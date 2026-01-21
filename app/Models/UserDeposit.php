<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserDeposit extends Model
{
    protected $fillable = [
        'amount',
        'payment_method',
        'transaction_id',
        'status',
        'note',
        'created_by',
        'outlet_id',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_FAILED = 'failed';

    // relationships
    public function user()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function outlet()
    {
        return $this->belongsTo(Outlet::class, 'outlet_id');
    }
}
