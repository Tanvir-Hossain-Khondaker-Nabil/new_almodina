<?php

namespace App\Models;

use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;

class Unit extends Model
{
    protected $fillable = [
        'name',
        'short_code',
        'type',
        'base_unit',
        'conversion_factor',
        'is_active',
        'created_by',
        'outlet_id'
    ];

    protected static function booted()
    {
        static::addGlobalScope(new UserScope);
        static::addGlobalScope(new OutletScope);
        
        static::creating(function ($unit) {
            if (Auth::check()) {
                $unit->created_by = Auth::id();
                if (Auth::user()->current_outlet_id) {
                    $unit->outlet_id = Auth::user()->current_outlet_id;
                }
            }
        });
    }

    public static function getBaseUnits()
    {
        return [
            'weight' => 'kg',
            'volume' => 'liter',
            'piece' => 'piece',
            'length' => 'meter'
        ];
    }

    public static function getConversions()
    {
        return [
            'weight' => [
                'ton' => 1000,      // 1 ton = 1000 kg
                'kg' => 1,          // base unit
                'gram' => 0.001,    // 1 gram = 0.001 kg
                'pound' => 0.453592 // 1 pound = 0.453592 kg
            ],
            'volume' => [
                'liter' => 1,
                'ml' => 0.001
            ],
            'piece' => [
                'piece' => 1,
                'dozen' => 12,
                'box' => 1
            ],
            'length' => [
                'meter' => 1,
                'cm' => 0.01,
                'mm' => 0.001
            ]
        ];
    }
}