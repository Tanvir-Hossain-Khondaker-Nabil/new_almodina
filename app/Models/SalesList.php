<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalesList extends Model
{
    // customer
    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer');
    }

    // createed by
    public function created_by()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeFilter($query, array $filters)
    {
        // 🔎 General search across multiple columns
        if ($filters['search'] ?? false) {
            $search = $filters['search'];

            $query->where(function ($q) use ($search) {
                $q->where('sales_id', 'like', "%{$search}%")
                    ->orWhere('products', 'like', "%{$search}%")
                    ->orWhere('status', 'like', "%{$search}%")
                    ->orWhere('payment_system', 'like', "%{$search}%")
                    ->orWhere('created_by', 'like', "%{$search}%");

                // 🔎 Search in customer relation (e.g., name, email, phone)
                $q->orWhereHas('customer', function ($cq) use ($search) {
                    $cq->where('customer_name', 'like', "%{$search}%")
                        ->orWhere('address', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            });
        }
    }
}
