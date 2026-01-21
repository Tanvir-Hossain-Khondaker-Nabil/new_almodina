<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasRoles;

    protected $fillable = [
        'name',
        'email',
        'password',
        'type',
        'role',
        'phone',
        'address',
        'status',
        'parent_id',
        'current_outlet_id',
        'outlet_logged_in_at',
        'total_deposit',
        'role_id'
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    const ADMIN_ROLE = 1;
    const COMPANY_ROLE = 2;
    const USER_ROLE = 3;

    protected $casts = [
        'email_verified_at' => 'datetime',
        'outlet_logged_in_at' => 'datetime',
        'current_outlet_id' => 'integer',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // relationship with businesses
    public function business()
    {
        return $this->hasOne(BusinessProfile::class, 'user_id', 'id');
    }


    /**
     * Super Admin check (Spatie Role name based)
     */
    public function isSuperAdmin(): bool
    {
        return $this->hasRole('Super Admin');
    }

    /**
     * User has an active and currently valid subscription?
     * Rules:
     * - status = ACTIVE
     * - start_date <= today
     * - end_date >= today
     */
    public function hasValidSubscription(): bool
    {
        return $this->subscriptions()
            ->active()
            ->validToday()
            ->exists();
    }

    // আপনার আগের outlet related মেথডগুলো 그대로 থাকবে...
    public function currentOutlet()
    {
        return $this->belongsTo(Outlet::class, 'current_outlet_id');
    }

    // roles relationship


    // subscriptions relationship
    public function subscriptions()
    {
        return $this->hasMany(Subscription::class, 'user_id', 'id');
    }

    /**
     * Check if user is logged into an outlet
     */
    public function isLoggedIntoOutlet(): bool
    {
        return !is_null($this->current_outlet_id) && $this->current_outlet_id > 0;
    }

    public function getAvailableOutletsAttribute()
    {
        return Outlet::where('user_id', $this->id)->get();
    }

    public function canAccessOutlet($outletId): bool
    {
        return $this->availableOutlets->contains('id', $outletId);
    }

    public function loginToOutlet($outletId): bool
    {
        if (!$this->canAccessOutlet($outletId)) {
            return false;
        }

        $this->update([
            'current_outlet_id' => $outletId,
            'outlet_logged_in_at' => now(),
        ]);

        return true;
    }

    public function logoutFromOutlet(): void
    {
        $this->update([
            'current_outlet_id' => null,
            'outlet_logged_in_at' => null,
        ]);
    }

    public function getOutletLoginDurationAttribute()
    {
        if (!$this->outlet_logged_in_at) {
            return null;
        }

        return $this->outlet_logged_in_at->diffForHumans();
    }

    public function scopeFilter($query, array $filters)
    {
        if ($filters['search'] ?? false) {
            $search = $filters['search'];

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }
    }
}
