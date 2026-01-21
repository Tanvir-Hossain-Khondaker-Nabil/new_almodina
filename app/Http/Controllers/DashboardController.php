<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\Sale;
use App\Models\Customer;
use App\Models\SaleItem;
use App\Models\Stock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $range = $request->get('timeRange', 'today'); // today|week|month|year
        $payload = $this->buildDashboardPayload($range);

        return inertia('Dashboard', $payload);
    }

    // If your frontend calls /dashboard/data/{range}
    public function data(string $range)
    {
        $payload = $this->buildDashboardPayload($range);

        return response()->json([
            'success' => true,
            'dashboardData' => $payload['dashboardData'],
            'totalSales' => $payload['totalSales'],
            'totalPaid' => $payload['totalPaid'],
            'totalDue' => $payload['totalDue'],
            'totalselas' => $payload['totalselas'],
            'totalexpense' => $payload['totalexpense'],
            'isShadowUser' => $payload['isShadowUser'],
        ]);
    }

    private function buildDashboardPayload(string $range): array
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $salesTotalCol = $isShadowUser ? 'shadow_grand_total' : 'grand_total';
        $paidCol       = $isShadowUser ? 'shadow_paid_amount' : 'paid_amount';
        $dueCol        = $isShadowUser ? 'shadow_due_amount' : 'due_amount';

        // --------- Period windows (current + previous same length) ----------
        [$from, $to, $prevFrom, $prevTo, $labelMode] = $this->resolveRange($range);

        $salesBase = Sale::query()->whereBetween('created_at', [$from, $to]);
        $salesPrev = Sale::query()->whereBetween('created_at', [$prevFrom, $prevTo]);

        // --------- Totals (ALL TIME) ----------
        $totalSales  = (float) Sale::selectRaw("COALESCE(SUM($salesTotalCol),0) as total")->value('total');
        $totalPaid   = (float) Sale::selectRaw("COALESCE(SUM($paidCol),0) as total")->value('total');
        $totalDue    = (float) Sale::selectRaw("COALESCE(SUM($dueCol),0) as total")->value('total');
        $totalOrders = (int) Sale::count();

        // --------- Period sales + growth ----------
        $periodSales = (float) $salesBase->clone()->selectRaw("COALESCE(SUM($salesTotalCol),0) as total")->value('total');
        $prevSales   = (float) $salesPrev->clone()->selectRaw("COALESCE(SUM($salesTotalCol),0) as total")->value('total');

        $salesGrowth = $prevSales > 0 ? (($periodSales - $prevSales) / $prevSales) * 100 : 0;

        // --------- Status counts (period) ----------
        $statusCounts = $salesBase->clone()
            ->select('status', DB::raw('COUNT(*) as c'))
            ->groupBy('status')
            ->pluck('c', 'status')
            ->toArray();

        $delivered   = (int)($statusCounts['delivered'] ?? 0);
        $shipped     = (int)($statusCounts['shipped'] ?? 0);
        $processing  = (int)($statusCounts['processing'] ?? 0);
        $pending     = (int)($statusCounts['pending'] ?? 0);
        $cancelled   = (int)($statusCounts['cancelled'] ?? 0);
        $returned    = (int)($statusCounts['returned'] ?? 0);

        $periodOrders = (int) $salesBase->clone()->count();
        $completedOrders = $delivered + $shipped;
        $activeProcessingOrders = $processing + $pending;
        $returnRate = $periodOrders > 0 ? ($returned / $periodOrders) * 100 : 0;

        // --------- Customers ----------
        $totalCustomers  = (int) Customer::count();
        $activeCustomers = (int) Customer::where('is_active', true)->count();

        // Real conversion: unique customers who bought in period / active customers
        // (Assumes sales table has customer_id. If not, tell me your schema.)
        $buyersThisPeriod = (int) $salesBase->clone()
            ->whereNotNull('customer_id')
            ->distinct('customer_id')
            ->count('customer_id');

        $conversionRate = $activeCustomers > 0 ? ($buyersThisPeriod / $activeCustomers) * 100 : 0;

        // --------- Inventory ----------
        $inventoryValue = (float) Stock::selectRaw('COALESCE(SUM(quantity * purchase_price),0) as value')->value('value');
        $lowStockItems  = (int) Stock::where('quantity', '<=', 10)->where('quantity', '>', 0)->count();
        $outOfStockItems = (int) Stock::where('quantity', '<=', 0)->count();

        // --------- Expenses + Profit (period) ----------
        // If you have expense dates, make this period-based. Otherwise it stays all-time.
        $totalExpenses = (float) Expense::sum('amount');

        $profitMargin = $periodSales > 0
            ? (($periodSales - $totalExpenses) / $periodSales) * 100
            : 0;

        $averageOrderValue = $periodOrders > 0 ? ($periodSales / $periodOrders) : 0;

        // --------- Sales chart series (100% backend) ----------
        // returns: ['labels'=>[], 'values'=>[]]
        $salesSeries = $this->buildSalesSeries($labelMode, $from, $to, $salesTotalCol);

        // --------- Top products (period) ----------
        // Assumes sale_items has product_id and total_price, quantity.
        // If your schema differs, tell me columns and I’ll adapt.
        $topProducts = SaleItem::query()
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->leftJoin('products', 'sale_items.product_id', '=', 'products.id')
            ->whereBetween('sales.created_at', [$from, $to])
            ->selectRaw('sale_items.product_id as product_id')
            ->selectRaw("COALESCE(products.name, CONCAT('Product #', sale_items.product_id)) as name")
            ->selectRaw('SUM(sale_items.quantity) as total_quantity')
            ->selectRaw('SUM(sale_items.total_price) as total_sales')
            ->groupBy('sale_items.product_id', 'products.name')
            ->orderByDesc('total_sales')
            ->limit(5)
            ->get()
            ->map(function ($row) use ($from, $to, $prevFrom, $prevTo) {
                // growth: compare this product sales in previous period vs current
                $current = (float) $row->total_sales;

                $prev = (float) SaleItem::query()
                    ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                    ->whereBetween('sales.created_at', [$prevFrom, $prevTo])
                    ->where('sale_items.product_id', $row->product_id)
                    ->sum('sale_items.total_price');

                $growth = $prev > 0 ? (($current - $prev) / $prev) * 100 : 0;

                return [
                    'id'       => $row->product_id,
                    'name'     => $row->name,
                    'sales'    => $current,
                    'quantity' => (int) $row->total_quantity,
                    'growth'   => round($growth, 1),
                ];
            });

        // --------- Recent activities (period) ----------
        $recentActivities = $salesBase->clone()
            ->latest()
            ->limit(5)
            ->get()
            ->map(function ($sale) use ($salesTotalCol) {
                return [
                    'id'     => $sale->id,
                    'type'   => 'sale',
                    'user'   => 'Customer',
                    'action' => 'Completed sale ' . $sale->invoice_no,
                    'time'   => Carbon::parse($sale->created_at)->diffForHumans(),
                    'amount' => (float) ($sale->{$salesTotalCol} ?? 0),
                ];
            })
            ->values()
            ->toArray();

        // --------- Donut percentages (period) ----------
        // Categories: completed, processing, returned
        $completed = $completedOrders;
        $processingAll = $activeProcessingOrders;

        $donut = $this->percentTriplet($completed, $processingAll, $returned);

        $dashboardData = [
            // period metrics
            'periodSales' => $periodSales,
            'prevPeriodSales' => $prevSales,
            'salesGrowth' => round($salesGrowth, 1),

            'totalCustomers' => $totalCustomers,
            'activeCustomers' => $activeCustomers,
            'buyersThisPeriod' => $buyersThisPeriod,
            'conversionRate' => round($conversionRate, 1),

            'inventoryValue' => $inventoryValue,
            'lowStockItems' => $lowStockItems,
            'outOfStockItems' => $outOfStockItems,

            'profitMargin' => round($profitMargin, 1),
            'returnRate' => round($returnRate, 1),
            'averageOrderValue' => round($averageOrderValue, 2),

            // period orders
            'orderAnalytics' => [
                'totalOrders' => $periodOrders,
                'deliveredOrders' => $delivered,
                'shippedOrders' => $shipped,
                'completedOrders' => $completedOrders,
                'processingOrders' => $processing,
                'pendingOrders' => $pending,
                'activeProcessingOrders' => $activeProcessingOrders,
                'cancelledOrders' => $cancelled,
                'returnedOrders' => $returned,
                'returnRate' => round($returnRate, 1),
            ],

            'donutPercentages' => $donut,

            // chart + lists
            'salesSeries' => $salesSeries,
            'topProducts' => $topProducts,
            'recentActivities' => $recentActivities,

            // metadata
            'range' => $range,
            'rangeFrom' => $from->toDateTimeString(),
            'rangeTo' => $to->toDateTimeString(),
            'prevRangeFrom' => $prevFrom->toDateTimeString(),
            'prevRangeTo' => $prevTo->toDateTimeString(),
            'labelMode' => $labelMode,
        ];

        return [
            'dashboardData' => $dashboardData,
            'totalSales' => $totalSales,
            'totalPaid' => $totalPaid,
            'totalDue' => $totalDue,
            'totalselas' => $totalOrders,
            'totalexpense' => $totalExpenses,
            'isShadowUser' => $isShadowUser,
        ];
    }

    private function resolveRange(string $range): array
    {
        $now = Carbon::now();

        if ($range === 'today') {
            $from = $now->copy()->startOfDay();
            $to   = $now->copy()->endOfDay();

            $prevFrom = $from->copy()->subDay();
            $prevTo   = $to->copy()->subDay();

            $labelMode = 'hour';
            return [$from, $to, $prevFrom, $prevTo, $labelMode];
        }

        if ($range === 'week') {
            $from = $now->copy()->startOfWeek();
            $to   = $now->copy()->endOfWeek();

            $prevFrom = $from->copy()->subWeek();
            $prevTo   = $to->copy()->subWeek();

            $labelMode = 'day';
            return [$from, $to, $prevFrom, $prevTo, $labelMode];
        }

        if ($range === 'month') {
            $from = $now->copy()->startOfMonth();
            $to   = $now->copy()->endOfMonth();

            $prevFrom = $from->copy()->subMonth()->startOfMonth();
            $prevTo   = $from->copy()->subMonth()->endOfMonth();

            $labelMode = 'day';
            return [$from, $to, $prevFrom, $prevTo, $labelMode];
        }

        // year
        $from = $now->copy()->startOfYear();
        $to   = $now->copy()->endOfYear();

        $prevFrom = $from->copy()->subYear()->startOfYear();
        $prevTo   = $from->copy()->subYear()->endOfYear();

        $labelMode = 'month';
        return [$from, $to, $prevFrom, $prevTo, $labelMode];
    }

    private function buildSalesSeries(string $mode, Carbon $from, Carbon $to, string $salesTotalCol): array
    {
        if ($mode === 'hour') {
            // 24 buckets
            $rows = Sale::query()
                ->whereBetween('created_at', [$from, $to])
                ->selectRaw('HOUR(created_at) as k')
                ->selectRaw("COALESCE(SUM($salesTotalCol),0) as v")
                ->groupBy('k')
                ->orderBy('k')
                ->get();

            $map = $rows->pluck('v', 'k')->toArray();

            $labels = [];
            $values = [];
            for ($h = 0; $h < 24; $h++) {
                $labels[] = str_pad((string)$h, 2, '0', STR_PAD_LEFT) . ':00';
                $values[] = (float)($map[$h] ?? 0);
            }
            return compact('labels', 'values');
        }

        if ($mode === 'day') {
            // daily buckets
            $rows = Sale::query()
                ->whereBetween('created_at', [$from, $to])
                ->selectRaw('DATE(created_at) as k')
                ->selectRaw("COALESCE(SUM($salesTotalCol),0) as v")
                ->groupBy('k')
                ->orderBy('k')
                ->get();

            $map = $rows->pluck('v', 'k')->toArray();

            $labels = [];
            $values = [];
            $cursor = $from->copy()->startOfDay();
            while ($cursor->lte($to)) {
                $k = $cursor->toDateString();
                $labels[] = $cursor->format('d M');
                $values[] = (float)($map[$k] ?? 0);
                $cursor->addDay();
            }
            return compact('labels', 'values');
        }

        // month buckets
        $rows = Sale::query()
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw('MONTH(created_at) as k')
            ->selectRaw("COALESCE(SUM($salesTotalCol),0) as v")
            ->groupBy('k')
            ->orderBy('k')
            ->get();

        $map = $rows->pluck('v', 'k')->toArray();

        $labels = [];
        $values = [];
        for ($m = 1; $m <= 12; $m++) {
            $labels[] = Carbon::createFromDate($from->year, $m, 1)->format('M');
            $values[] = (float)($map[$m] ?? 0);
        }
        return compact('labels', 'values');
    }

    private function percentTriplet(int $a, int $b, int $c): array
    {
        $total = $a + $b + $c;
        if ($total <= 0) {
            return ['completed' => 0, 'processing' => 0, 'returned' => 0];
        }

        $pa = (int) round(($a / $total) * 100);
        $pb = (int) round(($b / $total) * 100);
        $pc = (int) round(($c / $total) * 100);

        // fix rounding to sum 100
        $sum = $pa + $pb + $pc;
        $diff = 100 - $sum;

        // adjust the largest bucket
        $arr = [
            ['k' => 'completed', 'v' => $pa],
            ['k' => 'processing', 'v' => $pb],
            ['k' => 'returned', 'v' => $pc],
        ];
        usort($arr, fn($x, $y) => $y['v'] <=> $x['v']);
        $arr[0]['v'] += $diff;

        $out = [];
        foreach ($arr as $it) $out[$it['k']] = max(0, (int)$it['v']);
        return $out;
    }
}
