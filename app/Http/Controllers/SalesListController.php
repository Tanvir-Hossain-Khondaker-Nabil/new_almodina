<?php

namespace App\Http\Controllers;

use App\Models\SalesList;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SalesListController extends Controller
{
    // index
    public function index(Request $request)
    {
        $salesList = SalesList::with(['customer', 'created_by'])
            ->when(Auth::user()->role !== 'admin', function ($query) {
                $query->where('created_by', Auth::id());
            })
            ->filter($request->only('search'))
            ->latest()
            ->paginate(10);

        // sales data
        $slaesId = $request->query('salesid');
        $salesdata = null;
        if (isset($slaesId) && !empty($slaesId)) {
            $salesdata = SalesList::with(['customer', 'created_by'])->find($slaesId);
        }

        return Inertia::render("sales/SalesList", [
            'sales' => $salesList,
            'filters' => $request->only('search'),
            'salesdata' => $salesdata
        ]);
    }

    // delete
    public function delete($id)
    {
        try {
            $data = SalesList::find($id);
            $data->delete();
            return redirect()->back()->with('success', 'One sales list deleted success');
        } catch (\Exception $th) {
            return redirect()->back()->with('error', 'Server error try again');
        }
    }

    // collact due
    public function collactDue(Request $request)
    {
        try {
            if (!$request->id || !$request->amount) {
                return redirect()->back()->with('error', 'Server error try again');
            }

            $list = SalesList::find($request->id);
            if (!$list) {
                return redirect()->back()->with('error', 'Invalid request');
            }

            // totalPayment
            $totalPay = 0;
            if ($request->payments) {
                foreach ($request->payments as $item) {
                    if (!empty($item['amount']) || (int) $item['amount'] >= 0) {
                        $totalPay += (float) $item['amount'];
                    } else {
                        return redirect()->back()->with('error', $item['system'] . ' payment system empty here.');
                    }
                }
            }

            if ((float) $totalPay > (float) $request->amount) {
                return redirect()->back()
                    ->with(
                        'error',
                        'The amount cannot be greater than the grand total: ' . $request->amount . ' Tk'
                    );
            }


            // payment
            $payments = collect($request->payments)
                ->map(function ($payment) {
                    $payment['date'] = now()->toDateString();
                    return $payment;
                })
                ->toArray();
            $oldPayments = $list->pay ? json_decode($list->pay, true) : [];
            $newPayments = array_merge($oldPayments, $payments);
            $list->pay = json_encode($newPayments);

            $payToalWithOld = (float) $list->paytotal + (float) $totalPay;
            $list->paytotal = $payToalWithOld;

            if ($request->trime) {
                $list->grandtotal = $payToalWithOld;
                $list->nextdue = 0;
            } else {
                $list->nextdue = (float) $list->grandtotal - $payToalWithOld;
            }
            $list->save();

            return redirect()->back()->with('success', 'Cash added success');
        } catch (\Exception $th) {
            return redirect()->back()->with('error', 'Server error try again');
        }
    }
}
