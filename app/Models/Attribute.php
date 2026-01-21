<?php

namespace App\Models;

use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attribute extends Model
{
    protected $fillable = ['name', 'code', 'is_active', 'created_by', 'outlet_id'];

    protected $hidden = ['created_by'];
    
    protected $casts = [
        'created_by' => 'integer',
        'is_active' => 'boolean',
        'outlet_id' => 'integer',
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

    public function values(): HasMany
    {
        return $this->hasMany(AttributeValue::class);
    }

    public function activeValues(): HasMany
    {
        return $this->values()->where('is_active', true);
    }

    // Relationship with outlet
    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    // Relationship with creator
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Scope for active attributes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // Scope for current outlet only
    public function scopeCurrentOutlet($query)
    {
        if (Auth::check() && Auth::user()->current_outlet_id) {
            return $query->where('outlet_id', Auth::user()->current_outlet_id);
        }
        return $query;
    }

    // Scope for specific outlet
    public function scopeForOutlet($query, $outletId)
    {
        return $query->where('outlet_id', $outletId);
    }

    // Get only attributes for user's current outlet
    public static function forCurrentOutlet()
    {
        return self::currentOutlet()->get();
    }
}