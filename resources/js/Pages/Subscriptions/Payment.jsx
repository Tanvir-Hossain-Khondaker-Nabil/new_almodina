import { Link, router, useForm } from "@inertiajs/react";
import { 
    Plus, 
    Trash2, 
    X, 
    Frown,
    Search,
    Filter,
    Edit,
    Eye,
    User,
    CreditCard,
    Calendar,
    DollarSign,
    Clock,
    BadgeCheck,
    Ban,
    Download,
    FileText
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "../../hooks/useTranslation";

export default function Payments({ subscription }) {
    const { t, locale } = useTranslation();
    // Search and filter states
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("");
    const [initialized, setInitialized] = useState(false);

    // Handle search and filter changes
    useEffect(() => {
        if (!initialized) {
            setInitialized(true);
            return;
        }

        const timer = setTimeout(() => {
            router.get(route("subscriptions.payments"), {
                search: search || null,
                status: status || null,
                payment_method: paymentMethod || null,
            }, {
                preserveState: true,
                replace: true
            });
        }, 500);

        return () => clearTimeout(timer);
    }, [search, status, paymentMethod]);

    // Clear all filters
    const clearFilters = () => {
        setSearch("");
        setStatus("");
        setPaymentMethod("");
        router.get(route("subscriptions.payments"));
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Format date with time
    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get status badge color
    const getStatusBadge = (status) => {
        const statusMap = {
            completed: { label: t('payments.completed', 'Completed'), class: 'badge-success', icon: BadgeCheck },
            pending: { label: t('payments.pending', 'Pending'), class: 'badge-warning', icon: Clock },
            failed: { label: t('payments.failed', 'Failed'), class: 'badge-error', icon: Ban },
            refunded: { label: t('payments.refunded', 'Refunded'), class: 'badge-info', icon: DollarSign },
        };
        
        const statusInfo = statusMap[status] || { label: status, class: 'badge-warning', icon: Clock };
        const StatusIcon = statusInfo.icon;
        
        return {
            ...statusInfo,
            icon: <StatusIcon size={12} />
        };
    };

    // Get payment method details
    const getPaymentMethodDetails = (method) => {
        const methodMap = {
            cash: { label: t('payments.cash', 'Cash'), class: 'text-green-600 bg-green-50 border-green-200' },
            card: { label: t('payments.card', 'Credit Card'), class: 'text-blue-600 bg-blue-50 border-blue-200' },
            bank: { label: t('payments.bank', 'Bank Transfer'), class: 'text-purple-600 bg-purple-50 border-purple-200' },
            mobile: { label: t('payments.mobile', 'Mobile Banking'), class: 'text-orange-600 bg-orange-50 border-orange-200' },
            online: { label: t('payments.online', 'Online Payment'), class: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
        };
        
        return methodMap[method] || { label: method, class: 'text-gray-600 bg-gray-50 border-gray-200' };
    };

    // Export payments data
    const handleExport = () => {
        // This would typically generate a CSV or PDF report
        alert(t('payments.export_functionality', 'Export functionality would be implemented here'));
    };

    return (
        <div className={`bg-white rounded-box p-5 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        {t('payments.subscription_payments', 'Subscription Payments')}
                    </h1>
                    <p className="text-gray-600 mt-1">
                        {t('payments.manage_track_payments', 'Manage and track subscription payment records')}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExport}
                        className="btn btn-outline btn-sm"
                    >
                        <Download size={15} /> {t('payments.export', 'Export')}
                    </button>
                    <Link
                        href={route("subscriptions.index")}
                        className="btn bg-[#1e4d2b] text-white btn-sm"
                    >
                        <CreditCard size={15} /> {t('payments.view_subscriptions', 'View Subscriptions')}
                    </Link>
                </div>
            </div>

            {/* Search and Filter Section */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                <div className="flex flex-col lg:flex-row gap-4 items-end">
                    {/* Search Input */}
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('payments.search_payments', 'Search Payments')}
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t('payments.search_placeholder', 'Search by transaction ID, user name, plan name...')}
                                className="input input-bordered w-full pl-10"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="w-full lg:w-48">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('payments.payment_status', 'Payment Status')}
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="select select-bordered w-full"
                        >
                            <option value="">{t('payments.all_status', 'All Status')}</option>
                            <option value="completed">{t('payments.completed', 'Completed')}</option>
                            <option value="pending">{t('payments.pending', 'Pending')}</option>
                            <option value="failed">{t('payments.failed', 'Failed')}</option>
                            <option value="refunded">{t('payments.refunded', 'Refunded')}</option>
                        </select>
                    </div>

                    {/* Payment Method Filter */}
                    <div className="w-full lg:w-48">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('payments.payment_method', 'Payment Method')}
                        </label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="select select-bordered w-full"
                        >
                            <option value="">{t('payments.all_methods', 'All Methods')}</option>
                            <option value="cash">{t('payments.cash', 'Cash')}</option>
                            <option value="card">{t('payments.card', 'Credit Card')}</option>
                            <option value="bank">{t('payments.bank', 'Bank Transfer')}</option>
                            <option value="mobile">{t('payments.mobile', 'Mobile Banking')}</option>
                            <option value="online">{t('payments.online', 'Online Payment')}</option>
                        </select>
                    </div>

                    {/* Clear Filters Button */}
                    {(search || status || paymentMethod) && (
                        <button
                            onClick={clearFilters}
                            className="btn btn-error btn-sm"
                        >
                            <X size={15} /> {t('payments.clear', 'Clear')}
                        </button>
                    )}
                </div>
            </div>

            {/* Payments Table */}
            <div className="overflow-x-auto">
                {subscription.data.length > 0 ? (
                    <table className="table table-auto w-full">
                        <thead className="bg-[#1e4d2b] text-white text-white">
                            <tr>
                                <th className="text-center">{t('payments.sl', 'SL')}</th>
                                <th>{t('payments.transaction_details', 'Transaction Details')}</th>
                                <th>{t('payments.subscription_info', 'Subscription Info')}</th>
                                <th>{t('payments.user', 'User')}</th>
                                <th>{t('payments.payment_method', 'Payment Method')}</th>
                                <th>{t('payments.amount', 'Amount')}</th>
                                <th>{t('payments.payment_date', 'Payment Date')}</th>
                                <th>{t('payments.status', 'Status')}</th>
                                <th className="text-center">{t('payments.actions', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subscription.data.map((payment, index) => (
                                <tr key={payment.id} className="hover:bg-gray-50">
                                    <td className="text-center">
                                        {subscription.from + index}
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <CreditCard size={14} className="text-blue-600" />
                                                <span className="font-mono text-sm font-semibold">
                                                    #{payment.transaction_id || `PAY-${payment.id}`}
                                                </span>
                                            </div>
                                            {payment.payment_date && (
                                                <div className="text-xs text-gray-500">
                                                    {t('payments.paid_on', 'Paid on')} {formatDate(payment.payment_date)}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        {payment.subscription ? (
                                            <div className="flex flex-col gap-1">
                                                <Link
                                                    href={route("subscriptions.show", payment.subscription.id)}
                                                    className="font-semibold text-blue-600 hover:underline text-sm"
                                                >
                                                    {payment.subscription.plan?.name || 'N/A'}
                                                </Link>
                                                <div className="text-xs text-gray-500">
                                                    {t('payments.subscription_id', 'Sub ID')}: #{payment.subscription.id}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-sm">{t('payments.no_subscription', 'No subscription')}</span>
                                        )}
                                    </td>
                                    <td>
                                        {payment.subscription?.user ? (
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-green-600" />
                                                <div>
                                                    <p className="font-semibold text-sm text-gray-800">
                                                        {payment.subscription.user.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {payment.subscription.user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-sm">{t('payments.no_user', 'No user')}</span>
                                        )}
                                    </td>
                                    <td>
                                        {payment.payment_method && (
                                            <span className={`badge badge-outline capitalize ${getPaymentMethodDetails(payment.payment_method).class}`}>
                                                {getPaymentMethodDetails(payment.payment_method).label}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-1">
                                            <span className="font-bold text-green-700">
                                                {formatCurrency(payment.amount)}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-1 text-sm">
                                            <Calendar size={12} className="text-purple-600" />
                                            <span>
                                                {payment.payment_date ? formatDateTime(payment.payment_date) : 'N/A'}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${getStatusBadge(payment.status).class} badge-sm flex items-center gap-1`}>
                                            {getStatusBadge(payment.status).icon}
                                            {getStatusBadge(payment.status).label}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2 justify-center">
                                            <Link
                                                href={`/subscriptions_payments/view/${payment.id}`}
                                                className="btn bg-[#1e4d2b] text-white btn-xs"
                                            >
                                                <Eye size={12} /> {t('payments.view', 'View')}
                                            </Link>
                                            
                                            <button
                                                onClick={() => {
                                                    if (confirm(t('payments.delete_confirmation', 'Are you sure you want to delete this payment record?'))) {
                                                        router.delete(route("subscriptions.payments.destroy", payment.id));
                                                    }
                                                }}
                                                className="btn btn-error btn-xs"
                                            >
                                                <Trash2 size={12} /> {t('payments.delete', 'Delete')}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="border border-gray-200 rounded-box px-5 py-10 flex flex-col justify-center items-center gap-2">
                        <Frown size={40} className="text-gray-400" />
                        <h1 className="text-gray-500 text-lg font-medium">
                            {t('payments.no_payment_records', 'No payment records found!')}
                        </h1>
                        <p className="text-gray-400 text-sm mb-4">
                            {search || status || paymentMethod 
                                ? t('payments.adjust_search_filters', 'Try adjusting your search or filters') 
                                : t('payments.no_payment_records_available', 'No payment records available')
                            }
                        </p>
                        <Link
                            href={route("subscriptions.index")}
                            className="btn bg-[#1e4d2b] text-white btn-sm"
                        >
                            <CreditCard size={15} /> {t('payments.view_subscriptions', 'View Subscriptions')}
                        </Link>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {subscription.data.length > 0 && (
                <div className="mt-6">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-gray-600">
                            {t('payments.showing_records', 'Showing')} {subscription.from} {t('payments.to', 'to')} {subscription.to} {t('payments.of', 'of')} {subscription.total} {t('payments.payment_records', 'payment records')}
                        </div>
                        
                        {/* Custom Pagination Component */}
                        <div className="join">
                            {/* Previous Button */}
                            {subscription.links.prev && (
                                <Link
                                    href={subscription.links.prev}
                                    className="join-item btn btn-sm"
                                >
                                    «
                                </Link>
                            )}
                            
                            {/* Page Numbers */}
                            {subscription.links && subscription.links.links && subscription.links.links.slice(1, -1).map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url}
                                    className={`join-item btn btn-sm ${link.active ? 'bg-[#1e4d2b] text-white' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                            
                            {/* Next Button */}
                            {subscription.links.next && (
                                <Link
                                    href={subscription.links.next}
                                    className="join-item btn btn-sm"
                                >
                                    »
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            {subscription.data.length > 0 && (
                <div className="border-t border-gray-200 p-5 mt-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                        {t('payments.payments_summary', 'Payments Summary')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <CreditCard className="text-blue-600" size={20} />
                                <div>
                                    <p className="text-sm font-medium text-blue-800">
                                        {t('payments.total_payments', 'Total Payments')}
                                    </p>
                                    <p className="text-xl font-bold text-blue-900">{subscription.total}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <BadgeCheck className="text-green-600" size={20} />
                                <div>
                                    <p className="text-sm font-medium text-green-800">
                                        {t('payments.completed_payments', 'Completed Payments')}
                                    </p>
                                    <p className="text-xl font-bold text-green-900">
                                        {subscription.data.filter(payment => payment.status == 'completed').length}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <div>
                                    <p className="text-sm font-medium text-purple-800">
                                        {t('payments.total_revenue', 'Total Revenue')}
                                    </p>
                                    <p className="text-xl font-bold text-purple-900">
                                        {formatCurrency(
                                            subscription.data
                                                .filter(payment => payment.status == 'completed')
                                                .reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0)
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <Clock className="text-orange-600" size={20} />
                                <div>
                                    <p className="text-sm font-medium text-orange-800">
                                        {t('payments.pending_payments', 'Pending Payments')}
                                    </p>
                                    <p className="text-xl font-bold text-orange-900">
                                        {subscription.data.filter(payment => payment.status == 'pending').length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Methods Breakdown */}
                    <div className="mt-6">
                        <h3 className="text-md font-semibold text-gray-800 mb-3">
                            {t('payments.payment_methods_breakdown', 'Payment Methods Breakdown')}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            {['cash', 'card', 'bank', 'mobile', 'online'].map(method => {
                                const methodPayments = subscription.data.filter(payment => payment.payment_method == method);
                                const methodDetails = getPaymentMethodDetails(method);
                                
                                return (
                                    <div key={method} className={`border rounded-lg p-3 ${methodDetails.class}`}>
                                        <p className="text-sm font-medium capitalize">{methodDetails.label}</p>
                                        <p className="text-lg font-bold">{methodPayments.length}</p>
                                        <p className="text-xs text-gray-600">
                                            {formatCurrency(
                                                methodPayments
                                                    .filter(p => p.status == 'completed')
                                                    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
                                            )}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}