<?php
// app/Models/BonusSetting.php

namespace App\Models;

use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class BonusSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'bonus_name',
        'bonus_type', // 'eid', 'festival', 'performance', 'other'
        'percentage',
        'fixed_amount',
        'is_percentage',
        'is_active',
        'description',
        'effective_date',
        'created_by',
        'outlet_id'
    ];

    protected $casts = [
        'percentage' => 'decimal:2',
        'fixed_amount' => 'decimal:2',
        'is_percentage' => 'boolean',
        'is_active' => 'boolean',
        'effective_date' => 'date'
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


    public function isFestivalBonus()
    {
        return in_array($this->bonus_type, ['eid', 'festival']);
    }

    public function isPerformanceBonus()
    {
        return $this->bonus_type === 'performance';
    }

    public function calculateBonus($basicSalary)
    {
        return $this->is_percentage
            ? ($basicSalary * $this->percentage / 100)
            : $this->fixed_amount;
    }

    // Check if bonus applies to specific month
    public function appliesToMonth($month, $year)
    {
        if (!$this->effective_date) {
            return true; // Apply to all months if no effective date
        }

        $effectiveDate = \Carbon\Carbon::parse($this->effective_date);
        return ($effectiveDate->month == $month && $effectiveDate->year == $year);
    }
}