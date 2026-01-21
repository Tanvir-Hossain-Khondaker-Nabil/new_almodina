<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\Sale;
use Inertia\Inertia;
use App\Models\Stock;
use App\Models\Account;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Variant;
use App\Models\Customer;
use App\Models\SaleItem;
use App\Models\Supplier;
use Illuminate\Support\Str;
use App\Models\PurchaseItem;
use Illuminate\Http\Request;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Services\ReceiptService;

class SalesController extends Controller
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

    // কনভার্ট টু বেস ইউনিট
    private function convertToBase($quantity, $fromUnit, $unitType)
    {
        $conversions = $this->getUnitConversions();

        if (!isset($conversions[$unitType][$fromUnit])) {
            return $quantity;
        }

        return $quantity * $conversions[$unitType][$fromUnit];
    }

    // কনভার্ট ফ্রম বেস ইউনিট
    private function convertFromBase($quantity, $toUnit, $unitType)
    {
        $conversions = $this->getUnitConversions();

        if (!isset($conversions[$unitType][$toUnit])) {
            return $quantity;
        }

        $conversion = $conversions[$unitType][$toUnit];
        return $conversion != 0 ? $quantity / $conversion : $quantity;
    }

    // Get available sale units for a product
    private function getAvailableSaleUnits($product, $stock = null)
    {
        $unitType = $product->unit_type ?? 'piece';
        $conversions = $this->getUnitConversions();

        if (!isset($conversions[$unitType])) {
            return [$product->default_unit ?? 'piece'];
        }

        // Get purchase unit from stock or product
        $purchaseUnit = $stock ? $stock->unit : ($product->default_unit ?? 'piece');
        $purchaseFactor = $conversions[$unitType][$purchaseUnit] ?? 1;

        // Get all units that are smaller or equal to purchase unit
        $available = [];
        foreach ($conversions[$unitType] as $unit => $factor) {
            if ($factor <= $purchaseFactor) {
                $available[] = $unit;
            }
        }

        // Sort from smallest to largest (gram < kg < ton)
        usort($available, function ($a, $b) use ($conversions, $unitType) {
            return ($conversions[$unitType][$a] ?? 0) <=> ($conversions[$unitType][$b] ?? 0);
        });

        return $available;
    }

    /**
     * Display a listing of all sales
     */
    public function index(Request $request, $pos = null)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $search = $request->input('search');
        $status = $request->input('status');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $pos === 'pos' ? $type = 'pos' : $type = 'inventory';

        $sales = Sale::with(['customer', 'items.product', 'items.product.brand', 'items.variant', 'payments'])
            ->where('type', $type)
            ->where('status', '!=', 'cancelled')
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('invoice_no', 'like', "%{$search}%")
                        ->orWhereHas('customer', function ($q) use ($search) {
                            $q->where('customer_name', 'like', "%{$search}%");
                        });
                });
            })
            ->when($status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($dateFrom, function ($query, $dateFrom) {
                $query->whereDate('created_at', '>=', $dateFrom);
            })
            ->when($dateTo, function ($query, $dateTo) {
                $query->whereDate('created_at', '<=', $dateTo);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        if ($isShadowUser) {
            $sales->getCollection()->transform(function ($sale) {
                return $this->transformToShadowData($sale);
            });
        }

        if ($type == 'pos') {
            $render = 'sales/IndexPos';
        } else {
            $render = 'sales/Index';
        }

        return Inertia::render($render, [
            'sales' => $sales,
            'accounts' => Account::where('is_active', true)->get(),
            'isShadowUser' => $isShadowUser,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
            'unitConversions' => $this->getUnitConversions()
        ]);
    }

    /**
     * Show form for the sale(inventory) creation
     */
    public function create()
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $customers = Customer::where('phone', '!=', '100100100')->active()->get();

        logger()->info($customers);

        $stock = Stock::with(['warehouse', 'product.category', 'product.brand', 'variant', 'product.variants'])
            ->where('quantity', '>', 0)
            ->orderBy('created_at', 'asc')
            ->get();

        

        $accounts = Account::where('is_active', true)->get();
        $supplier = Supplier::get();

        $isShadowUser ? $render = 'sales/CreateShadow' : $render = 'sales/Create';

        return Inertia::render($render, [
            'customers' => $customers,
            'productstocks' => $stock,
            'accounts' => $accounts,
            'isShadowUser' => $isShadowUser,
            'suppliers' => $supplier,
            'unitConversions' => $this->getUnitConversions()
        ]);
    }

    public function createPos()
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $customers = Customer::all();

        $stock = Stock::with(['warehouse', 'product.category', 'product.brand', 'variant'])
            ->where('quantity', '>', 0)
            ->orderBy('created_at', 'asc')
            ->get();

        $accounts = Account::where('is_active', true)->get();
        $supplier = Supplier::get();

        $isShadowUser ? $render = 'sales/CreateShadowPos' : $render = 'sales/CreatePos';

        return Inertia::render($render, [
            'customers' => $customers,
            'productstocks' => $stock,
            'accounts' => $accounts,
            'isShadowUser' => $isShadowUser,
            'suppliers' => $supplier,
            'unitConversions' => $this->getUnitConversions()
        ]);
    }

    /**
     * ✅ Store sale (FIXED: inventory with unit conversions)
     */

    public function store(Request $request)
    {

        //dd($request->all());

        $type = $request->input('type', 'pos');

        $rules = [
            'customer_id' => 'nullable|exists:customers,id',
            'customer_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.variant_id' => 'required|exists:variants,id',
            'items.*.unit_quantity' => 'required|numeric|min:0.001',
            'items.*.unit' => 'required|string|max:20',
            'account_id' => 'nullable|exists:accounts,id',
        ];

        if ($request->paid_amount > 0) {
            $rules['account_id'] = 'required|exists:accounts,id';
        }

        if ($request->has('pickup_items') && is_array($request->pickup_items) && count($request->pickup_items) > 0) {
            $rules['supplier_id'] = 'required|exists:suppliers,id';
        }

        // dd($request->all());

        $request->validate($rules);

        DB::beginTransaction();

        try {
            $adjust_amount = (bool) $request->adjust_from_advance;
            $paid_amount = (float) ($request->paid_amount ?? 0);
            $account_id = $request->account_id ?? null;

            $supplier_id = $request->supplier_id ?? null;
            $pickup_items = $request->pickup_items ?? [];
            $regular_items = $request->items ?? [];

            // Validate account
            if ($paid_amount > 0) {
                $account = Account::find($account_id);
                if (!$account)
                    throw new \Exception('Selected account not found.');
            } else {
                $account = null;
            }

            // Validate supplier for pickup items
            if (count($pickup_items) > 0) {
                if (!$supplier_id)
                    throw new \Exception('Supplier is required for pickup items.');
                $supplier = Supplier::find($supplier_id);
                if (!$supplier)
                    throw new \Exception('Selected supplier not found.');
            }

            // ✅ Determine customerId
            $customerId = null;

            if (
                !$request->filled('customer_id') &&
                !$request->filled('customer_name') &&
                !$request->filled('phone')
            ) {
                $customerId = Customer::where('phone', '100100100')->first()->id ?? 1;
            } elseif (!empty($request->customer_id)) {
                $customerId = (int) $request->customer_id;
            } else {
                $name = trim((string) $request->customer_name);
                $phone = trim((string) $request->phone);

                if ($name !== '' && $phone !== '') {
                    $existingCustomer = Customer::where('phone', $phone)->first();

                    if ($existingCustomer) {
                        $customerId = $existingCustomer->id;
                    } else {
                        $customerId = Customer::create([
                            'customer_name' => $name,
                            'phone' => $phone,
                            'advance_amount' => 0,
                            'due_amount' => $request->customer_due_amount ?? 0,
                            'is_active' => 1,
                            'created_by' => Auth::id(),
                        ])->id;
                    }
                }
            }

            // ✅ Inventory must have a customer
            if ($type === 'inventory' && !$customerId) {
                throw new \Exception('Customer is required for inventory sale.');
            }

            // Handle advance adjustment (only if customer exists)
            $payment_type = $account->type ?? 'cash';

            if ($adjust_amount === true && $customerId) {
                $customer = Customer::find($customerId);
                if (!$customer)
                    throw new \Exception('Customer not found for advance adjustment.');

                if ($paid_amount > $customer->advance_amount) {
                    throw new \Exception('Adjustment amount cannot be greater than available advance amount.');
                }

                $payment_type = 'advance_adjustment';
                $customer->update([
                    'advance_amount' => $customer->advance_amount - $paid_amount,
                ]);
            }

            // paid amount logic
            $paidAmount = $request->paid_amount ?? 0;

            // status
            if ($type === 'inventory' || $type === 'pos') {
                $status = ((float) $request->paid_amount === (float) $request->grand_amount) ? 'paid' : 'pending';
            }

            $sale = Sale::create([
                'customer_id' => $customerId,
                'invoice_no' => $this->generateInvoiceNo(),
                'sub_total' => $request->sub_amount ?? 0,
                'discount' => $request->discount_rate ?? 0,
                'vat_tax' => $request->vat_rate ?? 0,
                'grand_total' => $request->grand_amount ?? 0,
                'paid_amount' => $paidAmount ?? 0,
                'due_amount' => $request->due_amount ?? 0,

                'shadow_vat_tax' => $request->vat_rate ?? 0,
                'shadow_discount' => $request->discount_rate ?? 0,
                'shadow_sub_total' => $request->sub_amount ?? 0,
                'shadow_grand_total' => $request->grand_amount ?? 0,
                'shadow_paid_amount' => $paidAmount ?? 0,
                'shadow_due_amount' => $request->due_amount ?? 0,

                'account_id' => $account->id ?? null,
                'payment_type' => $payment_type ?? 'cash',
                'status' => $status ?? 'pending',
                'type' => $type ?? 'pos',
                'sale_type' => count($pickup_items) > 0 ? 'both' : 'real',
                'created_by' => Auth::id(),
            ]);

            $shadowSubTotal = 0;
            $regularSubTotal = 0;
            $regularCostTotal = 0;

            // Regular items
            if (count($regular_items) > 0) {
                foreach ($regular_items as $item) {
                    if (!isset($item['product_id']) || !isset($item['variant_id'])) {
                        throw new \Exception('Product ID and Variant ID are required for inventory items.');
                    }

                    $product = Product::find($item['product_id']);
                    $variant = Variant::find($item['variant_id']);
                    if (!$product || !$variant)
                        throw new \Exception('Product or Variant not found for inventory item.');

                    $unit = $item['unit'] ?? ($product->min_sale_unit ?? $product->default_unit ?? 'piece');
                    $unitQuantity = (float) ($item['unit_quantity'] ?? $item['quantity'] ?? 1);

                    // Get sale price (already converted to selected unit in frontend)
                    $unitPrice = (float) ($item['unit_price'] ?? 0);
                    $shadowUnitPrice = (float) ($item['shadow_sell_price'] ?? $unitPrice);

                    // Calculate base quantity
                    $unitType = $product->unit_type ?? 'piece';
                    $baseQuantity = $this->convertToBase($unitQuantity, $unit, $unitType);

                    // Check stock in base units
                    $availableBaseQty = $this->getAvailableStockInBase($product->id, $variant->id, $item['stock_id'] ?? null);
                    if ($baseQuantity > $availableBaseQty) {
                        $availableInUnit = $this->convertFromBase($availableBaseQty, $unit, $unitType);
                        throw new \Exception("Not enough stock for {$product->name}. Available: {$availableInUnit} {$unit}, Requested: {$unitQuantity} {$unit}");
                    }

                    // FIFO stock deduction in base units
                    $stockUsed = $this->fifoOutInBase($product->id, $variant->id, $baseQuantity, $sale->id, $item['stock_id'] ?? null, $unit);

                    SaleItem::create([
                        'sale_id' => $sale->id,
                        'product_id' => $product->id,
                        'variant_id' => $variant->id,
                        'warehouse_id' => $stockUsed['warehouse_id'] ?? null,
                        'quantity' => $unitQuantity,
                        'unit' => $unit,
                        'unit_quantity' => $unitQuantity,
                        'base_quantity' => $baseQuantity,
                        'unit_price' => $unitPrice,
                        'total_price' => $unitQuantity * $unitPrice,
                        'stock_id' => $stockUsed['stock_id'] ?? null,
                        'shadow_unit_price' => $shadowUnitPrice,
                        'shadow_total_price' => $unitQuantity * $shadowUnitPrice,
                        'status' => 'completed',
                        'created_by' => Auth::id(),
                        'item_type' => 'real',
                    ]);

                    $shadowSubTotal += $unitQuantity * $shadowUnitPrice;
                    $regularSubTotal += $unitQuantity * $unitPrice;
                }
            }

            // Pickup items
            if (count($pickup_items) > 0) {
                foreach ($pickup_items as $pickupItem) {
                    $pickupQuantity = (int) ($pickupItem['quantity'] ?? 1);
                    $pickupUnitPrice = (float) ($pickupItem['unit_price'] ?? 0);
                    $pickupSalePrice = (float) ($pickupItem['sale_price'] ?? $pickupUnitPrice);
                    $pickupTotalPrice = (float) ($pickupItem['total_price'] ?? ($pickupQuantity * $pickupSalePrice));

                    $purchaseItem = PurchaseItem::create([
                        'purchase_id' => null,
                        'product_id' => null,
                        'variant_id' => null,
                        'warehouse_id' => null,
                        'supplier_id' => $supplier_id,
                        'quantity' => $pickupQuantity,
                        'unit_price' => $pickupUnitPrice,
                        'total_price' => $pickupUnitPrice * $pickupQuantity,
                        'shadow_unit_price' => $pickupUnitPrice,
                        'shadow_total_price' => $pickupUnitPrice * $pickupQuantity,
                        'shadow_sale_price' => $pickupSalePrice,
                        'sale_price' => $pickupSalePrice,
                        'created_by' => Auth::id(),
                        'item_type' => 'pickup',
                        'product_name' => $pickupItem['product_name'] ?? null,
                        'brand' => $pickupItem['brand'] ?? null,
                        'variant_name' => $pickupItem['variant'] ?? null,
                    ]);

                    SaleItem::create([
                        'sale_id' => $sale->id,
                        'product_id' => null,
                        'variant_id' => null,
                        'warehouse_id' => null,
                        'stock_id' => null,
                        'quantity' => $pickupQuantity,
                        'unit' => 'piece',
                        'unit_quantity' => $pickupQuantity,
                        'base_quantity' => $pickupQuantity,
                        'unit_price' => $pickupSalePrice,
                        'total_price' => $pickupTotalPrice,
                        'shadow_unit_price' => $pickupSalePrice,
                        'shadow_total_price' => $pickupTotalPrice,
                        'status' => 'completed',
                        'created_by' => Auth::id(),
                        'item_type' => 'pickup',
                        'product_name' => $pickupItem['product_name'] ?? null,
                        'brand' => $pickupItem['brand'] ?? null,
                        'variant_name' => $pickupItem['variant'] ?? null,
                        'purchase_item_id' => $purchaseItem->id,
                    ]);

                    $shadowSubTotal += $pickupTotalPrice;
                    $regularSubTotal += $pickupTotalPrice;
                    $regularCostTotal += $pickupUnitPrice * $pickupQuantity;
                }
            }

            if (count($regular_items) == 0 && count($pickup_items) == 0) {
                throw new \Exception('At least one item is required for a sale.');
            }

            // Update sale totals
            $sale->update([
                'sub_total' => $regularSubTotal,
                'grand_total' => $regularSubTotal + ($regularSubTotal * ($request->vat_rate ?? 0) / 100) - ($regularSubTotal * ($request->discount_rate ?? 0) / 100),
                'shadow_sub_total' => $shadowSubTotal,
                'shadow_grand_total' => $shadowSubTotal + ($shadowSubTotal * ($request->vat_rate ?? 0) / 100) - ($shadowSubTotal * ($request->discount_rate ?? 0) / 100),
                'shadow_due_amount' => $sale->shadow_grand_total - $paidAmount,
            ]);

            if ($paidAmount > 0) {
                Payment::create([
                    'sale_id' => $sale->id,
                    'account_id' => $account_id,
                    'amount' => $paidAmount,
                    'shadow_amount' => $shadowSubTotal,
                    'payment_method' => $request->payment_method ?? ($payment_type ?? 'cash'),
                    'txn_ref' => $request->txn_ref ?? ('SIOP-' . Str::random(10)),
                    'note' => $request->notes ?? null,
                    'customer_id' => $customerId,
                    'paid_at' => Carbon::now(),
                    'status' => 'completed',
                    'created_by' => Auth::id(),
                ]);

                if ($paid_amount && $adjust_amount == false) {
                    $account->updateBalance($paidAmount - $regularCostTotal, 'credit');
                }
            }

            DB::commit();

            return to_route('sales.show', $sale->id)->with('success', 'Sale created successfully! Invoice: ' . $sale->invoice_no);
        } catch (\Exception $e) {
            DB::rollBack();
            logger()->error('Error creating sale', [
                'message' => $e->getMessage(),
                'file'    => $e->getFile(),
                'line'    => $e->getLine(),
                'trace'   => $e->getTraceAsString(),
            ]);
            return back()->withErrors($e->getMessage());
        }
    }

    // Get available stock in base units
    private function getAvailableStockInBase($productId, $variantId, $stockId = null)
    {
        $query = Stock::where('product_id', $productId)
            ->where('variant_id', $variantId)
            ->where('quantity', '>', 0);

        if ($stockId) {
            $query->where('id', $stockId);
        }

        $stocks = $query->get();

        $totalBase = 0;
        foreach ($stocks as $stock) {
            $totalBase += $stock->base_quantity ?? $stock->quantity;
        }

        return $totalBase;
    }

    // FIFO stock deduction in base units
    private function fifoOutInBase($productId, $variantId, $neededBaseQty, $saleId, $stockId = null, $saleUnit = null)
    {
        $query = Stock::where('product_id', $productId)
            ->where('variant_id', $variantId)
            ->where('quantity', '>', 0);

        if ($stockId) {
            $query->where('id', $stockId);
        }

        $stocks = $query->orderBy('created_at', 'asc')->get();

        $stockUsed = [
            'warehouse_id' => null,
            'stock_id' => null
        ];

        foreach ($stocks as $stock) {
            if ($neededBaseQty <= 0) break;

            $availableBaseQty = $stock->base_quantity ?? $stock->quantity;
            $takeBase = min($availableBaseQty, $neededBaseQty);

            // Update stock in base units
            $remainingBaseQty = $availableBaseQty - $takeBase;

            if ($stock->unit) {
                // Convert back to original unit for display
                $product = Product::find($productId);
                $unitType = $product->unit_type ?? 'piece';
                $remainingUnitQty = $this->convertFromBase($remainingBaseQty, $stock->unit, $unitType);

                $stock->update([
                    'quantity' => $remainingUnitQty,
                    'base_quantity' => $remainingBaseQty
                ]);
            } else {
                $stock->decrement('quantity', $takeBase);
                $stock->decrement('base_quantity', $takeBase);
            }

            $neededBaseQty -= $takeBase;

            // Record which stock was used
            if (!$stockUsed['warehouse_id']) {
                $stockUsed['warehouse_id'] = $stock->warehouse_id;
                $stockUsed['stock_id'] = $stock->id;
            }

            // Stock movement record
            StockMovement::create([
                'warehouse_id' => $stock->warehouse_id ?? null,
                'product_id' => $productId,
                'variant_id' => $variantId,
                'type' => 'out',
                'qty' => $takeBase,
                'unit' => 'base',
                'sale_unit' => $saleUnit,
                'reference_type' => Sale::class,
                'reference_id' => $saleId,
                'created_by' => Auth::id(),
                'notes' => 'Sale deduction in base units. Sold in unit: ' . $saleUnit
            ]);
        }

        if ($neededBaseQty > 0) {
            throw new \Exception("Not enough stock for product ID $productId.");
        }

        return $stockUsed;
    }

    // Get product with stock info
    public function getProductWithStock($productId, $variantId = null)
    {
        try {
            $product = Product::with(['variants.stock'])->findOrFail($productId);

            // Calculate total available stock
            $totalStock = 0;
            $totalBaseStock = 0;

            foreach ($product->variants as $variant) {
                if ($variant->stock) {
                    $totalStock += $variant->stock->quantity;
                    $totalBaseStock += $variant->stock->base_quantity ?? $variant->stock->quantity;
                }
            }

            $response = [
                'product' => $product,
                'total_stock' => $totalStock,
                'total_base_stock' => $totalBaseStock,
                'unit_type' => $product->unit_type ?? 'piece',
                'default_unit' => $product->default_unit ?? 'piece',
                'min_sale_unit' => $product->min_sale_unit ?? null,
                'is_fraction_allowed' => $product->is_fraction_allowed ?? false,
            ];

            if ($variantId) {
                $variant = Variant::with('stock')->where('product_id', $productId)
                    ->where('id', $variantId)
                    ->first();

                if ($variant) {
                    $response['variant'] = $variant;
                    $response['variant_stock'] = $variant->stock;
                }
            }

            return response()->json($response);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Product not found'], 404);
        }
    }

    /**
     * Display the specified sale
     */
    public function show(Sale $sale, $print = null)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';
        $sale = Sale::with([
            'customer',
            'items',
            'items.product',
            'items.product.brand',
            'items.variant',
            'items.warehouse',
            'creator'
        ])->findOrFail($sale->id);

        if ($isShadowUser) {
            $sale = $this->transformToShadowData($sale);
        }

        $render = $print ? 'sales/ShowPos' : 'sales/Show';

        return Inertia::render($render, [
            'sale' => $sale,
            'business_name' => @$sale->creator->business->name,
        ]);
    }

    /**
     * Remove the specified sale
     */
    public function destroy(Sale $sale)
    {
        DB::beginTransaction();

        try {
            foreach ($sale->items as $item) {
                if ($item->item_type === 'real') {
                    // Find stock record and add back the quantity
                    $stock = Stock::where('product_id', $item->product_id)
                        ->where('variant_id', $item->variant_id)
                        ->where('warehouse_id', $item->warehouse_id)
                        ->first();

                    if ($stock) {
                        // Calculate base quantity to add back
                        $unitType = $item->product->unit_type ?? 'piece';
                        $baseQty = $this->convertToBase($item->quantity, $item->unit, $unitType);

                        $stock->increment('quantity', $item->quantity);
                        $stock->increment('base_quantity', $baseQty);
                    }
                }
            }

            $sale->delete();

            DB::commit();

            return redirect()->route('sales.index')->with('success', 'Sale deleted successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors($e->getMessage());
        }
    }

    private function generateInvoiceNo()
    {
        $last = Sale::latest()->first();
        $num = $last ? intval(substr($last->invoice_no, -4)) + 1 : 1;
        return 'INV-' . date('Y-m') . '-' . str_pad($num, 4, '0', STR_PAD_LEFT);
    }

    private function transformToShadowData($sale)
    {
        $sale->sub_total = $sale->shadow_sub_total;
        $sale->discount = $sale->shadow_discount;
        $sale->vat_tax = $sale->shadow_vat_tax;
        $sale->grand_total = $sale->shadow_grand_total;
        $sale->paid_amount = $sale->shadow_paid_amount;
        $sale->due_amount = $sale->shadow_due_amount;

        if ($sale->items) {
            $sale->items->transform(function ($item) {
                $item->unit_price = $item->shadow_unit_price;
                $item->sale_price = $item->shadow_sale_price;
                $item->total_price = $item->shadow_total_price;
                return $item;
            });
        }

        return $sale;
    }

    public function scanBarcode(Request $request)
    {
        $code = trim($request->code);
        $code = preg_replace('/\s+/', '', $code);

        $stock = Stock::with(['product', 'variant'])
            ->where('quantity', '>', 0)
            ->where(function ($q) use ($code) {
                $q->where('barcode', $code)
                    ->orWhere('batch_no', $code);
            })
            ->first();

        if (!$stock) {
            return response()->json([
                'message' => 'Stock not found',
                'code_received' => $code,
            ], 404);
        }

        return response()->json([
            'stock' => [
                'id' => $stock->id,
                'barcode' => $stock->barcode,
                'batch_no' => $stock->batch_no,
                'quantity' => $stock->quantity,
                'base_quantity' => $stock->base_quantity,
                'unit' => $stock->unit,
                'sale_price' => $stock->sale_price,
                'shadow_sale_price' => $stock->shadow_sale_price,
                'product' => [
                    'id' => $stock->product->id,
                    'name' => $stock->product->name,
                    'product_no' => $stock->product->product_no,
                    'unit_type' => $stock->product->unit_type ?? 'piece',
                    'default_unit' => $stock->product->default_unit ?? 'piece',
                    'is_fraction_allowed' => $stock->product->is_fraction_allowed ?? false,
                    'min_sale_unit' => $stock->product->min_sale_unit ?? null,
                ],
                'variant' => [
                    'id' => $stock->variant->id,
                    'sku' => $stock->variant->sku,
                    'attribute_values' => $stock->variant->attribute_values,
                ],
            ]
        ]);
    }

    // Get available units for a product
    public function getAvailableUnits($productId, $stockId = null)
    {
        try {
            $product = Product::findOrFail($productId);
            $stock = $stockId ? Stock::find($stockId) : null;

            $availableUnits = $this->getAvailableSaleUnits($product, $stock);

            return response()->json([
                'units' => $availableUnits,
                'default_unit' => $product->default_unit ?? 'piece',
                'min_sale_unit' => $product->min_sale_unit ?? null,
                'is_fraction_allowed' => $product->is_fraction_allowed ?? false,
                'unit_type' => $product->unit_type ?? 'piece'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Product not found',
                'units' => ['piece'],
                'default_unit' => 'piece',
                'min_sale_unit' => null,
                'is_fraction_allowed' => false,
                'unit_type' => 'piece'
            ], 404);
        }
    }

    // Get available sale units for a specific stock item
    public function getAvailableSaleUnitsForStock($stockId)
    {
        $stock = Stock::with('product')->findOrFail($stockId);
        $product = $stock->product;

        if (!$product) {
            return response()->json(['available_units' => [$stock->unit ?? 'piece']]);
        }

        $availableUnits = $this->getAvailableSaleUnits($product, $stock);

        // Calculate price in different units
        $prices = [];
        foreach ($availableUnits as $unit) {
            if ($unit === $stock->unit) {
                $prices[$unit] = $stock->sale_price;
            } else {
                $prices[$unit] = $this->calculatePriceInUnit(
                    $stock->sale_price,
                    $stock->unit,
                    $unit,
                    $product->unit_type ?? 'piece'
                );
            }
        }

        return response()->json([
            'available_units' => $availableUnits,
            'prices' => $prices,
            'purchase_unit' => $stock->unit,
            'sale_price' => $stock->sale_price,
            'base_quantity' => $stock->base_quantity,
            'product' => [
                'name' => $product->name,
                'unit_type' => $product->unit_type,
                'is_fraction_allowed' => $product->is_fraction_allowed
            ]
        ]);
    }

    // Calculate price in different unit
    private function calculatePriceInUnit($price, $fromUnit, $toUnit, $unitType)
    {
        $conversions = $this->getUnitConversions();

        if (!isset($conversions[$unitType][$fromUnit]) || !isset($conversions[$unitType][$toUnit])) {
            return $price;
        }

        $pricePerBaseUnit = $price / $conversions[$unitType][$fromUnit];
        return $pricePerBaseUnit * $conversions[$unitType][$toUnit];
    }

    // Get unit conversion rates
    public function getUnitConversionRates()
    {
        return response()->json([
            'conversions' => $this->getUnitConversions()
        ]);
    }

    public function allSalesItems()
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $salesItems = SaleItem::with(['sale.customer', 'product', 'variant', 'stock', 'warehouse'])
            ->where('status', '!=', 'cancelled')
            ->orderBy('created_at', 'desc')
            ->filter(request()->all())
            ->paginate(15)
            ->withQueryString();

        if ($isShadowUser) {
            $salesItems->getCollection()->transform(function ($item) {
                return self::transformToShadowItemData($item);
            });
        }

        return Inertia::render('sales/SalesItem', [
            'salesItems' => $salesItems,
            'isShadowUser' => $isShadowUser,
        ]);
    }
    public function showItem($id)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';
        $saleItem = SaleItem::with(['sale.customer', 'product', 'variant', 'warehouse',])->findOrFail($id);

        if ($isShadowUser) {
            $saleItem = self::transformToShadowItemData($saleItem);
        }

        return Inertia::render('sales/ShowItem', [
            'saleItem' => $saleItem,
            'isShadowUser' => $isShadowUser,
        ]);
    }

    // payment Clearance - UPDATED WITH ACCOUNT SUPPORT
    public function storePayment(Request $request, Sale $sale)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'account_id' => 'required|exists:accounts,id',
        ]);

        $customerId = $sale->customer_id;
        $account = Account::find($request->account_id);

        if (!$account || !$account->is_active) {
            return back()->withErrors(['error' => 'Selected account is not active or not found.']);
        }

        DB::beginTransaction();

        try {
            Payment::create([
                'sale_id' => $sale->id,
                'account_id' => $request->account_id,
                'customer_id' => $customerId,
                'amount' => $request->amount,
                'shadow_amount' => $request->shadow_paid_amount ?? 0,
                'payment_method' => $request->payment_method ?? $account->type,
                'txn_ref' => $request->txn_ref ?? ('nexoryn-' . Str::random(10)),
                'note' => $request->notes ?? 'sales due payment clearance',
                'paid_at' => $request->payment_date ?? Carbon::now(),
                'created_by' => Auth::id(),
                'status' => 'completed',
            ]);

            $newPaidAmount = $sale->paid_amount + $request->amount;
            $newDueAmount = max(0, $sale->due_amount - $request->amount);

            $sale->update([
                'paid_amount' => $newPaidAmount ?? 0,
                'shadow_paid_amount' => $sale->shadow_paid_amount + ($request->shadow_paid_amount ?? 0),
                'due_amount' => $newDueAmount ?? 0,
                'shadow_due_amount' => max(0, $sale->shadow_due_amount - ($request->shadow_paid_amount ?? 0)),
                'status' => $newDueAmount <= 0.01 ? 'paid' : 'partial',
            ]);

            $account->updateBalance($request->amount, 'credit');

            DB::commit();

            return redirect()->back()->with('success', 'Payment recorded successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Payment failed: ' . $e->getMessage()]);
        }
    }

    public function printRequest(ReceiptService $posPrinter, $id)
    {
        $sale = Sale::with(['customer', 'items.product', 'items.product.brand', 'items.variant', 'items.warehouse'])
            ->findOrFail($id);

        $posPrinter->printRequest((float) $sale->paid_amount, $sale);

        return response()->json(['ok' => true]);
    }

    public function print(Sale $sale)
    {
        $sale = Sale::with(['customer', 'items.product', 'items.product.brand', 'items.variant', 'items.warehouse'])
            ->findOrFail($sale->id);

        return Inertia::render('Sales/Print', [
            'sale' => $sale,
        ]);
    }
}
