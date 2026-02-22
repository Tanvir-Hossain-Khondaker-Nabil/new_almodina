<?php

namespace App\Http\Controllers;

use App\Http\Requests\ClearDueStore;
use App\Models\Account;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\Product;
use App\Models\PurchaseItem;
use App\Models\SaleItem;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class LedgerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $type = $request->type ?? 'all';
        $search = $request->search ?? '';
        $entityId = $request->entity_id ?? '';
        $startDate = $request->start_date ?? '';
        $endDate = $request->end_date ?? '';

        // Base queries
        $customerQuery = Customer::query();
        $supplierQuery = Supplier::query();


        // Apply search filter
        if ($search) {

            $customerQuery->where(function ($q) use ($search) {
                $q->where('customer_name', $search)
                    ->orWhere('customer_name', 'LIKE', "%{$search}%")
                    ->orWhere('phone', $search)
                    ->orWhereHas('sales', function ($query) use ($search) {
                        $query->where('invoice_no', 'like', "%{$search}%");
                    });
            });

            $supplierQuery->where(function ($q) use ($search) {
                $q->where('name', $search)
                    ->orWhere('name', 'LIKE', "%{$search}%")
                    ->orWhere('phone', $search)
                    ->orWhere('email', $search)
                    ->orWhereHas('purchases', function ($query) use ($search) {
                        $query->where('purchase_no', 'like', "%{$search}%");
                    });
            });
        }

        // Apply date filter for related transactions
        $dateFilter = function ($query) use ($startDate, $endDate) {
            if ($startDate) {
                $query->whereDate('created_at', '>=', $startDate);
            }
            if ($endDate) {
                $query->whereDate('created_at', '<=', $endDate);
            }
        };

        // Eager load relations with constraints
        if ($type == 'customer' || $type == 'all') {
            $customerQuery->with(['sales' => $dateFilter]);
        }

        if ($type == 'supplier' || $type == 'all') {
            $supplierQuery->with(['purchases' => $dateFilter]);
        }

        // Apply active status
        $customerQuery->active();
        $supplierQuery->active();

        if ($type == 'customer') {
            $customers = $customerQuery->get();

            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json([
                    'type' => $type,
                    'customers' => $customers,
                    'filters' => [
                        'type' => $type,
                        'search' => $search,
                        'entity_id' => $entityId,
                        'start_date' => $startDate,
                        'end_date' => $endDate,
                    ],
                    'stats' => $this->calculateLedgerStats($customers, collect(), $type),
                ]);
            }

            return Inertia::render('Ledger/Index', [
                'type' => $type,
                'customers' => $customers,
                'filters' => [
                    'type' => $type,
                    'search' => $search,
                    'entity_id' => $entityId,
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ],
                'stats' => $this->calculateLedgerStats($customers, collect(), $type),
            ]);
        } elseif ($type == 'supplier') {
            $suppliers = $supplierQuery->get();

            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json([
                    'type' => $type,
                    'suppliers' => $suppliers,
                    'filters' => [
                        'type' => $type,
                        'search' => $search,
                        'entity_id' => $entityId,
                        'start_date' => $startDate,
                        'end_date' => $endDate,
                    ],
                    'stats' => $this->calculateLedgerStats(collect(), $suppliers, $type),
                ]);
            }

            return Inertia::render('Ledger/Index', [
                'type' => $type,
                'suppliers' => $suppliers,
                'filters' => [
                    'type' => $type,
                    'search' => $search,
                    'entity_id' => $entityId,
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ],
                'stats' => $this->calculateLedgerStats(collect(), $suppliers, $type),
            ]);
        } else {
            // For 'all' type
            $customers = $customerQuery->get();
            $suppliers = $supplierQuery->get();

            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json([
                    'type' => $type,
                    'customers' => $customers,
                    'suppliers' => $suppliers,
                    'filters' => [
                        'type' => $type,
                        'search' => $search,
                        'entity_id' => $entityId,
                        'start_date' => $startDate,
                        'end_date' => $endDate,
                    ],
                    'stats' => $this->calculateLedgerStats($customers, $suppliers, $type),
                ]);
            }

            return Inertia::render('Ledger/Index', [
                'type' => $type,
                'customers' => $customers,
                'suppliers' => $suppliers,
                'filters' => [
                    'type' => $type,
                    'search' => $search,
                    'entity_id' => $entityId,
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ],
                'stats' => $this->calculateLedgerStats($customers, $suppliers, $type),
            ]);
        }
    }

    private function calculateLedgerStats($customers, $suppliers, $type)
    {
        // Convert to collection if not already
        $customers = $customers instanceof \Illuminate\Database\Eloquent\Collection
            ? $customers
            : collect($customers);

        $suppliers = $suppliers instanceof \Illuminate\Database\Eloquent\Collection
            ? $suppliers
            : collect($suppliers);

        $totalCustomers = $type === 'supplier' ? 0 : $customers->count();
        $totalSuppliers = $type === 'customer' ? 0 : $suppliers->count();

        // Calculate totals from sales and purchases
        $totalSalesAmount = 0;
        $totalPurchasesAmount = 0;
        $totalTransactions = 0;

        if ($type !== 'supplier') {
            foreach ($customers as $customer) {
                $totalSalesAmount += $customer->sales->sum('grand_total');
                $totalTransactions += $customer->sales->count();
            }
        }

        if ($type !== 'customer') {
            foreach ($suppliers as $supplier) {
                $totalPurchasesAmount += $supplier->purchases->sum('grand_total');
                $totalTransactions += $supplier->purchases->count();
            }
        }

        // Calculate average transaction
        $averageTransaction = $totalTransactions > 0
            ? ($totalSalesAmount + $totalPurchasesAmount) / $totalTransactions
            : 0;

        // Calculate percentages
        $totalAmount = $totalSalesAmount + $totalPurchasesAmount;
        $salesPercentage = $totalAmount > 0 ? round(($totalSalesAmount / $totalAmount) * 100) : 0;
        $purchasesPercentage = $totalAmount > 0 ? round(($totalPurchasesAmount / $totalAmount) * 100) : 0;

        return [
            'total_customers' => $totalCustomers,
            'total_suppliers' => $totalSuppliers,
            'total_sales_amount' => $totalSalesAmount,
            'total_purchases_amount' => $totalPurchasesAmount,
            'total_transactions' => $totalTransactions,
            'average_transaction' => round($averageTransaction, 2),
            'sales_percentage' => $salesPercentage,
            'purchases_percentage' => $purchasesPercentage,
            'total_amount' => $totalAmount,
        ];
    }

    // New method for individual customer ledger
    public function customerLedger($id, Request $request)
    {
        $startDate = $request->start_date ?? '';
        $endDate = $request->end_date ?? '';
        $search = $request->search ?? '';

        $customer = Customer::findOrFail($id);

        // Load sales with optional filtering
        $salesQuery = $customer->sales();

        if ($startDate) {
            $salesQuery->whereDate('created_at', '>=', $startDate);
        }
        if ($endDate) {
            $salesQuery->whereDate('created_at', '<=', $endDate);
        }
        if ($search) {
            $salesQuery->where('invoice_no', 'like', "%{$search}%");
        }

        $sales = $salesQuery->get();

        // Calculate customer-specific stats
        $totalSales = $sales->sum('grand_total');
        $totalPaid = $sales->sum('paid_amount');
        $totalDue = $totalSales - $totalPaid;
        $totalTransactions = $sales->count();
        $averageSale = $totalTransactions > 0 ? $totalSales / $totalTransactions : 0;

        // Prepare data for charts
        $monthlySales = $sales->groupBy(function ($sale) {
            return $sale->created_at->format('M Y');
        })->map(function ($monthSales) {
            return $monthSales->sum('grand_total');
        });

        // Calculate payment methods distribution
        $paymentMethods = $sales->groupBy('payment_type')->map->sum('grand_total');

        $balance = $customer->advance_amount ?? 0;

        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json([
                'customer' => $customer,
                'sales' => $sales,
                'stats' => [
                    'total_sales' => $totalSales,
                    'total_transactions' => $totalTransactions,
                    'average_sale' => round($averageSale, 2),
                    'balance' => $balance,
                    'total_due' => $totalDue,
                    'total_paid' => $totalPaid,
                ],
                'chart_data' => [
                    'monthly_sales' => $monthlySales,
                    'payment_methods' => $paymentMethods,
                ],
                'filters' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'search' => $search,
                ],
            ]);
        }

        return Inertia::render('Ledger/Customer', [
            'customer' => $customer,
            'accounts' => Account::where('is_active', true)->get(),
            'sales' => $sales,
            'stats' => [
                'total_sales' => $totalSales,
                'total_transactions' => $totalTransactions,
                'average_sale' => round($averageSale, 2),
                'balance' => $balance,
                'total_due' => $totalDue,
                'total_paid' => $totalPaid,
            ],
            'chart_data' => [
                'monthly_sales' => $monthlySales,
                'payment_methods' => $paymentMethods,
            ],
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'search' => $search,
            ],
        ]);
    }

    // New method for individual supplier ledger
    public function supplierLedger($id, Request $request)
    {
        $startDate = $request->start_date ?? '';
        $endDate = $request->end_date ?? '';
        $search = $request->search ?? '';

        $supplier = Supplier::findOrFail($id);

        // Load purchases with optional filtering
        $purchasesQuery = $supplier->purchases();

        if ($startDate) {
            $purchasesQuery->whereDate('created_at', '>=', $startDate);
        }
        if ($endDate) {
            $purchasesQuery->whereDate('created_at', '<=', $endDate);
        }
        if ($search) {
            $purchasesQuery->where('purchase_no', 'like', "%{$search}%");
        }

        $purchases = $purchasesQuery->get();

        // Calculate supplier-specific stats
        $totalPurchases = $purchases->sum('grand_total');
        $totalTransactions = $purchases->count();
        $totalPaid = $purchases->sum('paid_amount');
        $totalDue = $totalPurchases - $totalPaid;
        $averagePurchase = $totalTransactions > 0 ? $totalPurchases / $totalTransactions : 0;

        // Prepare data for charts
        $monthlyPurchases = $purchases->groupBy(function ($purchase) {
            return $purchase->created_at->format('M Y');
        })->map(function ($monthPurchases) {
            return $monthPurchases->sum('grand_total');
        });

        // Calculate payment methods distribution
        $paymentMethods = $purchases->groupBy('payment_type')->map->sum('grand_total');

        $balance = $supplier->advance_amount ?? 0;

        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json([
                'supplier' => $supplier,
                'purchases' => $purchases,
                'stats' => [
                    'total_purchases' => $totalPurchases,
                    'total_transactions' => $totalTransactions,
                    'average_purchase' => round($averagePurchase, 2),
                    'balance' => $balance,
                    'total_due' => $totalDue,
                    'total_paid' => $totalPaid,
                ],
                'chart_data' => [
                    'monthly_purchases' => $monthlyPurchases,
                    'payment_methods' => $paymentMethods,
                ],
                'filters' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'search' => $search,
                ],
            ]);
        }

        return Inertia::render('Ledger/Supplier', [
            'supplier' => $supplier,
            'purchases' => $purchases,
            'accounts' => Account::where('is_active', 1)->get(),
            'stats' => [
                'total_purchases' => $totalPurchases,
                'total_transactions' => $totalTransactions,
                'average_purchase' => round($averagePurchase, 2),
                'balance' => $balance,
                'total_due' => $totalDue,
                'total_paid' => $totalPaid,
            ],
            'chart_data' => [
                'monthly_purchases' => $monthlyPurchases,
                'payment_methods' => $paymentMethods,
            ],
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'search' => $search,
            ],
        ]);
    }


    // product ledger 
    public function ProductLedger(Request $request)
    {
        $user = Auth::user();

        $search = $request->string('search')->toString();
        $productId = $request->integer('product_id') ?: null;
        $txType = $request->string('tx_type')->toString();
        $page = $request->integer('page', 1);

        if (!in_array($txType, ['all', 'sale', 'purchase'], true)) {
            $txType = 'all';
        }

        // ------- Product list (overview) -------
        $productsQuery = Product::query()
            ->select('id', 'name', 'product_no')
            ->when($search, function ($q) use ($search) {
                $q->where(function ($qq) use ($search) {
                    $qq->where('name', 'LIKE', "%{$search}%")
                        ->orWhere('product_no', 'LIKE', "%{$search}%");
                });
            })
            ->orderBy('name');

        $products = $productsQuery->paginate(10)->withQueryString();

        if (!$productId && $products->count() > 0) {
            $productId = $products->first()->id;
        }

        $selectedProduct = null;
        $transactions = [];

        if ($productId) {
            $selectedProduct = Product::query()
                ->select('id', 'name', 'product_no')
                ->find($productId);

            if ($selectedProduct) {
                $transactions = $this->buildTransactions($productId, $txType, $page);
            }
        }

        return Inertia::render('Ledger/ProductLedger', [
            'products' => $products,
            'selectedProduct' => $selectedProduct,
            'transactions' => $transactions,
            'filters' => [
                'search' => $search,
                'product_id' => $productId,
                'tx_type' => $txType,
                'page' => $page,
            ],
        ]);
    }


    private function buildTransactions(int $productId, string $txType, int $page = 1): array
    {
        $perPage = 15;

        // Get all sales rows
        $saleRows = [];
        if ($txType === 'all' || $txType === 'sale') {
            $saleRows = SaleItem::query()
                ->where('product_id', $productId)
                ->with(['sale:id,invoice_no,customer_id,created_at', 'sale.customer:id,customer_name,phone'])
                ->orderByDesc('id')
                ->get()
                ->map(function ($item) {
                    $sale = $item->sale;
                    $customer = $sale?->customer;
                    return [
                        'type' => 'sale',
                        'date' => optional($sale?->created_at)->toDateString(),
                        'ref_no' => $sale?->invoice_no,
                        'party' => $customer->customer_name ?? 'N/A',
                        'party_phone' => $customer?->phone,
                        'qty' => (float) $item->quantity,
                        'unit_price' => (float) $item->unit_price,
                        'total' => (float) $item->total_price,
                        'variant' => $item->variant->sku,
                        'timestamp' => optional($sale?->created_at)->timestamp,
                    ];
                })->toArray();
        }

        // Get all purchase rows
        $purchaseRows = [];
        if ($txType === 'all' || $txType === 'purchase') {
            $purchaseRows = PurchaseItem::query()
                ->where('product_id', $productId)
                ->with(['purchase:id,purchase_no,supplier_id,created_at', 'supplier:id,name,phone'])
                ->orderByDesc('id')
                ->get()
                ->map(function ($item) {
                    $purchase = $item->purchase;
                    $supplier = $purchase?->supplier;
                    return [
                        'type' => 'purchase',
                        'date' => optional($purchase?->created_at)->toDateString(),
                        'ref_no' => $purchase?->purchase_no,
                        'party' => $supplier->name ?? 'N/A',
                        'party_phone' => $supplier?->phone,
                        'qty' => (float) $item->quantity,
                        'unit_price' => (float) $item->unit_price,
                        'total' => (float) $item->total_price,
                        'variant' => $item->variant->sku,
                        'timestamp' => optional($purchase?->created_at)->timestamp,
                    ];
                })->toArray();
        }

        // Merge and sort by date/time
        $merged = array_merge($saleRows, $purchaseRows);
        usort($merged, function ($a, $b) {
            return ($b['timestamp'] ?? 0) <=> ($a['timestamp'] ?? 0);
        });

        // Calculate totals
        $soldQty = array_reduce($saleRows, fn($c, $r) => $c + ($r['qty'] ?? 0), 0);
        $purchasedQty = array_reduce($purchaseRows, fn($c, $r) => $c + ($r['qty'] ?? 0), 0);

        // Manual pagination
        $totalItems = count($merged);
        $offset = ($page - 1) * $perPage;
        $paginatedRows = array_slice($merged, $offset, $perPage);

        // Remove timestamp from final data
        $paginatedRows = array_map(function ($row) {
            unset($row['timestamp']);
            return $row;
        }, $paginatedRows);

        // Create pagination metadata
        $pagination = [
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => $totalItems,
            'last_page' => ceil($totalItems / $perPage),
            'from' => $offset + 1,
            'to' => min($offset + $perPage, $totalItems),
            'links' => $this->generatePaginationLinks($page, ceil($totalItems / $perPage)),
        ];

        return [
            'summary' => [
                'sold_qty' => $soldQty,
                'purchased_qty' => $purchasedQty,
                'stock_est' => $purchasedQty - $soldQty,
            ],
            'rows' => $paginatedRows,
            'pagination' => $pagination,
        ];
    }


    private function generatePaginationLinks($currentPage, $lastPage)
    {
        $links = [];

        // Previous link
        $links[] = [
            'url' => $currentPage > 1 ? "?page=" . ($currentPage - 1) : null,
            'label' => '&laquo; Previous',
            'active' => false,
        ];

        // Page links
        for ($i = 1; $i <= $lastPage; $i++) {
            $links[] = [
                'url' => "?page=" . $i,
                'label' => $i,
                'active' => $i == $currentPage,
            ];
        }

        // Next link
        $links[] = [
            'url' => $currentPage < $lastPage ? "?page=" . ($currentPage + 1) : null,
            'label' => 'Next &raquo;',
            'active' => false,
        ];

        return $links;
    }


    // Clear Due Store Method
    public function clearDueStore($id, ClearDueStore $request)
    {
        $request->validated();
        $paid_amount = $request->paid_amount;
        $paymentMethod = $request->payment_type;
        $account = Account::where('id', $request->account_id)->first();


        // ------------------------------------------------------------
        // CUSTOMER DUE CLEARING
        // ------------------------------------------------------------
        if ($request->type == 'customer') {

            $customer = Customer::findOrFail($id);

            //  Handle Advance Adjustment
            if ($paymentMethod == 'advance_adjustment') {

                if ($customer->advance_amount < $paid_amount) {
                    return back()->withErrors([
                        'paid_amount' => 'Paid amount exceeds advance amount.'
                    ]);
                }
                $customer->advance_amount -= $paid_amount;
                $customer->save();
            }

            if ($paymentMethod == 'account_adjustment' && $account) {
                $account->updateBalance($paid_amount, 'credit');
            }

            //  Get all due sales
            $sales = $customer->sales()
                ->where('due_amount', '>', 0)
                ->orderBy('created_at')
                ->get();


            foreach ($sales as $sale) {

                if ($paid_amount <= 0)
                    break;

                $saleDue = $sale->due_amount;
                $applied = min($saleDue, $paid_amount);
                //  Record Payment
                Payment::create([
                    'sale_id' => $sale->id,
                    'customer_id' => $customer->id,
                    'amount' => $applied,
                    'shadow_amount' => 0,
                    'payment_method' => $account->type ?? $paymentMethod ?? 'cash',
                    'txn_ref' => $request->txn_ref ?? ('CDA-' . Str::random(10)),
                    'note' => $request->notes ?? 'clearing due payment',
                    'paid_at' => Carbon::now(),
                    'created_by' => Auth::id(),
                    'status' => 'completed'
                ]);

                //  Update Sale
                $sale->paid_amount += $applied;
                $sale->due_amount -= $applied;

                if ($sale->due_amount <= 0) {
                    $sale->due_amount = 0;
                    $sale->status = 'paid';
                }

                $sale->save();
                $paid_amount -= $applied;
            }
        }


        // ------------------------------------------------------------
        // SUPPLIER DUE CLEARING
        // ------------------------------------------------------------
        if ($request->type == 'supplier') {
            $supplier = Supplier::findOrFail($id);


            //  Handle Advance Adjustment
            if ($paymentMethod == 'advance_adjustment') {
                if ($supplier->advance_amount < $paid_amount) {
                    return back()->withErrors([
                        'paid_amount' => 'Paid amount exceeds advance amount.'
                    ]);
                }

                $supplier->advance_amount -= $paid_amount;
                $supplier->save();
            }




            if ($paymentMethod == 'account_adjustment' && $account) {


                if ($account->current_balance < $paid_amount) {
                    return back()->withErrors(['account_id' => 'Paid amount exceeds account balance']);
                }

                $account->updateBalance($paid_amount, 'withdraw');
            }

            //  Get all due purchases
            $purchases = $supplier->purchases()
                ->where('grand_total', '>', 'paid_amount')
                ->orderBy('created_at')
                ->get();



            foreach ($purchases as $purchase) {

                if ($paid_amount <= 0)
                    break;

                $purchaseDue = $purchase->grand_total - $purchase->paid_amount;
                $applied = min($purchaseDue, $paid_amount);

                //  Record Payment
                Payment::create([
                    'purchase_id' => $purchase->id,
                    'supplier_id' => $supplier->id,
                    'amount' => -$applied,
                    'shadow_amount' => 0,
                    'payment_method' => $paymentMethod ?? 'cash',
                    'txn_ref' => $request->txn_ref ?? ('nexoryn-' . Str::random(10)),
                    'note' => $request->notes ?? 'clearing due payment',
                    'paid_at' => Carbon::now(),
                    'created_by' => Auth::id(),
                ]);



                // Update Purchase


                $purchase->update([
                    'paid_amount' => $purchase->paid_amount + $applied,
                    'due_amount' => ($purchase->grand_total - ($purchase->paid_amount + $applied)),
                ]);

                // $purchase->paid_amount += $applied;
                // $purchase->due_amount -= $applied;


                if ($purchase->due_amount <= 0) {

                    $purchase->update([
                        'status' => 'completed',
                        'due_amount' => 0,
                    ]);
                }
                // $purchase->save();
                // $paid_amount -= $applied;
            }
        }

        return back()->with('success', 'Payment recorded successfully.');
    }


    //advancePaymentStore method
    public function advancePaymentStore($id, Request $request)
    {

        $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'account_id' => 'required|exists:accounts,id',
            'notes' => 'nullable|string',
        ]);


        $paid_amount = $request->input('amount');
        $account = Account::where('id', $request->input('account_id'))->first();

        if ($request->type == 'supplier') {
            $supplier = Supplier::findOrFail($id);

            if ($account->current_balance < $paid_amount) {
                return back()->withErrors(['account_id' => 'Paid amount exceeds account balance']);
            }

            $supplier->advance_amount += $paid_amount;
            $supplier->save();
            $account->updateBalance($paid_amount, 'withdraw');
        } else {
            $customer = Customer::findOrFail($id);
            $customer->advance_amount += $paid_amount;
            $customer->save();
            $account->updateBalance($paid_amount, 'deposit');
        }



        // Record Payment
        Payment::create([
            'supplier_id'    => $supplier->id ?? null,
            'customer_id'    => $customer->id ?? null,
            'amount'         => $paid_amount,
            'shadow_amount'  => 0,
            'payment_method' => $account->type ?? 'cash',
            'txn_ref'        => $request->input('transaction_id') ?? ('ADB-' . Str::random(10)),
            'note'           => $request->input('notes') ?? 'advance payment',
            'paid_at'        => Carbon::now(),
            'status'         => 'completed',
            'created_by'     => Auth::id(),
        ]);

        return back()->with('success', 'Advance payment recorded successfully.');
    }


    public function clearDueStore1($id, Request $request)
    {
        $request->validate([
            'paid_amount' => 'required|numeric|min:0.01',
            'payment_type' => 'required|string',
        ]);

        $paid_amount = $request->input('paid_amount');
        $paymentMethod = $request->input('payment_type');

        if ($request->type == 'customer') {
            $customer = Customer::findOrFail($id);

            if ($request->payment_type == 'advance_adjustment') {
                if ($customer->advance_amount < $paid_amount) {
                    return redirect()->back()->withErrors(['paid_amount' => 'Paid amount exceeds advance amount']);
                }
                $customer->advance_amount = ($customer->advance_amount ?? 0) - $paid_amount;
                $customer->save();
            }

            $sales = $customer->sales()->where('due_amount', '>', 0)->orderBy('created_at')->get();


            foreach ($sales as $sale) {
                if ($paid_amount <= 0) {
                    break;
                }

                if ($paid_amount > 0) {
                    $payment = new Payment();
                    $payment->sale_id = $sale->id;
                    $payment->amount = $paid_amount;
                    $payment->shadow_amount = $paid_amount;
                    $payment->payment_method = $paymentMethod ?? ($payment_type ?? 'cash');
                    $payment->txn_ref = $request->txn_ref ?? ('nexoryn-' . Str::random(10));
                    $payment->note = $request->notes ?? 'clearing due payment';
                    $payment->customer_id =  $customer->id ?? null;
                    $payment->paid_at = Carbon::now();
                    $payment->created_by = Auth::id();
                    $payment->save();
                }

                $due = $sale->due_amount;
                if ($paid_amount >= $due) {
                    // Full payment for this sale
                    $sale->paid_amount += $due;
                    $sale->due_amount = 0;
                    $sale->status = 'paid';
                    $paid_amount -= $due;
                } else {
                    // Partial payment for this sale
                    $sale->paid_amount += $paid_amount;
                    $sale->due_amount -= $paid_amount;
                    $paid_amount = 0;
                }
                $sale->save();
            }
        } elseif ($request->type === 'supplier') {


            $supplier = Supplier::findOrFail($id);

            if ($request->payment_type == 'advance_adjustment') {
                if ($supplier->advance_amount < $paid_amount) {
                    return redirect()->back()->withErrors(['paid_amount' => 'Paid amount exceeds advance amount']);
                }
                $supplier->advance_amount = ($supplier->advance_amount ?? 0) - $paid_amount;
                $supplier->save();
            }

            $purchases = $supplier->purchases()->where('due_amount', '>', 0)->orderBy('created_at')->get();

            foreach ($purchases as $purchase) {
                if ($paid_amount <= 0) {
                    break;
                }

                if ($paid_amount > 0) {
                    $payment = new Payment();
                    $payment->purchase_id = $purchase->id;
                    $payment->amount = $paid_amount;
                    $payment->shadow_amount = $paid_amount;
                    $payment->payment_method = $paymentMethod ?? ($payment_type ?? 'cash');
                    $payment->txn_ref = $request->txn_ref ?? ('nexoryn-' . Str::random(10));
                    $payment->note = $request->notes ?? 'clearing due payment';
                    $payment->customer_id =  $customer->id ?? null;
                    $payment->paid_at = Carbon::now();
                    $payment->created_by = Auth::id();
                    $payment->save();
                }

                $due = $purchase->due_amount;
                if ($paid_amount >= $due) {
                    $purchase->paid_amount += $due;
                    $purchase->due_amount = 0;
                    $purchase->status = 'completed';
                    $paid_amount -= $due;
                } else {
                    $purchase->paid_amount += $paid_amount;
                    $purchase->due_amount -= $paid_amount;
                    $paid_amount = 0;
                }
                $purchase->save();
            }
        }



        return redirect()->back()->with('success', 'Payment recorded successfully.');
    }
}
