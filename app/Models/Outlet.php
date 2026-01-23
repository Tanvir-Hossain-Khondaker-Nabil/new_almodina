<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;

class Outlet extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'name',
        'code',
        'phone',
        'email',
        'address',
        'currency',
        'timezone',
        'is_active',
        'is_main',
        'created_by'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_main' => 'boolean',
    ];

    protected static function booted()
    {
        static::addGlobalScope('owner_outlets', function ($builder) {
            if (!Auth::check()) return;

            $builder->where('user_id', Auth::user()->ownerId());
        });

        static::creating(function ($outlet) {
            if (!Auth::check()) return;

            $ownerId = Auth::user()->ownerId();
            $outlet->user_id = $ownerId;
            $outlet->created_by = $ownerId;
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function currentUsers()
    {
        return $this->hasMany(User::class, 'current_outlet_id');
    }

    public function scopeSearch($query, $search)
    {
        return $query->where('name', 'like', "%{$search}%")
            ->orWhere('code', 'like', "%{$search}%")
            ->orWhere('phone', 'like', "%{$search}%")
            ->orWhere('email', 'like', "%{$search}%");
    }

    public function canBeDeleted(): bool
    {
        return !$this->is_main;
    }
}
