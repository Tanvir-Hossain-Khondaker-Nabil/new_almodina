<?php

namespace App\Http\Controllers;

use App\Models\Outlet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OutletController extends Controller
{
    public function index(Request $request)
    {
        // Global scope already filters by ownerId
        $outlets = Outlet::query()
            ->when($request->search, fn($q) => $q->search($request->search))
            ->when($request->status, fn($q) =>
                $q->where('is_active', $request->status === 'active')
            )
            ->get();

        return inertia('Outlet/Index', [
            'outlets' => $outlets
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:255',
            'email' => 'required|string|email|max:255',
            'address' => 'required|string|max:255',
            'is_active' => 'boolean',
        ]);

        $outlet = Outlet::create(array_merge($validated, [
            'code' => strtoupper(uniqid('OUT-')),
            'is_main' => false,
            'currency' => 'BDT',
            'timezone' => 'Asia/Dhaka',
        ]));

        return to_route('outlets.index')->with('success', 'Outlet created successfully!');
    }

    public function edit($id)
    {
        if (!Auth::user()->canAccessOutlet($id)) abort(403);
        $outlet = Outlet::findOrFail($id);

        return inertia('Outlet/Edit', ['outlet' => $outlet]);
    }

    public function update(Request $request, $id)
    {
        if (!Auth::user()->canAccessOutlet($id)) abort(403);
        $outlet = Outlet::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:255',
            'email' => 'required|string|email|max:255',
            'address' => 'required|string|max:255',
            'is_active' => 'boolean',
        ]);

        $outlet->update($validated);

        return to_route('outlets.index')->with('success', 'Outlet updated successfully!');
    }

    public function destroy($id)
    {
        if (!Auth::user()->canAccessOutlet($id)) abort(403);

        $outlet = Outlet::findOrFail($id);
        $outlet->delete();

        return to_route('outlets.index')->with('success', 'Outlet deleted successfully!');
    }

    public function login(Request $request, $id)
    {
        // 🔐 ensure owner/staff can access
        if (!Auth::user()->canAccessOutlet($id)) abort(403);

        Auth::user()->update([
            'current_outlet_id' => $id,
            'outlet_logged_in_at' => now(),
        ]);

        $outlet = Outlet::findOrFail($id);

        return redirect()->route('home')
            ->with('success', "{$outlet->name} outlet এ লগইন করা হয়েছে!");
    }

    public function logout(Request $request)
    {
        $currentOutlet = Auth::user()->currentOutlet;

        Auth::user()->update([
            'current_outlet_id' => null,
            'outlet_logged_in_at' => null,
        ]);

        return redirect()->route('outlets.index')->with(
            'success',
            $currentOutlet ? "{$currentOutlet->name} outlet থেকে লগআউট করা হয়েছে!" : 'Outlet থেকে লগআউট করা হয়েছে!'
        );
    }

    public function switchOutlet(Request $request)
    {
        $request->validate([
            'outlet_id' => 'required|exists:outlets,id',
        ]);

        if (!Auth::user()->canAccessOutlet($request->outlet_id)) abort(403);

        Auth::user()->update([
            'current_outlet_id' => $request->outlet_id,
            'outlet_logged_in_at' => now(),
        ]);

        $outlet = Outlet::findOrFail($request->outlet_id);

        return back()->with('success', "Outlet পরিবর্তন করা হয়েছে: {$outlet->name}");
    }
}
