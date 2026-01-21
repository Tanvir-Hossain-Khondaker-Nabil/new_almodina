<?php
// app/Models/AllowanceSetting.php

namespace App\Models;

use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class AllowanceSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'allowance_type',
        'percentage',
        'fixed_amount',
        'is_percentage',
        'is_active',
        'description',
        'created_by',
        'outlet_id'
    ];

    protected $casts = [
        'percentage' => 'decimal:2',
        'fixed_amount' => 'decimal:2',
        'is_percentage' => 'boolean',
        'is_active' => 'boolean'
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

    public function calculateAllowance($basicSalary)
    {
        if ($this->is_percentage) {
            return ($basicSalary * $this->percentage) / 100;
        }
        
        return $this->fixed_amount;
    }
}