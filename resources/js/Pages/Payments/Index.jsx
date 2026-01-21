import React from "react";
import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import { Frown, Search, Eye, FileText, User, Receipt, DollarSign, Wallet, CreditCard, Landmark, Globe, Calendar } from "lucide-react";
import { Link, router, useForm, usePage } from "@inertiajs/react";
import { useTranslation } from "../../hooks/useTranslation";

export default function PaymentIndex({ payments, filters, isShadowUser }) {
    const { auth } = usePage().props;
    const { t, locale } = useTranslation();

    // Handle search and filters
    const filterForm = useForm({
        search: filters.search || "",
    });

    const handleFilter = () => {
        const queryParams = {};
        if (filterForm.data.search.trim()) {
            queryParams.search = filterForm.data.search.trim();
        }
        router.get(route("payments.index"), queryParams, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleFilter();
        }
    };

    const clearFilters = () => {
        filterForm.setData({ search: "" });
        setTimeout(() => {
            router.get(route("payments.index"), {}, {
                preserveScroll: true,
                preserveState: true,
            });
        }, 0);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BD', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-GB', {
            timeZone: "Asia/Dhaka",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getPaymentMethodBadge = (method) => {
        const colors = {
            cash: "bg-green-100 text-green-700",
            bank: "bg-purple-100 text-purple-700",
            mobile_banking: "bg-amber-100 text-amber-700",
            online: "bg-red-100 text-red-700",
        };
        const labels = {
            cash: t('payment.cash', 'Cash'),
            bank: t('payment.bank', 'Bank Transfer'),
            mobile_banking: t('payment.mobile_banking', 'Mobile Banking'),
            online: t('payment.online', 'Online Payment'),
        };
        return {
            color: colors[method] || "bg-gray-100 text-gray-700",
            label: labels[method] || method
        };
    };

    const getStatusLabel = (status) => {
        const labels = {
            completed: t('payment.completed', 'Completed'),
            pending: t('payment.pending', 'Pending'),
            failed: t('payment.failed', 'Failed'),
        };
        return labels[status] || status;
    };

    const calculateTotals = () => {
        const paymentsData = payments.data || [];
        const totalAmount = paymentsData.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
        const totalCash = paymentsData.reduce((sum, payment) =>
            payment.payment_method == 'cash' ? sum + parseFloat(payment.amount || 0) : sum, 0);
        const totalCard = paymentsData.reduce((sum, payment) =>
            payment.payment_method == 'mobile_banking' ? sum + parseFloat(payment.amount || 0) : sum, 0);
        const totalBank = paymentsData.reduce((sum, payment) =>
            payment.payment_method == 'bank' ? sum + parseFloat(payment.amount || 0) : sum, 0);

        return { totalAmount, totalCash, totalCard, totalBank, totalPayments: paymentsData.length };
    };

    const totals = calculateTotals();
    const hasActiveFilters = filterForm.data.search;

    return (
        <div className={`bg-white rounded-box p-5 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <PageHeader
                title={t('payment.title', 'Transaction Ledger')}
                subtitle={t('payment.subtitle', 'Monitor financial inbound and outbound flows')}
            >
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex bg-gray-100 rounded-xl p-1 shadow-inner border border-gray-200">
                        <input
                            type="search"
                            value={filterForm.data.search}
                            onChange={(e) => filterForm.setData("search", e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={t('payment.search_placeholder', 'Search references...')}
                            className="input input-sm border-none bg-transparent focus:ring-0 w-64 font-bold"
                        />
                        <button
                            onClick={handleFilter}
                            className="btn btn-sm bg-[#1e4d2b] text-white hover:bg-red-600 text-white border-none rounded-lg"
                        >
                            <Search size={14} />
                        </button>
                    </div>

                    {hasActiveFilters && (
                        <button onClick={clearFilters} className="btn btn-sm btn-ghost text-red-600 font-black uppercase text-[10px] tracking-widest">
                            {t('payment.clear_filters', 'Reset')}
                        </button>
                    )}
                </div>
            </PageHeader>

            {/* Industrial Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                <div className="bg-[#1e4d2b] text-white rounded-2xl p-4 shadow-xl border-b-4 border-red-600 text-white">
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">{t('payment.total_amount', 'Total Volume')}</p>
                    <p className="text-xl font-black font-mono">৳{formatCurrency(totals.totalAmount)}</p>
                </div>
                <div className="bg-white border-2 border-gray-900 rounded-2xl p-4 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cash In</p>
                    <p className="text-xl font-black text-gray-900 font-mono">৳{formatCurrency(totals.totalCash)}</p>
                </div>
                <div className="bg-white border-2 border-gray-900 rounded-2xl p-4 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Card Processed</p>
                    <p className="text-xl font-black text-gray-900 font-mono">৳{formatCurrency(totals.totalCard)}</p>
                </div>
                <div className="bg-white border-2 border-gray-900 rounded-2xl p-4 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Bank Trans.</p>
                    <p className="text-xl font-black text-gray-900 font-mono">৳{formatCurrency(totals.totalBank)}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Entries</p>
                    <p className="text-2xl font-black text-gray-900">{totals.totalPayments}</p>
                </div>
            </div>

            <div className="print:hidden">
                <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
                    {payments.data.length > 0 ? (
                        <table className="table w-full border-separate border-spacing-0">
                            <thead className="bg-[#1e4d2b] text-white text-white uppercase text-[10px] tracking-widest">
                                <tr>
                                    <th className="py-4">Reference</th>
                                    <th>Entity (Customer/Supplier)</th>
                                    <th>Amount</th>
                                    <th>Method</th>
                                    <th>Status</th>
                                    <th>Date/Time</th>
                                    <th>Account</th>
                                    <th className="text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="font-bold text-sm text-gray-700 italic-last-child">
                                {payments.data.map((payment) => {
                                    const methodBadge = getPaymentMethodBadge(payment.payment_method);
                                    return (
                                        <tr key={payment.id} className="hover:bg-gray-50 border-b border-gray-50 transition-colors">
                                            <td>
                                                <span className="font-mono text-xs font-black text-gray-900 tracking-tighter">
                                                    {payment.txn_ref || "#MANUAL"}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2 uppercase font-black text-gray-900">
                                                        <User size={12} className="text-red-600" />
                                                        {payment.customer?.customer_name || payment.supplier?.name || "Walk-in"}
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 uppercase ml-5">
                                                        {payment.customer ? "Customer" : "Supplier"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="font-mono font-black text-gray-900">
                                                    ৳{formatCurrency(payment.amount)}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge border-none font-black text-[9px] uppercase tracking-tighter py-2 px-2 rounded ${methodBadge.color}`}>
                                                    {methodBadge.label}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge border-none font-black text-[9px] uppercase py-2 px-2 rounded ${payment.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                        payment.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {getStatusLabel(payment.status)}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-black uppercase tracking-tighter">
                                                    <Calendar size={10} />
                                                    {formatDate(payment.created_at)}
                                                </div>
                                            </td>
                                            <td>
                                                {payment.account ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-gray-700">
                                                            {payment.account.name}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">Cash</span>
                                                )}
                                            </td>
                                            <td className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Link
                                                        href={route("payments.show", { payment: payment.id })}
                                                        className="btn btn-ghost btn-square btn-xs hover:bg-[#1e4d2b] text-white hover:text-white"
                                                    >
                                                        <Eye size={14} />
                                                    </Link>
                                                    {payment.sale && (
                                                        <Link
                                                            href={route("sales.show", { sale: payment.sale.id })}
                                                            className="btn btn-ghost btn-square btn-xs hover:bg-red-600 hover:text-white text-red-600"
                                                        >
                                                            <Receipt size={14} />
                                                        </Link>
                                                    )}

                                                    {payment.purchase && (
                                                        <Link
                                                            href={route("purchase.show", { id: payment.purchase.id })}
                                                            className="btn btn-ghost btn-square btn-xs hover:bg-red-600 hover:text-white text-red-600"
                                                        >
                                                            <Receipt size={14} />
                                                        </Link>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="py-20 text-center text-gray-400 flex flex-col items-center gap-3">
                            <Frown size={40} className="text-gray-200" />
                            <span className="font-black uppercase tracking-widest text-xs">No transactions found</span>
                        </div>
                    )}
                </div>
                {payments.data.length > 0 && <Pagination data={payments} />}
            </div>
        </div>
    );
}