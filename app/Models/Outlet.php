<?php

namespace App\Models;

use App\Scopes\UserScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Validation\ValidationException;

use Illuminate\Database\Eloquent\SoftDeletes;

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
        static::addGlobalScope(new UserScope);
    }


    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function currentUsers()
    {
        return $this->hasMany(User::class, 'current_outlet_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeMain($query)
    {
        return $query->where('is_main', true);
    }

    public function scopeSearch($query, $search)
    {
        return $query->where('name', 'like', "%{$search}%")
            ->orWhere('code', 'like', "%{$search}%")
            ->orWhere('phone', 'like', "%{$search}%")
            ->orWhere('email', 'like', "%{$search}%");
    }

    // Methods
    public function makeMain()
    {
        self::where('is_main', true)->update(['is_main' => false]);

        $this->update(['is_main' => true]);

        return $this;
    }

    public function canBeDeleted(): bool
    {
        return !$this->is_main;
    }

    public function getFormattedAddressAttribute(): ?string
    {
        if (!$this->address) {
            return null;
        }

        return nl2br($this->address);
    }
}