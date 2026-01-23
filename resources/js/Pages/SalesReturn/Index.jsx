import PageHeader from "../../components/PageHeader";
import { router } from "@inertiajs/react";
import React from "react";
import {
    Search,
    Filter,
    Calendar,
    Trash2,
    RefreshCw,
    DollarSign,
    Package,
    CheckCircle,
    XCircle,
    Clock,
    ChevronDown,
    ChevronUp,
    User,
    FileText
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "../../hooks/useTranslation";

export default function SalesReturnIndex({
    salesReturns,
    filters = {},
    isShadowUser = false
}) {
    const { t, locale } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || '');
    const [fromDate, setFromDate] = useState(filters.from_date || '');
    const [toDate, setToDate] = useState(filters.to_date || '');
    const [expandedRows, setExpandedRows] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedReturn, setSelectedReturn] = useState(null);

    const statusOptions = [
        { value: '', label: t('sales_return.all_statuses', 'All Statuses') },
        { value: 'pending', label: t('sales_return.pending', 'Pending') },
        { value: 'approved', label: t('sales_return.approved', 'Approved') },
        { value: 'completed', label: t('sales_return.completed', 'Completed') },
        { value: 'cancelled', label: t('sales_return.cancelled', 'Cancelled') }
    ];

    const typeOptions = [
        { value: '', label: t('sales_return.all_types', 'All Types') },
        { value: 'sales_return', label: t('sales_return.return', 'Return') },
        { value: 'damaged', label: t('sales_return.damage', 'Damage') }
    ];

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(Number(value) || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-GB');
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: <span className="badge badge-warning badge-sm gap-1"><Clock size={10} /> {t('sales_return.pending', 'Pending')}</span>,
            approved: <span className="badge badge-info badge-sm gap-1"><CheckCircle size={10} /> {t('sales_return.approved', 'Approved')}</span>,
            completed: <span className="badge badge-success badge-sm gap-1"><CheckCircle size={10} /> {t('sales_return.completed', 'Completed')}</span>,
            cancelled: <span className="badge badge-error badge-sm gap-1"><XCircle size={10} /> {t('sales_return.cancelled', 'Cancelled')}</span>
        };
        return badges[status] || <span className="badge badge-sm">{status}</span>;
    };

    const applyFilters = () => {
        router.get(route('salesReturn.list'), {
            search,
            status: statusFilter,
            type: typeFilter,
            from_date: fromDate,
            to_date: toDate
        }, { preserveState: true, replace: true });
    };

    const resetFilters = () => {
        setSearch('');
        setStatusFilter('');
        setTypeFilter('');
        setFromDate('');
        setToDate('');
        router.get(route('salesReturn.list'), {});
    };

    const toggleRowExpand = (id) => {
        setExpandedRows(prev => prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]);
    };

    const handleDelete = (item) => {
        if (confirm(t('sales_return.confirm_delete', 'Are you sure you want to delete this record?'))) {
            router.delete(route('sales-return.destroy', item.id));
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if ((fromDate && toDate) || (!fromDate && !toDate)) {
                applyFilters();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [search, statusFilter, typeFilter, fromDate, toDate]);

    return (
        <div className={`space-y-6 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <PageHeader
                title={t('sales_return.list_title', 'Sales Returns & Damages')}
                subtitle={t('sales_return.list_subtitle', 'Manage customer returns and damaged stock')}
            >
                <div className="flex gap-2">
                    <button onClick={() => router.visit(route("sales.index"))} className="btn btn-sm btn-ghost">
                        {t('sales_return.back_to_sales', 'Back to Sales')}
                    </button>
                    <button onClick={() => router.visit(route("return.create"))} className="btn btn-sm bg-[#1e4d2b] text-white">
                        <RefreshCw size={14} className="mr-1" />
                        {t('sales_return.create_new', 'Create Return')}
                    </button>
                </div>
            </PageHeader>

            {/* Filters */}
            <div className="bg-white p-4 rounded-box border border-base-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="form-control w-full">
                        <label className="label py-1"><span className="label-text text-xs font-semibold">{t('sales_return.search', 'Search')}</span></label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-base-content/40" size={16} />
                            <input
                                type="text"
                                placeholder={t('sales_return.search_placeholder', 'Search customer or invoice...')}
                                className="input input-sm input-bordered w-full pl-3"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-control w-full">
                        <label className="label py-1"><span className="label-text text-xs font-semibold">{t('sales_return.status', 'Status')}</span></label>
                        <select className="select select-sm select-bordered" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>

                    <div className="form-control w-full">
                        <label className="label py-1"><span className="label-text text-xs font-semibold">{t('sales_return.type', 'Return Type')}</span></label>
                        <select className="select select-sm select-bordered" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                            {typeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>

                    <div className="form-control w-full">
                        <label className="label py-1"><span className="label-text text-xs font-semibold">{t('sales_return.from_date', 'From Date')}</span></label>
                        <input
                            type="date"
                            className="input input-sm input-bordered"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                        />
                    </div>

                    <div className="form-control w-full">
                        <label className="label py-1"><span className="label-text text-xs font-semibold">{t('sales_return.to_date', 'To Date')}</span></label>
                        <input
                            type="date"
                            className="input input-sm input-bordered"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            min={fromDate}
                        />
                    </div>
                </div>

                <div className="flex justify-end mt-4">
                    <button onClick={resetFilters} className="btn btn-sm btn-ghost mr-2">
                        <RefreshCw size={14} className="mr-1" />
                        {t('sales_return.reset_filters', 'Reset')}
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto bg-white rounded-box border border-base-200 shadow-sm">
                <table className="table table-zebra">
                    <thead className="bg-base-50">
                        <tr>
                            <th className="w-10"></th>
                            <th>{t('sales_return.customer', 'Customer')}</th>
                            <th>{t('sales_return.invoice', 'Sale Invoice')}</th>
                            <th>{t('sales_return.amount', 'Refund Amount')}</th>
                            <th>{t('sales_return.type', 'Type')}</th>
                            <th>{t('sales_return.return_type', 'Return Type')}</th>
                            <th>{t('sales_return.status', 'Status')}</th>
                            <th>{t('sales_return.date', 'Date')}</th>
                            <th className="text-right">{t('sales_return.actions', 'Actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {salesReturns.data && salesReturns.data.length > 0 ? (
                            salesReturns.data.map((item) => (
                                <React.Fragment key={item.id}>
                                    <tr>
                                        <td>
                                            <button onClick={() => toggleRowExpand(item.id)} className="btn btn-ghost btn-xs">
                                                {expandedRows.includes(item.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </button>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-base-200 rounded-lg"><User size={14} /></div>
                                                <div>
                                                    <div className="font-bold">{item.customer?.customer_name || 'Walk-in Customer'}</div>
                                                    <div className="text-xs opacity-50">
                                                        {item.customer?.phone || item.sale?.customer?.phone || ''}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1 text-primary font-medium">
                                                <FileText size={14} />
                                                {item.sale?.invoice_no || 'N/A'}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="font-semibold text-error">
                                                ৳{formatCurrency(item.refunded_amount)}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge badge-sm p-4 rounded ${item.type == 'damage' ? 'badge-error' : 'badge-info'}`}>
                                                {item.type ? t(`sales_return.${item.type}`, item.type) : 'N/A'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge badge-sm p-4 rounded ${item.return_type == 'product_replacement' ? 'badge-warning' : 'badge-ghost'}`}>
                                                {item.return_type ? item.return_type.replace('_', ' ') : 'N/A'}
                                            </span>
                                        </td>
                                        <td>{getStatusBadge(item.status)}</td>
                                        <td>
                                            <div className="text-xs opacity-70">{formatDate(item.created_at)}</div>
                                        </td>
                                        <td className="text-right space-x-1">
                                            {item.status === "pending" && (
                                                <>
                                                    <button
                                                        onClick={() => handleDelete(item)}
                                                        className="btn btn-ghost btn-xs text-error"
                                                        title={t("sales_return.delete", "Delete")}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            if (confirm("Are you sure you want to approve this return?")) {
                                                                router.post(route("return.approve", item.id), {}, {
                                                                    preserveScroll: true,
                                                                });
                                                            }
                                                        }}
                                                        className="btn btn-ghost btn-xs text-success"
                                                        title={t("sales_return.approve", "Approve")}
                                                        disabled={router.processing}
                                                    >
                                                        <CheckCircle size={14} />
                                                    </button>
                                                </>
                                            )}
                                            {/* <button
                                                onClick={() => router.visit(route('sales-return.show', item.id))}
                                                className="btn btn-ghost btn-xs text-info"
                                                title={t('sales_return.view', 'View Details')}
                                            >
                                                <FileText size={14} />
                                            </button> */}
                                        </td>
                                    </tr>
                                    {/* {expandedRows.includes(item.id) && (
                                        <tr className="bg-base-100">
                                            <td colSpan="9" className="bg-base-50 p-4">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div>
                                                        <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">{t('sales_return.reason_notes', 'Reason & Notes')}</h4>
                                                        <p className="text-sm font-medium">{item.reason || t('sales_return.no_reason', 'No reason provided')}</p>
                                                        <p className="text-xs text-gray-500 mt-1">{item.notes}</p>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">{t('sales_return.quantities', 'Quantities')}</h4>
                                                        <div className="flex items-center gap-2">
                                                            <Package size={14} />
                                                            <span className="text-sm">
                                                                {t('sales_return.returned_units', 'Returned:')} <strong>{item.return_quantity}</strong> {t('sales_return.units', 'units')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">{t('sales_return.replacement_details', 'Replacement Details')}</h4>
                                                        <p className="text-sm text-success font-semibold">
                                                            {t('sales_return.total', 'Total:')} ৳{formatCurrency(item.replacement_total)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )} */}
                                </React.Fragment>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="9" className="text-center py-8">
                                    <div className="flex flex-col items-center justify-center">
                                        <Package size={48} className="text-gray-300 mb-2" />
                                        <p className="text-gray-500">{t('sales_return.no_records', 'No sales returns found')}</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {salesReturns.data && salesReturns.data.length > 0 && (
                <div className="flex justify-between items-center px-4">
                    <span className="text-sm opacity-50">
                        {t('sales_return.showing_results', 'Showing {from} to {to} of {total} returns', {
                            from: salesReturns.from || 0,
                            to: salesReturns.to || 0,
                            total: salesReturns.total || 0
                        })}
                    </span>

                    {/* Pagination Links */}
                    {salesReturns.links && salesReturns.links.length > 3 && (
                        <div className="join">
                            {salesReturns.links.map((link, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        if (link.url) {
                                            router.get(link.url, {}, { preserveState: true });
                                        }
                                    }}
                                    className={`join-item btn btn-sm ${link.active ? 'btn-active' : ''} ${!link.url ? 'btn-disabled' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}