<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubscriptionPayment extends Model
{
    protected $fillable = [
        'subscription_id',
        'payment_method',
        'transaction_id',
        'amount',
        'status',
        'payment_date',
    ];

    
    const STATUS_PENDING = 1;
    const STATUS_COMPLETED = 2;
    const STATUS_FAILED = 3;

    // Relation with Subscription
    public function subscription()
    {
        return $this->belongsTo(Subscription::class)->with('plan', 'user');
    }

    //search scope
    public function scopeSearch($query, $term)
    {
        $term = "%$term%";
        $query->where('transaction_id', 'like', $term)
              ->orWhereHas('subscription.user', function ($q) use ($term) {
                  $q->where('name', 'like', $term)
                    ->orWhere('email', 'like', $term);
              });
    }


    //status scope
    public function scopeStatus($query, $value)
    {
        return $query->where('status', $value);
    }


    //payment method scope
    public function scopePaymentMethod($query, $value)
    {
        return $query->where('payment_method', $value);
    }


}
