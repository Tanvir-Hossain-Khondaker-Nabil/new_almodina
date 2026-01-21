<?php

namespace App\Http\Controllers;

use App\Http\Requests\SubscriptionStore;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\SubscriptionPayment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SubscriptionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $subscriptions = Subscription::with(['plan','user','payments'])
        ->when(request('status'), function ($query) { $query->status(request('status' )); })
        ->when(request('search'), function ($query) { $query->search(request('search')); })
        ->orderBy('created_at', 'desc')
        ->paginate(10)
        ->withQueryString();

        return inertia('Subscriptions/Index', [
            'subscriptions' => $subscriptions
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $plans = Plan::with('modules')->active()->get();
        $users = User::where('role', User::USER_ROLE)->get();

        return inertia('Subscriptions/Create', [
            'plans' => $plans,
            'users' => $users
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(SubscriptionStore $request)
    {

        $validity = Plan::where('id', $request->plan_id)->value('validity');
        $product_range = Plan::where('id', $request->plan_id)->value('product_range');
        $validated = $request->validated();

        if(!empty($request->user_email) && empty($request->user_id)) {
            $user = User::where('email', $request->user_email)->first();
            if ($user) {
                $validated['user_id'] = $user->id;
            }
        }

        $checkUser = Subscription::where('user_id', $validated['user_id'])->where('plan_id', $validated['plan_id'])->where('status', 1)->exists();

        if($checkUser) 
        {
            return back()->withErrors(['user_id' => 'This user already has an active subscription for the selected plan.'])->withInput();
        }

        $validated['validity'] = $validity;
        $validated['status'] = 1; 
        $validated['product_range'] =  $product_range ?? 20;

       $subscriptions = Subscription::create($validated);

       if($subscriptions) {
          SubscriptionPayment::create([
              'subscription_id' => $subscriptions->id,
              'payment_method' => $request->payment_method ?? 'manual',
              'transaction_id' => $request->transaction_id ?? 'nexoryn-' . uniqid(),
              'amount' => $subscriptions->plan->price,
              'status' => 'completed',
              'payment_date' => now(),
          ]);
       }

        return to_route('subscriptions.index')->with('success', 'Subscription created successfully.');
    }

    /**
     * edit the specified resource.
     */
    public function edit(string $id)
    {
        $subscription = Subscription::with(['user', 'plan'])->findOrFail($id);
        
        return Inertia::render('Subscriptions/Edit', [
            'subscription' => $subscription,
            'plans' => Plan::active()->get(),
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function renew(Request $request, string $id)
    {
        $subscription = Subscription::with(['user', 'plan'])->findOrFail($id);
        $plan = Plan::findOrFail($request->plan_id);
        $plan_type = $plan->plan_type;

        if ($plan_type == Plan::PLAN_PAID) {
            $request->validate([
                'payment_method' => 'required|string',
                'transaction_id' => 'required|string',
            ]);
        }

        $startDate = Carbon::parse($subscription->end_date);
        $endDate = $startDate->addDays($plan->validity);

        $subscription->update([
            'end_date' => $endDate,
            'validity' => $subscription->validity + $plan->validity,
            'status' => Subscription::STATUS_ACTIVE,
        ]);

        if ($plan_type !== Plan::PLAN_FREE) {
            \App\Models\SubscriptionPayment::create([
                'subscription_id' => $subscription->id,
                'amount' => $plan->price,
                'payment_method' => $request->payment_method,
                'transaction_id' => $request->transaction_id,
                'status' => \App\Models\SubscriptionPayment::STATUS_COMPLETED,
                'payment_date' => now(),
            ]);
        }

        return to_route('subscriptions.index')->with('success', 'Subscription renewed and payment recorded successfully.');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function show(string $id)
    {
        $subscription = Subscription::with(['plan', 'user', 'payments'])
        ->withCount('payments')
        ->findOrFail($id);

        $paymentTotal = $subscription->payments()->sum('amount');

        return inertia('Subscriptions/Show', [
            'subscription' => $subscription,
            'paymentTotal' => $paymentTotal
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function payment(Request $request)
    {
        $subscription = SubscriptionPayment::with(['subscription.plan', 'subscription.user','subscription'])
        ->when($request->search, function ($query) use ($request) {
            $query->search($request->search);
        })
        ->when($request->status, function ($query, $status) {
            $query->where('status', $status);
        })
        ->when($request->payment_method, function ($query, $payment_method) {
            $query->where('payment_method', $payment_method);
        })
        ->orderBy('created_at', 'desc')
        ->paginate(10)
        ->withQueryString();

        return inertia('Subscriptions/Payment', [
            'subscription' => $subscription
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function paymentView(string $id)
    {
        $payment = SubscriptionPayment::with(['subscription.plan', 'subscription.user','subscription'])
            ->findOrFail($id);

        return inertia('Subscriptions/PaymentView', [
            'payment' => $payment
        ]);
    }
}
