<?php

namespace App\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;

class UserScope implements Scope
{
    public function apply(Builder $builder, Model $model)
    {
        if (!Auth::check()) return;

        $builder->where($model->qualifyColumn('created_by'), Auth::id());
    }
}
