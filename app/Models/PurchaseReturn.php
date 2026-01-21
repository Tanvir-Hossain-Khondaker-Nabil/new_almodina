<?php

namespace App\Models;

use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PurchaseReturn extends Model
{
    use HasFactory;

    protected $fillable = [
        'return_no',
        'purchase_id',
        'supplier_id',
        'warehouse_id',
        'return_date',
        'return_type',
        'total_return_amount',
        'refunded_amount',
        'shadow_return_amount',
        'shadow_refunded_amount',
        'reason',
        'notes',
        'status',
        'created_by',
        'user_type',
        'payment_type',
        'replacement_total',  // Make sure this is here
        'shadow_replacement_total'  // Make sure this is here
        , 'outlet_id'
    ];

    protected $casts = [
        'return_date' => 'date',
        'total_return_amount' => 'decimal:2',
        'refunded_amount' => 'decimal:2',
        'shadow_return_amount' => 'decimal:2',
        'shadow_refunded_amount' => 'decimal:2',
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

    public function purchase()
    {
        return $this->belongsTo(Purchase::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function items()
    {
        return $this->hasMany(PurchaseReturnItem::class);
    }

    public function replacementProducts()
    {
        return $this->hasMany(ReplacementProduct::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function isMoneyBack()
    {
        return $this->return_type === 'money_back';
    }

    public function isProductReplacement()
    {
        return $this->return_type === 'product_replacement';
    }

    public function canBeApproved()
    {
        return $this->status === 'pending';
    }

    public function canBeCompleted()
    {
        return $this->status === 'approved';
    }
}