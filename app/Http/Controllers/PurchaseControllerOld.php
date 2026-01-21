<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Inertia\Inertia;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Supplier;
use App\Models\Warehouse;
use App\Models\Product;
use App\Models\Variant;
use App\Models\Stock;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log as FacadesLog;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class PurchaseControllerOld extends Controller
{


    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $purchases = Purchase::with(['supplier', 'warehouse', 'items.product', 'items.variant', 'creator'])
            ->filter($request->all())
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Purchase/PurchaseList', [
            'purchases' => $purchases,
            'filters' => $request->only(['search', 'status', 'date']),
            'isShadowUser' => Auth::user()->user_type === 'shadow',
        ]);
    }


    public function allPurchasesItems(Request $request)
    {
        $purchaseItems = PurchaseItem::with(['purchase', 'product', 'variant', 'warehouse'])
            ->when($request->filled('product_id'), function ($query) use ($request) {
                $query->where('product_id', $request->product_id);
            })
            ->when($request->filled('date_from') && $request->filled('date_to'), function ($query) use ($request) {
                $query->whereHas('purchase', function ($q) use ($request) {
                    $q->whereBetween('purchase_date', [$request->date_from, $request->date_to]);
                });
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();


        return Inertia::render('Purchase/PurchaseItemsList', [
            'purchaseItems' => $purchaseItems,
            'filters' => $request->only(['product_id', 'date_from', 'date_to']),
            'isShadowUser' => Auth::user()->user_type === 'shadow',
        ]);
    }



    /**
     * Show the form for creating a new resource.
     */

    public function create()
    {
        return Inertia::render('Purchase/AddPurchase', [
            'suppliers' => Supplier::all(),
            'warehouses' => Warehouse::all(),
            'products' => Product::with(['variants'])->get(),
            'isShadowUser' => Auth::user()->user_type === 'shadow',
        ]);
    }



    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {

        DB::beginTransaction();
        try {
            // Generate purchase number
            $purchaseNo = 'PUR-' . date('Ymd') . '-' . strtoupper(Str::random(6));

            // Calculate totals from items
            $totalAmount = 0;
            $shadowTotalAmount = 0;

            foreach ($request->items as $item) {
                $totalAmount += ($item['quantity'] * $item['unit_price']);
                $shadowTotalAmount += ($item['quantity'] * $item['shadow_unit_price']);
            }

            $paidAmount = $request->paid_amount ?? 0;
            $shadowPaidAmount = $request->shadow_paid_amount ?? 0;

            $dueAmount = max(0, $totalAmount - $paidAmount);
            $shadowDueAmount = max(0, $shadowTotalAmount - $shadowPaidAmount);

            // Determine payment status
            $paymentStatus = $this->calculatePaymentStatus($paidAmount, $totalAmount);
            $shadowPaymentStatus = $this->calculatePaymentStatus($shadowPaidAmount, $shadowTotalAmount);

            // Create purchase
            $purchase = Purchase::create([
                'purchase_no' => $purchaseNo,
                'supplier_id' => $request->supplier_id,
                'warehouse_id' => $request->warehouse_id,
                'purchase_date' => $request->purchase_date,
                'total_amount' => $totalAmount,
                'shadow_total_amount' => $shadowTotalAmount,
                'paid_amount' => $paidAmount,
                'shadow_paid_amount' => $shadowPaidAmount,
                'due_amount' => $dueAmount,
                'shadow_due_amount' => $shadowDueAmount,
                'payment_status' => $paymentStatus,
                'shadow_payment_status' => $shadowPaymentStatus,
                'notes' => $request->notes,
                'status' => Auth::user()->type === 'shadow' ? 'pending' : 'completed',
                'created_by' => Auth::id(),
                'user_type' => Auth::user()->type ?? 'general',
            ]);

            // Create purchase items
            foreach ($request->items as $item) {
                $itemTotalPrice = $item['quantity'] * $item['unit_price'];
                $itemShadowTotalPrice = $item['quantity'] * $item['shadow_unit_price'];

                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $item['product_id'],
                    'variant_id' => $item['variant_id'],
                    'warehouse_id' => $request->warehouse_id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'shadow_unit_price' => $item['shadow_unit_price'],
                    'sale_price' => $item['sale_price'],
                    'shadow_sale_price' => $item['shadow_sale_price'],
                    'total_price' => $itemTotalPrice,
                    'shadow_total_price' => $itemShadowTotalPrice,
                    'created_by' => Auth::id(),
                ]);
            }


            if ($paidAmount > 0) {
                $payment = new Payment();
                $payment->purchase_id = $purchase->id;
                $payment->amount = $paidAmount;
                $payment->shadow_amount = $shadowPaidAmount;
                $payment->payment_method = $request->payment_method ?? 'cash';
                $payment->txn_ref = $request->txn_ref ?? ('nexoryn-' . Str::random(10));
                $payment->note = $request->notes ?? null;
                $payment->supplier_id = $request->supplier_id ?? null;
                $payment->paid_at = Carbon::now();
                $payment->created_by = Auth::id();
                $payment->save();
            }


            DB::commit();

            return redirect()->route('purchase.list')->with('success', 'Purchase created successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::alert($e->getMessage());
            return redirect()->back()->with('error', 'Failed to create purchase: ' . $e->getMessage());
        }
    }

    public function show($id)
    {
        $purchase = Purchase::with([
            'supplier',
            'warehouse',
            'items.product',
            'items.variant',
            'creator'
        ])->findOrFail($id);

        return Inertia::render('Purchase/ViewPurchase', [
            'purchase' => $purchase,
            'isShadowUser' => Auth::user()->user_type === 'shadow',
        ]);
    }

    public function updatePayment(Request $request, $id)
    {
        $request->validate([
            'paid_amount' => 'required|numeric|min:0',
            'shadow_paid_amount' => 'required|numeric|min:0',
            'payment_status' => 'required|in:unpaid,partial,paid',
            'shadow_payment_status' => 'required|in:unpaid,partial,paid',
        ]);

        DB::beginTransaction();
        try {
            $purchase = Purchase::findOrFail($id);

            // Update payment details
            $purchase->update([
                'paid_amount' => $request->paid_amount,
                'shadow_paid_amount' => $request->shadow_paid_amount,
                'due_amount' => max(0, $purchase->total_amount - $request->paid_amount),
                'shadow_due_amount' => max(0, $purchase->shadow_total_amount - $request->shadow_paid_amount),
                'payment_status' => $request->payment_status,
                'shadow_payment_status' => $request->shadow_payment_status,
            ]);

            DB::commit();

            return redirect()->back()->with('success', 'Payment updated successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to update payment: ' . $e->getMessage());
        }
    }

    public function approve(Request $request, $id)
    {
        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.purchase_price' => 'required|numeric|min:0.01',
            'items.*.sale_price' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $purchase = Purchase::with('items')->findOrFail($id);

            if ($purchase->status !== 'pending' || $purchase->user_type !== 'shadow') {
                throw new \Exception('Only pending shadow purchases can be approved.');
            }

            // Update purchase items with approved prices
            foreach ($request->items as $itemData) {
                $item = $purchase->items->where('id', $itemData['id'])->first();
                if ($item) {
                    $item->update([
                        'unit_price' => $itemData['purchase_price'],
                        'sale_price' => $itemData['sale_price'],
                        'total_price' => $itemData['purchase_price'] * $item->quantity,
                    ]);

                    // Update stock with approved prices
                    $this->updateStock(
                        $item->product_id,
                        $item->variant_id,
                        $purchase->warehouse_id,
                        $item->quantity,
                        $itemData['purchase_price'],
                        $itemData['sale_price'],
                        $item->shadow_unit_price,
                        $item->shadow_sale_price
                    );
                }
            }

            // Recalculate totals based on approved prices
            $totalAmount = $purchase->items->sum('total_price');
            $dueAmount = max(0, $totalAmount - $purchase->paid_amount);
            $paymentStatus = $this->calculatePaymentStatus($purchase->paid_amount, $totalAmount);

            // Update purchase status and totals
            $purchase->update([
                'total_amount' => $totalAmount,
                'due_amount' => $dueAmount,
                'payment_status' => $paymentStatus,
                'status' => 'completed',
                'notes' => $purchase->notes . "\n\nApproval Notes: " . ($request->notes ?? 'No notes provided.'),
            ]);

            DB::commit();

            return redirect()->route('purchase.list')->with('success', 'Purchase approved successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to approve purchase: ' . $e->getMessage());
        }
    }

    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $purchase = Purchase::with('items')->findOrFail($id);

            if ($purchase->status === 'completed') {
                // Reverse stock for completed purchases
                foreach ($purchase->items as $item) {
                    $this->reverseStock(
                        $item->product_id,
                        $item->variant_id,
                        $purchase->warehouse_id,
                        $item->quantity
                    );
                }
            }

            // Delete purchase items
            PurchaseItem::where('purchase_id', $id)->delete();

            // Delete purchase
            $purchase->delete();

            DB::commit();

            return redirect()->route('purchase.list')->with('success', 'Purchase deleted successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to delete purchase: ' . $e->getMessage());
        }
    }

    /**
     * Update stock for a product variant
     */
    private function updateStock($productId, $variantId, $warehouseId, $quantity, $unitPrice, $salePrice, $shadowUnitPrice, $shadowSalePrice)
    {
        $stock = Stock::where('product_id', $productId)
            ->where('variant_id', $variantId)
            ->where('warehouse_id', $warehouseId)
            ->first();

        if ($stock) {
            // Update existing stock
            $stock->increment('quantity', $quantity);
            $stock->update([
                'unit_price' => $unitPrice,
                'sale_price' => $salePrice,
                'shadow_unit_price' => $shadowUnitPrice,
                'shadow_sale_price' => $shadowSalePrice,
            ]);
        } else {
            // Create new stock record
            Stock::create([
                'product_id' => $productId,
                'variant_id' => $variantId,
                'warehouse_id' => $warehouseId,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'sale_price' => $salePrice,
                'shadow_unit_price' => $shadowUnitPrice,
                'shadow_sale_price' => $shadowSalePrice,
            ]);
        }
    }

    /**
     * Reverse stock when purchase is deleted
     */
    private function reverseStock($productId, $variantId, $warehouseId, $quantity)
    {
        $stock = Stock::where('product_id', $productId)
            ->where('variant_id', $variantId)
            ->where('warehouse_id', $warehouseId)
            ->first();

        if ($stock) {
            if ($stock->quantity <= $quantity) {
                $stock->delete();
            } else {
                $stock->decrement('quantity', $quantity);
            }
        }
    }

    /**
     * Calculate payment status based on paid amount and total amount
     */
    private function calculatePaymentStatus($paidAmount, $totalAmount)
    {
        if ($paidAmount <= 0) {
            return 'unpaid';
        } elseif ($paidAmount >= $totalAmount) {
            return 'paid';
        } else {
            return 'partial';
        }
    }

    /**
     * Get status color for UI
     */
    private function getStatusColor($status)
    {
        return match ($status) {
            'pending' => 'warning',
            'completed' => 'success',
            'cancelled' => 'error',
            default => 'neutral',
        };
    }
}