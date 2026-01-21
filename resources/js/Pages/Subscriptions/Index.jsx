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
    Ban
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "../../hooks/useTranslation";

export default function Index({ subscriptions }) {
    const { t, locale } = useTranslation();
    // Search and filter states
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [initialized, setInitialized] = useState(false);

    // Handle search and filter changes
    useEffect(() => {
        if (!initialized) {
            setInitialized(true);
            return;
        }

        const timer = setTimeout(() => {
            router.get(route("subscriptions.index"), {
                search: search || null,
                status: status || null,
            }, {
                preserveState: true,
                replace: true
            });
        }, 500);

        return () => clearTimeout(timer);
    }, [search, status]);

    // Clear all filters
    const clearFilters = () => {
        setSearch("");
        setStatus("");
        router.get(route("subscriptions.index"));
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
        return new Date(dateString).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-BD', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Get status badge color
    const getStatusBadge = (status) => {
        const statusMap = {
            1: { label: t('subscription.active', 'Active'), class: 'badge-success', icon: BadgeCheck },
            2: { label: t('subscription.expired', 'Expired'), class: 'badge-neutral', icon: Calendar },
            3: { label: t('subscription.cancelled', 'Cancelled'), class: 'badge-error', icon: Ban },
            4: { label: t('subscription.pending', 'Pending'), class: 'badge-warning', icon: Clock },
        };
        
        const statusInfo = statusMap[status] || { label: status, class: 'badge-warning', icon: Clock };
        const StatusIcon = statusInfo.icon;
        
        return {
            ...statusInfo,
            icon: <StatusIcon size={12} />
        };
    };

    // Calculate days remaining
    const getDaysRemaining = (endDate) => {
        const end = new Date(endDate);
        const today = new Date();
        const diffTime = end - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    // Get total payments amount
    const getTotalPayments = (payments) => {
        return payments.reduce((total, payment) => total + parseFloat(payment.amount || 0), 0);
    };

    return (
        <div className={`bg-white rounded-box p-5 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        {t('subscription.subscription_management', 'Subscriptions Management')}
                    </h1>
                    <p className="text-gray-600 mt-1">
                        {t('subscription.manage_user_subscriptions', 'Manage user subscriptions and billing')}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href={route("subscriptions.create")}
                        className="btn bg-[#1e4d2b] text-white btn-sm"
                    >
                        <Plus size={15} /> {t('subscription.create_subscription', 'Create New Subscription')}
                    </Link>
                </div>
            </div>

            {/* Search and Filter Section */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                <div className="flex flex-col lg:flex-row gap-4 items-end">
                    {/* Search Input */}
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('subscription.search_subscriptions', 'Search Subscriptions')}
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t('subscription.search_placeholder', 'Search by user name, email, plan name...')}
                                className="input input-bordered w-full pl-10"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="w-full lg:w-48">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('subscription.status', 'Status')}
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="select select-bordered w-full"
                        >
                            <option value="">{t('subscription.all_status', 'All Status')}</option>
                            <option value="active">{t('subscription.active', 'Active')}</option>
                            <option value="pending">{t('subscription.pending', 'Pending')}</option>
                            <option value="expired">{t('subscription.expired', 'Expired')}</option>
                            <option value="cancelled">{t('subscription.cancelled', 'Cancelled')}</option>
                            <option value="inactive">{t('subscription.inactive', 'Inactive')}</option>
                        </select>
                    </div>

                    {/* Clear Filters Button */}
                    {(search || status) && (
                        <button
                            onClick={clearFilters}
                            className="btn btn-error btn-sm"
                        >
                            <X size={15} /> {t('subscription.clear', 'Clear')}
                        </button>
                    )}
                </div>
            </div>

            {/* Subscriptions Table */}
            <div className="overflow-x-auto">
                {subscriptions.data.length > 0 ? (
                    <table className="table table-auto w-full">
                        <thead className="bg-[#1e4d2b] text-white text-white">
                            <tr>
                                <th className="text-center">{t('subscription.sl', 'SL')}</th>
                                <th>{t('subscription.user', 'User')}</th>
                                <th>{t('subscription.plan', 'Plan')}</th>
                                <th>{t('subscription.price', 'Price')}</th>
                                <th>{t('subscription.period', 'Period')}</th>
                                <th>{t('subscription.payments', 'Payments')}</th>
                                <th>{t('subscription.status', 'Status')}</th>
                                <th className="text-center">{t('subscription.actions', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subscriptions.data.map((subscription, index) => (
                                <tr key={subscription.id} className="hover:bg-gray-50">
                                    <td className="text-center">
                                        {subscriptions.from + index}
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <User size={16} className="text-blue-600" />
                                            <div>
                                                <p className="font-semibold text-gray-800">
                                                    {subscription.user?.name || 'N/A'}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {subscription.user?.email || 'No email'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <CreditCard size={16} className="text-green-600" />
                                            <div>
                                                <p className="font-semibold text-gray-800">
                                                    {subscription.plan?.name || 'N/A'}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {subscription.plan?.description ? 
                                                        subscription.plan.description.substring(0, 30) + '...' : 
                                                        'No description'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-1">
                                            <span className="font-semibold">
                                                {formatCurrency(subscription.plan?.price || 0)}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1 text-sm">
                                            <div className="flex items-center gap-1">
                                                <Calendar size={12} className="text-purple-600" />
                                                <span>{t('subscription.start', 'Start')}: {formatDate(subscription.start_date)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar size={12} className="text-orange-600" />
                                                <span>{t('subscription.end', 'End')}: {formatDate(subscription.end_date)}</span>
                                            </div>
                                            {subscription.status == 1 && (
                                                <div className="text-xs text-primary font-medium">
                                                    {getDaysRemaining(subscription.end_date)} {t('subscription.days_remaining', 'days remaining')}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1">
                                                <span className="font-semibold">
                                                    {formatCurrency(getTotalPayments(subscription.payments || []))}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {subscription.payments?.length || 0} {t('subscription.payment_count', 'payment(s)')}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${getStatusBadge(subscription.status).class} badge-sm flex items-center gap-1`}>
                                            {getStatusBadge(subscription.status).icon}
                                            {getStatusBadge(subscription.status).label}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2 justify-center">
                                            <Link
                                                href={route("subscriptions.show", subscription.id)}
                                                className="btn bg-[#1e4d2b] text-white btn-xs"
                                            >
                                                <Eye size={12} /> {t('subscription.view', 'View')}
                                            </Link>

                                            <Link
                                                href={route("subscriptions.edit", subscription.id)}
                                                className="btn btn-warning btn-xs"
                                            >
                                                <DollarSign size={12} /> {t('subscription.renew', 'Renew')}
                                            </Link>

                                            <Link
                                                href={route("subscriptions.destroy", subscription.id)}
                                                method="delete"
                                                as="button"
                                                onClick={(e) => {
                                                    if (!confirm(t('subscription.delete_confirmation', 'Are you sure you want to delete this subscription?'))) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                className="btn btn-error btn-xs"
                                            >
                                                <Trash2 size={12} /> {t('subscription.delete', 'Delete')}
                                            </Link>
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
                            {t('subscription.no_subscriptions_found', 'No subscriptions found!')}
                        </h1>
                        <p className="text-gray-400 text-sm mb-4">
                            {search || status 
                                ? t('subscription.adjust_search_filters', 'Try adjusting your search or filters')
                                : t('subscription.get_started_create', 'Get started by creating your first subscription')
                            }
                        </p>
                        <Link
                            href={route("subscriptions.create")}
                            className="btn bg-[#1e4d2b] text-white btn-sm"
                        >
                            <Plus size={15} /> {t('subscription.create_subscription', 'Create New Subscription')}
                        </Link>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {subscriptions.data.length > 0 && (
                <div className="mt-6">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-gray-600">
                            {t('subscription.showing_entries', 'Showing')} {subscriptions.from} {t('subscription.to', 'to')} {subscriptions.to} {t('subscription.of', 'of')} {subscriptions.total} {t('subscription.entries', 'entries')}
                        </div>
                        
                        {/* Custom Pagination Component */}
                        <div className="join">
                            {/* Previous Button */}
                            {subscriptions.links.prev && (
                                <Link
                                    href={subscriptions.links.prev}
                                    className="join-item btn btn-sm"
                                >
                                    «
                                </Link>
                            )}
                            
                            {/* Page Numbers */}
                            {subscriptions.links && subscriptions.links.links && subscriptions.links.links.slice(1, -1).map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url}
                                    className={`join-item btn btn-sm ${link.active ? 'bg-[#1e4d2b] text-white' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                            
                            {/* Next Button */}
                            {subscriptions.links.next && (
                                <Link
                                    href={subscriptions.links.next}
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
            {subscriptions.data.length > 0 && (
                <div className="border-t border-gray-200 p-5 mt-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                        {t('subscription.subscriptions_summary', 'Subscriptions Summary')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <CreditCard className="text-blue-600" size={20} />
                                <div>
                                    <p className="text-sm font-medium text-blue-800">
                                        {t('subscription.total_subscriptions', 'Total Subscriptions')}
                                    </p>
                                    <p className="text-xl font-bold text-blue-900">{subscriptions.total}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <BadgeCheck className="text-green-600" size={20} />
                                <div>
                                    <p className="text-sm font-medium text-green-800">
                                        {t('subscription.active_subscriptions', 'Active Subscriptions')}
                                    </p>
                                    <p className="text-xl font-bold text-green-900">
                                        {subscriptions.data.filter(sub => sub.status == 1).length}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <div>
                                    <p className="text-sm font-medium text-purple-800">
                                        {t('subscription.total_revenue', 'Total Revenue')}
                                    </p>
                                    <p className="text-xl font-bold text-purple-900">
                                        {formatCurrency(
                                            subscriptions.data.reduce((sum, sub) => 
                                                sum + getTotalPayments(sub.payments || []), 0
                                            )
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <User className="text-orange-600" size={20} />
                                <div>
                                    <p className="text-sm font-medium text-orange-800">
                                        {t('subscription.active_users', 'Active Users')}
                                    </p>
                                    <p className="text-xl font-bold text-orange-900">
                                        {new Set(
                                            subscriptions.data
                                                .filter(sub => sub.status == 1)
                                                .map(sub => sub.user?.id)
                                                .filter(Boolean)
                                        ).size}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}