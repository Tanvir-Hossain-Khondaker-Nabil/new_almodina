<?php

namespace App\Http\Controllers;

use App\Models\Outlet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth ;

class OutletController extends Controller
{

    // index function will be here
    public function index(Request $request)
    {
        $outlets = Outlet::where('user_id',Auth::id())
        ->when($request->search, fn($query) =>
            $query->search($request->search)
        )
        ->when($request->status, fn($query) =>
            $query->where('is_active', $request->status == 'active' ? true : false)
        )
        ->get();

       


        return inertia('Outlet/Index', [
            'outlets' => $outlets
        ]);
    }


    // store function will be here

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:255',
            'email' => 'required|string|email|max:255',
            'address' => 'required|string|max:255',
            'is_active' => 'boolean',
        ]);


        // Merge the authenticated user ID
        $outlet = Outlet::create(array_merge($validated, [
            'user_id' => Auth::id(),
            'code' => strtoupper(uniqid('OUT-')),
            'is_main' => false,
            'currency' => 'BDT',
            'timezone' => 'Asia/Dhaka',
            'created_by' => Auth::id(),
        ]));


        return to_route('outlets.index', $outlet)
                        ->with('success', 'Outlet created successfully!');
    }


    // edit function will be here
    public function edit($id)
    {
        $outlet = Outlet::findOrFail($id);
        return inertia('Outlet/Edit', [
            'outlet' => $outlet
        ]); 
    }


    // update function will be here

    public function update(Request $request, $id)
    {
        $outlet = Outlet::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:255',
            'email' => 'required|string|email|max:255',
            'address' => 'required|string|max:255',
            'is_active' => 'boolean',
        ]);

        $outlet->update($validated);

        return to_route('outlets.index', $outlet)
                        ->with('success', 'Outlet updated successfully!');
    }


    // show function will be here
    public function show($id)
    {
        $outlet = Outlet::findOrFail($id);
        return inertia('Outlet/Show', [
            'outlet' => $outlet
        ]);
    }


    // destroy function will be here

    public function destroy($id)
    {
        $outlet = Outlet::findOrFail($id);

        // Check if the outlet can be deleted
        // if (!$outlet->canBeDeleted()) {
        //     return to_route('outlets.index')
        //                 ->with('error', 'Main outlet cannot be deleted.');
        // }

        $outlet->delete();

        return to_route('outlets.index')
                        ->with('success', 'Outlet deleted successfully!');
    }

    public function login(Request $request, $id)
    {
        $outlet = Outlet::where('user_id', Auth::id())
            ->where('id', $id)
            ->firstOrFail();

        // User এর current outlet সেট করুন
        Auth::user()->update([
            'current_outlet_id' => $outlet->id,
            'outlet_logged_in_at' => now(),
        ]);

        return redirect()->route('home')
            ->with('success', "{$outlet->name} outlet এ লগইন করা হয়েছে!");
    }

    /**
     * Outlet থেকে লগআউট করান
     */
    public function logout(Request $request)
    {
        $currentOutlet = Auth::user()->currentOutlet;
        
        Auth::user()->update([
            'current_outlet_id' => null,
            'outlet_logged_in_at' => null,
        ]);

        return redirect()->route('outlets.index')
            ->with('success', $currentOutlet 
                ? "{$currentOutlet->name} outlet থেকে লগআউট করা হয়েছে!" 
                : 'Outlet থেকে লগআউট করা হয়েছে!'
            );
    }

    /**
     * Outlet সুইচ করান
     */
    public function switchOutlet(Request $request)
    {
        $request->validate([
            'outlet_id' => 'required|exists:outlets,id',
        ]);

        $outlet = Outlet::where('user_id', Auth::id())
            ->where('id', $request->outlet_id)
            ->firstOrFail();

        Auth::user()->update([
            'current_outlet_id' => $outlet->id,
            'outlet_logged_in_at' => now(),
        ]);

        return back()->with('success', "Outlet পরিবর্তন করা হয়েছে: {$outlet->name}");
    }

}
