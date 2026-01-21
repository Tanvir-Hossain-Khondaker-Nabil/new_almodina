<?php

namespace App\Models;

use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ReplacementProduct extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_return_id',
        'product_id',
        'variant_id',
        'quantity',
        'unit_price',
        'shadow_unit_price',
        'sale_price',
        'shadow_sale_price',
        'total_price',
        'shadow_total_price',
        'created_by',
        'outlet_id'
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'shadow_unit_price' => 'decimal:2',
        'sale_price' => 'decimal:2',
        'shadow_sale_price' => 'decimal:2',
        'total_price' => 'decimal:2',
        'shadow_total_price' => 'decimal:2',
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

    public function purchaseReturn()
    {
        return $this->belongsTo(PurchaseReturn::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function variant()
    {
        return $this->belongsTo(Variant::class);
    }
}