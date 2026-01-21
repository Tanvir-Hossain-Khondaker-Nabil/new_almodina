<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SectorController extends Controller
{
    // category views ===============
    public function category_view(Request $request)
    {
        return Inertia::render("product/Category", [
            'filters' => $request->only('search'),
            'category' => Category::withCount('products')
                ->with(['products.variants.stock'])
                ->latest()
                ->filter($request->only('search'))
                ->paginate(10)
                ->withQueryString()
                ->through(function ($category) {
                    $totalStock = 0;

                    // Calculate total stock from all products in this category
                    foreach ($category->products as $product) {
                        foreach ($product->variants as $variant) {
                            $totalStock += $variant->stock ? $variant->stock->quantity : 0;
                        }
                    }

                    return [
                        'id' => $category->id,
                        'name' => $category->name,
                        'products_count' => $category->products_count,
                        'total_stock' => $totalStock,
                        'join_at' => $category->created_at->format('D M, Y'),
                    ];
                }),
        ]);
    }

    public function category_store(Request $request)
    {
        $request->validate([
            'name' => 'required'
        ]);

        try {
            $q = $request->id ? Category::find($request->id) : new Category();
            $q->name = $request->name;
            $q->created_by = Auth::id();
            $q->save();

            return redirect()->back()->with('success', $request->id ? 'Category updated success' : 'New category added success');
        } catch (\Exception $th) {
            return redirect()->back()->with('error', "Server error, try again!");
        }
    }

    public function category_edit($id)
    {
        try {
            $q = Category::find($id);

            if (!$q) {
                return redirect()->back()->with('error', "invalid request");
            }

            return response()->json(['data' => $q]);
        } catch (\Exception $th) {
            return redirect()->back()->with('error', "server error try again.");
        }
    }

    public function category_del($id)
    {
        try {
            Category::find($id)->delete();
            return redirect()->back()->with("success", "One category deleted success.");
        } catch (\Exception $th) {
            return redirect()->back()->with("error", "Server error try again.");
        }
    }
}
