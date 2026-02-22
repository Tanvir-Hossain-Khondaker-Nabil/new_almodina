// resources/js/Pages/Ledger/Index.jsx

import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip,
} from "chart.js";
import {
    ArrowDownRight,
    ArrowUpRight,
    BarChart as BarChartIcon,
    Building2,
    Calendar,
    Eye,
    FileText,
    Filter,
    RefreshCw,
    Search,
    Truck,
    User,
    UserCheck,
    Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import Pagination from "../../components/Pagination";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler,
);

export default function LedgerIndex({
    customers = [],
    suppliers = [],
    filters = {},
    stats = {},
    type = "all",
}) {
    const { auth } = usePage().props;

    const [salesChartData, setSalesChartData] = useState(null);
    const [purchasesChartData, setPurchasesChartData] = useState(null);

    // ---------------------------
    // Helpers
    // ---------------------------
    const formatCurrency = (amount) => {
        const n = Number(amount || 0);
        return new Intl.NumberFormat("en-BD", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(n);
    };

    const pad2 = (n) => String(n).padStart(2, "0");
    const toYMD = (d) =>
        `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

    // ---------------------------
    // Normalize lists
    // ---------------------------
    const customerList = useMemo(
        () => (Array.isArray(customers) ? customers : customers?.data || []),
        [customers],
    );

    const supplierList = useMemo(
        () => (Array.isArray(suppliers) ? suppliers : suppliers?.data || []),
        [suppliers],
    );

    // ---------------------------
    // Filter form
    // ---------------------------
    const filterForm = useForm({
        search: filters.search || "",
        type: filters.type || "all",
        entity_key: filters.entity_key || "",
        start_date: filters.start_date || "",
        end_date: filters.end_date || "",
        due_filter: filters.due_filter || "all", // all | due_only | clear_only
    });

    const hasActiveFilters =
        filterForm.data.search ||
        filterForm.data.type !== "all" ||
        filterForm.data.entity_key ||
        filterForm.data.start_date ||
        filterForm.data.end_date ||
        filterForm.data.due_filter !== "all";

    const handleFilter = () => {
        const queryParams = {};

        if (filterForm.data.search?.trim())
            queryParams.search = filterForm.data.search.trim();
        if (filterForm.data.type && filterForm.data.type !== "all")
            queryParams.type = filterForm.data.type;

        if (filterForm.data.entity_key)
            queryParams.entity_key = filterForm.data.entity_key;
        if (filterForm.data.start_date)
            queryParams.start_date = filterForm.data.start_date;
        if (filterForm.data.end_date)
            queryParams.end_date = filterForm.data.end_date;

        if (
            filterForm.data.due_filter &&
            filterForm.data.due_filter !== "all"
        ) {
            queryParams.due_filter = filterForm.data.due_filter;
        }

        router.get(route("ledgers.index"), queryParams, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        filterForm.setData({
            search: "",
            type: "all",
            entity_key: "",
            start_date: "",
            end_date: "",
            due_filter: "all",
        });

        setTimeout(() => {
            router.get(
                route("ledgers.index"),
                {},
                { preserveScroll: true, preserveState: true },
            );
        }, 0);
    };

    const setPreset = (preset) => {
        const now = new Date();
        const start = new Date(now);
        const end = new Date(now);

        if (preset === "today") {
            // same day
        } else if (preset === "this_month") {
            start.setDate(1);
        } else if (preset === "last_30") {
            start.setDate(start.getDate() - 30);
        }

        filterForm.setData("start_date", toYMD(start));
        filterForm.setData("end_date", toYMD(end));
    };

    // ---------------------------
    // Entity dropdown options
    // ---------------------------
    const entityOptions = useMemo(() => {
        const c = customerList.map((x) => ({
            key: `customer:${x.id}`,
            label: `${x.customer_name || "Customer"} (${x.phone || "—"})`,
            kind: "customer",
        }));

        const s = supplierList.map((x) => ({
            key: `supplier:${x.id}`,
            label: `${x.name || "Supplier"} (${x.phone || "—"})`,
            kind: "supplier",
        }));

        return [
            ...(c.length ? [{ header: "Customers" }, ...c] : []),
            ...(s.length ? [{ header: "Suppliers" }, ...s] : []),
        ];
    }, [customerList, supplierList]);

    // ---------------------------
    // Entity type config
    // ---------------------------
    const getEntityTypeConfig = (entity) => {
        const isCustomer = "customer_name" in entity;
        const entityType = isCustomer ? "customer" : "supplier";

        const configs = {
            customer: {
                label: "Customer",
                icon: Users,
                badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
                dot: "bg-emerald-500",
            },
            supplier: {
                label: "Supplier",
                icon: Building2,
                badge: "bg-orange-50 text-orange-700 border-orange-200",
                dot: "bg-orange-500",
            },
        };

        return (
            configs[entityType] || {
                label: "Unknown",
                icon: Users,
                badge: "bg-gray-50 text-gray-700 border-gray-200",
                dot: "bg-gray-500",
            }
        );
    };

    // ---------------------------
    // Build all entities based on current type
    // ---------------------------
    const allEntities = useMemo(() => {
        if (type === "customer") return customerList;
        if (type === "supplier") return supplierList;
        return [...customerList, ...supplierList];
    }, [customerList, supplierList, type]);

    const totalEntities = useMemo(() => {
        if (type === "customer") return customerList.length;
        if (type === "supplier") return supplierList.length;
        return customerList.length + supplierList.length;
    }, [customerList, supplierList, type]);

    // ---------------------------
    // Charts (top 10)
    // ---------------------------
    useEffect(() => {
        if (type !== "supplier" && customerList.length) {
            const salesData = customerList.slice(0, 10).map((customer) => ({
                label: customer.customer_name || "Customer",
                value:
                    customer.sales?.reduce(
                        (sum, sale) => sum + parseFloat(sale.grand_total || 0),
                        0,
                    ) || 0,
            }));

            setSalesChartData({
                labels: salesData.map((i) => i.label),
                datasets: [
                    {
                        label: "Sales Amount",
                        data: salesData.map((i) => i.value),
                        backgroundColor: "rgba(16, 185, 129, 0.15)",
                        borderColor: "rgb(16, 185, 129)",
                        borderWidth: 2,
                        borderRadius: 4,
                    },
                ],
            });
        } else {
            setSalesChartData(null);
        }

        if (type !== "customer" && supplierList.length) {
            const purchasesData = supplierList.slice(0, 10).map((supplier) => ({
                label: supplier.name || "Supplier",
                value:
                    supplier.purchases?.reduce(
                        (sum, purchase) =>
                            sum + parseFloat(purchase.grand_total || 0),
                        0,
                    ) || 0,
            }));

            setPurchasesChartData({
                labels: purchasesData.map((i) => i.label),
                datasets: [
                    {
                        label: "Purchases Amount",
                        data: purchasesData.map((i) => i.value),
                        backgroundColor: "rgba(249, 115, 22, 0.15)",
                        borderColor: "rgb(249, 115, 22)",
                        borderWidth: 2,
                        borderRadius: 4,
                    },
                ],
            });
        } else {
            setPurchasesChartData(null);
        }
    }, [customerList, supplierList, type]);

    const StatPill = ({ label, value, icon: Icon }) => (
        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg">
            <div className="h-8 w-8 rounded-md bg-gray-100 flex items-center justify-center">
                <Icon className="h-4 w-4 text-gray-700" />
            </div>
            <div className="leading-tight">
                <div className="text-[11px] uppercase tracking-wider text-gray-500">
                    {label}
                </div>
                <div className="text-sm font-bold text-gray-900">{value}</div>
            </div>
        </div>
    );

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function (value) {
                        return "৳" + formatCurrency(value);
                    },
                },
                grid: { color: "rgba(0,0,0,0.06)" },
            },
            x: {
                grid: { display: false },
            },
        },
    };

    return (
        <div className="min-h-screen bg-[#f7f4ee]">
            <Head title="Ledger" />

            <div className="max-w-full px-3 py-3">
                {/* Header */}
                <div className="mb-5">
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-black tracking-tight text-gray-900">
                                        Ledger Book
                                    </h1>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Customers & Suppliers summary (ruled
                                        ledger view)
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <StatPill
                                        label={
                                            type === "supplier"
                                                ? "Suppliers"
                                                : type === "customer"
                                                  ? "Customers"
                                                  : "Entities"
                                        }
                                        value={
                                            type === "customer"
                                                ? stats.total_customers
                                                : type === "supplier"
                                                  ? stats.total_suppliers
                                                  : totalEntities
                                        }
                                        icon={UserCheck}
                                    />
                                    <StatPill
                                        label="Total Sales"
                                        value={`৳${formatCurrency(stats.total_sales_amount)}`}
                                        icon={ArrowDownRight}
                                    />
                                    <StatPill
                                        label="Total Purchases"
                                        value={`৳${formatCurrency(stats.total_purchases_amount)}`}
                                        icon={ArrowUpRight}
                                    />
                                    <StatPill
                                        label="Transactions"
                                        value={stats.total_transactions || 0}
                                        icon={FileText}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="px-6 py-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-gray-700" />
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                                        Advanced Filter
                                    </h3>
                                </div>

                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="text-xs font-semibold text-gray-700 hover:text-gray-900 inline-flex items-center gap-2"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                        Reset
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                {/* Search */}
                                <div className="md:col-span-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="search"
                                            value={filterForm.data.search}
                                            onChange={(e) =>
                                                filterForm.setData(
                                                    "search",
                                                    e.target.value,
                                                )
                                            }
                                            onKeyDown={(e) =>
                                                e.key === "Enter" &&
                                                handleFilter()
                                            }
                                            placeholder="Search name / phone / invoice / purchase no..."
                                            className="w-full h-11 pl-10 pr-3 bg-[#fbfaf7] border border-gray-300 rounded-lg
                                 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-gray-800"
                                        />
                                    </div>
                                </div>

                                {/* Type */}
                                <div className="md:col-span-3">
                                    <select
                                        value={filterForm.data.type}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            filterForm.setData("type", v);
                                            filterForm.setData(
                                                "entity_key",
                                                "",
                                            );
                                        }}
                                        className="w-full h-11 px-3 bg-[#fbfaf7] border border-gray-300 rounded-lg
                               focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-gray-800"
                                    >
                                        <option value="all">
                                            All (Customers & Suppliers)
                                        </option>
                                        <option value="customer">
                                            Customers Only
                                        </option>
                                        <option value="supplier">
                                            Suppliers Only
                                        </option>
                                    </select>
                                </div>

                                {/* Entity */}
                                <div className="md:col-span-5">
                                    <select
                                        value={filterForm.data.entity_key}
                                        onChange={(e) =>
                                            filterForm.setData(
                                                "entity_key",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full h-11 px-3 bg-[#fbfaf7] border border-gray-300 rounded-lg
                               focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-gray-800"
                                    >
                                        <option value="">
                                            {filterForm.data.type === "customer"
                                                ? "Select Customer (optional)"
                                                : filterForm.data.type ===
                                                    "supplier"
                                                  ? "Select Supplier (optional)"
                                                  : "Select Customer/Supplier (optional)"}
                                        </option>

                                        {entityOptions.map((opt, idx) => {
                                            if (opt.header) {
                                                return (
                                                    <option
                                                        key={`h-${idx}`}
                                                        value=""
                                                        disabled
                                                    >
                                                        ── {opt.header} ──
                                                    </option>
                                                );
                                            }

                                            if (
                                                filterForm.data.type ===
                                                    "customer" &&
                                                !opt.key.startsWith("customer:")
                                            )
                                                return null;
                                            if (
                                                filterForm.data.type ===
                                                    "supplier" &&
                                                !opt.key.startsWith("supplier:")
                                            )
                                                return null;

                                            return (
                                                <option
                                                    key={opt.key}
                                                    value={opt.key}
                                                >
                                                    {opt.label}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>

                                {/* Start date */}
                                <div className="md:col-span-3">
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="date"
                                            value={filterForm.data.start_date}
                                            onChange={(e) =>
                                                filterForm.setData(
                                                    "start_date",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full h-11 pl-10 pr-3 bg-[#fbfaf7] border border-gray-300 rounded-lg
                                 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-gray-800"
                                        />
                                    </div>
                                </div>

                                {/* End date */}
                                <div className="md:col-span-3">
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="date"
                                            value={filterForm.data.end_date}
                                            onChange={(e) =>
                                                filterForm.setData(
                                                    "end_date",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full h-11 pl-10 pr-3 bg-[#fbfaf7] border border-gray-300 rounded-lg
                                 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-gray-800"
                                        />
                                    </div>
                                </div>

                                {/* Due filter */}
                                <div className="md:col-span-3">
                                    <select
                                        value={filterForm.data.due_filter}
                                        onChange={(e) =>
                                            filterForm.setData(
                                                "due_filter",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full h-11 px-3 bg-[#fbfaf7] border border-gray-300 rounded-lg
                               focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-gray-800"
                                    >
                                        <option value="all">
                                            All (Due + Clear)
                                        </option>
                                        <option value="due_only">
                                            Only Due
                                        </option>
                                        <option value="clear_only">
                                            Only Clear
                                        </option>
                                    </select>
                                </div>

                                {/* Presets */}
                                <div className="md:col-span-6 flex flex-wrap gap-2 items-center">
                                    <button
                                        type="button"
                                        onClick={() => setPreset("today")}
                                        className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs font-bold hover:bg-gray-50"
                                    >
                                        Today
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPreset("this_month")}
                                        className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs font-bold hover:bg-gray-50"
                                    >
                                        This Month
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPreset("last_30")}
                                        className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs font-bold hover:bg-gray-50"
                                    >
                                        Last 30 Days
                                    </button>
                                </div>

                                {/* Apply */}
                                <div className="md:col-span-3">
                                    <button
                                        onClick={handleFilter}
                                        className="w-full h-11 rounded-lg bg-gray-900 text-white font-semibold
                               hover:bg-gray-800 focus:ring-2 focus:ring-gray-900/20"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* TABLE */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-[#fbfaf7]">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-wider text-gray-900">
                                    Ledger Entries
                                </h2>
                                <p className="text-xs text-gray-600 mt-1">
                                    Totals computed from sales/purchases & paid
                                    amounts
                                </p>
                            </div>
                        </div>
                    </div>

                    {allEntities.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="bg-white">
                                            {[
                                                "Entity",
                                                "Type",
                                                "Contact",
                                                "Trans",
                                                "Total",
                                                "Paid",
                                                "Advance",
                                                "Due",
                                                "Actions",
                                            ].map((h) => (
                                                <th
                                                    key={h}
                                                    className="px-5 py-3 text-left text-[11px] font-black uppercase tracking-wider text-gray-700 border-b border-gray-200"
                                                >
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {allEntities.map((entity, idx) => {
                                            const isCustomer =
                                                "customer_name" in entity;
                                            const entityConfig =
                                                getEntityTypeConfig(entity);
                                            const transactions = isCustomer
                                                ? entity.sales
                                                : entity.purchases;

                                            const totalAmount =
                                                transactions?.reduce(
                                                    (sum, t) =>
                                                        sum +
                                                        (parseFloat(
                                                            t?.grand_total,
                                                        ) || 0),
                                                    0,
                                                ) || 0;

                                            const totalPaidAmount =
                                                transactions?.reduce(
                                                    (sum, t) =>
                                                        sum +
                                                        (parseFloat(
                                                            t?.paid_amount,
                                                        ) || 0),
                                                    0,
                                                ) || 0;

                                            // more accurate due: sum of due_amount (if your filter loads due_amount)
                                            const calculatedDue =
                                                transactions?.reduce(
                                                    (sum, t) =>
                                                        sum +
                                                        (parseFloat(
                                                            t?.due_amount,
                                                        ) || 0),
                                                    0,
                                                ) ??
                                                totalAmount - totalPaidAmount;

                                            const totalDueAmount = Math.max(
                                                0,
                                                calculatedDue,
                                            );

                                            const transactionCount =
                                                transactions?.length || 0;
                                            const advanceAmount =
                                                entity?.advance_amount || 0;

                                            const EntityIcon =
                                                entityConfig.icon;

                                            return (
                                                <tr
                                                    key={`${isCustomer ? "c" : "s"}-${entity.id}`}
                                                    className={`border-b border-gray-100 ${
                                                        idx % 2 === 0
                                                            ? "bg-white"
                                                            : "bg-[#fcfbf8]"
                                                    } hover:bg-[#f6f3ea] transition-colors`}
                                                >
                                                    {/* Entity */}
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="h-8 w-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                                                                <User className="h-4 w-4 text-gray-700" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="text-sm font-bold text-gray-900 truncate max-w-[180px]">
                                                                    {isCustomer
                                                                        ? entity.customer_name
                                                                        : entity.name}
                                                                </div>
                                                                <div className="text-[11px] text-gray-500">
                                                                    ID:{" "}
                                                                    {entity.id}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Type */}
                                                    <td className="px-5 py-3">
                                                        <span
                                                            className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md border text-[11px] font-bold ${entityConfig.badge}`}
                                                        >
                                                            <span
                                                                className={`h-2 w-2 rounded-full ${entityConfig.dot}`}
                                                            />
                                                            <EntityIcon className="h-3.5 w-3.5" />
                                                            {entityConfig.label}
                                                        </span>
                                                    </td>

                                                    {/* Contact */}
                                                    <td className="px-5 py-3">
                                                        <div className="text-sm text-gray-900 font-semibold">
                                                            {entity.phone ? (
                                                                entity.phone
                                                            ) : (
                                                                <span className="text-gray-400">
                                                                    —
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Trans */}
                                                    <td className="px-5 py-3">
                                                        <div className="text-sm font-black text-gray-900">
                                                            {transactionCount}
                                                        </div>
                                                    </td>

                                                    {/* Total */}
                                                    <td className="px-5 py-3">
                                                        <div className="text-sm font-black text-gray-900">
                                                            ৳
                                                            {formatCurrency(
                                                                totalAmount,
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Paid */}
                                                    <td className="px-5 py-3">
                                                        <div className="text-sm font-black text-gray-900">
                                                            ৳
                                                            {formatCurrency(
                                                                totalPaidAmount,
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Advance */}
                                                    <td className="px-5 py-3">
                                                        <div
                                                            className={`text-sm font-black ${
                                                                (advanceAmount ||
                                                                    0) >= 0
                                                                    ? "text-emerald-700"
                                                                    : "text-rose-700"
                                                            }`}
                                                        >
                                                            ৳
                                                            {formatCurrency(
                                                                advanceAmount,
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Due */}
                                                    <td className="px-5 py-3">
                                                        <div className="text-sm font-black text-gray-900">
                                                            ৳
                                                            {formatCurrency(
                                                                totalAmount - totalPaidAmount,
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <Link
                                                                href={route(
                                                                    isCustomer
                                                                        ? "ledgers.customer"
                                                                        : "ledgers.supplier",
                                                                    {
                                                                        id: entity.id,
                                                                        ...(filterForm
                                                                            .data
                                                                            .start_date && {
                                                                            start_date:
                                                                                filterForm
                                                                                    .data
                                                                                    .start_date,
                                                                        }),
                                                                        ...(filterForm
                                                                            .data
                                                                            .end_date && {
                                                                            end_date:
                                                                                filterForm
                                                                                    .data
                                                                                    .end_date,
                                                                        }),
                                                                        ...(filterForm
                                                                            .data
                                                                            .search && {
                                                                            search: filterForm
                                                                                .data
                                                                                .search,
                                                                        }),
                                                                    },
                                                                )}
                                                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-gray-200 bg-white
                                           text-gray-800 hover:bg-gray-50 text-xs font-bold"
                                                                title="View Ledger"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                                Ledger
                                                            </Link>

                                                            {isCustomer ? (
                                                                <Link
                                                                    href={`/customer/show/${entity.id}`}
                                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-gray-200 bg-white
                                             text-gray-800 hover:bg-gray-50 text-xs font-bold"
                                                                    title="Customer Profile"
                                                                >
                                                                    <User className="h-4 w-4" />
                                                                    Profile
                                                                </Link>
                                                            ) : (
                                                                <Link
                                                                    href={`/supplier/show/${entity.id}`}
                                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-gray-200 bg-white
                                             text-gray-800 hover:bg-gray-50 text-xs font-bold"
                                                                    title="Supplier Profile"
                                                                >
                                                                    <Truck className="h-4 w-4" />
                                                                    Profile
                                                                </Link>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination (kept like your previous style) */}
                            <div className="px-6 py-4 border-t border-gray-200 bg-[#fbfaf7]">
                                {type === "all" ? (
                                    <div className="space-y-4">
                                        {customers &&
                                            (Array.isArray(customers)
                                                ? customers.length
                                                : customers?.data?.length) >
                                                0 && (
                                                <div>
                                                    <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 mb-2">
                                                        Customers
                                                    </h4>
                                                    <Pagination
                                                        data={customers}
                                                    />
                                                </div>
                                            )}

                                        {suppliers &&
                                            (Array.isArray(suppliers)
                                                ? suppliers.length
                                                : suppliers?.data?.length) >
                                                0 && (
                                                <div>
                                                    <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 mb-2">
                                                        Suppliers
                                                    </h4>
                                                    <Pagination
                                                        data={suppliers}
                                                    />
                                                </div>
                                            )}
                                    </div>
                                ) : type === "customer" ? (
                                    customers && <Pagination data={customers} />
                                ) : (
                                    suppliers && <Pagination data={suppliers} />
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="p-12 text-center">
                            <div className="mx-auto h-20 w-20 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center mb-5">
                                <Users className="h-10 w-10 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-black text-gray-900">
                                No entities found
                            </h3>
                            <p className="text-sm text-gray-600 mt-2">
                                {hasActiveFilters
                                    ? "Try adjusting your filters."
                                    : "No customers or suppliers available."}
                            </p>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="mt-6 px-5 py-2.5 rounded-lg bg-gray-900 text-white font-bold hover:bg-gray-800"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* GRAPHS DOWN */}
                {(salesChartData || purchasesChartData) && (
                    <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {type !== "supplier" && salesChartData && (
                            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200 bg-[#fbfaf7]">
                                    <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 flex items-center gap-2">
                                        <BarChartIcon className="h-4 w-4" />
                                        Top Customers by Sales
                                    </h3>
                                    <p className="text-xs text-gray-600 mt-1">
                                        (Top 10 customers)
                                    </p>
                                </div>
                                <div className="h-80 p-4">
                                    <Bar
                                        data={salesChartData}
                                        options={chartOptions}
                                    />
                                </div>
                            </div>
                        )}

                        {type !== "customer" && purchasesChartData && (
                            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200 bg-[#fbfaf7]">
                                    <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 flex items-center gap-2">
                                        <BarChartIcon className="h-4 w-4" />
                                        Top Suppliers by Purchases
                                    </h3>
                                    <p className="text-xs text-gray-600 mt-1">
                                        (Top 10 suppliers)
                                    </p>
                                </div>
                                <div className="h-80 p-4">
                                    <Bar
                                        data={purchasesChartData}
                                        options={chartOptions}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
