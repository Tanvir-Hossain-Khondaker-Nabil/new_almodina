<?php

namespace App\Http\Controllers;

use App\Http\Requests\SupplierStore;
use App\Models\Payment;
use App\Models\Supplier;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Services\SmsService;
use Illuminate\Support\Facades\Log;
use App\Models\Account;
use App\Models\DillerShip;

class SupplierController extends Controller
{
    // Display supplier list
    public function index(Request $request)
    {
        $filters = $request->only('search');

        $suppliers = Supplier::with(['purchases','dealership'])->when($filters['search'] ?? null, function ($query, $search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('contact_person', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('company', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        })
            ->withCount('purchases')
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Supplier/Index', [
            'suppliers' => $suppliers,
            'filters' => $filters,
            'dealerships' => DillerShip::all(),
            'accounts' => Account::where('is_active',true)->get(),
        ]);
    }



    // Store new supplier
    public function store(SupplierStore $request)
    {
        $validated = $request->validated();

        $validated['created_by'] = Auth::id();
        $account = Account::find($request->input('account_id'));
        $dealership = DillerShip::find($request->input('dealership_id'));

        if ($dealership) {
            $validated['dealership_id'] = $dealership->id;
        }

        $supplier = Supplier::create($validated);

        // Send welcome SMS if requested
        $smsSent = false;
        $smsError = null;

        if ($request->boolean('send_welcome_sms')) {
            try {
                $smsService = new SmsService();
                $smsResult = $smsService->sendSupplierWelcome($supplier);
                $smsSent = $smsResult['success'] ?? false;

                if (!$smsResult['success']) {
                    $smsError = $smsResult['message'] ?? 'Failed to send SMS';
                }

                Log::info('Supplier Welcome SMS Result:', [
                    'supplier_id' => $supplier->id,
                    'phone' => $supplier->phone,
                    'result' => $smsResult,
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to send welcome SMS: ' . $e->getMessage());
                $smsError = $e->getMessage();
            }
        }

        // if advance amount is given, create a payment record
        if ($request->advance_amount && $request->advance_amount > 0 && $account) {

            Payment::create([
                'supplier_id' => $supplier->id ?? null,
                'amount' => -$request->advance_amount ?? 0,
                'shadow_amount' => 0,
                'payment_method' => $account->type ?? 'Cash',
                'txn_ref' => $request->input('transaction_id') ?? ('nexoryn-' . Str::random(10)),
                'note' => 'Initial advance amount payment of supplier',
                'paid_at' => Carbon::now(),
                'created_by' => Auth::id(),
                'account_id'  => $account->id ?? null,
                'status' => 'completed'
            ]);

            $account->updateBalance($request->advance_amount ?? 0 , 'withdraw');
        }



        $responseMessage = 'Supplier contact added successfully!';
        if ($smsSent) {
            $responseMessage .= ' Welcome SMS sent.';
        } elseif ($smsError) {
            $responseMessage .= ' (SMS failed: ' . $smsError . ')';
        }

        return redirect()->back()->with('success', $responseMessage);
    }



    // Edit supplier - return data for form
    public function edit($id)
    {
        $supplier = Supplier::findOrFail($id);

        return response()->json([
            'data' => $supplier
        ]);
    }
    

    // Update supplier
    public function update(Request $request, $id)
    {
        $supplier = Supplier::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'contact_person' => 'required|string|max:255',
            'email' => 'required|email',
            'phone' => 'required|string|max:20',
            'company' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'website' => 'nullable|url',
            'advance_amount' => 'nullable|numeric|min:0',
            'due_amount' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
            'dealership_id' => 'nullable|exists:diller_ships,id'
        ]);


        $dealership = DillerShip::find($request->input('dealership_id'));

        if ($dealership) {
            $validated['dealership_id'] = $dealership->id;
        }

        $supplier->update($validated);

        return redirect()->back()->with('success', 'Supplier contact updated successfully!');
    }

    // Delete supplier
    public function destroy($id)
    {
        $supplier = Supplier::findOrFail($id);

        if ($supplier->purchases()->exists()) {
            return redirect()->back()->with('error', 'Cannot delete supplier with existing purchases!');
        }

        $supplier->delete();

        return redirect()->back()->with('success', 'Supplier contact deleted successfully!');
    }


    public function show($id)
    {
        $supplier = Supplier::with(['dealership',
            'purchases' => function ($query) {
                $query->with([
                    'items.product',
                    'creator' => function ($q) {
                        $q->select('id', 'name', 'email');
                    }
                ])->latest();
            },
            'creator' => function ($query) {
                $query->select('id', 'name');
            }
        ])->findOrFail($id);

        $totalPurchases = $supplier->purchases->count();
        $totalAmount = $supplier->purchases->sum('grand_total');
        $totalPaid = $supplier->purchases->sum('paid_amount');
        $totalDue = $supplier->purchases->sum('due_amount');

        return Inertia::render('Supplier/Show', [
            'supplier' => $supplier,
            'stats' => [
                'total_purchases' => $totalPurchases,
                'total_amount' => $totalAmount,
                'total_paid' => $totalPaid,
                'total_due' => $totalDue,
                'advance_amount' => $supplier->advance_amount,
                'current_due' => $supplier->due_amount,
                'payment_ratio' => $totalAmount > 0 ? ($totalPaid / $totalAmount) * 100 : 0,
            ],
            'breadcrumbs' => [
                ['name' => 'Suppliers', 'link' => route('supplier.view')],
                ['name' => $supplier->name, 'link' => '#'],
            ]
        ]);
    }


    public function getSmsPreview(Request $request)
    {
        $request->validate([
            'contact_person' => 'required|string',
            'phone' => 'required|string',
            'email' => 'required|email',
            'company' => 'nullable|string',
            'advance_amount' => 'nullable|numeric',
        ]);

        $fakeSupplier = (object) [
            'contact_person' => $request->contact_person,
            'phone' => $request->phone,
            'email' => $request->email,
            'company' => $request->company,
            'advance_amount' => $request->advance_amount ?? 0,
            'id' => 'TEST001',
        ];

        $smsService = new SmsService();

        $template = $request->advance_amount > 0
            ? 'supplier_welcome_with_advance'
            : 'supplier_welcome';

        $templateConfig = config("sms.templates.{$template}");

        $variables = [
            'contact_person' => $fakeSupplier->contact_person,
            'company_name' => $fakeSupplier->company ?: config('app.name'),
            'email' => $fakeSupplier->email,
            'phone' => $fakeSupplier->phone,
            'supplier_id' => $fakeSupplier->id,
            'advance_amount' => number_format($fakeSupplier->advance_amount, 2),
            // Remove this line:
            // 'login_url' => route('supplier.login'),
        ];

        $message = $templateConfig;
        foreach ($variables as $key => $value) {
            $message = str_replace('{' . $key . '}', $value, $message);
        }

        return response()->json([
            'success' => true,
            'preview' => $message,
            'characters' => strlen($message),
            'sms_count' => ceil(strlen($message) / 160),
            'template' => $template,
            'variables' => $variables,
        ]);
    }

    // টেস্ট SMS পাঠানোর জন্য API
    public function sendTestSms(Request $request)
    {
        $request->validate([
            'phone' => 'required|string',
            'message' => 'required|string',
        ]);

        $smsService = new SmsService();
        $result = $smsService->sendSms($request->phone, $request->message);

        return response()->json([
            'success' => $result['success'] ?? false,
            'message' => $result['message'] ?? 'SMS sent',
            'sandbox' => $result['sandbox'] ?? false,
            'details' => $result,
        ]);
    }
}