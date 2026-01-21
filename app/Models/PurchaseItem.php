<?php

namespace App\Models;

use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PurchaseItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_id',
        'product_id',
        'warehouse_id',
        'supplier_id',
        'variant_id',
        'quantity',
        'unit_price',
        'shadow_unit_price',
        'total_price',
        'shadow_total_price',
        'sale_price',
        'shadow_sale_price',
        'created_by',

        //add new feild
        'item_type',
        'product_name',
        'brand',
        'variant_name',
        'outlet_id',
        'unit', // Purchase unit (ton, kg, gram)
        'unit_quantity', // Original quantity in purchased unit
        'base_quantity',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'shadow_unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
        'shadow_total_price' => 'decimal:2'
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

    public function stock()
    {
        return $this->belongsTo(Stock::class);
    }

    //supplier relactionship
    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }

    public function purchase()
    {
        return $this->belongsTo(Purchase::class)->with(['warehouse', 'creator', 'supplier', 'stock']);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function variant()
    {
        return $this->belongsTo(Variant::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }
    public function getAvailableUnitsForSale()
    {
        if (!$this->product) {
            return ['piece'];
        }

        $purchasedUnit = $this->unit ?? 'piece';
        $unitType = $this->product->unit_type ?? 'piece';
        $conversions = Unit::getConversions();

        $availableUnits = [];

        if (isset($conversions[$unitType])) {
            foreach ($conversions[$unitType] as $unit => $factor) {
                // Only allow units equal or smaller than purchased unit
                if ($factor <= ($conversions[$unitType][$purchasedUnit] ?? 1)) {
                    $availableUnits[] = $unit;
                }
            }
        }

        return $availableUnits;
    }

    public function getRemainingBaseQuantity()
    {
        $soldBaseQuantity = SaleItem::where('purchase_item_id', $this->id)
            ->sum('base_quantity');

        return max(0, $this->base_quantity - $soldBaseQuantity);
    }
}