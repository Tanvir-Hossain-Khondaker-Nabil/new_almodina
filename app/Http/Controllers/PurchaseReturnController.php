<?php

namespace App\Http\Controllers;

use App\Http\Requests\PurchaseReturnStore;
use App\Models\Account;
use App\Models\Purchase;
use App\Models\PurchaseReturn;
use App\Models\PurchaseReturnItem;
use App\Models\ReplacementProduct;
use App\Models\Supplier;
use App\Models\Warehouse;
use App\Models\Product;
use App\Models\Stock;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class PurchaseReturnController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $query = PurchaseReturn::with([
            'purchase.supplier',
            'supplier',
            'warehouse',
            'items.product',
            'creator'
        ])
            ->latest();

        // Search filters
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('return_no', 'like', '%' . $request->search . '%')
                    ->orWhereHas('purchase', function ($q) use ($request) {
                        $q->where('purchase_no', 'like', '%' . $request->search . '%');
                    })
                    ->orWhereHas('supplier', function ($q) use ($request) {
                        $q->where('name', 'like', '%' . $request->search . '%');
                    });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('return_type')) {
            $query->where('return_type', $request->return_type);
        }

        if ($request->filled('date_from') && $request->filled('date_to')) {
            $query->whereBetween('return_date', [$request->date_from, $request->date_to]);
        } elseif ($request->filled('date_from')) {
            $query->where('return_date', '>=', $request->date_from);
        } elseif ($request->filled('date_to')) {
            $query->where('return_date', '<=', $request->date_to);
        }

        $returns = $query->paginate(20)->withQueryString();

        return Inertia::render('PurchaseReturn/PurchaseReturnList', [
            'returns' => $returns,
            'filters' => $request->only(['search', 'status', 'return_type', 'date_from', 'date_to']),
            'isShadowUser' => $isShadowUser,
            'summary' => [
                'total' => $returns->total(),
                'pending' => PurchaseReturn::where('status', 'pending')->count(),
                'completed' => PurchaseReturn::where('status', 'completed')->count(),
                'money_back' => PurchaseReturn::where('return_type', 'money_back')->count(),
                'replacement' => PurchaseReturn::where('return_type', 'product_replacement')->count(),
            ]
        ]);
    }

    public function create(Request $request)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $purchase = null;
        $purchaseItems = [];

        if ($request->filled('purchase_id')) {
            $purchase = Purchase::with(['items.product', 'items.variant', 'supplier', 'warehouse'])
                ->where('status', 'completed')
                ->find($request->purchase_id);

            if ($purchase) {
                foreach ($purchase->items as $item) {
                    // Get current stock quantity
                    $stock = Stock::where('warehouse_id', $purchase->warehouse_id)
                        ->where('product_id', $item->product_id)
                        ->where('variant_id', $item->variant_id)
                        ->first();

                    // Calculate already returned quantity for this purchase item
                    $alreadyReturned = PurchaseReturnItem::where('purchase_item_id', $item->id)
                        ->whereHas('purchaseReturn', function ($q) use ($purchase) {
                            $q->where('status', '!=', 'cancelled')
                                ->where('purchase_id', $purchase->id);
                        })
                        ->sum('return_quantity');

                    // Calculate max returnable quantity
                    $availableFromStock = $stock ? $stock->quantity : 0;
                    $availableFromPurchase = max(0, $item->quantity - $alreadyReturned);
                    $maxQuantity = min($availableFromStock, $availableFromPurchase);

                    if ($maxQuantity > 0) {
                        $purchaseItems[] = [
                            'purchase_item_id' => $item->id,
                            'product_id' => $item->product_id,
                            'variant_id' => $item->variant_id,
                            'product_name' => $item->product->name ?? 'Unknown',
                            'variant_name' => $this->getVariantDisplayName($item->variant),
                            'purchase_quantity' => $item->quantity,
                            'unit_price' => $item->unit_price,
                            'shadow_unit_price' => $item->shadow_unit_price,
                            'stock_quantity' => $availableFromStock,
                            'already_returned' => $alreadyReturned,
                            'max_quantity' => $maxQuantity,
                        ];
                    }
                }
            }
        }

        // Get recent purchases for dropdown
        $recentPurchases = Purchase::where('status', 'completed')
            ->with(['supplier', 'warehouse'])
            ->orderBy('purchase_date', 'desc')
            ->take(50)
            ->get()
            ->map(function ($purchase) {
                return [
                    'id' => $purchase->id,
                    'purchase_no' => $purchase->purchase_no,
                    'purchase_date' => $purchase->purchase_date,
                    'grand_total' => $purchase->grand_total,
                    'supplier' => $purchase->supplier ? [
                        'name' => $purchase->supplier->name,
                        'company' => $purchase->supplier->company,
                    ] : null,
                    'warehouse' => $purchase->warehouse ? [
                        'name' => $purchase->warehouse->name,
                    ] : null,
                ];
            });

        return Inertia::render('PurchaseReturn/AddPurchaseReturn', [
            'purchase' => $purchase,
            'purchaseItems' => $purchaseItems,
            'recentPurchases' => $recentPurchases,
            'products' => Product::with('variants')->get(),
            'accounts' => Account::where('is_active', true)->get(),
            'isShadowUser' => $isShadowUser,
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        DB::beginTransaction();
        try {
            // Validate purchase exists
            $purchase = Purchase::with('supplier')->findOrFail($request->purchase_id);

            // Generate return number
            $returnNo = 'RTN-' . date('Ymd') . '-' . strtoupper(Str::random(6));

            // Calculate totals
            $totalReturnAmount = 0;
            $shadowTotalReturnAmount = 0;

            foreach ($request->items as $item) {
                $purchaseItem = \App\Models\PurchaseItem::find($item['purchase_item_id']);
                if (!$purchaseItem)
                    continue;

                $quantity = $item['return_quantity'] ?? 0;
                if ($quantity > 0) {
                    $totalReturnAmount += $quantity * $purchaseItem->unit_price;
                    $shadowTotalReturnAmount += $quantity * ($purchaseItem->shadow_unit_price ?? $purchaseItem->unit_price);
                }
            }

            // Determine refund amount
            $refundedAmount = 0;
            $shadowRefundedAmount = 0;

            if ($request->return_type === 'money_back') {
                $refundedAmount = $totalReturnAmount;
                $shadowRefundedAmount = $shadowTotalReturnAmount;
            }

            // Create purchase return
            $purchaseReturn = PurchaseReturn::create([
                'return_no' => $returnNo,
                'purchase_id' => $purchase->id,
                'supplier_id' => $purchase->supplier_id,
                'warehouse_id' => $purchase->warehouse_id,
                'return_date' => $request->return_date,
                'return_type' => $request->return_type,
                'total_return_amount' => $totalReturnAmount,
                'refunded_amount' => $refundedAmount,
                'shadow_return_amount' => $shadowTotalReturnAmount,
                'shadow_refunded_amount' => $shadowRefundedAmount,
                'reason' => $request->reason,
                'notes' => $request->notes,
                'status' => 'pending',
                'created_by' => $user->id,
                'user_type' => $user->type,
                'payment_type' => $request->return_type === 'money_back' ? ($request->payment_type ?? 'cash') : null,
                'account_id' => $request->return_type === 'money_back' ? $request->account_id : null,
            ]);

            // Create return items
            foreach ($request->items as $item) {
                $purchaseItem = \App\Models\PurchaseItem::find($item['purchase_item_id']);
                if (!$purchaseItem)
                    continue;

                $quantity = $item['return_quantity'] ?? 0;
                if ($quantity <= 0)
                    continue;

                PurchaseReturnItem::create([
                    'purchase_return_id' => $purchaseReturn->id,
                    'purchase_item_id' => $item['purchase_item_id'],
                    'product_id' => $purchaseItem->product_id,
                    'variant_id' => $purchaseItem->variant_id,
                    'return_quantity' => $quantity,
                    'unit_price' => $purchaseItem->unit_price,
                    'shadow_unit_price' => $purchaseItem->shadow_unit_price,
                    'total_price' => $quantity * $purchaseItem->unit_price,
                    'shadow_total_price' => $quantity * ($purchaseItem->shadow_unit_price ?? $purchaseItem->unit_price),
                    'reason' => $item['reason'] ?? 'Return requested',
                    'status' => 'pending',
                ]);
            }

            // Create replacement products if applicable
            if ($request->return_type === 'product_replacement' && !empty($request->replacement_products)) {
                foreach ($request->replacement_products as $replacement) {
                    ReplacementProduct::create([
                        'purchase_return_id' => $purchaseReturn->id,
                        'product_id' => $replacement['product_id'],
                        'variant_id' => $replacement['variant_id'],
                        'quantity' => $replacement['quantity'],
                        'unit_price' => $replacement['unit_price'],
                        'shadow_unit_price' => $replacement['shadow_unit_price'] ?? $replacement['unit_price'],
                        'total_price' => $replacement['quantity'] * $replacement['unit_price'],
                        'shadow_total_price' => $replacement['quantity'] * ($replacement['shadow_unit_price'] ?? $replacement['unit_price']),
                        'status' => 'pending',
                    ]);
                }
            }

            DB::commit();

            return redirect()->route('purchase-return.list')
                ->with('success', 'Purchase return created successfully. Return No: ' . $returnNo);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Purchase return creation error: ' . $e->getMessage());

            return redirect()->back()
                ->with('error', 'Failed to create purchase return: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function show($id)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $purchaseReturn = PurchaseReturn::with([
            'purchase.supplier',
            'purchase.warehouse',
            'items.product',
            'items.variant',
            'items.purchaseItem',
            'replacementProducts.product',
            'replacementProducts.variant',
            'creator',
            'approver',
            'completer'
        ])->findOrFail($id);

        return Inertia::render('PurchaseReturn/Show', [
            'return' => $purchaseReturn,
            'isShadowUser' => $isShadowUser,
        ]);
    }

    public function edit($id)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $purchaseReturn = PurchaseReturn::with([
            'purchase',
            'items',
            'replacementProducts'
        ])->findOrFail($id);

        if ($purchaseReturn->status !== 'pending') {
            return redirect()->back()->with('error', 'Only pending returns can be edited.');
        }

        return Inertia::render('PurchaseReturn/Edit', [
            'return' => $purchaseReturn,
            'products' => Product::with('variants')->get(),
            'accounts' => Account::where('is_active', true)->get(),
            'isShadowUser' => $isShadowUser,
        ]);
    }

    public function update(PurchaseReturnStore $request, $id)
    {
        $purchaseReturn = PurchaseReturn::findOrFail($id);

        if ($purchaseReturn->status !== 'pending') {
            return redirect()->back()->with('error', 'Only pending returns can be updated.');
        }

        DB::beginTransaction();
        try {
            // Delete existing items and replacement products
            $purchaseReturn->items()->delete();
            $purchaseReturn->replacementProducts()->delete();

            // Update return details
            $purchaseReturn->update([
                'return_type' => $request->return_type,
                'return_date' => $request->return_date,
                'reason' => $request->reason,
                'notes' => $request->notes,
                'payment_type' => $request->return_type === 'money_back' ? ($request->payment_type ?? 'cash') : null,
                'account_id' => $request->return_type === 'money_back' ? $request->account_id : null,
            ]);

            // Recalculate totals and recreate items
            $totalReturnAmount = 0;
            $shadowTotalReturnAmount = 0;

            foreach ($request->items as $item) {
                $purchaseItem = \App\Models\PurchaseItem::find($item['purchase_item_id']);
                if (!$purchaseItem)
                    continue;

                $quantity = $item['return_quantity'] ?? 0;
                if ($quantity <= 0)
                    continue;

                PurchaseReturnItem::create([
                    'purchase_return_id' => $purchaseReturn->id,
                    'purchase_item_id' => $item['purchase_item_id'],
                    'product_id' => $purchaseItem->product_id,
                    'variant_id' => $purchaseItem->variant_id,
                    'return_quantity' => $quantity,
                    'unit_price' => $purchaseItem->unit_price,
                    'shadow_unit_price' => $purchaseItem->shadow_unit_price,
                    'total_price' => $quantity * $purchaseItem->unit_price,
                    'shadow_total_price' => $quantity * ($purchaseItem->shadow_unit_price ?? $purchaseItem->unit_price),
                    'reason' => $item['reason'] ?? 'Return requested',
                    'status' => 'pending',
                ]);

                $totalReturnAmount += $quantity * $purchaseItem->unit_price;
                $shadowTotalReturnAmount += $quantity * ($purchaseItem->shadow_unit_price ?? $purchaseItem->unit_price);
            }

            // Create replacement products if applicable
            if ($request->return_type === 'product_replacement' && !empty($request->replacement_products)) {
                foreach ($request->replacement_products as $replacement) {
                    ReplacementProduct::create([
                        'purchase_return_id' => $purchaseReturn->id,
                        'product_id' => $replacement['product_id'],
                        'variant_id' => $replacement['variant_id'],
                        'quantity' => $replacement['quantity'],
                        'unit_price' => $replacement['unit_price'],
                        'shadow_unit_price' => $replacement['shadow_unit_price'] ?? $replacement['unit_price'],
                        'total_price' => $replacement['quantity'] * $replacement['unit_price'],
                        'shadow_total_price' => $replacement['quantity'] * ($replacement['shadow_unit_price'] ?? $replacement['unit_price']),
                        'status' => 'pending',
                    ]);
                }
            }

            // Update totals
            $refundedAmount = $request->return_type === 'money_back' ? $totalReturnAmount : 0;
            $shadowRefundedAmount = $request->return_type === 'money_back' ? $shadowTotalReturnAmount : 0;

            $purchaseReturn->update([
                'total_return_amount' => $totalReturnAmount,
                'refunded_amount' => $refundedAmount,
                'shadow_return_amount' => $shadowTotalReturnAmount,
                'shadow_refunded_amount' => $shadowRefundedAmount,
            ]);

            DB::commit();

            return redirect()->route('purchase-return.list')
                ->with('success', 'Purchase return updated successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Purchase return update error: ' . $e->getMessage());

            return redirect()->back()
                ->with('error', 'Failed to update purchase return: ' . $e->getMessage());
        }
    }

    public function destroy($id)
    {
        $purchaseReturn = PurchaseReturn::findOrFail($id);

        if ($purchaseReturn->status !== 'pending') {
            return redirect()->back()->with('error', 'Only pending returns can be deleted.');
        }

        DB::beginTransaction();
        try {
            $purchaseReturn->items()->delete();
            $purchaseReturn->replacementProducts()->delete();
            $purchaseReturn->delete();

            DB::commit();

            return redirect()->route('purchase-return.list')
                ->with('success', 'Purchase return deleted successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Purchase return deletion error: ' . $e->getMessage());

            return redirect()->back()
                ->with('error', 'Failed to delete purchase return: ' . $e->getMessage());
        }
    }

    public function approve($id)
    {
        $user = Auth::user();

        DB::beginTransaction();
        try {
            $purchaseReturn = PurchaseReturn::with(['items', 'purchase'])->findOrFail($id);

            if ($purchaseReturn->status !== 'pending') {
                throw new \Exception('Only pending returns can be approved.');
            }

            // Check stock availability for product replacement returns
            if ($purchaseReturn->return_type === 'product_replacement') {
                foreach ($purchaseReturn->items as $item) {
                    $stock = Stock::where('warehouse_id', $purchaseReturn->warehouse_id)
                        ->where('product_id', $item->product_id)
                        ->where('variant_id', $item->variant_id)
                        ->first();

                    if (!$stock || $stock->quantity < $item->return_quantity) {
                        throw new \Exception('Insufficient stock for product: ' .
                            ($item->product->name ?? 'Unknown') .
                            '. Available: ' . ($stock ? $stock->quantity : 0) .
                            ', Requested: ' . $item->return_quantity);
                    }
                }
            }

            $purchaseReturn->update([
                'status' => 'approved',
                'approved_at' => now(),
                'approved_by' => $user->id,
            ]);

            $purchaseReturn->items()->update(['status' => 'approved']);

            DB::commit();

            return redirect()->back()->with('success', 'Purchase return approved successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Purchase return approval error: ' . $e->getMessage());

            return redirect()->back()->with('error', 'Failed to approve purchase return: ' . $e->getMessage());
        }
    }

    public function complete($id)
    {
        $user = Auth::user();

        DB::beginTransaction();
        try {
            $purchaseReturn = PurchaseReturn::with([
                'purchase',
                'replacementProducts',
                'items.product',
                'items.purchaseItem',
                'supplier'
            ])->findOrFail($id);

            if ($purchaseReturn->status !== 'approved') {
                throw new \Exception('Only approved returns can be completed.');
            }

            $purchase = $purchaseReturn->purchase;

            // ============================================
            // STOCK UPDATES BASED ON RETURN TYPE
            // ============================================
            if ($purchaseReturn->return_type === 'money_back') {
                // For money back returns - DECREASE STOCK (items go back to supplier)
                foreach ($purchaseReturn->items as $item) {
                    $stock = Stock::where('warehouse_id', $purchaseReturn->warehouse_id)
                        ->where('product_id', $item->product_id)
                        ->where('variant_id', $item->variant_id)
                        ->first();

                    if ($stock) {
                        // Decrease stock quantity (items returned to supplier)
                        $stock->decrement('quantity', $item->return_quantity);

                        Log::info('Stock decreased for money back return', [
                            'purchase_return_id' => $purchaseReturn->id,
                            'return_no' => $purchaseReturn->return_no,
                            'stock_id' => $stock->id,
                            'product_id' => $item->product_id,
                            'quantity_decreased' => $item->return_quantity,
                            'remaining_quantity' => $stock->fresh()->quantity
                        ]);
                    } else {
                        throw new \Exception("Stock not found for product ID: {$item->product_id}");
                    }
                }

                // Process financial refund
                if ($purchaseReturn->total_return_amount > 0) {
                    // Update purchase amounts
                    $purchase->increment('paid_amount', $purchaseReturn->total_return_amount);
                    $purchase->decrement('due_amount', min($purchaseReturn->total_return_amount, $purchase->due_amount));

                    // Update payment status
                    $paymentStatus = $purchase->due_amount <= 0 ? 'paid' : ($purchase->paid_amount > 0 ? 'partial' : 'unpaid');
                    $purchase->update(['payment_status' => $paymentStatus]);

                    // Create payment record for refund received
                    Payment::create([
                        'purchase_id' => $purchase->id,
                        'amount' => $purchaseReturn->total_return_amount,
                        'payment_method' => $purchaseReturn->payment_type ?? 'cash',
                        'txn_ref' => 'REFUND-' . $purchaseReturn->return_no,
                        'note' => 'Refund received for return: ' . $purchaseReturn->return_no,
                        'supplier_id' => $purchaseReturn->supplier_id,
                        'account_id' => $purchaseReturn->account_id,
                        'paid_at' => now(),
                        'created_by' => $user->id,
                        'type' => 'refund_received'
                    ]);

                    // Update account balance if account specified
                    if ($purchaseReturn->account_id) {
                        $account = Account::find($purchaseReturn->account_id);
                        if ($account) {
                            $account->updateBalance($purchaseReturn->total_return_amount, 'deposit');
                        }
                    }
                }

            } elseif ($purchaseReturn->return_type === 'product_replacement') {
                // For product replacement returns - NO STOCK DECREASE
                // (Items stay in warehouse, just exchanged for other products)
                // But we need to INCREASE stock for replacement products

                Log::info('Product replacement return - no stock decrease for returned items', [
                    'purchase_return_id' => $purchaseReturn->id,
                    'return_no' => $purchaseReturn->return_no
                ]);

                // Increase stock for replacement products
                foreach ($purchaseReturn->replacementProducts as $replacement) {
                    $stock = Stock::where('warehouse_id', $purchaseReturn->warehouse_id)
                        ->where('product_id', $replacement->product_id)
                        ->where('variant_id', $replacement->variant_id)
                        ->first();

                    if ($stock) {
                        $stock->increment('quantity', $replacement->quantity);

                        Log::info('Stock increased for replacement product', [
                            'purchase_return_id' => $purchaseReturn->id,
                            'stock_id' => $stock->id,
                            'product_id' => $replacement->product_id,
                            'quantity_increased' => $replacement->quantity
                        ]);
                    } else {
                        // Create new stock entry for replacement product
                        Stock::create([
                            'warehouse_id' => $purchaseReturn->warehouse_id,
                            'product_id' => $replacement->product_id,
                            'variant_id' => $replacement->variant_id,
                            'quantity' => $replacement->quantity,
                            'unit' => 'piece',
                            'purchase_price' => $replacement->unit_price,
                            'sale_price' => $replacement->unit_price * 1.2, // Default 20% markup
                            'batch_no' => 'REPL-' . $purchaseReturn->return_no,
                            'created_by' => $user->id,
                        ]);
                    }

                    $replacement->update(['status' => 'completed']);
                }
            }

            // Update return status
            $purchaseReturn->update([
                'status' => 'completed',
                'completed_at' => now(),
                'completed_by' => $user->id,
            ]);

            $purchaseReturn->items()->update(['status' => 'completed']);

            DB::commit();

            return redirect()->back()->with('success', 'Purchase return completed successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Purchase return completion error: ' . $e->getMessage());

            return redirect()->back()->with('error', 'Failed to complete purchase return: ' . $e->getMessage());
        }
    }

    public function cancel($id)
    {
        $user = Auth::user();

        DB::beginTransaction();
        try {
            $purchaseReturn = PurchaseReturn::findOrFail($id);

            if (!in_array($purchaseReturn->status, ['pending', 'approved'])) {
                throw new \Exception('Only pending or approved returns can be cancelled.');
            }

            $purchaseReturn->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
                'cancelled_by' => $user->id,
            ]);

            $purchaseReturn->items()->update(['status' => 'cancelled']);

            DB::commit();

            return redirect()->back()->with('success', 'Purchase return cancelled successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Purchase return cancellation error: ' . $e->getMessage());

            return redirect()->back()->with('error', 'Failed to cancel purchase return: ' . $e->getMessage());
        }
    }

    private function getVariantDisplayName($variant)
    {
        if (!$variant)
            return 'Default';

        if ($variant->attribute_values && is_array($variant->attribute_values)) {
            return collect($variant->attribute_values)
                ->map(fn($value, $key) => "$key: $value")
                ->join(', ');
        }

        $parts = [];
        if ($variant->size)
            $parts[] = "Size: $variant->size";
        if ($variant->color)
            $parts[] = "Color: $variant->color";
        if ($variant->material)
            $parts[] = "Material: $variant->material";

        return !empty($parts) ? implode(', ', $parts) : 'Default';
    }

    public function getPurchaseData($id)
    {
        $purchase = Purchase::with(['items.product', 'items.variant', 'supplier', 'warehouse'])
            ->where('status', 'completed')
            ->findOrFail($id);

        $purchaseItems = [];
        foreach ($purchase->items as $item) {
            $stock = Stock::where('warehouse_id', $purchase->warehouse_id)
                ->where('product_id', $item->product_id)
                ->where('variant_id', $item->variant_id)
                ->first();

            $alreadyReturned = PurchaseReturnItem::where('purchase_item_id', $item->id)
                ->whereHas('purchaseReturn', function ($q) use ($purchase) {
                    $q->where('status', '!=', 'cancelled')
                        ->where('purchase_id', $purchase->id);
                })
                ->sum('return_quantity');

            $availableFromStock = $stock ? $stock->quantity : 0;
            $availableFromPurchase = max(0, $item->quantity - $alreadyReturned);
            $maxQuantity = min($availableFromStock, $availableFromPurchase);

            if ($maxQuantity > 0) {
                $purchaseItems[] = [
                    'purchase_item_id' => $item->id,
                    'product_id' => $item->product_id,
                    'variant_id' => $item->variant_id,
                    'product_name' => $item->product->name ?? 'Unknown',
                    'variant_name' => $this->getVariantDisplayName($item->variant),
                    'purchase_quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'shadow_unit_price' => $item->shadow_unit_price,
                    'stock_quantity' => $availableFromStock,
                    'already_returned' => $alreadyReturned,
                    'max_quantity' => $maxQuantity,
                ];
            }
        }

        return response()->json([
            'purchase' => [
                'id' => $purchase->id,
                'purchase_no' => $purchase->purchase_no,
                'purchase_date' => $purchase->purchase_date,
                'grand_total' => $purchase->grand_total,
                'paid_amount' => $purchase->paid_amount,
                'due_amount' => $purchase->due_amount,
                'supplier' => $purchase->supplier,
                'warehouse' => $purchase->warehouse,
            ],
            'purchaseItems' => $purchaseItems,
        ]);
    }
}