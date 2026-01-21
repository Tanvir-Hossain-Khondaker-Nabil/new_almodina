<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Module extends Model
{
    protected $fillable = ['name', 'description' , 'is_active'];

    //plans relation
    public function plans() 
    { 
        return $this->belongsToMany(Plan::class, 'plan_module');
    }
    
}
