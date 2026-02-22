<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Warehouse;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class WarehouseController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $warehousesQuery = Warehouse::latest()
            ->withCount([
                'stocks as total_products' => function ($query) {
                    $query->select(DB::raw('count(distinct product_id)'));
                }
            ]);

        // Calculate stock value based on user type
        if ($isShadowUser) {
            $warehousesQuery->withSum('stocks as total_stock_value', DB::raw('quantity * shadow_purchase_price'));
        } else {
            $warehousesQuery->withSum('stocks as total_stock_value', DB::raw('quantity * purchase_price'));
        }

        $warehouses = $warehousesQuery->filter($request->only('search'))
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Warehouse/WarehouseList', [
            'filters' => $request->only('search'),
            'warehouses' => $warehouses,
            'isShadowUser' => $isShadowUser
        ]);
    }

    public function create()
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        return Inertia::render('Warehouse/AddWarehouse', [
            'isShadowUser' => $isShadowUser
        ]);
    }

    public function edit($id)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $warehouse = Warehouse::findOrFail($id);
        return Inertia::render('Warehouse/AddWarehouse', [
            'warehouse' => $warehouse,
            'isShadowUser' => $isShadowUser
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email',
            'is_active' => 'boolean'
        ]);


        try {
            $warehouseData = $request->all();
            $warehouseData['code'] = 'IN' . '-' . uniqid();
            $warehouseData['created_by'] = $user->id;
            $warehouseData['user_type'] = $user->type;

            Warehouse::create($warehouseData);

            return redirect()->route('warehouse.list')->with(
                'success',
                $isShadowUser ? 'Shadow warehouse created successfully' : 'Warehouse created successfully'
            );
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Error creating warehouse: ' . $e->getMessage());
        }
    }

    public function show($id)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $warehouse = Warehouse::with(['stocks.product', 'stocks.variant'])->findOrFail($id);

        $products = Product::query()
            ->with([
                'category',
                'variants' => function ($q) use ($id) {
                    $q->select('id', 'product_id', 'sku', 'attribute_values')
                        ->with([
                            'stocks' => function ($stockQuery) use ($id) {
                                $stockQuery->where('warehouse_id', $id)
                                    ->where('quantity', '>', 0)
                                    ->select(
                                        'id',
                                        'warehouse_id',
                                        'product_id',
                                        'variant_id',
                                        'quantity',
                                        'purchase_price',
                                        'sale_price',
                                        'shadow_purchase_price',
                                        'shadow_sale_price',
                                        'batch_no',
                                        'barcode',
                                        'created_at'
                                    )
                                    ->orderByDesc('id');
                            }
                        ]);
                }
            ])
            ->whereHas('variants.stocks', function ($q) use ($id) {
                $q->where('warehouse_id', $id)->where('quantity', '>', 0);
            })
            ->get(['id', 'name', 'product_no', 'description', 'category_id'])
            ->map(function ($product) use ($isShadowUser) {
                // Calculate total stock safely
                $totalStock = 0;

                // Check if variants relationship exists and is loaded
                if ($product->variants && $product->variants->isNotEmpty()) {
                    foreach ($product->variants as $variant) {
                        // Check if stocks relationship exists and is loaded
                        if ($variant->relationLoaded('stocks') && $variant->stocks) {
                            // Convert to collection if it's a single model
                            $stocks = $variant->stocks instanceof \Illuminate\Database\Eloquent\Collection
                                ? $variant->stocks
                                : collect([$variant->stocks]);

                            foreach ($stocks as $stock) {
                                $totalStock += (float) ($stock->quantity ?? 0);
                            }
                        }
                    }
                }

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'product_no' => $product->product_no,
                    'description' => $product->description,
                    'category' => $product->category,
                    'total_stock' => $totalStock,
                    'variants' => $product->variants
                        ->filter(function ($variant) {
                            // Check if stocks relationship exists and has items
                            if (!$variant->relationLoaded('stocks') || !$variant->stocks) {
                                return false;
                            }

                            // Convert to collection if it's a single model
                            $stocks = $variant->stocks instanceof \Illuminate\Database\Eloquent\Collection
                                ? $variant->stocks
                                : collect([$variant->stocks]);

                            return $stocks->isNotEmpty();
                        })
                        ->map(function ($variant) use ($isShadowUser) {
                            // Convert to collection if it's a single model
                            $stocks = $variant->stocks instanceof \Illuminate\Database\Eloquent\Collection
                                ? $variant->stocks
                                : collect([$variant->stocks]);

                            $batches = $stocks->map(function ($stock) use ($isShadowUser) {
                                $qty = (float) ($stock->quantity ?? 0);

                                $purchasePrice = $isShadowUser
                                    ? (float) ($stock->shadow_purchase_price ?? 0)
                                    : (float) ($stock->purchase_price ?? 0);

                                $salePrice = $isShadowUser
                                    ? (float) ($stock->shadow_sale_price ?? 0)
                                    : (float) ($stock->sale_price ?? 0);

                                return [
                                    'stock_id' => $stock->id,
                                    'batch_no' => $stock->batch_no,
                                    'barcode' => $stock->barcode,
                                    'stock_quantity' => $qty,
                                    'purchase_price' => $purchasePrice,
                                    'sale_price' => $salePrice,
                                    'stock_value' => $qty * $purchasePrice,
                                    'created_at' => optional($stock->created_at)->toDateTimeString(),
                                ];
                            })->values();

                            return [
                                'id' => $variant->id,
                                'attribute_values' => $variant->attribute_values,
                                'sku' => $variant->sku,
                                'total_stock_quantity' => $batches->sum('stock_quantity'),
                                'batches' => $batches,
                            ];
                        })
                        ->values(),
                ];
            })
            ->filter(function ($product) {
                return ($product['total_stock'] ?? 0) > 0;
            })
            ->values();

        return Inertia::render('Warehouse/WarehouseProducts', [
            'warehouse' => $warehouse,
            'products' => $products,
            'isShadowUser' => $isShadowUser
        ]);
    }


    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email',
            'is_active' => 'boolean'
        ]);

        try {
            $warehouse = Warehouse::findOrFail($id);
            $warehouseData = $request->all();
            $warehouseData['code'] = 'IN' . '-' . uniqid();
            $warehouse->update($warehouseData);

            return redirect()->route('warehouse.list')->with(
                'success',
                $isShadowUser ? 'Shadow warehouse updated successfully' : 'Warehouse updated successfully'
            );
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Error updating warehouse: ' . $e->getMessage());
        }
    }

    public function destroy($id)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        try {
            $warehouse = Warehouse::findOrFail($id);

            // Check if warehouse has purchases
            if ($warehouse->purchases()->exists()) {
                return redirect()->back()->with('error', 'Cannot delete warehouse with associated purchases');
            }

            $warehouse->delete();

            return redirect()->route('warehouse.list')->with(
                'success',
                $isShadowUser ? 'Shadow warehouse deleted successfully' : 'Warehouse deleted successfully'
            );
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Error deleting warehouse: ' . $e->getMessage());
        }
    }
}