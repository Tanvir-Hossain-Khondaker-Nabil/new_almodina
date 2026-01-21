<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\Sale;
use Inertia\Inertia;
use App\Models\Account;
use App\Models\Payment;
use App\Models\Customer;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use App\Http\Requests\CustomerStore;
use Illuminate\Support\Facades\Auth;

class CustomerController extends Controller
{
    // index
    public function index(Request $request)
    {
        $query = Customer::query()
            ->with(['sales' => function ($query) {
                $query->select('id', 'customer_id', 'due_amount');
            }])
            ->latest();

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('customer_name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%");
            });
        }

        return Inertia::render("Customers", [
            'filters' => $request->only('search'),
            'accounts' => Account::where('is_active',true)->get(),
            'customers' => $query->paginate(10)
                ->withQueryString()
                ->through(fn($customer) => [
                    'id' => $customer->id,
                    'customer_name' => $customer->customer_name,
                    'phone' => $customer->phone,
                    'address' => $customer->address,
                    'is_active' => (bool) $customer->is_active,
                    'advance_amount' => (float) $customer->advance_amount,
                    'due_amount' => (float) $customer->due_amount,
                    'sales' => $customer->sales,
                    'created_at' => $customer->created_at->format('D M, Y h:i A'),
                ]),
        ]);
    }

    // store
    public function store(CustomerStore $request)
    {
        $request->validated();

        $account = null;
        if($request->account_id !=null) 
        {
            $account = Account::find($request->input('account_id'));
        }
        
        try {
           $customer =   Customer::create([
                'customer_name' => $request->customer_name,
                'phone' => $request->phone,
                'address' => $request->address,
                'advance_amount' => $request->advance_amount ?? 0,
                'due_amount' => $request->due_amount ?? 0,
                'is_active' => $request->is_active ?? true,
                'created_by' => Auth::id(),
            ]);

            if($request->due_amount > 0)
            {
                Sale::create([
                    'customer_id' => $customer->id,
                    'invoice_no' => 'ICD-' . Str::random(8),
                    'grand_total' => $request->due_amount,
                    'paid_amount' => 0,
                    'due_amount' => $request->due_amount ?? 0,
                    'status' => 'pending',
                    'outlet_id' => Auth::user()->current_outlet_id ?? 1,
                    'created_by' => Auth::id(),
                ]);
            }

            if ($account) {
                if ($request->advance_amount && $request->advance_amount > 0) {

                    $account->updateBalance($request->advance_amount,'deposit');
                    
                    Payment::create([
                        'customer_id'    => $customer->id ?? null,
                        'amount'         => $request->advance_amount ?? 0,
                        'shadow_amount'  => 0,
                        'payment_method' => $account->type ?? 'Cash',
                        'txn_ref'        => $request->input('transaction_id') ?? ('ADB-' . Str::random(10)),
                        'note'           =>'Initial advance amount payment of customer',
                        'paid_at'        => Carbon::now(),
                        'created_by'     => Auth::id(),
                        'status'         => 'completed'
                    ]);
                }
            }

            return redirect()->back()->with('success', 'New customer added successfully');

        } catch (\Exception $th) {
            return redirect()->back()->with('error', 'Server error: ' . $th->getMessage());
        }
    }


    // delete customer
    public function del($id)
    {
        try {
            $customer = Customer::findOrFail($id);

            // Check if customer has any sales before deleting
            if ($customer->sales()->exists()) {
                return redirect()->back()->with('error', 'Cannot delete customer with existing sales records.');
            }

            $customer->delete();
            return redirect()->back()->with('success', "Customer deleted successfully");
        } catch (\Exception $th) {
            return redirect()->back()->with('error', 'Server error: ' . $th->getMessage());
        }
    }

    // edit
    public function edit($id)
    {
        try {
            $customer = Customer::findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $customer->id,
                    'customer_name' => $customer->customer_name,
                    'phone' => $customer->phone,
                    'address' => $customer->address,
                    'advance_amount' => $customer->advance_amount,
                    'due_amount' => $customer->due_amount,
                    'is_active' => $customer->is_active,
                ]
            ]);
        } catch (\Exception $th) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found'
            ], 404);
        }
    }


    // update
    public function update(Request $request, $id)
    {
        $request->validate([
            'customer_name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'address' => 'nullable|string',
            'advance_amount' => 'nullable|numeric|min:0',
            'due_amount' => 'nullable|numeric|min:0',
            'is_active' => 'boolean'
        ]);

        try {
            $customer = Customer::findOrFail($id);

            $customer->update([
                'customer_name' => $request->customer_name,
                'phone' => $request->phone,
                'address' => $request->address,
                'advance_amount' => $request->advance_amount ?? $customer->advance_amount,
                'due_amount' => $request->due_amount ?? $customer->due_amount,
                'is_active' => $request->has('is_active') ? $request->is_active : $customer->is_active,
            ]);

            return redirect()->back()->with('success', 'Customer updated successfully');
        } catch (\Exception $th) {
            return redirect()->back()->with('error', 'Server error: ' . $th->getMessage());
        }
    }


    // show
    public function show($id)
    {
        $customer = Customer::with([
            'sales' => function ($query) {
                $query->with([
                    'items.product',
                    'payments',
                    'creator' => function ($q) {
                        $q->select('id', 'name', 'email');
                    }
                ])->latest();
            },
            'creator' => function ($query) {
                $query->select('id', 'name');
            }
        ])->findOrFail($id);

        // Calculate summary statistics
        $totalSales = $customer->sales->count();
        $totalAmount = $customer->sales->sum('grand_total');
        $totalPaid = $customer->sales->sum('paid_amount');
        $totalDue = $customer->sales->sum('due_amount');

        return Inertia::render('Customer/Show', [
            'customer' => $customer,
            'stats' => [
                'total_sales' => $totalSales,
                'total_amount' => $totalAmount,
                'total_paid' => $totalPaid,
                'total_due' => $totalDue,
                'advance_amount' => $customer->advance_amount,
                'current_due' => $customer->due_amount,
            ],
            'breadcrumbs' => [
                ['name' => 'Customers', 'link' => route('customer.index')],
                ['name' => $customer->customer_name, 'link' => '#'],
            ]
        ]);
    }
}
