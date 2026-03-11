<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Account;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ExpenseController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $startdate = $request->query('startdate') ?? null;
        $date = $request->query('date') ?? now('Asia/Dhaka')->toDateString();

        $todaysExpense = Expense::with(['creator', 'category'])
            ->when($startdate && $date, function ($query) use ($startdate, $date) {
                $query->whereBetween('date', [
                    Carbon::parse($startdate)->startOfDay(),
                    Carbon::parse($date)->endOfDay(),
                ]);
            })
            ->when(empty($startdate) && $date, function ($query) use ($date) {
                $query->whereDate('date', $date);
            })
            ->when(Auth::user()->role !== 'admin', function ($query) {
                $query->where('created_by', Auth::id());
            })
            ->paginate(10);

        $todaysExpenseTotal = Expense::when($startdate && $date, function ($query) use ($startdate, $date) {
            $query->whereBetween('date', [
                Carbon::parse($startdate)->startOfDay(),
                Carbon::parse($date)->endOfDay(),
            ]);
        })
            ->when(!$startdate && $date, function ($query) use ($date) {
                $query->whereDate('date', $date);
            })
            ->when(Auth::user()->role !== 'admin', function ($query) {
                $query->where('created_by', Auth::id());
            })
            ->sum('amount');

        if ($isShadowUser) {
            $todaysExpense->getCollection()->transform(function ($expense) {
                return $this->transformToShadowData($expense);
            });

            $todaysExpenseTotal = $todaysExpense->sum('sh_amount');
        }

        return Inertia::render('expenses/Index', [
            'todaysExpenseTotal' => $todaysExpenseTotal,
            'todaysExpense' => $todaysExpense,
            'query' => $request->only('date', 'startdate'),
            'categories' => ExpenseCategory::all(),
            'accounts' => Account::where('is_active', true)->get(),
            'isShadowUser' => $isShadowUser,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'details' => 'nullable|string',
            'amount' => 'required|numeric|min:0.01',
            'sh_amount' => 'nullable|numeric',
            'category_id' => 'nullable|integer',
            'account_id' => 'required_if:amount,>,0|exists:accounts,id',
        ]);

        try {
            $account = null;

            if ($request->account_id) {
                $account = Account::find($request->account_id);
                if (!$account) {
                    return redirect()->back()->with('error', 'Selected account not found');
                }
                if (!$account->is_active) {
                    return redirect()->back()->with('error', 'Selected account is not active');
                }
                if (!$account->canWithdraw($request->amount)) {
                    return redirect()->back()->with('error', "Insufficient balance in account: {$account->name}. Available: ৳{$account->current_balance}");
                }
            }

            $expense = Expense::create([
                'date' => Carbon::parse($request->date)->toDateString(),
                'details' => $request->details,
                'amount' => $request->amount,
                'sh_amount' => $request->sh_amount ?? $request->amount,
                'created_by' => Auth::id(),
                'category_id' => $request->category_id ?? 0,
                'payment_id' => null
            ]);

            if ($account && $request->amount > 0) {

                $account->updateBalance($request->amount, 'withdraw');

                $payment = new Payment();
                $payment->amount = -$request->amount; 
                $payment->payment_method = $account->type ?? 'cash';
                $payment->txn_ref = 'EXP-' . Str::random(10);
                $payment->note = $request->details ?? 'Expense Payment';
                $payment->account_id = $request->account_id;
                $payment->paid_at = now();
                $payment->created_by = Auth::id();
                $payment->save();

                $expense->update([
                    'payment_id' => $payment->id
                ]);

            }

            return redirect()->back()->with('success', "Expense added successfully.");
        } catch (\Exception $e) {
            return redirect()->back()->with('error', "Error creating expense: " . $e->getMessage());
        }
    }

    /**
     * Create a expense category
     */
    public function category(Request $request)
    {
        $query = $request->only(['startdate', 'date', 'search']);
        $today = now()->format('Y-m-d');
        $categories = ExpenseCategory::with('expenses')
            ->when($request->has('startdate') && $request->startdate, function ($query) use ($request) {
                $query->whereDate('created_at', '>=', $request->startdate);
            })
            ->when($request->has('search') && $request->search, function ($query) use ($request) {
                $query->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('description', 'like', '%' . $request->search . '%');
            })
            ->withCount('expenses')
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $todaysCategoriesCount = ExpenseCategory::count();

        return Inertia::render('expenses/category/index', [
            'categories' => $categories,
            'todaysCategoriesCount' => $todaysCategoriesCount,
            'query' => $query,
        ]);
    }

    /**
     * Store a expense category
     */
    public function categoryStore(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'description' => 'nullable|string',
        ]);

        try {
            ExpenseCategory::create([
                'name' => $request->name,
                'slug' => Str::slug($request->name),
                'description' => $request->description,
                'created_by' => Auth::id(),
            ]);

            return redirect()->back()->with('success', "Expense category added successfully.");
        } catch (\Exception $e) {
            return redirect()->back()->with('error', "Server error, please try again.");
        }
    }

    // Category update
    public function categoryUpdate(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string',
            'description' => 'nullable|string',
        ]);

        try {
            $category = ExpenseCategory::findOrFail($id);
            $category->update([
                'name' => $request->name,
                'slug' => Str::slug($request->name),
                'description' => $request->description,
            ]);

            return redirect()->back()->with('success', "Expense category updated successfully.");
        } catch (\Exception $e) {
            return redirect()->back()->with('error', "Server error, please try again.");
        }
    }

    // Category destroy
    public function categoryDestroy($id)
    {
        try {
            $category = ExpenseCategory::withCount('expenses')->findOrFail($id);

            if ($category->expenses_count > 0) {
                return redirect()->back()->with('error', "Cannot delete category with existing expenses.");
            }

            $category->delete();

            return redirect()->back()->with('success', "Expense category deleted successfully.");
        } catch (\Exception $e) {
            return redirect()->back()->with('error', "Server error, please try again.");
        }
    }

    // Delete expense
    public function distroy($id)
    {
        try {
            $expense = Expense::findOrFail($id);

            if ($expense->payment_id) {
                $payment = Payment::find($expense->payment_id);
                if ($payment && $payment->account_id) {
                    $account = Account::find($payment->account_id);
                    if ($account && $payment->amount != 0) {
                        $restoreAmount = abs($payment->amount); 
                        $account->updateBalance($restoreAmount, 'deposit');

                        \Illuminate\Support\Facades\Log::info('Expense deleted, account balance restored', [
                            'expense_id' => $expense->id,
                            'payment_id' => $payment->id,
                            'account_id' => $account->id,
                            'amount' => $payment->amount,
                            'restore_amount' => $restoreAmount,
                            'new_balance' => $account->current_balance
                        ]);
                    }

                    $payment->delete();
                }
            }

            $expense->delete();

            return redirect()->back()->with('success', "Expense deleted successfully.");
        } catch (\Exception $e) {
            return redirect()->back()->with('error', "Error deleting expense: " . $e->getMessage());
        }
    }

    private function transformToShadowData($expense)
    {
        $expense->amount = $expense->sh_amount;
        return $expense;
    }
}