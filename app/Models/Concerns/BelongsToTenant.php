<?php
namespace App\Models\Concerns;

use App\Scopes\UserScope;
use App\Scopes\OutletScope;
use Illuminate\Support\Facades\Auth;

trait BelongsToTenant
{
    protected static function bootBelongsToTenant()
    {
        static::addGlobalScope(new UserScope);
        static::addGlobalScope(new OutletScope);

        static::creating(function ($model) {
            if (!Auth::check()) return;

            $user = Auth::user();

            // ✅ created_by always OWNER
            if ($model->isFillable('created_by') || isset($model->created_by)) {
                $model->created_by = $user->ownerId();
            }

            // ✅ outlet_id = current outlet
            if ($user->current_outlet_id && ($model->isFillable('outlet_id') || isset($model->outlet_id))) {
                $model->outlet_id = $user->current_outlet_id;
            }
        });

        static::updating(function ($model) {
            // prevent outlet_id change
            if ($model->getOriginal('outlet_id') !== null && $model->outlet_id !== $model->getOriginal('outlet_id')) {
                $model->outlet_id = $model->getOriginal('outlet_id');
            }

            // prevent created_by change
            if ($model->getOriginal('created_by') !== null && $model->created_by !== $model->getOriginal('created_by')) {
                $model->created_by = $model->getOriginal('created_by');
            }
        });
    }
}
