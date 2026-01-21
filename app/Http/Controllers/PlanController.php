<?php

namespace App\Http\Controllers;

use App\Http\Requests\PlanStore;
use App\Http\Requests\PlanUpdate;
use App\Models\Plan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PlanController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $plans = Plan::active()
        ->with('modules')
        ->when(request('plan_type'), function ($query) {$query->ofType(request('plan_type')); })
        ->when(request('search'), function ($query) {$query->search(request('search')); })
        ->orderBy('created_at', 'desc')
        ->paginate(10)
        ->withQueryString();

        return Inertia::render('Plans/Index', [
            'plans' => $plans,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $modules = \App\Models\Module::all();
        return Inertia::render('Plans/Create', [
            'modules' => $modules,
        ]);
    }

    /**
     * Store a newly created resource in storage.   
     */
    public function store(PlanStore $request)
    {
        $validated = $request->validated();
        $validated['status'] = Plan::STATUS_ACTIVE;
        $plan = Plan::create($validated);

        $plan->modules()->sync($request->modules);

        return to_route('plans.index')->with('success', 'Plan created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $plans = Plan::with('modules')->findOrFail($id);
        return Inertia::render('Plans/Show', [
            'plans' => $plans,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $plans = Plan::with('modules')->findOrFail($id);
        $modules = \App\Models\Module::all();
        return Inertia::render('Plans/Edit', [
            'plans' => $plans,
            'modules' => $modules,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(PlanUpdate $request, string $id)
    {
        $plan = Plan::findOrFail($id);
        $plan->update($request->validated());

        if (isset($validated['modules'])) {
            $plan->modules()->sync($validated['modules']);
        }

        return to_route('plans.index')->with('success', 'Plan updated successfully!');
    }



    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $plan = Plan::findOrFail($id);

        // if subscriptions exist for the plan, prevent deletion
        if ($plan->subscriptions()->exists()) {
            return to_route('plans.index')->withErrors(['error' => 'Cannot delete plan with active subscriptions.']);
        }
        
        $plan->modules()->detach();
        $plan->delete();
        return to_route('plans.index')->with('success', 'Plan deleted successfully.');
    }
}
