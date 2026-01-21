<?php

namespace App\Http\Controllers;

use App\Http\Requests\UserDepositStore;
use App\Models\User;
use App\Models\UserDeposit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserDepositController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {

        $deposits = UserDeposit::with('user','outlet')
        ->when($request->input('payment_method'), function ($query, $paymentMethod) {
            return $query->where('payment_method', $paymentMethod);
        })
        ->when($request->input('status'), function ($query, $status) {
            return $query->where('status', $status);
        })
        ->get();

        return inertia('UserDeposits/Index', [
            'deposits' => $deposits,
        ]);

    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return inertia('UserDeposits/Create', [
            'users' => User::where('outlet_id', Auth::user()->outlet_id)->get(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(UserDepositStore $request)
    {
        $validated = $request->validated();

        $validated['created_by'] = Auth::id();
        $validated['outlet_id'] = Auth::user()->outlet_id;
        $validated['status'] = UserDeposit::STATUS_PENDING;

        UserDeposit::create($validated);

        return to_route('deposits.index')->withSuccess('User deposit created successfully.');
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
       
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        // Find the deposit
        $deposit = UserDeposit::findOrFail($id);

        // Validate and update the deposit
        $validated = $request->validate([
            'amount' => 'required|numeric',
            'payment_method' => 'required|string',
            'transaction_id' => 'required|string',
            'note' => 'nullable|string',
        ]);

        $deposit->update($validated);

        return to_route('user_deposits.index')->withSuccess('User deposit updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function approve(string $id)
    {
        $deposit = UserDeposit::findOrFail($id);
        $deposit->status = UserDeposit::STATUS_APPROVED;
        $deposit->save();

        User::where('id', $deposit->created_by)->increment('total_deposit', $deposit->amount);

        return to_route('deposits.index')->withSuccess('User deposit approved successfully.');
    }
}
