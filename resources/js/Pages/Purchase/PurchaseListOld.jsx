import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import { Link, router, useForm, usePage } from "@inertiajs/react";
import { Eye, Plus, Trash2, Frown, Calendar, User, Warehouse, DollarSign, Package, Shield, Search, Filter, X, Edit, CheckCircle, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "../../hooks/useTranslation";

export default function PurchaseList({ purchases, filters, isShadowUser }) {
    const { auth } = usePage().props;
    const { t, locale } = useTranslation();

    const [localFilters, setLocalFilters] = useState({
        search: filters?.search || "",
        status: filters?.status || "",
        date: filters?.date || "",
    });

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState(null);
    const [paymentData, setPaymentData] = useState({
        paid_amount: 0,
        shadow_paid_amount: 0,
        payment_status: 'unpaid',
        shadow_payment_status: 'unpaid'
    });
    const [approveData, setApproveData] = useState({
        items: [],
        notes: ''
    });

    // Update local filters when props change
    useEffect(() => {
        setLocalFilters({
            search: filters?.search || "",
            status: filters?.status || "",
            date: filters?.date || "",
        });
    }, [filters]);

    const handleFilter = (field, value) => {
        const newFilters = {
            ...localFilters,
            [field]: value
        };
        setLocalFilters(newFilters);

        // Remove empty filters
        const queryString = {};
        if (newFilters.search) queryString.search = newFilters.search;
        if (newFilters.status) queryString.status = newFilters.status;
        if (newFilters.date) queryString.date = newFilters.date;

        router.get(route("purchase.list"), queryString, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setLocalFilters({
            search: "",
            status: "",
            date: "",
        });
        router.get(route("purchase.list"), {}, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = (id) => {
        if (confirm("Are you sure you want to delete this purchase? This will reverse the stock.")) {
            router.delete(route("purchase.destroy", id));
        }
    };

    // Add this function to handle Return button click
    const handleCreateReturn = (purchaseId) => {
        router.visit(route('purchase-return.create', { purchase_id: purchaseId }));
    };

    // ... rest of your existing Payment and Approve modal functions ...

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-IN');
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat(locale === 'bn' ? 'bn-BD' : 'en-IN', {
            style: 'currency',
            currency: 'BDT'
        }).format(amount || 0);
    };

    const hasActiveFilters = localFilters.search || localFilters.status || localFilters.date;

    // Check if purchase is from shadow user and needs approval
    const isPendingApproval = (purchase) => {
        return purchase.user_type === 'shadow' && purchase.status === 'pending';
    };

    // Check if user can approve purchases (general users only)
    const canApprovePurchases = !isShadowUser && auth?.role === 'admin';

    // Get display amounts based on user type
    const getDisplayAmounts = (purchase) => {
        if (isShadowUser) {
            return {
                total: purchase.shadow_total_amount || purchase.grand_total || 0,
                paid: purchase.shadow_paid_amount || purchase.paid_amount || 0,
                due: purchase.shadow_due_amount || purchase.due_amount || 0,
                payment_status: purchase.shadow_payment_status || purchase.payment_status || 'unpaid'
            };
        }
        return {
            total: purchase.grand_total || purchase.total_amount || 0,
            paid: purchase.paid_amount || 0,
            due: purchase.due_amount || 0,
            payment_status: purchase.payment_status || 'unpaid'
        };
    };

    // Safe data access
    const safePurchases = purchases?.data || [];
    const safePagination = purchases || {};

    return (
        <div className={`bg-white rounded-box p-5 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <PageHeader
                title={t('purchase.purchase_management', 'Purchase Management')}
                subtitle={isShadowUser ? t('purchase.view_purchase_data', 'View purchase data') : t('purchase.manage_purchases', 'Manage your product purchases')}
            >
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="search"
                                onChange={(e) => handleFilter('search', e.target.value)}
                                value={localFilters.search}
                                style={{ padding: '0 0 0 20px', width: '150px' }}
                                placeholder={t('purchase.search_purchases', 'Search purchases...')}
                                className="input input-sm input-bordered pl-9"
                            />
                        </div>
                        <select
                            onChange={(e) => handleFilter('status', e.target.value)}
                            value={localFilters.status}
                            className="select select-sm select-bordered"
                        >
                            <option value="">{t('purchase.all_status', 'All Status')}</option>
                            <option value="pending">{t('purchase.pending', 'Pending')}</option>
                            <option value="completed">{t('purchase.completed', 'Completed')}</option>
                            <option value="cancelled">{t('purchase.cancelled', 'Cancelled')}</option>
                        </select>
                        <input
                            type="date"
                            onChange={(e) => handleFilter('date', e.target.value)}
                            value={localFilters.date}
                            className="input input-sm input-bordered"
                        />
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="btn btn-sm btn-ghost"
                                title={t('purchase.clear_filters', 'Clear all filters')}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                        <Link
                            href={route("purchase.create")}
                            className={`btn btn-sm ${isShadowUser ? 'btn-warning' : 'bg-[#1e4d2b] text-white'}`}
                        >
                            <Plus size={15} />
                            {t('purchase.new_purchase', 'New Purchase')}
                        </Link>
                </div>
            </PageHeader>

            {/* Active Filters Display */}
            {hasActiveFilters && (
                <div className="mb-4 p-3 bg-base-200 rounded-box">
                    <div className="flex items-center gap-2 text-sm">
                        <Filter size={14} className="text-gray-500" />
                        <span className="font-medium">{t('purchase.active_filters', 'Active Filters')}:</span>
                        {localFilters.search && (
                            <span className="badge badge-outline">
                                {t('purchase.search', 'Search')}: "{localFilters.search}"
                            </span>
                        )}
                        {localFilters.status && (
                            <span className="badge badge-outline">
                                {t('purchase.status', 'Status')}: {t(`purchase.${localFilters.status}`, localFilters.status)}
                            </span>
                        )}
                        {localFilters.date && (
                            <span className="badge badge-outline">
                                {t('purchase.date', 'Date')}: {localFilters.date}
                            </span>
                        )}
                        <button
                            onClick={clearFilters}
                            className="btn btn-xs btn-ghost ml-auto"
                        >
                            {t('purchase.clear_all', 'Clear All')}
                        </button>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                {safePurchases.length > 0 ? (
                    <table className="table table-auto w-full">
                        <thead className={isShadowUser ? "bg-warning text-warning-content" : "bg-[#1e4d2b] text-white text-primary-content"}>
                            <tr>
                                <th className="bg-opacity-20">#</th>
                                <th>{t('purchase.purchase_details', 'Purchase Details')}</th>
                                <th>{t('purchase.supplier_warehouse', 'Supplier & Warehouse')}</th>
                                {/* <th>{t('purchase.items_amount', 'Items & Amount')}</th> */}
                                <th>{t('purchase.payment_status', 'Payment Status')}</th>
                                <th>{t('purchase.actions', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {safePurchases.map((purchase, index) => {
                                const displayAmounts = getDisplayAmounts(purchase);
                                return (
                                <tr key={purchase.id} className="hover:bg-base-100">
                                    <th className="bg-base-200">{index + 1}</th>
                                    <td>
                                        <div className="space-y-1">
                                            <div className="font-mono font-bold flex items-center gap-2">
                                                {t('purchase.purchase_number', 'Purchase #')}{purchase.purchase_no}
                                                {isPendingApproval(purchase) && (
                                                    <span className="badge badge-warning badge-sm">
                                                        <Clock size={12} /> {t('purchase.pending_approval', 'Pending')}
                                                    </span>
                                                )}
                                                {purchase.user_type === 'shadow' && (
                                                    <Shield size={14} className="text-warning" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Calendar size={14} />
                                                {formatDate(purchase.purchase_date)}
                                            </div>
                                            {purchase.user_type === 'shadow' && (
                                                <div className="text-xs text-warning flex items-center gap-1">
                                                    <Shield size={12} />
                                                    {t('purchase.shadow_purchase', 'Shadow Purchase')}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-blue-600" />
                                                <div>
                                                    <div className="font-medium">{purchase.supplier?.name || 'N/A'}</div>
                                                    <div className="text-xs text-gray-500">{purchase.supplier?.company || ''}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Warehouse size={14} className="text-green-600" />
                                                <div>
                                                    <div className="font-medium">{purchase.warehouse?.name || 'N/A'}</div>
                                                    <div className="text-xs text-gray-500">{purchase.warehouse?.code || ''}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    {/* <td>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Package size={14} className="text-purple-600" />
                                                <span className="font-medium">
                                                    {purchase.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0} {t('purchase.units', 'units')}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    ({purchase.items?.length || 0} {t('purchase.items', 'items')})
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <DollarSign size={14} className={isShadowUser ? "text-warning" : "text-green-600"} />
                                                <span className="font-bold">
                                                    {formatCurrency(displayAmounts.total)}
                                                </span>
                                            </div>
                                            {purchase.user_type === 'shadow' && purchase.status === 'pending' && (
                                                <div className="text-xs text-warning">
                                                    {t('purchase.needs_approval', 'Needs Approval')}
                                                </div>
                                            )}
                                            {!isShadowUser && purchase.user_type === 'shadow' && (
                                                <div className="text-xs text-blue-600">
                                                    {t('purchase.shadow_total', 'Shadow Total')}: {formatCurrency(purchase.shadow_total_amount)}
                                                </div>
                                            )}
                                        </div>
                                    </td> */}
                                    <td>
                                        <div className="flex flex-col gap-1">
                                            <span className={`badge badge-${purchase.status_color || 'neutral'} badge-sm`}>
                                                {t(`purchase.${purchase.status}`, purchase.status)}
                                            </span>
                                            <div className="text-xs space-y-1">
                                                <div className="flex justify-between">
                                                    <span>{t('purchase.paid_status', 'Paid')}:</span>
                                                    <span className="text-green-600">
                                                        {formatCurrency(displayAmounts.paid)}
                                                    </span>
                                                </div>
                                                {displayAmounts.due > 0 && (
                                                    <div className="flex justify-between">
                                                        <span>{t('purchase.due_amount', 'Due')}:</span>
                                                        <span className="text-orange-600">
                                                            {formatCurrency(displayAmounts.due)}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className={`badge badge-xs ${displayAmounts.payment_status === 'paid' ? 'badge-success' :
                                                        displayAmounts.payment_status === 'partial' ? 'badge-warning' : 'badge-error'
                                                    }`}>
                                                    {t(`purchase.${displayAmounts.payment_status}`, displayAmounts.payment_status)}
                                                </div>
                                            </div>
                                             {!isShadowUser && purchase.shadow_payment_status && (
                                                <div className="text-xs text-blue-600 mt-1">
                                                    <div className="flex justify-between">
                                                        <span>{t('purchase.shadow', 'Shadow')}:</span>
                                                        <span className={`badge badge-xs ${purchase.shadow_payment_status === 'paid' ? 'badge-success' :
                                                                purchase.shadow_payment_status === 'partial' ? 'badge-warning' : 'badge-error'
                                                            }`}>
                                                            {t(`purchase.${purchase.shadow_payment_status}`, purchase.shadow_payment_status)}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1">
                                            <Link
                                                href={route("purchase.show", purchase.id)}
                                                className="btn btn-xs btn-info btn-outline"
                                            >
                                                <Eye size={12} /> {t('purchase.details', 'Details')}
                                            </Link>

                                            {/* Add Return Button */}
                                            {purchase.status === 'completed' && (
                                                <button
                                                    onClick={() => handleCreateReturn(purchase.id)}
                                                    className="btn btn-xs btn-warning btn-outline"
                                                >
                                                    <RefreshCw size={12} /> {t('purchase.return', 'Return')}
                                                </button>
                                            )}

                                            {auth?.role === "admin" && purchase.status !== 'cancelled' && (
                                                <button
                                                    onClick={() => openPaymentModal(purchase)}
                                                    className="btn btn-xs btn-warning btn-outline"
                                                >
                                                    <Edit size={12} /> {t('purchase.payment', 'Payment')}
                                                </button>
                                            )}

                                            {canApprovePurchases && isPendingApproval(purchase) && (
                                                <button
                                                    onClick={() => openApproveModal(purchase)}
                                                    className="btn btn-xs btn-success btn-outline"
                                                >
                                                    <CheckCircle size={12} /> {t('purchase.approve', 'Approve')}
                                                </button>
                                            )}

                                            {auth?.role === "admin" && purchase.status !== 'cancelled' && (
                                                <button
                                                    onClick={() => handleDelete(purchase.id)}
                                                    className="btn btn-xs btn-error btn-outline"
                                                >
                                                    <Trash2 size={12} /> {t('purchase.delete', 'Delete')}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                ) : (
                    <div className="border border-gray-200 rounded-box px-5 py-16 flex flex-col justify-center items-center gap-3">
                        <Frown size={40} className="text-gray-400" />
                        <h1 className="text-gray-500 text-lg font-medium">
                            {hasActiveFilters ? t('purchase.no_matching_purchases', 'No purchases match your filters') :
                                isShadowUser ? t('purchase.no_purchases_found', 'No purchases found!') : t('purchase.no_purchases_found', 'No purchases found!')}
                        </h1>
                        <p className="text-gray-400 text-sm">
                            {hasActiveFilters ? t('purchase.adjust_search_criteria', 'Try adjusting your search criteria') :
                                isShadowUser ? t('purchase.create_first_purchase', 'Get started by creating your first purchase') :
                                    t('purchase.create_first_purchase', 'Get started by creating your first purchase')}
                        </p>
                        <div className="flex gap-2 mt-2">
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="btn btn-sm btn-ghost"
                                >
                                    {t('purchase.clear_filters', 'Clear Filters')}
                                </button>
                            )}
                                <Link
                                    href={route("purchase.create")}
                                    className={`btn btn-sm ${isShadowUser ? 'btn-warning' : 'bg-[#1e4d2b] text-white'}`}
                                >
                                    <Plus size={15} />
                                    {t('purchase.new_purchase', 'Create Purchase')}
                                </Link>
                        </div>
                    </div>
                )}
            </div>

            {safePurchases.length > 0 && (
                <Pagination data={safePagination} />
            )}
        </div>
    );
}