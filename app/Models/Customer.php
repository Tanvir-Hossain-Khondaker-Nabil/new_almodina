<?php

namespace App\Models;

use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;


class Customer extends Model
{

    protected $fillable = [
        'customer_name',
        'address',
        'phone',
        'is_active',
        'advance_amount',
        'due_amount',
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


    public function scopeFilter($query, array $filters)
    {
        if ($filters['search'] ?? false) {
            $search = $filters['search'];

            $query->where(function ($q) use ($search) {
                $q->where('customer_name', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }
    }


    //relations ship to sales
    public function sales()
    {
        return $this->hasMany(Sale::class, 'customer_id')->with(['creator','items','payments']);
    }

    //user relation
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    //active scrope 
    public function scopeActive($query)
    {
        return $query->where('is_active', 1);
    }
}
