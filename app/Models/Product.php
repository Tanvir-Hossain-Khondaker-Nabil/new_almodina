<?php

namespace App\Models;

use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'product_no',
        'category_id',
        'brand_id',
        'description',
        'created_by',
        'product_type',
        'in_house_cost',
        'in_house_shadow_cost',
        'in_house_sale_price',
        'in_house_shadow_sale_price',
        'in_house_initial_stock',
        'outlet_id',
        'photo',
        'unit_type',
        'default_unit',
        'is_fraction_allowed',
        'min_sale_unit',
    ];

    protected $casts = [
        'in_house_cost' => 'decimal:2',
        'in_house_shadow_cost' => 'decimal:2',
        'in_house_sale_price' => 'decimal:2',
        'in_house_shadow_sale_price' => 'decimal:2',
        'in_house_initial_stock' => 'integer',
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

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function variants()
    {
        return $this->hasMany(Variant::class)->with('stock');
    }

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    // Scope for filtering
    public function scopeFilter($query, array $filters)
    {
        $query->when($filters['search'] ?? null, function ($query, $search) {
            $query->where(function ($query) use ($search) {
                $query->where('name', 'like', '%' . $search . '%')
                    ->orWhere('product_no', 'like', '%' . $search . '%')
                    ->orWhere('description', 'like', '%' . $search . '%')
                    ->orWhereHas('category', function ($query) use ($search) {
                        $query->where('name', 'like', '%' . $search . '%');
                    })
                    ->orWhereHas('brand', function ($query) use ($search) {
                        $query->where('name', 'like', '%' . $search . '%');
                    })
                    ->orWhereHas('variants', function ($query) use ($search) {
                        $query->where('sku', 'like', '%' . $search . '%')
                            ->orWhereJsonContains('attribute_values', $search);
                    });
            });
        });
    }

    // This method might not be needed, but keep it if you use it elsewhere
    public function getTotalStockAttribute()
    {
        if (!$this->relationLoaded('variants')) {
            return 0;
        }

        return $this->variants->sum(function ($variant) {
            if ($variant->relationLoaded('stock')) {
                return $variant->stock ? $variant->stock->quantity : 0;
            }
            return 0;
        });
    }

    public function availableUnits()
    {
        $unitType = $this->unit_type ?? 'piece';
        $conversions = Unit::getConversions();

        return array_keys($conversions[$unitType] ?? ['piece' => 1]);
    }

    public function getBaseUnit()
    {
        return $this->default_unit ?? 'piece';
    }

    public function convertToBase($quantity, $fromUnit)
    {
        $unitType = $this->unit_type ?? 'piece';
        $conversions = Unit::getConversions();

        if (!isset($conversions[$unitType][$fromUnit])) {
            return $quantity;
        }

        return $quantity * $conversions[$unitType][$fromUnit];
    }

    public function convertFromBase($quantity, $toUnit)
    {
        $unitType = $this->unit_type ?? 'piece';
        $conversions = Unit::getConversions();

        if (!isset($conversions[$unitType][$toUnit])) {
            return $quantity;
        }

        $conversion = $conversions[$unitType][$toUnit];
        return $conversion != 0 ? $quantity / $conversion : $quantity;
    }
}