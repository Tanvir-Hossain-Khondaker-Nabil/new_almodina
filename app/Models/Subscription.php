<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    protected $fillable = [
        'user_id',
        'plan_id',
        'validity',
        'start_date',
        'end_date',
        'status',
        'notes',
        'product_range',
    ];

    // ✅ date cast (খুব গুরুত্বপূর্ণ)
    protected $casts = [
        'start_date' => 'date',
        'end_date'   => 'date',
    ];

    const STATUS_ACTIVE = 1;
    const STATUS_EXPIRED = 2;
    const STATUS_CANCELLED = 3;
    const STATUS_PENDING = 4;

    public function plan()
    {
        return $this->belongsTo(Plan::class)->with('modules');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function payments()
    {
        return $this->hasMany(SubscriptionPayment::class, 'subscription_id', 'id');
    }

    // ✅ clean scopes
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function scopeValidToday($query)
    {
        $today = now()->toDateString();

        return $query->whereDate('start_date', '<=', $today)
                     ->whereDate('end_date', '>=', $today);
    }

    public function scopeSearch($query, $term)
    {
        return $query->whereHas('user', function ($q) use ($term) {
            $q->where('name', 'like', "%{$term}%")
              ->orWhere('email', 'like', "%{$term}%");
        })->orWhereHas('plan', function ($q) use ($term) {
            $q->where('name', 'like', "%{$term}%");
        });
    }

    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }
}
