<?php

namespace App\Models;

use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SmsTemplate extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'api_key',
        'api_secret',
        'api_url',
        'sender_id',
        'is_active',
        'balance',
        'notes',
        'created_by',
        'outlet_id'
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // Scope for active templates
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

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

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (auth()->check()) {
                $userId = auth()->id();

                // Check if user already has a template (including soft deleted)
                $existing = self::withTrashed()->where('created_by', $userId)->exists();

                if ($existing) {
                    throw ValidationException::withMessages([
                        'general' => 'প্রতি ইউজার শুধুমাত্র একটি SMS Gateway তৈরি করতে পারবেন।'
                    ]);
                }

                $model->created_by = $userId;
            }
        });

        static::updating(function ($model) {
            // Prevent updating created_by field
            if ($model->isDirty('created_by')) {
                throw ValidationException::withMessages([
                    'created_by' => 'ক্রিয়েটর পরিবর্তন করা সম্ভব নয়।'
                ]);
            }
        });
    }

    public function scopeFilter($query, array $filters)
    {
        $query->when($filters['search'] ?? null, function ($query, $search) {
            $query->where(function ($query) use ($search) {
                $query->where('name', 'like', '%' . $search . '%')
                    ->orWhere('sender_id', 'like', '%' . $search . '%')
                    ->orWhere('api_url', 'like', '%' . $search . '%')
                    ->orWhere('notes', 'like', '%' . $search . '%');
            });
        })->when($filters['is_active'] ?? null, function ($query, $isActive) {
            $query->where('is_active', $isActive == '1');
        });
    }

    // Scope for API configuration
    public function scopeConfigured($query)
    {
        return $query->whereNotNull('api_key')
            ->whereNotNull('api_secret')
            ->whereNotNull('api_url')
            ->whereNotNull('sender_id');
    }

    // Get the user's gateway
    public function scopeUserGateway($query, $userId = null)
    {
        $userId = $userId ?? auth()->id();
        return $query->where('created_by', $userId);
    }

    // Encrypt API key when setting
    public function setApiKeyAttribute($value)
    {
        if (!empty($value)) {
            // Check if value is already masked or encrypted
            if (strpos($value, '***') === false) {
                // Encrypt the value
                $this->attributes['api_key'] = Crypt::encryptString($value);
            } else {
                // It's masked, don't change
                unset($this->attributes['api_key']);
            }
        } else {
            $this->attributes['api_key'] = null;
        }
    }

    // Decrypt API key when getting
    public function getApiKeyAttribute($value)
    {
        if (empty($value)) {
            return null;
        }

        try {
            return Crypt::decryptString($value);
        } catch (\Exception $e) {
            // If decryption fails, return original (might be from old data)
            return $value;
        }
    }

    // Encrypt API secret when setting
    public function setApiSecretAttribute($value)
    {
        if (!empty($value)) {
            // Check if value is already masked or encrypted
            if (strpos($value, '***') === false) {
                // Encrypt the value
                $this->attributes['api_secret'] = Crypt::encryptString($value);
            } else {
                // It's masked, don't change
                unset($this->attributes['api_secret']);
            }
        } else {
            $this->attributes['api_secret'] = null;
        }
    }

    // Decrypt API secret when getting
    public function getApiSecretAttribute($value)
    {
        if (empty($value)) {
            return null;
        }

        try {
            return Crypt::decryptString($value);
        } catch (\Exception $e) {
            // If decryption fails, return original
            return $value;
        }
    }

    // Get masked API key for display
    public function getMaskedApiKeyAttribute()
    {
        if (empty($this->api_key)) {
            return null;
        }

        $apiKey = $this->api_key;
        $length = strlen($apiKey);

        if ($length <= 8) {
            return $apiKey;
        }

        return substr($apiKey, 0, 4) . '***' . substr($apiKey, -4);
    }

    // Get masked API secret for display
    public function getMaskedApiSecretAttribute()
    {
        if (empty($this->api_secret)) {
            return null;
        }

        $apiSecret = $this->api_secret;
        $length = strlen($apiSecret);

        if ($length <= 8) {
            return $apiSecret;
        }

        return '********' . substr($apiSecret, -8);
    }

    // Check if gateway is fully configured
    public function getIsConfiguredAttribute()
    {
        return !empty($this->api_key) &&
            !empty($this->api_secret) &&
            !empty($this->api_url) &&
            !empty($this->sender_id);
    }

    // Get gateway status as text
    public function getStatusTextAttribute()
    {
        if (!$this->is_active) {
            return 'নিষ্ক্রিয়';
        }

        if (!$this->is_configured) {
            return 'কনফিগারেশন অসম্পূর্ণ';
        }

        return 'সক্রিয়';
    }

    // Get status badge color
    public function getStatusColorAttribute()
    {
        if (!$this->is_active) {
            return 'danger';
        }

        if (!$this->is_configured) {
            return 'warning';
        }

        return 'success';
    }

    // Get provider name from API URL
    public function getProviderNameAttribute()
    {
        $url = strtolower($this->api_url);

        $providers = [
            'twilio' => 'Twilio',
            'nexmo' => 'Vonage (Nexmo)',
            'vonage' => 'Vonage',
            'clicksend' => 'ClickSend',
            'messagebird' => 'MessageBird',
            'plivo' => 'Plivo',
            'bandwidth' => 'Bandwidth',
            'telnyx' => 'Telnyx',
            'mimsms' => 'MIMSMS',
        ];

        foreach ($providers as $keyword => $name) {
            if (strpos($url, $keyword) !== false) {
                return $name;
            }
        }

        return 'কাস্টম Gateway';
    }

    // Relationship with creator
    public function creator()
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }

    // Append attributes
    protected $appends = [
        'masked_api_key',
        'masked_api_secret',
        'is_configured',
        'status_text',
        'status_color',
        'provider_name',
    ];

    // Hide sensitive attributes by default
    protected $hidden = [
        'api_key',
        'api_secret',
    ];

    // Make attributes visible when needed
    public function makeVisible($attributes)
    {
        $this->hidden = array_diff($this->hidden, (array) $attributes);
        return $this;
    }
}