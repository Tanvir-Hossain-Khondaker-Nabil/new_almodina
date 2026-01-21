<?php

namespace App\Models;

use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    protected $fillable = [
        'warehouse_id',
        'product_id',
        'variant_id',
        'type',
        'qty',
        'reference_type',
        'reference_id',
        'created_by',
        'outlet_id',
        'reason'
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


    // relation to warehouse
    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }


    // relation to product
    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    // relation to variant
    public function variant()
    {
        return $this->belongsTo(Variant::class, 'variant_id');
    }

    // relation to reference
    public function reference()
    {
        return $this->morphTo();
    }
}
