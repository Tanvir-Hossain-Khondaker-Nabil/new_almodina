<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cart extends Model
{
    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }
}
