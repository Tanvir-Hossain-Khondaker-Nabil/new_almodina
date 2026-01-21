<?php

namespace App\Models;

use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;

class SaleItem extends Model
{
    protected $fillable = [
        'sale_id',
        'product_id',
        'variant_id',
        'warehouse_id',
        'quantity',
        'unit_price',
        'total_price',
        'shadow_unit_price',
        'shadow_total_price',
        'status',
        'created_by',
        'outlet_id',
        'stock_id',
        'item_type',           // Add this
        'product_name',        // Add this
        'brand',               // Add this
        'variant_name',        // Add this
        'purchase_item_id',    // Add this
        'unit_id',
        'sale_quantity',
        'base_quantity',
        'unit_price',
        'converted_unit_price',
        'unit', // Sale unit (kg, gram, etc.)
        'unit_quantity', // Quantity in sale unit
        'total_price',
    ];



    protected static function booted()
    {
        static::addGlobalScope(new UserScope);
        static::addGlobalScope(new OutletScope);

        // Automatically set outlet_id and created_by when creating
        static::creating(function ($attribute) {
            if (Auth::check()) {
                $user = Auth::user();
                $attribute->created_by = $user->id;

                // Get current outlet ID from user
                if ($user->current_outlet_id) {
                    $attribute->outlet_id = $user->current_outlet_id;
                }
            }
        });

        // Prevent updating outlet_id once set
        static::updating(function ($attribute) {
            $originalOutletId = $attribute->getOriginal('outlet_id');
            if ($originalOutletId !== null && $attribute->outlet_id !== $originalOutletId) {
                $attribute->outlet_id = $originalOutletId;
            }
        });
    }

    //stock relation
    public function stock()
    {
        return $this->belongsTo(Stock::class, 'stock_id');
    }

    //relation to sale
    public function sale()
    {
        return $this->belongsTo(Sale::class, 'sale_id')->with('customer', 'creator');
    }

    //relation to purchase
    public function purchase()
    {
        return $this->belongsTo(Purchase::class, 'purchase_id');
    }

    //relation to product
    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id')->with('brand');
    }

    //relation to variant
    public function variant()
    {
        return $this->belongsTo(Variant::class)->withDefault();
    }

    //relation to warehouse
    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }


    //search scope
    public function scopeSearch($query, $term)
    {
        $search = "%$term%";
        $query->where(function ($q) use ($search) {
            $q->whereHas('product', function ($q1) use ($search) {
                $q1->where('name', 'like', $search)
                    ->orWhere('product_no', 'like', $search);
            })->orWhereHas('sale', function ($q1) use ($search) {
                $q1->where('invoice_no', 'like', $search)
                    ->orWhereHas('customer', function ($q2) use ($search) {
                        $q2->where('customer_name', 'like', $search)
                            ->orWhere('phone', 'like', $search);
                    });
            })->orWhereHas('variant', function ($q1) use ($search) {
                $q1->where('sku', 'like', $search);
            })->orWhereHas('warehouse', function ($q1) use ($search) {
                $q1->where('name', 'like', $search);
            });
        });
    }


    public function scopeFilter($query, $filters)
    {
        return $query
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->search($search);
            })

            ->when($filters['customer_id'] ?? null, function ($query, $customerId) {
                $query->whereHas('sale.customer', function ($q) use ($customerId) {
                    $q->where('customer_name', 'like', "%{$customerId}%")
                        ->orWhere('phone', 'like', "%{$customerId}%");
                });
            })

            ->when($filters['product_id'] ?? null, function ($query, $productId) {
                $query->whereHas('product', function ($q) use ($productId) {
                    $q->where('name', 'like', "%{$productId}%")
                        ->orWhere('product_no', 'like', "%{$productId}%");
                });
            })

            ->when($filters['warehouse_id'] ?? null, function ($query, $warehouseId) {
                $query->whereHas('warehouse', function ($q) use ($warehouseId) {
                    $q->where('name', 'like', "%{$warehouseId}%");
                });
            })

            ->when($filters['date_from'] ?? null, function ($query, $dateFrom) {
                $query->whereDate('created_at', '>=', $dateFrom);
            })

            ->when($filters['date_to'] ?? null, function ($query, $dateTo) {
                $query->whereDate('created_at', '<=', $dateTo);
            });
    }

    public function purchaseItem()
    {
        return $this->belongsTo(PurchaseItem::class);
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function calculateBaseQuantity()
    {
        if (!$this->unit) {
            $this->base_quantity = $this->sale_quantity;
            return;
        }

        $baseUnit = Unit::getBaseWeightUnit();
        if ($baseUnit && $this->unit_id !== $baseUnit->id) {
            $this->base_quantity = $this->sale_quantity * $this->unit->conversion_factor;
        } else {
            $this->base_quantity = $this->sale_quantity;
        }
    }

    public function calculateConvertedUnitPrice($variantUnitPrice)
    {
        if (!$this->unit || !$this->variant) {
            $this->converted_unit_price = $variantUnitPrice;
            return;
        }

        // Convert price based on unit conversion
        $variantUnit = $this->variant->unit;
        if ($variantUnit && $this->unit->id !== $variantUnit->id) {
            // Convert variant unit price to selected sale unit
            $this->converted_unit_price = $variantUnitPrice / $this->unit->conversion_factor;
        } else {
            $this->converted_unit_price = $variantUnitPrice;
        }
    }


    public function getUnitOptions()
    {
        if (!$this->purchaseItem) {
            return ['piece'];
        }

        return $this->purchaseItem->getAvailableUnitsForSale();
    }

    public function convertToBase($quantity, $fromUnit)
    {
        if (!$this->product) {
            return $quantity;
        }

        return $this->product->convertToBase($quantity, $fromUnit);
    }

    public function convertFromBase($quantity, $toUnit)
    {
        if (!$this->product) {
            return $quantity;
        }

        return $this->product->convertFromBase($quantity, $toUnit);
    }

}
