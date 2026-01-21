<?php

namespace App\Http\Controllers;

use App\Models\BusinessProfile;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PaymentController extends Controller
{

    //index function
    public function index(Request $request)
    {
        $isShadowUser = Auth::user()->type === 'shadow';
        $search = $request->input('search');

        $payments = Payment::with([
            'sale',
            'purchase',
            'customer',
            'creator',
            'supplier',
            'account'
        ])
            ->where('status', '!=', 'cancelled')
            ->search($search)
            ->latest()
            ->paginate(20)
            ->withQueryString();

        if ($isShadowUser) {
            $payments->getCollection()->transform(
                fn($payment) => $this->transformToShadowData($payment)
            );
        }

        return Inertia::render('Payments/Index', [
            'payments' => $payments,
            'filters' => ['search' => $search],
            'isShadowUser' => $isShadowUser,
        ]);
    }




    // ledger function
    public function ledger(Request $request)
    {
        $isShadowUser = Auth::user()->type === 'shadow';
        $search = $request->input('search');
        $type = $request->input('type', 'all');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $payments = Payment::with([
            'sale',
            'purchase',
            'customer',
            'creator',
            'supplier'
        ])
            ->where('status', '!=', 'cancelled')
            ->search($search)
            ->when($type == 'customer', function ($query) {
                return $query->whereNotNull('customer_id')->where('supplier_id', 0);
            })
            ->when($type == 'supplier', function ($query) {
                return $query->whereNotNull('supplier_id')->where('customer_id', 0);
            })
            ->when($startDate, function ($query) use ($startDate) {
                return $query->whereDate('created_at', '>=', $startDate);
            })
            ->when($endDate, function ($query) use ($endDate) {
                return $query->whereDate('created_at', '<=', $endDate);
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();


        if ($isShadowUser) {
            $payments->getCollection()->transform(
                fn($payment) => $this->transformToShadowData($payment)
            );
        }

        return Inertia::render('Payments/Ledger', [
            'payments' => $payments,
            'filters' => [
                'search' => $search,
                'type' => $type,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'isShadowUser' => $isShadowUser,
        ]);
    }


    public function show(Payment $payment)
    {

        $payment = Payment::with(['customer', 'sale.items','supplier','purchase.items'])->findOrFail($payment->id);

        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        if ($isShadowUser) {
            $payment = $this->transformToShadowData($payment);
        }

        return Inertia::render('Payments/Show', [
            'payment' => $payment,
            'business' => BusinessProfile::where('user_id', Auth::id())->first(),
            'isShadowUser' => $isShadowUser,
        ]);
    }


    private function transformToShadowData(Payment $payment)
    {
        $payment->amount = $payment->shadow_amount;

        if ($payment->sale) {
            $payment->sale->grand_total = $payment->sale->shadow_grand_total;
        }

        if ($payment->purchase) {
            $payment->purchase->grand_total = $payment->purchase->shadow_grand_total;
        }

        if (!empty($payment->sale?->items)) {
            $payment->sale->items->transform(function ($item) {
                $item->unit_price  = $item->shadow_unit_price;
                $item->sale_price  = $item->shadow_sale_price;
                $item->total_price = $item->shadow_total_price;
                return $item;
            });
        }

        if (!empty($payment->purchase?->items)) {
            $payment->purchase->items->transform(function ($item) {
                $item->unit_price  = $item->shadow_unit_price;
                $item->sale_price  = $item->shadow_sale_price;
                $item->total_price = $item->shadow_total_price;
                return $item;
            });
        }

        return $payment;
    }
}
