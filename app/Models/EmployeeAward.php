<?php
// app/Models/EmployeeAward.php

namespace App\Models;

use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class EmployeeAward extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'award_id',
        'award_date',
        'achievement_reason',
        'cash_amount',
        'is_paid',
        'paid_date',
        'created_by',
        'outlet_id'
    ];

    protected $casts = [
        'cash_amount' => 'decimal:2',
        'is_paid' => 'boolean',
        'award_date' => 'date',
        'paid_date' => 'date'
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

    public function user()
    {
        return $this->belongsTo(Employee::class);
    }

    public function award()
    {
        return $this->belongsTo(Award::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }


    // app/Models/Award.php
    public function employeeAwards()
    {
        return $this->hasMany(EmployeeAward::class);
    }
}