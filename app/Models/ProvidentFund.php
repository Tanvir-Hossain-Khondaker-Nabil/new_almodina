<?php
// app/Models/ProvidentFund.php

namespace App\Models;

use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ProvidentFund extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'month',
        'year',
        'employee_contribution',
        'employer_contribution',
        'total_contribution',
        'current_balance',
        'status',
        'contribution_date',
        'created_by',
        'outlet_id'
    ];

    protected $casts = [
        'employee_contribution' => 'decimal:2',
        'employer_contribution' => 'decimal:2',
        'total_contribution' => 'decimal:2',
        'current_balance' => 'decimal:2',
        'contribution_date' => 'date'
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

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function calculateTotalContribution()
    {
        $this->total_contribution = $this->employee_contribution + $this->employer_contribution;
        return $this->total_contribution;
    }

    public function updateBalance()
    {
        $previousBalance = self::where('employee_id', $this->employee_id)
            ->where('id', '<', $this->id)
            ->orderBy('id', 'desc')
            ->value('current_balance') ?? 0;

        $this->current_balance = $previousBalance + $this->total_contribution;
        return $this->current_balance;
    }
}