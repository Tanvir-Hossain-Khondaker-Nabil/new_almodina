<?php

namespace App\Models;

use App\Scopes\UserScope;
use App\Models\DillerShip;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;


class Supplier extends Model
{
   use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'contact_person',
        'email',
        'phone',
        'company',
        'address',
        'website',
        'advance_amount',
        'due_amount',
        'is_active',
        'created_by',
        'outlet_id',
        'dealership_id',
        // 'send_welcome_sms'
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


    //relationship to dealership
    public function dealership()
    {
        return $this->belongsTo(DillerShip::class, 'dealership_id' , 'id');
    }

    //relationship to creator
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    //relationship to purchases
    public function purchases()
    {
        return $this->hasMany(Purchase::class, 'supplier_id')->with('warehouse', 'creator','items');
    }

    //active scrope 
    public function scopeActive($query)
    {
        return $query->where('is_active', 1);
    }


    }