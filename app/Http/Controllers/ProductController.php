<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Stock;
use App\Models\Product;
use App\Models\Variant;
use App\Models\Category;
use App\Models\Attribute;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
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

    public function view($id)
    {
        $product = Product::with([
            'category',
            'brand',
            'variants.stock'
        ])->findOrFail($id);

        // Calculate total stock including variants
        $totalStock = 0;
        $totalBaseStock = 0;
        
        foreach ($product->variants as $variant) {
            if ($variant->stock) {
                $totalStock += $variant->stock->quantity;
                $totalBaseStock += $variant->stock->base_quantity ?? $variant->stock->quantity;
            }
        }
        
        $product->total_stock = $totalStock;
        $product->total_base_stock = $totalBaseStock;

        return Inertia::render('product/ViewProduct', [
            'product' => $product,
            'unitConversions' => $this->getUnitConversions()
        ]);
    }

    public function index(Request $request)
    {
        $products = Product::latest()
            ->with(['category', 'brand', 'variants.stock'])
            ->filter($request->only('search'))
            ->paginate(10);

        // Calculate stock for each product
        $products->getCollection()->transform(function ($product) {
            $totalStock = 0;
            $totalBaseStock = 0;
            
            foreach ($product->variants as $variant) {
                if ($variant->stock) {
                    $totalStock += $variant->stock->quantity;
                    $totalBaseStock += $variant->stock->base_quantity ?? $variant->stock->quantity;
                }
            }
            
            $product->total_stock = $totalStock;
            $product->total_base_stock = $totalBaseStock;
            
            return $product;
        });

        return Inertia::render("product/Product", [
            'filters' => $request->only('search'),
            'product' => $products,
            'unitConversions' => $this->getUnitConversions()
        ]);
    }

    public function add_index(Request $request)
    {
        $querystring = $request->only('id');
        $update = null;

        if ($querystring && isset($querystring['id'])) {
            $update = Product::with(['variants', 'category', 'brand'])->find($querystring['id']);

            if (!$update) {
                return redirect()->route('product.list')->with('error', 'Product not found');
            }
        }

        $attributes = Attribute::with(['activeValues'])->get()->map(function ($attribute) {
            return [
                'id' => $attribute->id,
                'name' => $attribute->name,
                'code' => $attribute->code,
                'active_values' => $attribute->activeValues->map(function ($value) {
                    return [
                        'id' => $value->id,
                        'value' => $value->value,
                        'code' => $value->code,
                    ];
                })
            ];
        });

        return Inertia::render('product/AddProduct', [
            'category' => Category::pluck('name', 'id'),
            'brand' => \App\Models\Brand::pluck('name', 'id'),
            'update' => $update ? $update->toArray() : null,
            'attributes' => $attributes,
            'unitConversions' => $this->getUnitConversions()
        ]);
    }

    public function update(Request $request)
    {
        // dd($request->all());
        $isUpdate = !empty($request->id);

        // ভ্যালিডেশন রুলস
        $rules = [
            'product_name' => 'required|string|max:255',
            'category_id'  => 'required|exists:categories,id',
            'product_no'   => 'nullable|string|max:100|unique:products,product_no,' . ($request->id ?? 'NULL'),
            'description'  => 'nullable|string',
            'product_type' => 'required|in:regular,in_house',
            'variants'     => 'nullable|array|min:1',
            'variants.*.attribute_values' => 'nullable|array',
            'brand_id'     => 'nullable|exists:brands,id',
            
            'unit_type' => 'required|in:piece,weight,volume,length',
            'default_unit' => 'required|string|max:20',
            'is_fraction_allowed' => 'boolean',
            'min_sale_unit' => 'nullable|string|max:20',
            'photo' => 'nullable'
        ];

        if ($request->product_type === 'in_house') {
            $rules = array_merge($rules, [
                'in_house_cost'              => 'required|numeric|min:0',
                'in_house_shadow_cost'       => 'required|numeric|min:0',
                'in_house_sale_price'        => 'required|numeric|min:0',
                'in_house_shadow_sale_price' => 'required|numeric|min:0',
                'in_house_initial_stock'     => 'required|integer|min:0',
            ]);
        }

        // ইউনিট ভ্যালিডেশন বেসড অন ইউনিট টাইপ
        if ($request->unit_type === 'weight') {
            $rules['default_unit'] = 'required|in:ton,kg,gram,pound';
            $rules['min_sale_unit'] = 'nullable|in:ton,kg,gram,pound';
        } elseif ($request->unit_type === 'volume') {
            $rules['default_unit'] = 'required|in:liter,ml';
            $rules['min_sale_unit'] = 'nullable|in:liter,ml';
        } elseif ($request->unit_type === 'length') {
            $rules['default_unit'] = 'required|in:meter,cm,mm';
            $rules['min_sale_unit'] = 'nullable|in:meter,cm,mm';
        } else {
            $rules['default_unit'] = 'required|in:piece,dozen,box';
            $rules['min_sale_unit'] = 'nullable|in:piece,dozen,box';
        }

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput()
                ->with('error', 'Please fix the validation errors');
        }

        DB::beginTransaction();
        try {
            $product = $isUpdate ? Product::find($request->id) : new Product();

            if ($isUpdate && !$product) {
                throw new \Exception("Product not found with ID: " . $request->id);
            }

            $product->name = $request->product_name;
            $product->brand_id = $request->brand_id ?: null;
            $product->product_no = $request->product_no;
            $product->category_id = $request->category_id;
            $product->description = $request->description;
            $product->product_type = $request->product_type;
            $product->created_by = auth()->id();

            // ✅ ইউনিট ফিল্ডস
            $product->unit_type = $request->unit_type;
            $product->default_unit = $request->default_unit;
            $product->is_fraction_allowed = $request->is_fraction_allowed ?? false;
            $product->min_sale_unit = $request->min_sale_unit;

            // ✅ outlet_id (keep your logic if you use OutletScope or auth outlet)
            if (!$product->outlet_id && auth()->user() && isset(auth()->user()->outlet_id)) {
                $product->outlet_id = auth()->user()->outlet_id;
            }

            // ✅ Photo upload
            if ($request->hasFile('photo')) {
                // delete old photo if exists
                if (!empty($product->photo) && Storage::disk('public')->exists($product->photo)) {
                    Storage::disk('public')->delete($product->photo);
                }

                // store new
                $path = $request->file('photo')->store('products', 'public');
                $product->photo = $path; // store "products/xxx.webp"
            }

            // In-house settings
            if ($request->product_type === 'in_house') {
                $product->in_house_cost = $request->in_house_cost;
                $product->in_house_shadow_cost = $request->in_house_shadow_cost;
                $product->in_house_sale_price = $request->in_house_sale_price;
                $product->in_house_shadow_sale_price = $request->in_house_shadow_sale_price;
                $product->in_house_initial_stock = $request->in_house_initial_stock;
            } else {
                $product->in_house_cost = null;
                $product->in_house_shadow_cost = null;
                $product->in_house_sale_price = null;
                $product->in_house_shadow_sale_price = null;
                $product->in_house_initial_stock = 0;
            }

            $product->save();

            // Handle variants
            $existingVariantIds = $product->variants()->pluck('id')->toArray();
            $newVariantIds = [];

            foreach ($request->variants as $variantData) {
                if (empty($variantData['attribute_values']) || !is_array($variantData['attribute_values'])) {
                    // allow empty attributes but still keep the variant
                    $variantData['attribute_values'] = [];
                }

                $sku = $this->generateSku($product, $variantData['attribute_values']);

                if (!empty($variantData['id'])) {
                    $variant = Variant::where('id', $variantData['id'])
                        ->where('product_id', $product->id)
                        ->first();

                    if ($variant) {
                        $variant->update([
                            'attribute_values' => $variantData['attribute_values'],
                            'sku' => $sku,
                        ]);
                        $newVariantIds[] = $variant->id;
                        
                        // Update stock if in-house product
                        if ($product->product_type === 'in_house') {
                            $this->updateInHouseStock($product, $variant);
                        }
                    }
                } else {
                    $variant = Variant::create([
                        'product_id' => $product->id,
                        'attribute_values' => $variantData['attribute_values'],
                        'sku' => $sku,
                    ]);
                    $newVariantIds[] = $variant->id;

                    if ($product->product_type === 'in_house') {
                        $this->createInHouseStock($product, $variant);
                    }
                }
            }

            // Delete removed variants + their stock
            $variantsToDelete = array_diff($existingVariantIds, $newVariantIds);
            if (!empty($variantsToDelete)) {
                Variant::whereIn('id', $variantsToDelete)->delete();
                Stock::whereIn('variant_id', $variantsToDelete)->delete();
            }

            DB::commit();

            return redirect()->route('product.list')
                ->with('success', "Product " . ($isUpdate ? 'updated' : 'created') . " successfully");

        } catch (\Exception $th) {
            DB::rollBack();
            return redirect()->back()->with('error', "Server error: " . $th->getMessage());
        }
    }

    private function createInHouseStock(Product $product, Variant $variant)
    {
        $inHouseWarehouse = Warehouse::where('code', 'IN-HOUSE')->first();

        if (!$inHouseWarehouse) {
            $inHouseWarehouse = Warehouse::create([
                'name' => 'In-House Production',
                'code' => 'IN-HOUSE',
                'address' => 'Internal Production Department',
                'is_active' => true,
                'created_by' => auth()->id(),
            ]);
        }

        $existingStock = Stock::where('warehouse_id', $inHouseWarehouse->id)
            ->where('product_id', $product->id)
            ->where('variant_id', $variant->id)
            ->first();

        // Calculate base quantity
        $unitType = $product->unit_type ?? 'piece';
        $defaultUnit = $product->default_unit ?? 'piece';
        $baseQuantity = $this->convertToBase($product->in_house_initial_stock, $defaultUnit, $unitType);

        $payload = [
            'quantity' => $product->in_house_initial_stock,
            'unit' => $defaultUnit,
            'base_quantity' => $baseQuantity,
            'purchase_price' => $product->in_house_cost,
            'sale_price' => $product->in_house_sale_price,
            'shadow_purchase_price' => $product->in_house_shadow_cost,
            'shadow_sale_price' => $product->in_house_shadow_sale_price,
        ];

        if ($existingStock) {
            $existingStock->update($payload);
        } else {
            Stock::create(array_merge($payload, [
                'warehouse_id' => $inHouseWarehouse->id,
                'product_id' => $product->id,
                'variant_id' => $variant->id,
                'created_by' => auth()->id(),
            ]));
        }
    }

    private function updateInHouseStock(Product $product, Variant $variant)
    {
        $inHouseWarehouse = Warehouse::where('code', 'IN-HOUSE')->first();
        
        if (!$inHouseWarehouse) {
            return;
        }

        $existingStock = Stock::where('warehouse_id', $inHouseWarehouse->id)
            ->where('product_id', $product->id)
            ->where('variant_id', $variant->id)
            ->first();

        // Calculate base quantity
        $unitType = $product->unit_type ?? 'piece';
        $defaultUnit = $product->default_unit ?? 'piece';
        $baseQuantity = $this->convertToBase($product->in_house_initial_stock, $defaultUnit, $unitType);

        $payload = [
            'unit' => $defaultUnit,
            'base_quantity' => $baseQuantity,
            'purchase_price' => $product->in_house_cost,
            'sale_price' => $product->in_house_sale_price,
            'shadow_purchase_price' => $product->in_house_shadow_cost,
            'shadow_sale_price' => $product->in_house_shadow_sale_price,
        ];

        if ($existingStock) {
            $existingStock->update($payload);
        }
    }

    private function generateSku(Product $product, array $attributeValues): string
    {
        $shortCodes = [];

        foreach ($attributeValues as $attribute => $value) {
            $attrShort = strtoupper(substr(preg_replace('/[^a-zA-Z]/', '', (string)$attribute), 0, 3));
            $valShort  = strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', (string)$value), 0, 3));
            $shortCodes[] = $attrShort . $valShort;
        }

        sort($shortCodes);

        if (empty($shortCodes)) {
            return $product->product_no . '_DEFAULT';
        }

        return $product->product_no . '_' . implode('_', $shortCodes);
    }

    public function del($id)
    {
        DB::beginTransaction();
        try {
            $product = Product::findOrFail($id);

            // Check if product has any sales or purchases
            $hasSales = DB::table('sale_items')->where('product_id', $id)->exists();
            $hasPurchases = DB::table('purchase_items')->where('product_id', $id)->exists();
            
            if ($hasSales || $hasPurchases) {
                return redirect()->back()->with('error', "Cannot delete product. It has associated sales or purchases.");
            }

            // ✅ delete photo
            if (!empty($product->photo) && Storage::disk('public')->exists($product->photo)) {
                Storage::disk('public')->delete($product->photo);
            }

            // Delete variants and their stocks
            $variants = $product->variants()->pluck('id')->toArray();
            if (!empty($variants)) {
                Stock::whereIn('variant_id', $variants)->delete();
                Variant::whereIn('id', $variants)->delete();
            }

            $product->delete();

            DB::commit();
            return redirect()->back()->with('success', "Product deleted successfully");
        } catch (\Exception $th) {
            DB::rollBack();
            return redirect()->back()->with('error', "Server error: " . $th->getMessage());
        }
    }

    // Get available units for a product
    public function getAvailableUnits($productId)
    {
        try {
            $product = Product::findOrFail($productId);
            
            $conversions = $this->getUnitConversions();
            $unitType = $product->unit_type ?? 'piece';
            
            $units = [];
            if (isset($conversions[$unitType])) {
                $units = array_keys($conversions[$unitType]);
            }
            
            // Get available stocks for this product to determine available sale units
            $stocks = Stock::where('product_id', $productId)
                ->where('quantity', '>', 0)
                ->get();
            
            $availableUnits = [];
            foreach ($stocks as $stock) {
                if ($stock->unit && !in_array($stock->unit, $availableUnits)) {
                    $availableUnits[] = $stock->unit;
                    
                    // Also add smaller units
                    if (isset($conversions[$unitType][$stock->unit])) {
                        $stockFactor = $conversions[$unitType][$stock->unit];
                        foreach ($conversions[$unitType] as $unit => $factor) {
                            if ($factor <= $stockFactor && !in_array($unit, $availableUnits)) {
                                $availableUnits[] = $unit;
                            }
                        }
                    }
                }
            }
            
            // If no stocks found, use product's default unit
            if (empty($availableUnits)) {
                $availableUnits = [$product->default_unit ?? 'piece'];
            }
            
            return response()->json([
                'units' => $availableUnits,
                'default_unit' => $product->default_unit ?? 'piece',
                'min_sale_unit' => $product->min_sale_unit ?? null,
                'is_fraction_allowed' => $product->is_fraction_allowed ?? false,
                'unit_type' => $unitType
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

    // Update stock for a product (for manual adjustments)
    public function updateStock(Request $request, $id)
    {
        $request->validate([
            'variant_id' => 'nullable|exists:variants,id',
            'quantity' => 'required|numeric|min:0',
            'unit' => 'required|string',
            'warehouse_id' => 'nullable|exists:warehouses,id',
            'notes' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $product = Product::findOrFail($id);
            $variant = Variant::findOrFail($request->variant_id);
            
            // Verify variant belongs to product
            if ($variant->product_id != $product->id) {
                throw new \Exception('Variant does not belong to this product');
            }
            
            $warehouseId = $request->warehouse_id ?? Warehouse::where('code', 'IN-HOUSE')->value('id');
            
            if (!$warehouseId) {
                throw new \Exception('Warehouse not found');
            }
            
            // Calculate base quantity
            $unitType = $product->unit_type ?? 'piece';
            $baseQuantity = $this->convertToBase($request->quantity, $request->unit, $unitType);
            
            // Find or create stock record
            $stock = Stock::where('warehouse_id', $warehouseId)
                ->where('product_id', $product->id)
                ->where('variant_id', $variant->id)
                ->first();
            
            if ($stock) {
                $stock->update([
                    'quantity' => $request->quantity,
                    'unit' => $request->unit,
                    'base_quantity' => $baseQuantity,
                    'updated_by' => auth()->id(),
                ]);
            } else {
                Stock::create([
                    'warehouse_id' => $warehouseId,
                    'product_id' => $product->id,
                    'variant_id' => $variant->id,
                    'quantity' => $request->quantity,
                    'unit' => $request->unit,
                    'base_quantity' => $baseQuantity,
                    'created_by' => auth()->id(),
                ]);
            }
            
            // Record stock movement
            \App\Models\StockMovement::create([
                'warehouse_id' => $warehouseId,
                'product_id' => $product->id,
                'variant_id' => $variant->id,
                'type' => 'adjustment',
                'qty' => $baseQuantity,
                'unit' => 'base',
                'reference_type' => 'manual',
                'reference_id' => auth()->id(),
                'notes' => $request->notes ?? 'Manual stock adjustment',
                'created_by' => auth()->id(),
            ]);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Stock updated successfully',
                'stock' => $stock
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Get stock history for a product
    public function stockHistory($id)
    {
        $product = Product::findOrFail($id);
        
        $history = \App\Models\StockMovement::with(['warehouse', 'variant'])
            ->where('product_id', $id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);
        
        return Inertia::render('product/StockHistory', [
            'product' => $product,
            'history' => $history
        ]);
    }

    // Export products to CSV/Excel
    public function export(Request $request)
    {
        $products = Product::with(['category', 'brand', 'variants.stock'])
            ->filter($request->only('search'))
            ->get()
            ->map(function ($product) {
                $totalStock = 0;
                $totalBaseStock = 0;
                
                foreach ($product->variants as $variant) {
                    if ($variant->stock) {
                        $totalStock += $variant->stock->quantity;
                        $totalBaseStock += $variant->stock->base_quantity ?? $variant->stock->quantity;
                    }
                }
                
                return [
                    'ID' => $product->id,
                    'Name' => $product->name,
                    'Product Code' => $product->product_no,
                    'Category' => $product->category->name ?? '',
                    'Brand' => $product->brand->name ?? '',
                    'Unit Type' => $product->unit_type ?? 'piece',
                    'Default Unit' => $product->default_unit ?? 'piece',
                    'Min Sale Unit' => $product->min_sale_unit ?? '',
                    'Allow Fractions' => $product->is_fraction_allowed ? 'Yes' : 'No',
                    'Product Type' => $product->product_type,
                    'In-House Cost' => $product->in_house_cost ?? 0,
                    'In-House Sale Price' => $product->in_house_sale_price ?? 0,
                    'Total Stock' => $totalStock,
                    'Total Base Stock' => $totalBaseStock,
                    'Variants Count' => $product->variants->count(),
                    'Description' => $product->description,
                    'Created At' => $product->created_at->format('Y-m-d H:i:s'),
                ];
            });
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="products_' . date('Y-m-d') . '.csv"',
        ];
        
        $callback = function() use ($products) {
            $file = fopen('php://output', 'w');
            
            // Add BOM for UTF-8
            fputs($file, $bom = (chr(0xEF) . chr(0xBB) . chr(0xBF)));
            
            // Headers
            fputcsv($file, array_keys($products->first() ?? []));
            
            // Data
            foreach ($products as $product) {
                fputcsv($file, $product);
            }
            
            fclose($file);
        };
        
        return response()->stream($callback, 200, $headers);
    }

    // Import products from CSV/Excel
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:csv,txt,xlsx,xls',
        ]);
        
        // This is a simplified version. In real implementation, you would use:
        // 1. Laravel Excel package or similar
        // 2. Queue jobs for large imports
        // 3. Proper validation and error handling
        
        return redirect()->back()->with('error', 'Import feature not implemented yet. Please use the web interface.');
    }

    // Get products for API (for mobile apps or external systems)
    public function apiIndex(Request $request)
    {
        $products = Product::with(['category', 'brand', 'variants.stock'])
            ->filter($request->only('search'))
            ->paginate($request->get('per_page', 20));
        
        // Calculate stock for each product
        $products->getCollection()->transform(function ($product) {
            $totalStock = 0;
            $totalBaseStock = 0;
            
            foreach ($product->variants as $variant) {
                if ($variant->stock) {
                    $totalStock += $variant->stock->quantity;
                    $totalBaseStock += $variant->stock->base_quantity ?? $variant->stock->quantity;
                }
            }
            
            return [
                'id' => $product->id,
                'name' => $product->name,
                'product_no' => $product->product_no,
                'category' => $product->category->name ?? null,
                'brand' => $product->brand->name ?? null,
                'unit_type' => $product->unit_type ?? 'piece',
                'default_unit' => $product->default_unit ?? 'piece',
                'min_sale_unit' => $product->min_sale_unit ?? null,
                'is_fraction_allowed' => $product->is_fraction_allowed ?? false,
                'product_type' => $product->product_type,
                'in_house_cost' => $product->in_house_cost,
                'in_house_sale_price' => $product->in_house_sale_price,
                'total_stock' => $totalStock,
                'total_base_stock' => $totalBaseStock,
                'variants' => $product->variants->map(function ($variant) {
                    return [
                        'id' => $variant->id,
                        'attribute_values' => $variant->attribute_values,
                        'sku' => $variant->sku,
                        'stock' => $variant->stock ? [
                            'quantity' => $variant->stock->quantity,
                            'base_quantity' => $variant->stock->base_quantity,
                            'unit' => $variant->stock->unit,
                            'sale_price' => $variant->stock->sale_price,
                        ] : null
                    ];
                }),
                'description' => $product->description,
                'photo_url' => $product->photo ? url('/storage/' . $product->photo) : null,
                'created_at' => $product->created_at->toISOString(),
            ];
        });
        
        return response()->json($products);
    }

    // Bulk update products
    public function bulkUpdate(Request $request)
    {
        $request->validate([
            'products' => 'required|array',
            'products.*.id' => 'required|exists:products,id',
            'field' => 'required|in:unit_type,default_unit,min_sale_unit,is_fraction_allowed',
            'value' => 'required',
        ]);
        
        DB::beginTransaction();
        try {
            $updatedCount = 0;
            
            foreach ($request->products as $productData) {
                $product = Product::find($productData['id']);
                
                if ($product) {
                    $field = $request->field;
                    $value = $request->value;
                    
                    // Validate based on field
                    if ($field === 'unit_type' && !in_array($value, ['piece', 'weight', 'volume', 'length'])) {
                        continue;
                    }
                    
                    if ($field === 'default_unit') {
                        // Validate based on current unit_type
                        $unitType = $product->unit_type;
                        $validUnits = $this->getUnitConversions()[$unitType] ?? ['piece'];
                        if (!in_array($value, array_keys($validUnits))) {
                            continue;
                        }
                    }
                    
                    if ($field === 'is_fraction_allowed') {
                        $value = filter_var($value, FILTER_VALIDATE_BOOLEAN);
                    }
                    
                    $product->update([$field => $value]);
                    $updatedCount++;
                }
            }
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => "Updated {$updatedCount} products successfully",
                'updated_count' => $updatedCount
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}