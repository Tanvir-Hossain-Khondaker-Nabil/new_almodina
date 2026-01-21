<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class BrandController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $brands = Brand::when(request('search'), function($query) {
                $query->search(request('search'));
            })
            ->orderBy('created_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Brand/Index', [ 
            'brands' => $brands,
            'filters' => request()->only(['search']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Brand/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:brands,name',
            'slug' => 'nullable|string|max:255|unique:brands,slug',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'description' => 'nullable|string',
        ]);

        // Generate slug if not provided
        $slug = $request->slug ?? Str::slug($request->name);
        
        $logoPath = null;
        if ($request->hasFile('logo')) {
            $logoPath = $request->file('logo')->store('brands', 'public');
        }

        // Create the brand
        Brand::create([
            'name' => $request->name,
            'slug' => $slug,
            'logo' => $logoPath,
            'description' => $request->description,
        ]);

        return to_route('brands.index')->with('success', 'Brand created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        // Not needed for now
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $brand = Brand::with('products')->findOrFail($id);

        return Inertia::render('Brand/Edit', [
            'brand' => $brand
        ]);
    
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $brand = Brand::findOrFail($id);
        
        $request->validate([
            'name' => 'required|string|max:255|unique:brands,name,' . $id,
            'slug' => 'nullable|string|max:255|unique:brands,slug,' . $id,
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'description' => 'nullable|string',
        ]);

        // Generate slug if not provided
        $slug = $request->slug ?? Str::slug($request->name);
        
        // Handle logo upload
        $logoData = [];
        if ($request->hasFile('logo')) {
            // Delete old logo if exists
            if ($brand->logo) {
                Storage::disk('public')->delete($brand->logo);
            }
            $logoData['logo'] = $request->file('logo')->store('brands', 'public');
        }

        // Update the brand
        $brand->update(array_merge([
            'name' => $request->name,
            'slug' => $slug,
            'description' => $request->description,
        ], $logoData));

        return to_route('brands.index')->with('success', 'Brand updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $brand = Brand::findOrFail($id);
        
        if ($brand->logo) {
            Storage::disk('public')->delete($brand->logo);
        }
        
        $brand->delete();

        return redirect()->route('brands.index')->with('success', 'Brand deleted successfully.');
    }
}