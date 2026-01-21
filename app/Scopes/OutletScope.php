<?php

namespace App\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;

class OutletScope implements Scope
{
    public function apply(Builder $builder, Model $model)
    {
        if (!Auth::check()) return;

        $outletId = Auth::user()->current_outlet_id;
        if (!$outletId) return;

        $builder->where($model->qualifyColumn('outlet_id'), $outletId);
    }
}
