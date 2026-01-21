<?php
// app/Models/Employee.php

namespace App\Models;

use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'employee_id',
        'rank_id',
        'joining_date',
        'current_salary',
        'basic_salary',
        'house_rent',
        'medical_allowance',
        'transport_allowance',
        'other_allowance',
        'provident_fund_percentage',
        'is_active',
        'created_by',
        'outlet_id'
    ];

    protected $casts = [
        'joining_date' => 'date',
        'current_salary' => 'decimal:2',
        'basic_salary' => 'decimal:2',
        'house_rent' => 'decimal:2',
        'medical_allowance' => 'decimal:2',
        'transport_allowance' => 'decimal:2',
        'other_allowance' => 'decimal:2',
        'provident_fund_percentage' => 'decimal:2',
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

    // Relationships
    public function rank()
    {
        return $this->belongsTo(Rank::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    public function salaries()
    {
        return $this->hasMany(Salary::class);
    }

    public function providentFunds()
    {
        return $this->hasMany(ProvidentFund::class);
    }

    public function leaves()
    {
        return $this->hasMany(Leave::class);
    }

    public function awards()
    {
        return $this->hasMany(EmployeeAward::class);
    }

    // Accessors
    public function getFormattedSalaryAttribute()
    {
        return '৳' . number_format($this->current_salary, 2);
    }

    public function getTotalAllowanceAttribute()
    {
        return $this->house_rent + 
               $this->medical_allowance + 
               $this->transport_allowance + 
               $this->other_allowance;
    }

    public function getGrossSalaryAttribute()
    {
        return $this->basic_salary + $this->total_allowance;
    }

    public function getProvidentFundAmountAttribute()
    {
        return ($this->basic_salary * $this->provident_fund_percentage) / 100;
    }

    public function getFormattedJoiningDateAttribute()
    {
        return $this->joining_date ? $this->joining_date->format('d M, Y') : 'N/A';
    }
}