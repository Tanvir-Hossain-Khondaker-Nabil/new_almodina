<?php
// app/Models/Award.php

namespace App\Models;

use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Award extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'cash_reward',
        'type',
        'month',
        'year',
        'criteria',
        'is_active',
        'created_by',
        'outlet_id'
    ];

    protected $casts = [
        'cash_reward' => 'decimal:2',
        'criteria' => 'array',
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

    public function employeeAwards()
    {
        return $this->hasMany(EmployeeAward::class);
    }

    public function recipients()
    {
        return $this->belongsToMany(Employee::class, 'employee_awards')
                    ->withPivot('award_date', 'achievement_reason', 'cash_amount', 'is_paid', 'paid_date')
                    ->withTimestamps();
    }
}