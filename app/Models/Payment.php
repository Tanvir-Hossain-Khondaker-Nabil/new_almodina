<?php

namespace App\Models;

use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'sale_id',
        'purchase_id',
        'expense_id', // Add this if you have expenses table
        'salary_id', // Add this if you have salaries table
        'account_id', // New field
        'amount',
        'payment_method',
        'txn_ref',
        'note',
        'customer_id',
        'supplier_id',
        'paid_at',
        'shadow_amount',
        'status',
        'created_by',
        'outlet_id'
    ];

    protected static function booted()
    {
        // Add global scopes
        static::addGlobalScope(new UserScope);
        static::addGlobalScope(new OutletScope);

        // Automatically set outlet_id and created_by when creating
        static::creating(function ($model) {
            if (Auth::check()) {
                $user = Auth::user();
                $model->created_by = $user->id;

                // Get current outlet ID from user
                if ($user->current_outlet_id) {
                    $model->outlet_id = $user->current_outlet_id;
                }
            }
        });

        // Prevent updating outlet_id once set
        static::updating(function ($model) {
            $originalOutletId = $model->getOriginal('outlet_id');
            if ($originalOutletId !== null && $model->outlet_id !== $originalOutletId) {
                $model->outlet_id = $originalOutletId;
            }
        });

        // Payment-specific event handlers
        static::created(function ($model) {
            // Update account balance when payment is created
            if ($model->account && $model->status == 'completed') {
                $model->updateAccountBalance();
            }
        });

        static::updated(function ($model) {
            // Handle balance updates if payment status or amount changes
            if ($model->account && $model->isDirty(['amount', 'status'])) {
                $model->updateAccountBalance();
            }
        });

        static::deleting(function ($model) {
            // Reverse account balance when payment is deleted
            if ($model->account && $model->status == 'completed') {
                $model->reverseAccountBalance();
            }
        });
    }

    public function account()
    {
        return $this->belongsTo(Account::class, 'account_id');
    }

    public function sale()
    {
        return $this->belongsTo(Sale::class, 'sale_id');
    }

    public function purchase()
    {
        return $this->belongsTo(Purchase::class, 'purchase_id');
    }

    public function expense()
    {
        return $this->belongsTo(Expense::class, 'expense_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isCompleted()
    {
        return $this->status == 'completed';
    }

    public function isPending()
    {
        return $this->status == 'pending';
    }


    public function isCancelled()
    {
        return $this->status == 'cancelled';
    }


    // New method to determine payment type (income/expense)
    public function getPaymentTypeAttribute()
    {
        if ($this->sale_id && !$this->sale?->is_return) {
            return 'income'; // Sale payment
        }
        if ($this->purchase_id) {
            return $this->purchase->is_return ? 'income' : 'expense'; // Purchase return gives money back
        }
        if ($this->expense_id) {
            return 'expense';
        }
        if ($this->salary_id) {
            return 'expense';
        }
        if ($this->sale?->is_return) {
            return 'expense'; // Sale return gives money back to customer
        }
        return 'transfer';
    }



    // Update account balance based on payment type
    public function updateAccountBalance()
    {
        if (!$this->account)
            return;

        $oldAmount = $this->getOriginal('amount') ?? 0;
        $newAmount = $this->amount;
        $oldStatus = $this->getOriginal('status');
        $newStatus = $this->status;

        // Handle status changes
        if ($oldStatus == 'completed' && $newStatus !== 'completed') {
            $this->reverseAccountBalanceForAmount($oldAmount);
            return;
        }

        if ($newStatus == 'completed') {
            if ($oldStatus == 'completed') {
                // Amount changed for completed payment
                $difference = $newAmount - $oldAmount;
                if ($difference != 0) {
                    $this->adjustAccountBalance($difference);
                }
            } else {
                // New completed payment
                $this->adjustAccountBalance($newAmount);
            }
        }
    }


    // Adjust account balance for payment
    private function adjustAccountBalance($amount)
    {
        $type = $this->payment_type;

        if ($type == 'income') {
            // Credit to account
            $this->account->updateBalance($amount, 'credit');
        } elseif ($type == 'expense') {
            // Debit from account
            $this->account->updateBalance($amount, 'debit');
        }
        // 'transfer' type handled separately in Account Transfer
    }

    // Reverse account balance for payment
    private function reverseAccountBalance()
    {
        $this->reverseAccountBalanceForAmount($this->amount);
    }

    private function reverseAccountBalanceForAmount($amount)
    {
        $type = $this->payment_type;

        if ($type === 'income') {
            // Reverse credit (debit)
            $this->account->updateBalance($amount, 'debit');
        } elseif ($type === 'expense') {
            // Reverse debit (credit)
            $this->account->updateBalance($amount, 'credit');
        }
    }

    public function scopeSearch($query, $term)
    {
        if (!$term)
            return $query;

        return $query->where(function ($q) use ($term) {
            $q->where('payment_method', 'like', "%{$term}%")
                ->orWhere('txn_ref', 'like', "%{$term}%")
                ->orWhere('note', 'like', "%{$term}%")
                ->orWhereHas('account', function ($q2) use ($term) {
                    $q2->where('name', 'like', "%{$term}%")
                        ->orWhere('account_number', 'like', "%{$term}%");
                })
                ->orWhereHas('customer', function ($q2) use ($term) {
                    $q2->where('customer_name', 'like', "%{$term}%")
                        ->orWhere('phone', 'like', "%{$term}%");
                })
                ->orWhereHas('supplier', function ($q2) use ($term) {
                    $q2->where('name', 'like', "%{$term}%")
                        ->orWhere('phone', 'like', "%{$term}%");
                });
        });
    }

    public function salary()
    {
        return $this->belongsTo(Salary::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}