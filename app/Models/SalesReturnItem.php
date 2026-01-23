<?php

namespace App\Models;

use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToTenant;

class SalesReturnItem extends Model
{
    use BelongsToTenant;
    protected $fillable = [
        'sales_return_id',
        'sale_item_id',
        'product_id',
        'variant_id',
        'warehouse_id',
        'unit_price',
        'shadow_unit_price',
        'sale_price',
        'shadow_sale_price',
        'total_price',
        'shadow_total_price',
        'return_quantity',
        'reassaon',
        'type',
        'status',
        'created_by',
        'outlet_id'
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

    //relation to sales return
    public function salesReturn()
    {
        return $this->belongsTo(SalesReturn::class, 'sales_return_id');
    
    }
    //relation to sale item
    public function saleItem()
    {
        return $this->belongsTo(SaleItem::class, 'sale_item_id');

    }

    public function saleReturn()
    {
        return $this->belongsTo(SalesReturn::class, 'sales_return_id');
    }


    //relation to product
    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }


    //relation to variant
    public function variant()
    {
        return $this->belongsTo(Variant::class, 'variant_id');
    }


    //relation to creator
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    //warehouse relation
    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }
}
