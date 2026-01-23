<?php

namespace App\Http\Controllers;

use App\Models\Purchase;
use App\Models\PurchaseReturn;
use App\Models\PurchaseReturnItem;
use App\Models\ReplacementProduct;
use App\Models\Supplier;
use App\Models\Warehouse;
use App\Models\Product;
use App\Models\Variant;
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
    private function getUnitConversions()
    {
        return [
            'weight' => [
                'ton' => 1000,
                'kg' => 1,
                'gram' => 0.001,
                'pound' => 0.453592
            ],
            'volume' => [
                'liter' => 1,
                'ml' => 0.001
            ],
            'piece' => [
                'piece' => 1,
                'dozen' => 12,
                'box' => 1
            ],
            'length' => [
                'meter' => 1,
                'cm' => 0.01,
                'mm' => 0.001
            ]
        ];
    }

    public function index(Request $request)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $query = PurchaseReturn::latest()
            ->with(['purchase', 'supplier', 'warehouse', 'items.product', 'items.variant']);

        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('return_no', 'like', '%' . $request->search . '%')
                    ->orWhereHas('purchase', function ($q) use ($request) {
                        $q->where('purchase_no', 'like', '%' . $request->search . '%');
                    })
                    ->orWhereHas('supplier', function ($q) use ($request) {
                        $q->where('name', 'like', '%' . $request->search . '%')
                            ->orWhere('company', 'like', '%' . $request->search . '%');
                    });
            });
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('return_type') && $request->return_type) {
            $query->where('return_type', $request->return_type);
        }

        if ($request->has('date') && $request->date) {
            $query->whereDate('return_date', $request->date);
        }

        $returns = $query->paginate(10)->withQueryString();

        if ($isShadowUser) {
            $returns->getCollection()->transform(function ($return) {
                return $this->transformToShadowData($return);
            });
        }

        $recentPurchases = Purchase::where('status', 'completed')
            ->with(['supplier'])
            ->orderBy('purchase_date', 'desc')
            ->take(20)
            ->get();

        return Inertia::render('PurchaseReturn/PurchaseReturnList', [
            'filters' => $request->only(['search', 'status', 'return_type', 'date']),
            'returns' => $returns,
            'purchases' => $recentPurchases,
            'suppliers' => Supplier::all(),
            'warehouses' => Warehouse::where('is_active', true)->get(),
            'products' => Product::with('variants')->get(),
            'isShadowUser' => $isShadowUser
        ]);
    }

    public function create(Request $request)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $purchaseId = $request->query('purchase_id');
        $purchase = null;
        $purchaseItems = [];

        if ($purchaseId) {
            $purchase = Purchase::with(['items.product', 'items.variant', 'supplier', 'warehouse'])
                ->where('status', 'completed')
                ->find($purchaseId);

            if ($purchase) {
                foreach ($purchase->items as $item) {
                    // Get current stock
                    $stock = Stock::where('warehouse_id', $purchase->warehouse_id)
                        ->where('product_id', $item->product_id)
                        ->where('variant_id', $item->variant_id)
                        ->first();

                    // Calculate already returned quantity
                    $alreadyReturned = PurchaseReturnItem::where('purchase_item_id', $item->id)
                        ->whereHas('purchaseReturn', function ($q) {
                            $q->whereIn('status', ['approved', 'completed']);
                        })
                        ->sum('return_quantity');

                    // Calculate maximum returnable quantity
                    $maxQuantity = 0;
                    if ($stock && $stock->quantity > 0) {
                        $availableFromStock = $stock->quantity;
                        $availableFromPurchase = max(0, $item->quantity - $alreadyReturned);
                        $maxQuantity = min($availableFromStock, $availableFromPurchase);
                    }

                    if ($maxQuantity > 0) {
                        $purchaseItems[] = [
                            'id' => $item->id,
                            'purchase_item_id' => $item->id,
                            'product_id' => $item->product_id,
                            'product_name' => $item->product->name ?? 'Unknown Product',
                            'variant_id' => $item->variant_id,
                            'variant_name' => $this->getVariantDisplayName($item->variant),
                            'max_quantity' => $maxQuantity,
                            'available_quantity' => $maxQuantity,
                            'unit_price' => $item->unit_price,
                            'shadow_unit_price' => $item->shadow_unit_price,
                            'sale_price' => $item->sale_price,
                            'shadow_sale_price' => $item->shadow_sale_price,
                            'purchase_quantity' => $item->quantity,
                            'total_price' => $item->total_price,
                            'shadow_total_price' => $item->shadow_total_price,
                            'stock_quantity' => $stock ? $stock->quantity : 0,
                            'already_returned' => $alreadyReturned
                        ];
                    }
                }
            }
        }

        $recentPurchases = Purchase::where('status', 'completed')
            ->with(['supplier', 'warehouse', 'items'])
            ->orderBy('purchase_date', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($purchase) {
                $availableItems = 0;
                foreach ($purchase->items as $item) {
                    $stock = Stock::where('warehouse_id', $purchase->warehouse_id)
                        ->where('product_id', $item->product_id)
                        ->where('variant_id', $item->variant_id)
                        ->first();

                    if ($stock && $stock->quantity > 0) {
                        $alreadyReturned = PurchaseReturnItem::where('purchase_item_id', $item->id)
                            ->whereHas('purchaseReturn', function ($q) {
                                $q->whereIn('status', ['approved', 'completed']);
                            })
                            ->sum('return_quantity');

                        $availableFromStock = $stock->quantity;
                        $availableFromPurchase = max(0, $item->quantity - $alreadyReturned);

                        if (min($availableFromStock, $availableFromPurchase) > 0) {
                            $availableItems++;
                        }
                    }
                }

                return [
                    'id' => $purchase->id,
                    'purchase_no' => $purchase->purchase_no,
                    'purchase_date' => $purchase->purchase_date,
                    'grand_total' => $purchase->grand_total,
                    'available_items' => $availableItems,
                    'supplier' => $purchase->supplier ? [
                        'id' => $purchase->supplier->id,
                        'name' => $purchase->supplier->name,
                        'company' => $purchase->supplier->company,
                    ] : null,
                    'warehouse' => $purchase->warehouse ? [
                        'id' => $purchase->warehouse->id,
                        'name' => $purchase->warehouse->name,
                    ] : null,
                ];
            });

        return Inertia::render('PurchaseReturn/AddPurchaseReturn', [
            'purchase' => $purchase ? [
                'id' => $purchase->id,
                'purchase_no' => $purchase->purchase_no,
                'purchase_date' => $purchase->purchase_date,
                'grand_total' => $purchase->grand_total,
                'paid_amount' => $purchase->paid_amount,
                'due_amount' => $purchase->due_amount,
                'status' => $purchase->status,
                'supplier' => $purchase->supplier ? [
                    'id' => $purchase->supplier->id,
                    'name' => $purchase->supplier->name,
                    'company' => $purchase->supplier->company,
                    'email' => $purchase->supplier->email,
                    'phone' => $purchase->supplier->phone,
                    'address' => $purchase->supplier->address,
                ] : null,
                'warehouse' => $purchase->warehouse ? [
                    'id' => $purchase->warehouse->id,
                    'name' => $purchase->warehouse->name,
                    'code' => $purchase->warehouse->code,
                ] : null,
                'items_count' => $purchase->items->count(),
            ] : null,
            'purchaseItems' => $purchaseItems,
            'purchases' => $recentPurchases,
            'suppliers' => Supplier::all(),
            'warehouses' => Warehouse::where('is_active', true)->get(),
            'products' => Product::with('variants')->get(),
            'isShadowUser' => $isShadowUser
        ]);
    }

    private function getVariantDisplayName($variant)
    {
        if (!$variant)
            return 'Default Variant';

        if ($variant->attribute_values && is_array($variant->attribute_values)) {
            $parts = [];
            foreach ($variant->attribute_values as $attribute => $value) {
                $parts[] = "$attribute: $value";
            }
            return implode(', ', $parts);
        }

        $parts = [];
        if ($variant->size)
            $parts[] = "Size: $variant->size";
        if ($variant->color)
            $parts[] = "Color: $variant->color";
        if ($variant->material)
            $parts[] = "Material: $variant->material";

        return !empty($parts) ? implode(', ', $parts) : 'Default Variant';
    }

    public function store(Request $request)
    {
        // dd($request->all());

        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        // Enhanced validation
        $request->validate([
            'purchase_id' => 'required|exists:purchases,id',
            'return_type' => 'required|in:money_back,product_replacement',
            'return_date' => 'required|date',
            'reason' => 'required|string|min:3',
            'notes' => 'nullable|string',
            'payment_type' => 'nullable|in:cash,card,mobile_banking,adjust_to_advance',
            'items' => 'required|array|min:1',
            'items.*.purchase_item_id' => 'required|exists:purchase_items,id',
            'items.*.return_quantity' => 'required|integer|min:1',
            'items.*.reason' => 'nullable|string',
            'replacement_products' => 'nullable|array',
            'replacement_products.*.product_id' => 'nullable|exists:products,id',
            'replacement_products.*.variant_id' => 'nullable|exists:variants,id',
            'replacement_products.*.quantity' => 'nullable|integer|min:1',
            'replacement_products.*.unit_price' => 'nullable|numeric|min:0.01',
            'replacement_products.*.shadow_unit_price' => 'nullable|numeric|min:0.01',
            'replacement_products.*.sale_price' => 'nullable|numeric|min:0.01',
            'replacement_products.*.shadow_sale_price' => 'nullable|numeric|min:0.01',
            'replacement_total' => 'nullable|numeric|min:0',
            'shadow_replacement_total' => 'nullable|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            // Generate return number
            $returnCount = PurchaseReturn::whereDate('created_at', today())->count();
            $returnNo = 'RTN-' . date('Ymd') . '-' . str_pad($returnCount + 1, 4, '0', STR_PAD_LEFT);

            // Get purchase details
            $purchase = Purchase::with(['items', 'supplier', 'warehouse'])->findOrFail($request->purchase_id);

            // Calculate total return amount
            $totalReturnAmount = 0;
            $shadowTotalReturnAmount = 0;

            foreach ($request->items as $item) {
                $purchaseItem = \App\Models\PurchaseItem::find($item['purchase_item_id']);
                if (!$purchaseItem)
                    continue;

                $quantity = $item['return_quantity'] ?? 0;
                if ($quantity > 0) {
                    $totalReturnAmount += $quantity * $purchaseItem->unit_price;
                    $shadowTotalReturnAmount += $quantity * $purchaseItem->shadow_unit_price;
                }
            }

            // For product replacement, calculate replacement total
            $replacementTotal = $request->replacement_total ?? 0;
            $shadowReplacementTotal = $request->shadow_replacement_total ?? 0;

            // If not provided, calculate from replacement products
            if ($request->return_type === 'product_replacement' && !empty($request->replacement_products)) {
                $calculatedReplacementTotal = 0;
                $calculatedShadowReplacementTotal = 0;

                foreach ($request->replacement_products as $replacement) {
                    $quantity = $replacement['quantity'] ?? 1;
                    $unitPrice = $replacement['unit_price'] ?? 0;
                    $shadowUnitPrice = $replacement['shadow_unit_price'] ?? 0;

                    $calculatedReplacementTotal += $quantity * $unitPrice;
                    $calculatedShadowReplacementTotal += $quantity * $shadowUnitPrice;
                }

                // Use calculated values if not provided
                if ($replacementTotal == 0)
                    $replacementTotal = $calculatedReplacementTotal;
                if ($shadowReplacementTotal == 0)
                    $shadowReplacementTotal = $calculatedShadowReplacementTotal;
            }

            // For money back returns, refund amount equals return amount
            $refundedAmount = $request->return_type === 'money_back' ? $totalReturnAmount : 0;
            $shadowRefundedAmount = $request->return_type === 'money_back' ? $shadowTotalReturnAmount : 0;

            // Create purchase return
            $purchaseReturn = PurchaseReturn::create([
                'return_no' => $returnNo,
                'purchase_id' => $request->purchase_id,
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
                'payment_type' => $request->return_type === 'money_back' ? $request->payment_type : null,
                'replacement_total' => $replacementTotal,
                'shadow_replacement_total' => $shadowReplacementTotal,
            ]);

            // Create return items
            foreach ($request->items as $item) {
                $purchaseItem = \App\Models\PurchaseItem::find($item['purchase_item_id']);
                if (!$purchaseItem)
                    continue;

                $quantity = $item['return_quantity'] ?? 0;
                if ($quantity <= 0)
                    continue;

                $returnItemTotal = $quantity * $purchaseItem->unit_price;
                $shadowReturnItemTotal = $quantity * $purchaseItem->shadow_unit_price;

                PurchaseReturnItem::create([
                    'purchase_return_id' => $purchaseReturn->id,
                    'purchase_item_id' => $item['purchase_item_id'],
                    'product_id' => $purchaseItem->product_id,
                    'variant_id' => $purchaseItem->variant_id,
                    'return_quantity' => $quantity,
                    'unit_price' => $purchaseItem->unit_price,
                    'shadow_unit_price' => $purchaseItem->shadow_unit_price,
                    'sale_price' => $purchaseItem->sale_price,
                    'shadow_sale_price' => $purchaseItem->shadow_sale_price,
                    'total_price' => $returnItemTotal,
                    'shadow_total_price' => $shadowReturnItemTotal,
                    'reason' => $item['reason'] ?? 'Return requested',
                    'status' => 'pending',
                ]);
            }

            // Create replacement products if applicable
            if ($request->return_type === 'product_replacement' && !empty($request->replacement_products)) {
                foreach ($request->replacement_products as $replacement) {
                    if (!isset($replacement['product_id']) || !isset($replacement['variant_id'])) {
                        continue;
                    }

                    $quantity = $replacement['quantity'] ?? 1;
                    $unitPrice = $replacement['unit_price'] ?? 0;
                    $shadowUnitPrice = $replacement['shadow_unit_price'] ?? 0;
                    $salePrice = $replacement['sale_price'] ?? 0;
                    $shadowSalePrice = $replacement['shadow_sale_price'] ?? 0;

                    $totalPrice = $quantity * $unitPrice;
                    $shadowTotalPrice = $quantity * $shadowUnitPrice;

                    ReplacementProduct::create([
                        'purchase_return_id' => $purchaseReturn->id,
                        'product_id' => $replacement['product_id'],
                        'variant_id' => $replacement['variant_id'],
                        'quantity' => $quantity,
                        'unit_price' => $unitPrice,
                        'shadow_unit_price' => $shadowUnitPrice,
                        'sale_price' => $salePrice,
                        'shadow_sale_price' => $shadowSalePrice,
                        'total_price' => $totalPrice,
                        'shadow_total_price' => $shadowTotalPrice,
                        'status' => 'pending',
                    ]);
                }
            }

            DB::commit();
            Log::info('Purchase return created successfully');

            return redirect()->route('purchase-return.list')->with(
                'success',
                'Purchase return created successfully. Return No: ' . $returnNo . '. Awaiting approval.'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Purchase return creation error: ' . $e->getMessage());
            Log::error('Error trace: ' . $e->getTraceAsString());
            return redirect()->back()
                ->with('error', 'Error creating purchase return: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function show($id)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $purchaseReturn = PurchaseReturn::with([
            'purchase',
            'supplier',
            'warehouse',
            'items.product',
            'items.variant',
            'items.purchaseItem',
            'replacementProducts.product',
            'replacementProducts.variant',
            'creator'
        ])->findOrFail($id);

        // Calculate net difference for product replacement
        if ($purchaseReturn->return_type === 'product_replacement') {
            $netDifference = $purchaseReturn->replacement_total - $purchaseReturn->total_return_amount;
            $shadowNetDifference = $purchaseReturn->shadow_replacement_total - $purchaseReturn->shadow_return_amount;

            $purchaseReturn->net_difference = $netDifference;
            $purchaseReturn->shadow_net_difference = $shadowNetDifference;
        }

        if ($isShadowUser) {
            $purchaseReturn = $this->transformToShadowData($purchaseReturn);
        }

        return Inertia::render('PurchaseReturn/PurchaseReturnShow', [
            'return' => $purchaseReturn,
            'isShadowUser' => $isShadowUser
        ]);
    }

    public function destroy($id)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return redirect()->back()->with('error', 'You are not authorized to delete purchase returns.');
        }

        DB::beginTransaction();
        try {
            $purchaseReturn = PurchaseReturn::with(['items'])->findOrFail($id);

            if ($purchaseReturn->status !== 'pending') {
                throw new \Exception('Only pending returns can be deleted.');
            }

            $purchaseReturn->delete();

            DB::commit();
            return redirect()->route('purchase-return.list')->with('success', 'Purchase return deleted successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error deleting purchase return: ' . $e->getMessage());
        }
    }

    public function approve($id)
    {
        $user = Auth::user();

        DB::beginTransaction();
        try {
            $purchaseReturn = PurchaseReturn::with(['items', 'purchase'])
                ->findOrFail($id);

            if ($purchaseReturn->status !== 'pending') {
                throw new \Exception('This return cannot be approved.');
            }

            // ✅ Only decrease stock when return_type = product_replacement (physical return)
            if ($purchaseReturn->return_type === 'product_replacement') {
                foreach ($purchaseReturn->items as $item) {
                    $stock = Stock::where('warehouse_id', $purchaseReturn->warehouse_id)
                        ->where('product_id', $item->product_id)
                        ->where('variant_id', $item->variant_id)
                        ->first();

                    if (!$stock) {
                        throw new \Exception('Stock not found for product: ' . ($item->product->name ?? 'Unknown'));
                    }

                    if ($stock->quantity < $item->return_quantity) {
                        throw new \Exception('Insufficient stock for product: ' . ($item->product->name ?? 'Unknown') .
                            '. Available: ' . $stock->quantity . ', Requested: ' . $item->return_quantity);
                    }

                    $stock->decrement('quantity', $item->return_quantity);
                    $item->update(['status' => 'approved']);
                }
            } else {
                // ✅ money_back: just approve items (no stock change)
                $purchaseReturn->items()->update(['status' => 'approved']);
            }

            $purchaseReturn->update([
                'status' => 'approved',
                'approved_at' => now(),
                'approved_by' => $user->id
            ]);

            DB::commit();
            return redirect()->back()->with('success', 'Purchase return approved successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Approve purchase return error: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Error approving purchase return: ' . $e->getMessage());
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
                'items.purchaseItem',
                'supplier'
            ])->findOrFail($id);

            if ($purchaseReturn->status !== 'approved') {
                throw new \Exception('This return must be approved before completion.');
            }

            $purchase = $purchaseReturn->purchase;

            // For MONEY BACK returns
            if ($purchaseReturn->return_type === 'money_back') {
                // Calculate net difference (should be positive refund)
                $netDifference = $purchaseReturn->total_return_amount;

                if ($netDifference > 0) {
                    // Update purchase amounts
                    $purchase->increment('paid_amount', $netDifference);
                    $purchase->decrement('due_amount', min($netDifference, $purchase->due_amount));

                    // If refund is more than due, adjust
                    if ($purchase->due_amount < 0) {
                        $purchase->update(['due_amount' => 0]);
                    }

                    // Update payment status
                    $paymentStatus = $purchase->due_amount <= 0 ? 'paid' : ($purchase->paid_amount > 0 ? 'partial' : 'unpaid');
                    $purchase->update(['payment_status' => $paymentStatus]);

                    // For adjust_to_advance payment type
                    if ($purchaseReturn->payment_type === 'adjust_to_advance') {
                        $supplier = Supplier::find($purchaseReturn->supplier_id);
                        if ($supplier) {
                            $supplier->increment('advance_amount', $netDifference);
                        }
                    }

                    // Create payment record for REFUND RECEIVED (positive amount)
                    Payment::create([
                        'purchase_id' => $purchase->id,
                        'amount' => $netDifference,
                        'shadow_amount' => $purchaseReturn->shadow_return_amount,
                        'payment_method' => $purchaseReturn->payment_type ?? 'cash',
                        'txn_ref' => 'REFUND-' . $purchaseReturn->return_no,
                        'note' => 'Refund received for return: ' . $purchaseReturn->return_no,
                        'supplier_id' => $purchaseReturn->supplier_id,
                        'paid_at' => Carbon::now(),
                        'created_by' => $user->id,
                        'type' => 'refund_received'
                    ]);
                }
            }
            // For PRODUCT REPLACEMENT returns
            elseif ($purchaseReturn->return_type === 'product_replacement') {
                // INCREASE stock for replacement products (new items coming in)
                foreach ($purchaseReturn->replacementProducts as $replacement) {
                    $stock = Stock::where('warehouse_id', $purchaseReturn->warehouse_id)
                        ->where('product_id', $replacement->product_id)
                        ->where('variant_id', $replacement->variant_id)
                        ->first();

                    if ($stock) {
                        // INCREASE stock
                        $stock->increment('quantity', $replacement->quantity);

                        // Update weighted average price
                        $oldQuantity = $stock->quantity - $replacement->quantity;
                        $oldValue = $stock->purchase_price * $oldQuantity;
                        $newValue = $oldValue + ($replacement->unit_price * $replacement->quantity);
                        $stock->purchase_price = $newValue / $stock->quantity;

                        // Update sale price if provided
                        if ($replacement->sale_price > 0) {
                            $stock->sale_price = $replacement->sale_price;
                        }

                        $stock->save();
                    } else {
                        // Create new stock entry
                        Stock::create([
                            'warehouse_id' => $purchaseReturn->warehouse_id,
                            'product_id' => $replacement->product_id,
                            'variant_id' => $replacement->variant_id,
                            'quantity' => $replacement->quantity,
                            'unit' => $replacement->unit_type === 'weight' ? 'kg' : ($replacement->unit_type ?? 'piece'),
                            'purchase_price' => $replacement->unit_price,
                            'sale_price' => $replacement->sale_price,
                            'shadow_sale_price' => $replacement->shadow_sale_price,
                            'batch_no' => 'REPL-' . $purchaseReturn->return_no,
                            'created_by' => $user->id,
                        ]);
                    }

                    $replacement->update(['status' => 'completed']);
                }

            }

            // Update return items status
            $purchaseReturn->items()->update(['status' => 'completed']);

            // Update purchase return status
            $purchaseReturn->update([
                'status' => 'completed',
                'completed_at' => now(),
                'completed_by' => $user->id
            ]);

            DB::commit();

            return redirect()->back()->with('success', 'Purchase return completed successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Complete purchase return error: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Error completing purchase return: ' . $e->getMessage());
        }
    }

    private function transformToShadowData($purchaseReturn)
    {
        $purchaseReturn->total_return_amount = $purchaseReturn->shadow_return_amount;
        $purchaseReturn->refunded_amount = $purchaseReturn->shadow_refunded_amount;
        $purchaseReturn->replacement_total = $purchaseReturn->shadow_replacement_total;

        if ($purchaseReturn->items) {
            $purchaseReturn->items->transform(function ($item) {
                $item->unit_price = $item->shadow_unit_price;
                $item->total_price = $item->shadow_total_price;
                return $item;
            });
        }

        if ($purchaseReturn->replacementProducts) {
            $purchaseReturn->replacementProducts->transform(function ($product) {
                $product->unit_price = $product->shadow_unit_price;
                $product->total_price = $product->shadow_total_price;
                return $product;
            });
        }

        return $purchaseReturn;
    }

    public function calculateTotals(Request $request)
    {
        $data = $request->validate([
            'items' => 'required|array',
            'replacement_products' => 'nullable|array',
            'return_type' => 'required|in:money_back,product_replacement',
        ]);

        $totalReturn = 0;
        $shadowTotalReturn = 0;
        $replacementTotal = 0;
        $shadowReplacementTotal = 0;

        foreach ($data['items'] as $item) {
            if (isset($item['return_quantity']) && $item['return_quantity'] > 0) {
                $purchaseItem = \App\Models\PurchaseItem::find($item['purchase_item_id']);
                if ($purchaseItem) {
                    $totalReturn += $item['return_quantity'] * $purchaseItem->unit_price;
                    $shadowTotalReturn += $item['return_quantity'] * $purchaseItem->shadow_unit_price;
                }
            }
        }

        if ($data['return_type'] === 'product_replacement' && !empty($data['replacement_products'])) {
            foreach ($data['replacement_products'] as $replacement) {
                $quantity = $replacement['quantity'] ?? 1;
                $unitPrice = $replacement['unit_price'] ?? 0;
                $shadowUnitPrice = $replacement['shadow_unit_price'] ?? 0;

                $replacementTotal += $quantity * $unitPrice;
                $shadowReplacementTotal += $quantity * $shadowUnitPrice;
            }
        }

        return response()->json([
            'total_return' => $totalReturn,
            'shadow_total_return' => $shadowTotalReturn,
            'replacement_total' => $replacementTotal,
            'shadow_replacement_total' => $shadowReplacementTotal,
            'net_difference' => $replacementTotal - $totalReturn,
            'shadow_net_difference' => $shadowReplacementTotal - $shadowTotalReturn,
        ]);
    }

    public function getPurchaseData(Request $request)
    {
        $request->validate([
            'purchase_id' => 'required|exists:purchases,id'
        ]);

        $purchase = Purchase::with(['items.product', 'items.variant', 'supplier', 'warehouse'])
            ->where('status', 'completed')
            ->findOrFail($request->purchase_id);

        $purchaseItems = [];
        foreach ($purchase->items as $item) {
            $stock = Stock::where('warehouse_id', $purchase->warehouse_id)
                ->where('product_id', $item->product_id)
                ->where('variant_id', $item->variant_id)
                ->first();

            // Calculate already returned quantity
            $alreadyReturned = PurchaseReturnItem::where('purchase_item_id', $item->id)
                ->whereHas('purchaseReturn', function ($q) {
                    $q->whereIn('status', ['approved', 'completed']);
                })
                ->sum('return_quantity');

            // Calculate maximum returnable quantity
            $maxQuantity = 0;
            if ($stock && $stock->quantity > 0) {
                $availableFromStock = $stock->quantity;
                $availableFromPurchase = max(0, $item->quantity - $alreadyReturned);
                $maxQuantity = min($availableFromStock, $availableFromPurchase);
            }

            if ($maxQuantity > 0) {
                $purchaseItems[] = [
                    'id' => $item->id,
                    'purchase_item_id' => $item->id,
                    'product_id' => $item->product_id,
                    'product_name' => $item->product->name ?? 'Unknown Product',
                    'variant_id' => $item->variant_id,
                    'variant_name' => $this->getVariantDisplayName($item->variant),
                    'max_quantity' => $maxQuantity,
                    'available_quantity' => $maxQuantity,
                    'unit_price' => $item->unit_price,
                    'shadow_unit_price' => $item->shadow_unit_price,
                    'sale_price' => $item->sale_price,
                    'shadow_sale_price' => $item->shadow_sale_price,
                    'purchase_quantity' => $item->quantity,
                    'total_price' => $item->total_price,
                    'shadow_total_price' => $item->shadow_total_price,
                    'stock_quantity' => $stock ? $stock->quantity : 0,
                    'already_returned' => $alreadyReturned
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
                'status' => $purchase->status,
                'supplier' => $purchase->supplier ? [
                    'id' => $purchase->supplier->id,
                    'name' => $purchase->supplier->name,
                    'company' => $purchase->supplier->company,
                    'email' => $purchase->supplier->email,
                    'phone' => $purchase->supplier->phone,
                    'address' => $purchase->supplier->address,
                ] : null,
                'warehouse' => $purchase->warehouse ? [
                    'id' => $purchase->warehouse->id,
                    'name' => $purchase->warehouse->name,
                    'code' => $purchase->warehouse->code,
                ] : null,
                'items_count' => $purchase->items->count(),
            ],
            'purchaseItems' => $purchaseItems
        ]);
    }
}