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
            'code' => 'required|string|max:50|unique:warehouses',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email',
            'is_active' => 'boolean'
        ]);

        try {
            $warehouseData = $request->all();
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

        // Get products with their variants and stocks for this warehouse
        $products = Product::with([
            'category',
            'variants.stock' => function ($query) use ($id) {
                $query->where('warehouse_id', $id);
            }
        ])
            ->whereHas('variants.stock', function ($query) use ($id) {
                $query->where('warehouse_id', $id)
                    ->where('quantity', '>', 0);
            })
            ->get()
            ->map(function ($product) use ($id, $isShadowUser) {
                // Calculate total stock for this product in this warehouse
                $totalStock = $product->variants->sum(function ($variant) use ($id) {
                    return $variant->stock ? $variant->stock->quantity : 0;
                });

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'product_no' => $product->product_no,
                    'description' => $product->description,
                    'category' => $product->category,
                    'total_stock' => $totalStock,
                    'variants' => $product->variants->map(function ($variant) use ($id, $isShadowUser) {
                        $stock = $variant->stock;

                        // Use shadow prices for shadow users
                        $purchasePrice = $isShadowUser ?
                            ($stock ? $stock->shadow_purchase_price : 0) :
                            ($stock ? $stock->purchase_price : 0);

                        $salePrice = $isShadowUser ?
                            ($stock ? $stock->shadow_sale_price : 0) :
                            ($stock ? $stock->sale_price : 0);

                        $stockQuantity = $stock ? $stock->quantity : 0;
                        $stockValue = $stockQuantity * $purchasePrice;

                        return [
                            'id' => $variant->id,
                            'attribute_values' => $variant->attribute_values,
                            'sku' => $variant->sku,
                            'variant_name' => $variant->variant_name,
                            'stock_quantity' => $stockQuantity,
                            'purchase_price' => $purchasePrice,
                            'sale_price' => $salePrice,
                            'stock_value' => $stockValue,
                        ];
                    })->filter(function ($variant) {
                        // Only show variants that have stock
                        return $variant['stock_quantity'] > 0;
                    })
                ];
            })
            ->filter(function ($product) {
                // Only show products that have stock
                return $product['total_stock'] > 0;
            });

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
            'code' => 'required|string|max:50|unique:warehouses,code,' . $id,
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email',
            'is_active' => 'boolean'
        ]);

        try {
            $warehouse = Warehouse::findOrFail($id);
            $warehouse->update($request->all());

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