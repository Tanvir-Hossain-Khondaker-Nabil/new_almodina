<?php

namespace App\Models;

use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;


class Stock extends Model
{
    use HasFactory;

    protected $fillable = [
        'warehouse_id',
        'product_id',
        'variant_id',
        'quantity',
        'purchase_price',
        'sale_price',
        'shadow_purchase_price',
        'shadow_sale_price',
        'created_by',
        'batch_no',
        'outlet_id',
        'barcode',
        'barcode_path',
        'base_quantity',
        'available_base_quantity'

    ];

    protected $casts = [
        'purchase_price' => 'decimal:2',
        'sale_price' => 'decimal:2',
        'shadow_purchase_price' => 'decimal:2', // Add this
        'shadow_sale_price' => 'decimal:2',     // Add this
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

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class)->with(['brand','variants']);
    }

    public function variant()
    {
        return $this->belongsTo(Variant::class);
    }

    public function getStockValueAttribute()
    {
        return $this->quantity * $this->purchase_price;
    }

    public function updateBaseQuantities()
    {
        $variant = $this->variant;
        if (!$variant || !$variant->unit) {
            $this->base_quantity = $this->quantity;
            $this->available_base_quantity = $this->quantity;
            return;
        }

        $baseUnit = Unit::getBaseWeightUnit();
        if ($baseUnit && $variant->unit_id !== $baseUnit->id) {
            $conversion = $variant->unit->conversion_factor;
            $this->base_quantity = $this->quantity * $conversion;
            $this->available_base_quantity = $this->quantity * $conversion;
        } else {
            $this->base_quantity = $this->quantity;
            $this->available_base_quantity = $this->quantity;
        }
    }
}