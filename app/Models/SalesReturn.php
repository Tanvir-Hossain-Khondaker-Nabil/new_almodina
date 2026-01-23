<?php

namespace App\Models;

use Carbon\Carbon;
use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToTenant;

class SalesReturn extends Model
{
    use BelongsToTenant;
    protected $fillable = [
        'sale_id',
        'customer_id',
        'refunded_amount',
        'shadow_refunded_amount',
        'return_type',
        'status',
        'return_date',
        'reason',
        'notes',
        'replacement_total',
        'shadow_replacement_total',
        'type',
        'return_quantity',
        'created_by',
        'outlet_id',
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


    //relation to sale
    public function sale()
    {
        return $this->belongsTo(Sale::class, 'sale_id')->with(['warehouse', 'items']);
    }

    //relation to customer
    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }


    //scope for searching by invoice number
    public function scopeSearchByInvoice($query, $search)
    {
        if (!$search)
            return $query;

        return $query->whereHas('sale', function ($q) use ($search) {
            $q->where('invoice_no', 'like', "%{$search}%");
        });
    }


    public function scopeSearchByCustomer($query, $search)
    {
        if (!$search)
            return $query;

        return $query->whereHas('customer', function ($q) use ($search) {
            $q->where('customer_name', 'like', "%{$search}%")
                ->orWhere('phone', 'like', "%{$search}%");
        });
    }

    public function scopeSearch($query, $search)
    {
        if (!$search)
            return $query;

        return $query->where(function ($q) use ($search) {
            $q->searchByInvoice($search)
                ->orWhere(function ($q2) use ($search) {
                    $q2->searchByCustomer($search);
                });
        });
    }

    public function scopeStatus($query, $status)
    {
        if (!$status)
            return $query;

        return $query->where('status', $status);
    }


    public function scopeDateBetween($query, $from, $to)
    {
        if (!$from || !$to)
            return $query;

        return $query->whereBetween('created_at', [
            Carbon::parse($from)->startOfDay(),
            Carbon::parse($to)->endOfDay(),
        ]);
    }


    public function scopeType($query, $type)
    {
        if (!$type)
            return $query;

        return $query->where('type', $type);
    }

    public function items()
    {
        return $this->hasMany(SalesReturnItem::class, 'sales_return_id')->with(['product', 'variant','saleItem']);
    }
}
