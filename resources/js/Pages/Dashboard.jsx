import { Head, router } from "@inertiajs/react";
import {
  TrendingUp,
  DollarSign,
  Package,
  Users,
  CheckCircle2,
  FileText,
  BarChart3,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "../hooks/useTranslation";

export default function Dashboard({
  totalSales = 0,
  totalPaid = 0,
  totalDue = 0,
  totalselas = 0,
  totalexpense = 0,
  dashboardData = {},
  isShadowUser = false,
}) {
  const { t, locale } = useTranslation();
  const [loading, setLoading] = useState(false);

  const {
    range = "today",
    periodSales = 0,
    prevPeriodSales = 0,
    salesGrowth = 0,

    totalCustomers = 0,
    activeCustomers = 0,
    buyersThisPeriod = 0,
    conversionRate = 0,

    inventoryValue = 0,
    lowStockItems = 0,
    outOfStockItems = 0,

    profitMargin = 0,
    returnRate = 0,
    averageOrderValue = 0,

    orderAnalytics = {},
    donutPercentages = { completed: 0, processing: 0, returned: 0 },

    salesSeries = { labels: [], values: [] },

    topProducts = [],
    recentActivities = [],
  } = dashboardData;

  const formatCurrency = (amount) => {
    const numAmount = Number(amount || 0);
    return new Intl.NumberFormat("en-BD", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  };

  const formatShortCurrency = (amount) => {
    const num = Number(amount || 0);
    if (num >= 10000000) return `৳${(num / 10000000).toFixed(1)}Cr`;
    if (num >= 1000000) return `৳${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `৳${(num / 1000).toFixed(0)}K`;
    return `৳${formatCurrency(num)}`;
  };

  const timeRanges = [
    { id: "today", label: t("dashboard.today", "Today") },
    { id: "week", label: t("dashboard.this_week", "Week") },
    { id: "month", label: t("dashboard.this_month", "Month") },
    { id: "year", label: t("dashboard.this_year", "Year") },
  ];

  const handleTimeRangeChange = (r) => {
    setLoading(true);
    router.reload({
      only: [
        "dashboardData",
        "totalSales",
        "totalPaid",
        "totalDue",
        "totalselas",
        "totalexpense",
        "isShadowUser",
      ],
      data: { timeRange: r },
      preserveScroll: true,
      onFinish: () => setLoading(false),
    });
  };

  const refreshDashboard = () => {
    setLoading(true);
    router.reload({
      only: [
        "dashboardData",
        "totalSales",
        "totalPaid",
        "totalDue",
        "totalselas",
        "totalexpense",
        "isShadowUser",
      ],
      preserveScroll: true,
      onFinish: () => setLoading(false),
    });
  };

  // ---------- Chart helpers ----------
  const labels = salesSeries?.labels || [];
  const values = (salesSeries?.values || []).map((v) => Number(v || 0));

  const totalSeriesValue = useMemo(() => {
    return values.reduce((a, b) => a + b, 0);
  }, [values]);

  const chartPoints = useMemo(() => {
    if (!labels.length || !values.length) return [];

    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const span = max - min || 1;

    return values.map((v, i) => {
      const x = labels.length === 1 ? 0 : (i / (labels.length - 1)) * 400;
      const normalizedY = 180 - ((v - min) / span) * 160; // fit into 20..180
      const y = Math.max(20, Math.min(180, normalizedY));
      return { x, y, v, label: labels[i], i };
    });
  }, [labels, values]);

  const generateSalesPath = () => {
    if (chartPoints.length === 0) return "M0,180 L400,180";
    let path = `M${chartPoints[0].x},${chartPoints[0].y}`;
    for (let i = 1; i < chartPoints.length; i++) {
      const prev = chartPoints[i - 1];
      const cur = chartPoints[i];
      const cp1 = `${prev.x + 50},${prev.y}`;
      const cp2 = `${cur.x - 50},${cur.y}`;
      path += ` C${cp1} ${cp2} ${cur.x},${cur.y}`;
    }
    return path;
  };

  const generateAreaPath = () => `${generateSalesPath()} L400,200 L0,200 Z`;

  // Show only a handful of x-axis labels so the design doesn't break
  const getTickIndexes = (n) => {
    if (n <= 7) return Array.from({ length: n }, (_, i) => i);

    const desiredTicks = 6; // tweak 6-8 if you want
    const step = Math.ceil((n - 1) / (desiredTicks - 1));

    const idxs = [];
    for (let i = 0; i < n; i += step) idxs.push(i);
    if (idxs[idxs.length - 1] !== n - 1) idxs.push(n - 1);
    return idxs;
  };

  const tickIndexes = useMemo(() => getTickIndexes(labels.length), [labels.length]);

  const netProfitPeriod = Number(periodSales || 0) - Number(totalexpense || 0);

  const quickStats = [
    {
      title: t("dashboard.sales", "Sales"),
      value: `৳${formatCurrency(periodSales)}`,
      change: salesGrowth,
      icon: <TrendingUp className="w-5 h-5" />,
      description: t("dashboard.vs_prev", "vs previous period"),
    },
    {
      title: t("dashboard.active_customers", "Active Customers"),
      value: Number(activeCustomers || 0).toLocaleString(),
      change: conversionRate,
      icon: <Users className="w-5 h-5" />,
      description: t("dashboard.buyers_in_period", `${buyersThisPeriod} buyers`),
    },
    {
      title: t("dashboard.inventory_value", "Inventory Value"),
      value:
        Number(inventoryValue) >= 1000000
          ? `৳${(Number(inventoryValue) / 1000000).toFixed(1)}M`
          : `৳${formatCurrency(inventoryValue)}`,
      change: 0,
      icon: <Package className="w-5 h-5" />,
      description: t("dashboard.stock_items", `${lowStockItems} low, ${outOfStockItems} out`),
    },
    {
      title: t("dashboard.net_profit", "Net Profit"),
      value: `৳${formatCurrency(netProfitPeriod)}`,
      change: profitMargin,
      icon: <DollarSign className="w-5 h-5" />,
      description: t("dashboard.margin", "profit margin"),
    },
  ];

  const donut = {
    completed: Number(donutPercentages?.completed || 0),
    processing: Number(donutPercentages?.processing || 0),
    returned: Number(donutPercentages?.returned || 0),
  };

  return (
    <div className={`space-y-8 pb-8 ${locale === "bn" ? "bangla-font" : ""}`}>
      <Head title={t("dashboard.title", "Dashboard")} />

      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-800">{t("dashboard.title", "Dashboard")}</h1>
          <p className="text-xs text-slate-500">
            {t("dashboard.range", "Range")}: <strong>{range}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {timeRanges.map((r) => (
            <button
              key={r.id}
              onClick={() => handleTimeRangeChange(r.id)}
              className={`px-3 py-2 rounded-xl text-xs font-black border ${
                range === r.id
                  ? "bg-[#1e4d2b] text-white border-[#1e4d2b]"
                  : "bg-white text-slate-700 border-slate-200 hover:border-[#1e4d2b]"
              }`}
              disabled={loading}
            >
              {r.label}
            </button>
          ))}

          <button
            onClick={refreshDashboard}
            className="px-3 py-2 rounded-xl text-xs font-black bg-white border border-slate-200 hover:border-[#35a952]"
            disabled={loading}
          >
            {loading ? t("dashboard.syncing", "Syncing...") : t("dashboard.sync", "Sync")}
          </button>
        </div>
      </div>

      {/* TOP STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {quickStats.map((stat, index) => (
          <div
            key={index}
            className="p-6 text-white relative overflow-hidden"
            style={{
              background: "linear-gradient(180deg, #1e4d2b 0%, #35a952 100%)",
              borderRadius: "20px",
              boxShadow: "0 4px 20px rgba(30, 77, 43, 0.1)",
            }}
          >
            <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">{stat.title}</p>

            <div className="flex items-end justify-between mt-2">
              <h3 className="text-2xl lg:text-3xl font-black tracking-tight">{stat.value}</h3>
              <div className="p-2 rounded-xl bg-white/15">{stat.icon}</div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <span
                className={`text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold ${
                  Number(stat.change) >= 0 ? "text-white" : "text-red-100"
                }`}
              >
                {Number(stat.change) >= 0 ? "+" : ""}
                {Number(stat.change).toFixed(1)}%
              </span>
              <span className="text-[9px] opacity-70">{stat.description}</span>
            </div>
          </div>
        ))}
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Sales Performance Chart */}
        <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-slate-800 font-bold text-lg flex items-center gap-2">
              <span
                className="w-2 h-6 rounded-full"
                style={{ background: "linear-gradient(180deg, #1e4d2b 0%, #35a952 100%)" }}
              />
              {t("dashboard.sales_performance", "Sales Performance")}
            </h3>
            <button className="p-2 hover:bg-slate-50 rounded-xl text-slate-400">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* No-data state */}
          {totalSeriesValue <= 0 ? (
            <div className="h-64 w-full flex items-center justify-center rounded-2xl border border-dashed border-slate-200">
              <div className="text-center">
                <p className="text-sm font-black text-slate-700">
                  {t("dashboard.no_sales_data", "No sales data")}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {t("dashboard.try_another_range", "Try another time range")}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-64 w-full relative flex-1">
              <svg viewBox="0 0 400 200" className="w-full h-full" preserveAspectRatio="none">
                {/* Grid */}
                <line x1="0" y1="50" x2="400" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="100" x2="400" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="150" x2="400" y2="150" stroke="#f1f5f9" strokeWidth="1" />

                {/* Area + line */}
                <path d={generateAreaPath()} fill="rgba(53, 169, 82, 0.08)" />
                <path
                  d={generateSalesPath()}
                  fill="none"
                  stroke="#1e4d2b"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* points */}
                {chartPoints.map((p) => (
                  <circle
                    key={p.i}
                    cx={p.x}
                    cy={p.y}
                    r="3"
                    fill="#1e4d2b"
                    opacity="0.6"
                  />
                ))}
              </svg>

              {/* X-axis labels (filtered) */}
              <div className="flex mt-2 justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
                {tickIndexes.map((i) => (
                  <span key={i}>{labels[i]}</span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between text-xs">
            <span className="text-slate-600">
              {t("dashboard.avg_order", "Avg Order")}:{" "}
              <strong className="text-[#1e4d2b]">৳{formatCurrency(averageOrderValue)}</strong>
            </span>

            <span
              className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                salesGrowth >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              {salesGrowth >= 0 ? "+" : ""}
              {Number(salesGrowth).toFixed(1)}% {t("dashboard.growth", "Growth")}
            </span>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-slate-800 font-bold text-lg">
              {t("dashboard.order_analytics", "Order Analytics")}
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around flex-1 gap-8">
            <div className="relative w-44 h-44 lg:w-52 lg:h-52">
              <svg viewBox="0 0 36 36" className="w-full h-full rotate-[-90deg]">
                <circle cx="18" cy="18" r="16" fill="none" stroke="#f1f5f9" strokeWidth="4" />

                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="#1e4d2b"
                  strokeWidth="5"
                  strokeDasharray={`${donut.completed}, 100`}
                  strokeLinecap="round"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="#35a952"
                  strokeWidth="5"
                  strokeDasharray={`${donut.processing}, 100`}
                  strokeDashoffset={`-${donut.completed}`}
                  strokeLinecap="round"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="5"
                  strokeDasharray={`${donut.returned}, 100`}
                  strokeDashoffset={`-${donut.completed + donut.processing}`}
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-800 tracking-tighter">
                  {orderAnalytics?.totalOrders ?? 0}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  {t("dashboard.total_orders", "Total Orders")}
                </span>
              </div>
            </div>

            <div className="space-y-4 w-full sm:w-auto">
              <LegendRow
                color="#1e4d2b"
                title={t("dashboard.completed", "Completed")}
                percent={donut.completed}
                count={orderAnalytics?.completedOrders ?? 0}
              />
              <LegendRow
                color="#35a952"
                title={t("dashboard.processing", "Processing")}
                percent={donut.processing}
                count={orderAnalytics?.activeProcessingOrders ?? 0}
              />
              <LegendRow
                color="#fbbf24"
                title={t("dashboard.returned", "Returned")}
                percent={donut.returned}
                count={orderAnalytics?.returnedOrders ?? 0}
              />
            </div>
          </div>
        </div>
      </div>

      {/* LOWER STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <LowerStat
          title={t("dashboard.period_sales", "Period Sales")}
          value={`৳${formatCurrency(periodSales)}`}
          sub={`${t("dashboard.prev", "Prev")}: ৳${formatCurrency(prevPeriodSales)}`}
          icon={<BarChart3 className="w-16 h-16 opacity-10 rotate-12" />}
        />
        <LowerStat
          title={t("dashboard.invoice_due", "Invoice Due (All Time)")}
          value={`৳${formatCurrency(totalDue)}`}
          sub={`${t("dashboard.paid", "Paid")}: ৳${formatCurrency(totalPaid)}`}
          icon={<FileText className="w-16 h-16 opacity-10 rotate-12" />}
        />
        <LowerStat
          title={t("dashboard.profit_margin", "Profit Margin")}
          value={`${Number(profitMargin).toFixed(1)}%`}
          sub={`${t("dashboard.net_profit", "Net Profit")}: ৳${formatCurrency(netProfitPeriod)}`}
          icon={<DollarSign className="w-16 h-16 opacity-10 rotate-12" />}
        />
        <LowerStat
          title={t("dashboard.customers", "Customers")}
          value={Number(totalCustomers).toLocaleString()}
          sub={`${t("dashboard.active", "Active")}: ${Number(activeCustomers).toLocaleString()}`}
          icon={<Users className="w-16 h-16 opacity-10 rotate-12" />}
        />
      </div>

      {/* SYNC ALERT */}
      <div
        className="rounded-3xl p-4 lg:p-6 flex flex-col sm:flex-row items-center justify-between shadow-2xl gap-4"
        style={{
          background: "linear-gradient(180deg, #1e4d2b 0%, #35a952 100%)",
          boxShadow: "0 4px 20px rgba(30, 77, 43, 0.2)",
        }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="text-white font-bold text-sm">
              {t("dashboard.sync_success", "System Synchronization")}
            </h4>
            <p className="text-white/70 text-xs">
              {t("dashboard.detected", "Detected")} ৳{formatCurrency(periodSales)}{" "}
              {t("dashboard.from", "from")} {orderAnalytics?.totalOrders ?? 0}{" "}
              {t("dashboard.orders", "orders")}
            </p>
          </div>
        </div>

        <button
          onClick={refreshDashboard}
          className="w-full sm:w-auto bg-white text-[#1e4d2b] text-[11px] font-black px-8 py-3 rounded-2xl uppercase hover:scale-105 transition-transform shadow-lg"
          disabled={loading}
        >
          {loading ? t("dashboard.syncing", "Syncing...") : t("dashboard.sync_now", "Sync Now")}
        </button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => router.visit(route("sales.create"))}
          className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-[#1e4d2b] transition-all group"
        >
          <span className="text-xs font-black uppercase tracking-widest text-gray-700">
            {t("dashboard.new_order", "New Order")}
          </span>
          <Plus size={16} className="text-gray-300 group-hover:text-[#1e4d2b]" />
        </button>

        <button
          onClick={() => router.visit(route("warehouse.list"))}
          className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-[#35a952] transition-all group"
        >
          <span className="text-xs font-black uppercase tracking-widest text-gray-700">
            {t("dashboard.inventory", "Inventory")}
          </span>
          <Package size={16} className="text-gray-300 group-hover:text-[#35a952]" />
        </button>
      </div>
    </div>
  );
}

function LegendRow({ color, title, percent, count }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">
          {title}
        </span>
        <span className="text-sm font-black text-slate-700">{percent}%</span>
        <span className="text-[10px] text-slate-500">{count} orders</span>
      </div>
    </div>
  );
}

function LowerStat({ title, value, sub, icon }) {
  return (
    <div className="bg-[#1e4d2b] text-white p-6 rounded-3xl relative h-36 flex flex-col justify-between overflow-hidden">
      <div className="z-10">
        <h2 className="text-xl font-black">{value}</h2>
        <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-1">
          {title}
        </p>
        <p className="text-[10px] opacity-70 mt-2">{sub}</p>
      </div>
      <div className="z-10 flex justify-end items-end">
        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full">Details</span>
      </div>
      {icon}
    </div>
  );
}
