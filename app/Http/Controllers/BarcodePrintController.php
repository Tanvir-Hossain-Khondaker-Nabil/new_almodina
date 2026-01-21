<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BarcodePrintController extends Controller
{
    // index
    public function index(Request $request)
    {
        $query = $request->query('code');
        $product = null;
        if ($query) {
            $product = Product::where('product_no', $query)
                ->with(['sizes.colors'])
                ->first();

            if (!$product) {
                return redirect()->route('barcode.print')->with('error', 'Invalid product code');
            }
        }

        return Inertia::render('Barcode', [
            'code' => $query,
            'product' => $product
        ]);
    }
}
