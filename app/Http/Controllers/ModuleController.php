<?php

namespace App\Http\Controllers;

use App\Models\Module;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ModuleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $filters = $request->only(['search']);
        
        $modules = Module::query()
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->orderBy('created_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Modules/Index', [
            'modules' => $modules,
            'filters' => $filters
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Modules/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:modules,name',
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        Module::create($validated);

        return redirect()->route('modules.index')->with('success', 'Module created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $module = Module::findOrFail($id);
        
        if (request()->wantsJson()) {
            return response()->json(['module' => $module]);
        }
        
        return Inertia::render('Modules/Edit', [
            'module' => $module
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Module $module)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:modules,name,' . $module->id,
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $module->update($validated);

        return to_route('modules.index')->with('success', 'Module updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Module $module)
    {
        $module->delete();

        return redirect()->route('modules.index')->with('success', 'Module deleted successfully.');
    }
}