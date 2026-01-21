<?php

namespace App\Http\Controllers;

use App\Http\Requests\SalesReturnStore;
use App\Models\Account;
use App\Models\Customer;
use App\Models\Expense;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalesReturn;
use App\Models\SalesReturnItem;
use App\Models\Stock;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Str;

class SalesReturnController extends Controller
{
    // ইউনিট কনভার্সন ফ্যাক্টর
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

    // ইনডেক্স ফাংশন
    public function index(Request $request)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $query = SalesReturn::with([
            'sale.customer',
            'customer',
            'sale.items.product',
            'sale.items.variant',
        ]);

        // সার্চ ফিল্টার
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('return_no', 'like', '%' . $request->search . '%')
                    ->orWhereHas('sale', function ($q) use ($request) {
                        $q->where('invoice_no', 'like', '%' . $request->search . '%');
                    })
                    ->orWhereHas('customer', function ($q) use ($request) {
                        $q->where('customer_name', 'like', '%' . $request->search . '%')
                            ->orWhere('phone', 'like', '%' . $request->search . '%');
                    });
            });
        }

        // স্ট্যাটাস ফিল্টার
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // তারিখ ফিল্টার
        if ($request->filled('date_from') && $request->filled('date_to')) {
            $query->whereBetween('return_date', [
                $request->date_from,
                $request->date_to
            ]);
        }

        // টাইপ ফিল্টার
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        $salesReturns = $query->orderBy('created_at', 'desc')
            ->paginate(15);

        // শ্যাডো ইউজারের জন্য ডেটা ট্রান্সফর্ম
        if ($isShadowUser) {
            $salesReturns->getCollection()->transform(function ($return) {
                return $this->transformToShadowData($return);
            });
        }

        return Inertia::render('SalesReturn/Index', [
            'salesReturns' => $salesReturns,
            'filters' => $request->only(['search', 'status', 'date_from', 'date_to', 'type'])
        ]);
    }

    // ক্রিয়েট পেজ
    public function create(Request $request)
    {
        $saleId = $request->query('sale_id');
        $sale = null;
        $saleItems = [];

        if ($saleId) {
            $sale = Sale::with([
                'items.product',
                'items.variant',
                'customer',
                'items.stock'
            ])->findOrFail($saleId);

            // শুধু ইনভেন্টরি আইটেমগুলো নিন (পিকআপ আইটেম নয়)
            foreach ($sale->items as $item) {
                if (is_null($item->product_id) || $item->item_type === 'pickup') {
                    continue;
                }

                // ইউনিট কনভার্সন জন্য প্রোডাক্ট ডিটেইলস
                $product = $item->product;
                $unitType = $product->unit_type ?? 'piece';
                $availableUnits = $this->getAvailableSaleUnits($product);

                // স্টক ক্যালকুলেশন (ইউনিট কনভার্সন সহ)
                $stock = $item->stock;
                $availableStock = 0;
                $availableBaseStock = 0;

                if ($stock) {
                    // বেস ইউনিটে কনভার্ট করে স্টক চেক করুন
                    $availableBaseStock = $stock->base_quantity ?? $stock->quantity;
                    
                    // আইটেমের ইউনিটে কনভার্ট করুন
                    if ($item->unit && $item->unit !== $stock->unit) {
                        $availableStock = $this->convertFromBase(
                            $availableBaseStock,
                            $item->unit,
                            $unitType
                        );
                    } else {
                        $availableStock = $availableBaseStock;
                    }
                }

                // ইতিমধ্যে রিটার্ন করা পরিমাণ
                $alreadyReturned = SalesReturnItem::where('sale_item_id', $item->id)
                    ->where('status', 'completed')
                    ->sum('return_quantity');

                // সর্বোচ্চ রিটার্ন করতে পারবে
                $maxQuantity = max(0, $item->quantity - $alreadyReturned);
                $maxQuantity = min($maxQuantity, $availableStock);

                if ($maxQuantity > 0) {
                    $saleItems[] = [
                        'id' => $item->id,
                        'sale_item_id' => $item->id,
                        'product_id' => $item->product_id,
                        'product_name' => $item->product->name,
                        'product_code' => $item->product->product_no,
                        'variant_id' => $item->variant_id,
                        'variant_name' => $this->getVariantDisplayName($item->variant),
                        'brand_name' => $item->product->brand->name ?? 'No Brand',
                        'max_quantity' => $maxQuantity,
                        'unit' => $item->unit ?? 'piece',
                        'available_units' => $availableUnits,
                        'unit_price' => $item->unit_price,
                        'shadow_unit_price' => $item->shadow_unit_price,
                        'sale_price' => $item->unit_price, // বিক্রয় মূল্য
                        'shadow_sale_price' => $item->shadow_unit_price,
                        'sale_quantity' => $item->quantity,
                        'total_price' => $item->total_price,
                        'shadow_total_price' => $item->shadow_total_price,
                        'stock_quantity' => $availableStock,
                        'base_stock_quantity' => $availableBaseStock,
                        'already_returned' => $alreadyReturned,
                        'warehouse_id' => $item->warehouse_id
                    ];
                }
            }
        }

        // সাম্প্রতিক বিক্রয়গুলো (ইনভেন্টরি শুধু)
        $recentSales = Sale::with(['customer'])
            ->whereHas('items', function ($query) {
                $query->where('item_type', 'real')
                    ->whereNotNull('product_id');
            })
            ->whereDate('created_at', '>=', now()->subDays(30))
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        return Inertia::render('SalesReturn/Create', [
            'sale' => $sale,
            'saleItems' => $saleItems,
            'sales' => $recentSales,
            'accounts' => Account::where('is_active', true)->get(),
            'customers' => Customer::all(),
            'products' => Product::with(['variants', 'brand'])->get(),
            'unitConversions' => $this->getUnitConversions()
        ]);
    }

    // ভেরিয়েন্ট ডিসপ্লে নাম
    private function getVariantDisplayName($variant)
    {
        if (!$variant) return 'Default Variant';

        $parts = [];

        if ($variant->attribute_values && is_array($variant->attribute_values)) {
            foreach ($variant->attribute_values as $key => $value) {
                $parts[] = "$key: $value";
            }
        }

        if ($variant->sku) {
            $parts[] = "SKU: {$variant->sku}";
        }

        return !empty($parts) ? implode(', ', $parts) : 'Default Variant';
    }

    // উপলব্ধ বিক্রয় ইউনিট
    private function getAvailableSaleUnits($product)
    {
        $unitType = $product->unit_type ?? 'piece';
        $conversions = $this->getUnitConversions();
        
        if (!isset($conversions[$unitType])) {
            return [$product->default_unit ?? 'piece'];
        }
        
        // পুচ্ছেজ ইউনিট (ডিফল্ট ইউনিট)
        $purchaseUnit = $product->default_unit ?? 'piece';
        $purchaseFactor = $conversions[$unitType][$purchaseUnit] ?? 1;
        
        // ছোট বা সমান ইউনিটগুলো
        $available = [];
        foreach ($conversions[$unitType] as $unit => $factor) {
            if ($factor <= $purchaseFactor) {
                $available[] = $unit;
            }
        }
        
        // সর্ট করুন (ছোট থেকে বড়)
        usort($available, function($a, $b) use ($conversions, $unitType) {
            return ($conversions[$unitType][$a] ?? 0) <=> ($conversions[$unitType][$b] ?? 0);
        });
        
        return $available;
    }

    // স্টোর ফাংশন (ইউনিট কনভার্সন সহ)
    public function store(SalesReturnStore $request)
    {

        $request->validated();


        DB::beginTransaction();
        try {
            // রিটার্ন নম্বর জেনারেট
            $returnCount = SalesReturn::whereDate('created_at', today())->count();
            $returnNo = 'SRT-' . date('Ymd') . '-' . str_pad($returnCount + 1, 4, '0', STR_PAD_LEFT);

            $sale = Sale::with(['customer', 'items'])->findOrFail($request->sale_id);
            $isDamaged = $request->input('is_damaged', false);
            $type = $isDamaged ? 'damaged' : 'sale_return';

            // কাস্টমার ডেটা
            $customerId = $sale->customer_id;
            $customer = $sale->customer;

            // টোটাল রিটার্ন ভ্যালু ক্যালকুলেট
            $totalReturnValue = 0;
            $shadowTotalReturnValue = 0;

            foreach ($request->items as $itemData) {
                $saleItem = SaleItem::with(['product', 'variant'])->findOrFail($itemData['sale_item_id']);
                
                $quantity = $itemData['return_quantity'];
                $unit = $itemData['unit'];
                
                // প্রোডাক্ট ইউনিট টাইপ
                $product = $saleItem->product;
                $unitType = $product->unit_type ?? 'piece';
                
                // ইউনিট ভ্যালিডেশন
                $availableUnits = $this->getAvailableSaleUnits($product);
                if (!in_array($unit, $availableUnits)) {
                    throw new \Exception("Invalid unit {$unit} for product {$product->name}. Allowed units: " . implode(', ', $availableUnits));
                }
                
                // বেস ইউনিটে কনভার্ট
                $baseQuantity = $this->convertToBase($quantity, $unit, $unitType);
                
                // টোটাল ক্যালকুলেট
                $totalReturnValue += $quantity * $saleItem->unit_price;
                $shadowTotalReturnValue += $quantity * $saleItem->shadow_unit_price;
            }

            // রিপ্লেসমেন্ট টোটাল
            $replacementTotal = 0;
            $shadowReplacementTotal = 0;
            
            if ($request->return_type === 'product_replacement' && !empty($request->replacement_products)) {
                foreach ($request->replacement_products as $replacement) {
                    $quantity = $replacement['quantity'] ?? 1;
                    $salePrice = $replacement['sale_price'] ?? 0;
                    $shadowSalePrice = $replacement['shadow_sale_price'] ?? $salePrice;
                    
                    $replacementTotal += $quantity * $salePrice;
                    $shadowReplacementTotal += $quantity * $shadowSalePrice;
                }
            }

            // রিফান্ড আমাউন্ট
            $refundedAmount = $request->refunded_amount ?? 0;
            $shadowRefundedAmount = $request->shadow_refunded_amount ?? 0;
            
            if ($request->return_type === 'money_back') {
                $refundedAmount = $totalReturnValue;
                $shadowRefundedAmount = $shadowTotalReturnValue;
            }

            // সেলস রিটার্ন ক্রিয়েট
            $salesReturn = SalesReturn::create([
                'return_no' => $returnNo,
                'sale_id' => $request->sale_id,
                'customer_id' => $customerId,
                'return_type' => $request->return_type,
                'return_date' => $request->return_date,
                'reason' => $request->reason,
                'notes' => $request->notes,
                'refunded_amount' => $refundedAmount,
                'shadow_refunded_amount' => $shadowRefundedAmount,
                'replacement_total' => $replacementTotal,
                'shadow_replacement_total' => $shadowReplacementTotal,
                'total_return_value' => $totalReturnValue,
                'shadow_total_return_value' => $shadowTotalReturnValue,
                'status' => 'pending',
                'type' => $type,
                'created_by' => Auth::id()
            ]);

            // আইটেমস প্রসেস
            foreach ($request->items as $itemData) {
                $saleItem = SaleItem::with(['product', 'variant', 'stock'])->findOrFail($itemData['sale_item_id']);
                
                $quantity = $itemData['return_quantity'];
                $unit = $itemData['unit'];
                $product = $saleItem->product;
                $unitType = $product->unit_type ?? 'piece';
                
                // বেস ইউনিটে কনভার্ট
                $baseQuantity = $this->convertToBase($quantity, $unit, $unitType);
                
                // সেলস রিটার্ন আইটেম ক্রিয়েট
                SalesReturnItem::create([
                    'sales_return_id' => $salesReturn->id,
                    'sale_item_id' => $saleItem->id,
                    'product_id' => $saleItem->product_id,
                    'variant_id' => $saleItem->variant_id,
                    'warehouse_id' => $saleItem->warehouse_id,
                    'return_quantity' => $quantity,
                    'base_return_quantity' => $baseQuantity,
                    'unit' => $unit,
                    'unit_price' => $saleItem->unit_price,
                    'shadow_unit_price' => $saleItem->shadow_unit_price,
                    'sale_price' => $saleItem->unit_price,
                    'shadow_sale_price' => $saleItem->shadow_unit_price,
                    'total_price' => $quantity * $saleItem->unit_price,
                    'shadow_total_price' => $quantity * $saleItem->shadow_unit_price,
                    'status' => 'pending',
                    'reason' => $itemData['reason'] ?? $request->reason ?? 'reason not provided',
                    'created_by' => Auth::id()
                ]);
            }

            // রিপ্লেসমেন্ট প্রোডাক্টস
            if ($request->return_type === 'product_replacement' && !empty($request->replacement_products)) {
                foreach ($request->replacement_products as $replacement) {
                    $product = Product::with('variants')->findOrFail($replacement['product_id']);
                    $variant = $product->variants()->find($replacement['variant_id']);
                    
                    $quantity = $replacement['quantity'] ?? 1;
                    $unit = $replacement['unit'];
                    $unitType = $product->unit_type ?? 'piece';
                    
                    // ইউনিট ভ্যালিডেশন
                    $availableUnits = $this->getAvailableSaleUnits($product);
                    if (!in_array($unit, $availableUnits)) {
                        throw new \Exception("Invalid unit {$unit} for replacement product {$product->name}");
                    }
                    
                    // বেস ইউনিটে কনভার্ট
                    $baseQuantity = $this->convertToBase($quantity, $unit, $unitType);
                    
                    $salePrice = $replacement['sale_price'] ?? 0;
                    $shadowSalePrice = $replacement['shadow_sale_price'] ?? $salePrice;
                    $unitPrice = $replacement['unit_price'] ?? $salePrice;
                    $shadowUnitPrice = $replacement['shadow_unit_price'] ?? $shadowSalePrice;

                    // রিপ্লেসমেন্ট আইটেম ক্রিয়েট
                    SalesReturnItem::create([
                        'sales_return_id' => $salesReturn->id,
                        'sale_item_id' => null,
                        'product_id' => $product->id,
                        'variant_id' => $variant->id ?? null,
                        'warehouse_id' => $sale->warehouse_id ?? null,
                        'return_quantity' => $quantity,
                        'base_return_quantity' => $baseQuantity,
                        'unit' => $unit,
                        'unit_price' => $unitPrice,
                        'shadow_unit_price' => $shadowUnitPrice,
                        'sale_price' => $salePrice,
                        'shadow_sale_price' => $shadowSalePrice,
                        'total_price' => $quantity * $unitPrice,
                        'shadow_total_price' => $quantity * $shadowUnitPrice,
                        'status' => 'pending',
                        'reason' => 'Replacement product',
                        'is_replacement' => true,
                        'created_by' => Auth::id()
                    ]);
                }
            }

            if ($request->input('auto_approve', false)) {
                $this->approve($salesReturn, $request == null);
            }

            DB::commit();

            return to_route('salesReturn.list')
                ->with('success', 'Sales return created successfully. Awaiting approval.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back();
        }
    }

    // রিটার্ন এপ্রুভ
    public function approve($id)
    {
        DB::beginTransaction();
        try {
            $salesReturn = SalesReturn::with([
                'items.saleItem',
                'items.product',
                'sale.customer'
            ])->findOrFail($id);

            if ($salesReturn->status !== 'pending') {
                throw new \Exception('This return cannot be approved.');
            }

            $customer = $salesReturn->sale->customer;

            // রিটার্ন আইটেমস প্রসেস
            foreach ($salesReturn->items as $item) {
                if ($item->is_replacement) {
                    // রিপ্লেসমেন্ট: স্টক ডিক্রিজ
                    $this->processReplacementItem($item);
                } else {
                    // রিটার্ন: স্টক ইনক্রিজ
                    $this->processReturnItem($item);
                }
                
                $item->update(['status' => 'completed']);
            }

            // ফাইনান্সিয়াল প্রসেস
            $this->processFinancials($salesReturn, $customer);

            // স্ট্যাটাস আপডেট
            $salesReturn->update(['status' => 'completed']);

            // সেল স্ট্যাটাস আপডেট
            $this->updateSaleStatus($salesReturn->sale_id);

            DB::commit();

            return redirect()->back()->with('success', 'Sales return approved successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back();
        }
    }

    // রিটার্ন আইটেম প্রসেস
    private function processReturnItem($item)
    {
        $saleItem = $item->saleItem;
        $product = $item->product;
        $unitType = $product->unit_type ?? 'piece';
        
        // বেস ইউনিটে কনভার্ট
        $baseQuantity = $this->convertToBase(
            $item->return_quantity,
            $item->unit,
            $unitType
        );

        // স্টক খুঁজুন
        $stock = Stock::where('warehouse_id', $item->warehouse_id)
            ->where('product_id', $item->product_id)
            ->where('variant_id', $item->variant_id)
            ->first();

        if ($stock) {
            // স্টক আপডেট
            $stock->increment('quantity', $item->return_quantity);
            $stock->increment('base_quantity', $baseQuantity);
        } else {
            // নতুন স্টক ক্রিয়েট
            Stock::create([
                'warehouse_id' => $item->warehouse_id,
                'product_id' => $item->product_id,
                'variant_id' => $item->variant_id,
                'quantity' => $item->return_quantity,
                'base_quantity' => $baseQuantity,
                'unit' => $item->unit,
                'sale_price' => $item->sale_price,
                'shadow_sale_price' => $item->shadow_sale_price,
                'batch_no' => 'RTN-' . $item->sales_return_id . '-' . Str::random(4),
                'created_by' => Auth::id()
            ]);
        }

        // স্টক মুভমেন্ট
        StockMovement::create([
            'warehouse_id' => $item->warehouse_id,
            'product_id' => $item->product_id,
            'variant_id' => $item->variant_id,
            'type' => 'in',
            'qty' => $baseQuantity,
            'unit' => 'base',
            'sale_unit' => $item->unit,
            'reference_type' => 'App\\Models\\SalesReturn',
            'reference_id' => $item->sales_return_id,
            'notes' => 'Stock returned from sales return #' . $item->salesReturn->return_no,
            'created_by' => Auth::id()
        ]);
    }

    // রিপ্লেসমেন্ট আইটেম প্রসেস
    private function processReplacementItem($item)
    {
        $product = $item->product;
        $unitType = $product->unit_type ?? 'piece';
        
        // বেস ইউনিটে কনভার্ট
        $baseQuantity = $this->convertToBase(
            $item->return_quantity,
            $item->unit,
            $unitType
        );

        // স্টক খুঁজুন
        $stock = Stock::where('warehouse_id', $item->warehouse_id)
            ->where('product_id', $item->product_id)
            ->where('variant_id', $item->variant_id)
            ->first();

        if ($stock) {
            // স্টক ডিক্রিজ
            if ($stock->quantity < $item->return_quantity) {
                throw new \Exception('Insufficient stock for replacement product: ' . $product->name);
            }
            
            $stock->decrement('quantity', $item->return_quantity);
            $stock->decrement('base_quantity', $baseQuantity);
        } else {
            throw new \Exception('Stock not found for replacement product: ' . $product->name);
        }

        // স্টক মুভমেন্ট
        StockMovement::create([
            'warehouse_id' => $item->warehouse_id,
            'product_id' => $item->product_id,
            'variant_id' => $item->variant_id,
            'type' => 'out',
            'qty' => $baseQuantity,
            'unit' => 'base',
            'sale_unit' => $item->unit,
            'reference_type' => 'App\\Models\\SalesReturn',
            'reference_id' => $item->sales_return_id,
            'notes' => 'Stock used for replacement in sales return #' . $item->salesReturn->return_no,
            'created_by' => Auth::id()
        ]);
    }

    // ফাইনান্সিয়াল প্রসেস
    private function processFinancials($salesReturn, $customer)
    {
        // মানি ব্যাক রিটার্ন
        if ($salesReturn->return_type === 'money_back') {
            // রিফান্ড প্রসেস
            if ($salesReturn->refunded_amount > 0) {
                // কাস্টমার ডিউ আপডেট
                if ($customer->due_amount > 0) {
                    // ডিউ কমাতে হবে
                    $deduction = min($salesReturn->refunded_amount, $customer->due_amount);
                    $customer->decrement('due_amount', $deduction);
                    
                    // বাকি থাকলে অ্যাডভান্সে যোগ
                    $remaining = $salesReturn->refunded_amount - $deduction;
                    if ($remaining > 0) {
                        $customer->increment('advance_amount', $remaining);
                    }
                } else {
                    // সরাসরি অ্যাডভান্সে যোগ
                    $customer->increment('advance_amount', $salesReturn->refunded_amount);
                }
                
                $customer->save();
                
                // পেমেন্ট রেকর্ড
                Payment::create([
                    'sale_id' => $salesReturn->sale_id,
                    'customer_id' => $customer->id,
                    'amount' => $salesReturn->refunded_amount,
                    'shadow_amount' => $salesReturn->shadow_refunded_amount,
                    'payment_method' => $salesReturn->payment_type ?? 'cash',
                    'txn_ref' => 'RFND-' . Str::random(10),
                    'note' => 'Refund for sales return #' . $salesReturn->return_no,
                    'paid_at' => Carbon::now(),
                    'created_by' => Auth::id(),
                    'type' => 'refund'
                ]);
            }
        }
        
        // প্রোডাক্ট রিপ্লেসমেন্ট
        if ($salesReturn->return_type === 'product_replacement') {
            $netDifference = $salesReturn->replacement_total - $salesReturn->total_return_value;
            
            if ($netDifference > 0) {
                // কাস্টমারকে অতিরিক্ত পেতে হবে
                $customer->increment('due_amount', $netDifference);
                $customer->save();
                
                Payment::create([
                    'sale_id' => $salesReturn->sale_id,
                    'customer_id' => $customer->id,
                    'amount' => -$netDifference, // নেগেটিভ = কাস্টমার ডিউ
                    'shadow_amount' => -($salesReturn->shadow_replacement_total - $salesReturn->shadow_total_return_value),
                    'payment_method' => 'adjustment',
                    'txn_ref' => 'ADJ-' . Str::random(10),
                    'note' => 'Adjustment for replacement return #' . $salesReturn->return_no,
                    'paid_at' => null, // এখনো পেইড নয়
                    'created_by' => Auth::id(),
                    'type' => 'due_adjustment',
                    'status' => 'pending'
                ]);
            } elseif ($netDifference < 0) {
                // আমরা রিফান্ড দিতে হবে
                $refundAmount = abs($netDifference);
                
                if ($customer->due_amount > 0) {
                    $deduction = min($refundAmount, $customer->due_amount);
                    $customer->decrement('due_amount', $deduction);
                    
                    $remaining = $refundAmount - $deduction;
                    if ($remaining > 0) {
                        $customer->increment('advance_amount', $remaining);
                    }
                } else {
                    $customer->increment('advance_amount', $refundAmount);
                }
                
                $customer->save();
                
                Payment::create([
                    'sale_id' => $salesReturn->sale_id,
                    'customer_id' => $customer->id,
                    'amount' => $refundAmount,
                    'shadow_amount' => abs($salesReturn->shadow_replacement_total - $salesReturn->shadow_total_return_value),
                    'payment_method' => 'adjustment',
                    'txn_ref' => 'RFND-ADJ-' . Str::random(10),
                    'note' => 'Refund adjustment for replacement return #' . $salesReturn->return_no,
                    'paid_at' => Carbon::now(),
                    'created_by' => Auth::id(),
                    'type' => 'refund'
                ]);
            }
        }
    }

    // সেল স্ট্যাটাস আপডেট
    private function updateSaleStatus($saleId)
    {
        $sale = Sale::with('items')->find($saleId);
        if (!$sale) return;

        $totalSold = $sale->items->sum('quantity');
        $totalReturned = SalesReturnItem::whereIn('sale_item_id', $sale->items->pluck('id'))
            ->where('status', 'completed')
            ->where('is_replacement', false)
            ->sum('return_quantity');

        if ($totalReturned >= $totalSold) {
            $sale->status = 'fully_returned';
        } elseif ($totalReturned > 0) {
            $sale->status = 'partially_returned';
        } else {
            $sale->status = 'completed';
        }

        $sale->save();
    }

    // শ্যাডো ডেটা ট্রান্সফর্ম
    private function transformToShadowData($salesReturn)
    {
        $salesReturn->refunded_amount = $salesReturn->shadow_refunded_amount;
        $salesReturn->replacement_total = $salesReturn->shadow_replacement_total;
        $salesReturn->total_return_value = $salesReturn->shadow_total_return_value;

        if ($salesReturn->items) {
            $salesReturn->items->transform(function ($item) {
                $item->unit_price = $item->shadow_unit_price;
                $item->sale_price = $item->shadow_sale_price;
                $item->total_price = $item->shadow_total_price;
                return $item;
            });
        }

        return $salesReturn;
    }

    // শো ফাংশন
    public function show($id)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $salesReturn = SalesReturn::with([
            'sale.customer',
            'customer',
            'items.product',
            'items.variant',
            'items.saleItem',
            'creator'
        ])->findOrFail($id);

        if ($isShadowUser) {
            $salesReturn = $this->transformToShadowData($salesReturn);
        }

        return Inertia::render('SalesReturn/Show', [
            'salesReturn' => $salesReturn,
            'isShadowUser' => $isShadowUser
        ]);
    }

    // ডিলিট ফাংশন
    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $salesReturn = SalesReturn::with(['items'])->findOrFail($id);

            if ($salesReturn->status !== 'pending') {
                throw new \Exception('Only pending returns can be deleted.');
            }

            $salesReturn->delete();

            DB::commit();
            return redirect()->route('sales-return.list')
                ->with('success', 'Sales return deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                ->with('error', 'Error deleting sales return: ' . $e->getMessage());
        }
    }
}