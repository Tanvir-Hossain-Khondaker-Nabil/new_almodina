<?php
// app/Models/Rank.php

namespace App\Models;

use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Rank extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'level',
        'base_salary',
        'salary_increment_percentage',
        'min_working_days',
        'max_late_minutes',
        'benefits',
        'is_active',
        'created_by',
        'outlet_id'
    ];

    protected $casts = [
        'base_salary' => 'decimal:2',
        'salary_increment_percentage' => 'decimal:2',
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

    public function users()
    {
        return $this->hasMany(Employee::class);
    }

    public function getNextRank()
    {
        return self::where('level', '>', $this->level)
            ->where('is_active', true)
            ->orderBy('level')
            ->first();
    }
}