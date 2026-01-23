import PageHeader from "../../components/PageHeader";
import { router, usePage } from "@inertiajs/react";
import {
    Search,
    Filter,
    Calendar,
    Eye,
    Trash2,
    RefreshCw,
    DollarSign,
    Package,
    AlertCircle,
    CheckCircle,
    XCircle,
    Clock,
    Download,
    Printer,
    MoreVertical,
    ChevronDown,
    ChevronUp,
    Shield
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "../../hooks/useTranslation";

export default function PurchaseReturnList({
    filters,
    returns,
    isShadowUser
}) {
    const { t, locale } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [typeFilter, setTypeFilter] = useState(filters.return_type || '');
    const [dateFilter, setDateFilter] = useState(filters.date || '');
    const [selectedReturn, setSelectedReturn] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [expandedRows, setExpandedRows] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(returns.current_page || 1);

    const statusOptions = [
        { value: '', label: t('purchase_return.all_statuses', 'All Statuses') },
        { value: 'pending', label: t('purchase_return.pending', 'Pending') },
        { value: 'approved', label: t('purchase_return.approved', 'Approved') },
        { value: 'completed', label: t('purchase_return.completed', 'Completed') },
        { value: 'cancelled', label: t('purchase_return.cancelled', 'Cancelled') }
    ];

    const typeOptions = [
        { value: '', label: t('purchase_return.all_types', 'All Types') },
        { value: 'money_back', label: t('purchase_return.money_back', 'Money Back') },
        { value: 'product_replacement', label: t('purchase_return.product_replacement', 'Product Replacement') }
    ];

    // Format currency
    const formatCurrency = (value) => {
        const numValue = Number(value) || 0;
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(numValue);
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB');
    };

    // Get status badge
    const getStatusBadge = (status) => {
        const badges = {
            pending: <span className="badge badge-warning badge-sm">
                <Clock size={10} /> {t('purchase_return.pending', 'Pending')}
            </span>,
            approved: <span className="badge badge-info badge-sm">
                <CheckCircle size={10} /> {t('purchase_return.approved', 'Approved')}
            </span>,
            completed: <span className="badge badge-success badge-sm">
                <CheckCircle size={10} /> {t('purchase_return.completed', 'Completed')}
            </span>,
            cancelled: <span className="badge badge-error badge-sm">
                <XCircle size={10} /> {t('purchase_return.cancelled', 'Cancelled')}
            </span>
        };
        return badges[status] || <span className="badge badge-sm">{status}</span>;
    };

    // Get type badge
    const getTypeBadge = (type) => {
        if (type === 'money_back') {
            return <span className="badge badge-primary  h-10 badge-sm">
                {t('purchase_return.money_back', 'Money Back')}
            </span>;
        } else if (type === 'product_replacement') {
            return <span className="badge badge-warning badge-sm">
                <Package size={10} /> {t('purchase_return.product_replacement', 'Replacement')}
            </span>;
        }
        return <span className="badge badge-sm">{type}</span>;
    };

    // Apply filters
    const applyFilters = () => {
        const params = {};
        if (search) params.search = search;
        if (statusFilter) params.status = statusFilter;
        if (typeFilter) params.return_type = typeFilter;
        if (dateFilter) params.date = dateFilter;

        router.get(route('purchase-return.list'), params, {
            preserveState: true,
            replace: true
        });
    };

    // Reset filters
    const resetFilters = () => {
        setSearch('');
        setStatusFilter('');
        setTypeFilter('');
        setDateFilter('');
        router.get(route('purchase-return.list'), {}, {
            preserveState: true,
            replace: true
        });
    };

    // Handle row expand/collapse
    const toggleRowExpand = (id) => {
        setExpandedRows(prev =>
            prev.includes(id)
                ? prev.filter(rowId => rowId !== id)
                : [...prev, id]
        );
    };

    // Handle delete
    const handleDelete = (returnItem) => {
        setSelectedReturn(returnItem);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (!selectedReturn) return;

        router.delete(route('purchase-return.destroy', selectedReturn.id), {
            onSuccess: () => {
                setShowDeleteModal(false);
                setSelectedReturn(null);
            },
            onError: () => {
                alert(t('purchase_return.delete_error', 'Failed to delete purchase return'));
            }
        });
    };

    // Handle approve
    const handleApprove = (id) => {
        if (!confirm(t('purchase_return.confirm_approve', 'Are you sure you want to approve this return?'))) {
            return;
        }

        router.post(route('purchase-return.approve', id), {}, {
            onSuccess: () => {
                router.reload({ only: ['returns'] });
            },
            onError: () => {
                alert(t('purchase_return.approve_error', 'Failed to approve purchase return'));
            }
        });
    };

    // Handle complete
    // Handle complete
    const handleComplete = (id) => {
        const returnItem = returns.data.find(r => r.id === id);
        if (!returnItem) return;

        const message = returnItem.return_type === 'money_back'
            ? t('purchase_return.confirm_complete_refund', 'Are you sure you want to complete this refund? This will process the payment.')
            : t('purchase_return.confirm_complete_replacement', 'Are you sure you want to complete this product replacement? This will finalize the replacement process.');

        if (!confirm(message)) {
            return;
        }

        router.post(route('purchase-return.complete', id), {}, {
            onSuccess: () => {
                router.reload({ only: ['returns'] });
            },
            onError: () => {
                alert(t('purchase_return.complete_error', 'Failed to complete purchase return'));
            }
        });
    };

    // Handle sort
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Sort data
    const sortedReturns = [...returns.data].sort((a, b) => {
        if (sortConfig.key === 'return_date') {
            const dateA = new Date(a[sortConfig.key]);
            const dateB = new Date(b[sortConfig.key]);
            return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        }

        if (sortConfig.key === 'total_return_amount') {
            const amountA = parseFloat(a[sortConfig.key]);
            const amountB = parseFloat(b[sortConfig.key]);
            return sortConfig.direction === 'asc' ? amountA - amountB : amountB - amountA;
        }

        if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    // Columns for table
    const columns = [
        {
            key: 'return_no',
            label: t('purchase_return.return_no', 'Return No'),
            sortable: true,
            render: (row) => (
                <div className="font-medium">
                    <div className="flex items-center gap-2">
                        <span>{row.return_no}</span>
                        {row.status === 'pending' && (
                            <span className="animate-pulse w-2 h-2 rounded-full bg-warning"></span>
                        )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {formatDate(row.return_date)}
                    </div>
                </div>
            )
        },
        {
            key: 'purchase',
            label: t('purchase_return.purchase_no', 'Purchase No'),
            render: (row) => (
                <div>
                    <div className="font-medium">{row.purchase?.purchase_no || 'N/A'}</div>
                    <div className="text-xs text-gray-500">
                        {row.supplier?.name || 'N/A'}
                    </div>
                </div>
            )
        },
        {
            key: 'return_type',
            label: t('purchase_return.type', 'Type'),
            render: (row) => getTypeBadge(row.return_type)
        },
        {
            key: 'total_return_amount',
            label: t('purchase_return.amount', 'Amount'),
            sortable: true,
            render: (row) => (
                <div className="font-semibold">
                    ৳{formatCurrency(row.total_return_amount)}
                    {/* {!isShadowUser && row.shadow_return_amount && (
                        <div className="text-xs text-warning flex items-center">
                            <Shield size={10} className="mr-1" />
                            ৳{formatCurrency(row.shadow_return_amount)}
                        </div>
                    )} */}
                </div>
            )
        },
        {
            key: 'status',
            label: t('purchase_return.status', 'Status'),
            sortable: true,
            render: (row) => getStatusBadge(row.status)
        },
        {
            key: 'created_by',
            label: t('purchase_return.created_by', 'Created By'),
            render: (row) => (
                <div>
                    <div className="text-sm">{row.creator?.name || 'System'}</div>
                    <div className="text-xs text-gray-500">
                        {row.user_type === 'shadow' ? 'Shadow User' : 'General User'}
                    </div>
                </div>
            )
        },
        {
            key: 'actions',
            label: t('purchase_return.actions', 'Actions'),
            render: (row) => (
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => toggleRowExpand(row.id)}
                        className="btn btn-xs btn-ghost"
                        title={expandedRows.includes(row.id) ? "Collapse" : "Expand"}
                    >
                        {expandedRows.includes(row.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {/* View Button */}
                    {/* <button
                        onClick={() => router.visit(route('purchase-return.show', row.id))}
                        className="btn btn-xs btn-outline btn-info"
                        title="View Details"
                    >
                        <Eye size={12} />
                    </button> */}

                    {/* Approve Button - Always visible for pending returns */}
                    {row.status === 'pending' && (
                        <button
                            onClick={() => handleApprove(row.id)}
                            className="btn btn-xs btn-outline btn-success"
                            title="Approve Return"
                        >
                            <CheckCircle size={12} />
                        </button>
                    )}

                    {/* Complete Button - Visible for APPROVED returns (both money_back AND product_replacement) */}
                    {row.status === 'approved' && (
                        <button
                            onClick={() => handleComplete(row.id)}
                            className={`btn btn-xs btn-outline ${row.return_type === 'money_back' ? 'bg-[#1e4d2b] text-white' : 'btn-warning'}`}
                            title={`Complete ${row.return_type === 'money_back' ? 'Refund' : 'Replacement'}`}
                        >
                            {row.return_type === 'money_back' ? (
                                <DollarSign size={12} />
                            ) : (
                                <Package size={12} />
                            )}
                        </button>
                    )}
                </div>
            )
        }
    ];

    // Expanded row content
    const renderExpandedRow = (row) => {
        return (
            <div className="bg-base-100 border-t border-base-300 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <h4 className="font-semibold text-sm mb-2">{t('purchase_return.return_details', 'Return Details')}</h4>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">{t('purchase_return.return_date', 'Return Date')}:</span>
                                <span>{formatDate(row.return_date)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">{t('purchase_return.warehouse', 'Warehouse')}:</span>
                                <span>{row.warehouse?.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">{t('purchase_return.payment_type', 'Payment Type')}:</span>
                                <span className="capitalize">{row.payment_type?.replace('_', ' ') || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-sm mb-2">{t('purchase_return.amount_details', 'Amount Details')}</h4>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">{t('purchase_return.total_return', 'Total Return')}:</span>
                                <span className="font-semibold">৳{formatCurrency(row.total_return_amount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">{t('purchase_return.refunded', 'Refunded')}:</span>
                                <span className="text-success">৳{formatCurrency(row.refunded_amount)}</span>
                            </div>

                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-sm mb-2">{t('purchase_return.reason_notes', 'Reason & Notes')}</h4>
                        <div className="text-sm">
                            <p className="text-gray-700 mb-2">{row.reason || t('purchase_return.no_reason', 'No reason provided')}</p>
                            {row.notes && (
                                <p className="text-gray-500 text-xs">{row.notes}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-base-300 flex gap-2">
                    {/* <button
                        onClick={() => router.visit(route('purchase-return.show', row.id))}
                        className="btn btn-sm btn-outline btn-info"
                    >
                        <Eye size={14} className="mr-1" />
                        {t('purchase_return.view_full_details', 'View Full Details')}
                    </button> */}

                    {row.status === 'pending' && (
                        <button
                            onClick={() => handleApprove(row.id)}
                            className="btn btn-sm btn-success"
                        >
                            <CheckCircle size={14} className="mr-1" />
                            {t('purchase_return.approve_return', 'Approve Return')}
                        </button>
                    )}

                    {row.status === 'approved' && (
                        <button
                            onClick={() => handleComplete(row.id)}
                            className={`btn btn-sm ${row.return_type === 'money_back' ? 'bg-[#1e4d2b] text-white' : 'btn-warning'}`}
                        >
                            {row.return_type === 'money_back' ? (
                                <>
                                    <DollarSign size={14} className="mr-1" />
                                    {t('purchase_return.complete_refund', 'Complete Refund')}
                                </>
                            ) : (
                                <>
                                    <Package size={14} className="mr-1" />
                                    {t('purchase_return.complete_replacement', 'Complete Replacement')}
                                </>
                            )}
                        </button>
                    )}

                    {/* {row.status === 'pending' && (
                        <button
                            onClick={() => handleDelete(row)}
                            className="btn btn-sm btn-outline btn-error"
                        >
                            <Trash2 size={14} className="mr-1" />
                            {t('purchase_return.delete', 'Delete')}
                        </button>
                    )} */}
                </div>
            </div>
        );
    };

    // Modal Component
    const Modal = ({ isOpen, onClose, title, children }) => {
        if (!isOpen) return null;

        return (
            <div className="modal modal-open">
                <div className="modal-box">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">{title}</h3>
                        <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">✕</button>
                    </div>
                    {children}
                </div>
            </div>
        );
    };

    // Auto apply search after delay
    useEffect(() => {
        const timer = setTimeout(() => {
            applyFilters();
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    // Auto apply other filters
    useEffect(() => {
        applyFilters();
    }, [statusFilter, typeFilter, dateFilter]);

    return (
        <div className={`bg-white rounded-box p-5 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <PageHeader
                title={t('purchase_return.list_title', 'Purchase Returns')}
                subtitle={t('purchase_return.list_subtitle', 'Manage and track purchase returns')}
            >
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.visit(route("purchase.list"))}
                        className="btn btn-sm btn-ghost"
                    >
                        {t('purchase_return.back_to_purchases', 'Back to Purchases')}
                    </button>
                    <button
                        onClick={() => router.visit(route("purchase-return.create"))}
                        className="btn btn-sm bg-[#1e4d2b] text-white"
                    >
                        <RefreshCw size={14} className="mr-1" />
                        {t('purchase_return.create_new', 'Create Return')}
                    </button>
                </div>
            </PageHeader>

            {/* Filters Section */}
            <div className="card card-compact bg-base-100 border border-base-300 mb-6">
                <div className="card-body">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="card-title text-sm font-semibold">
                            <Filter size={16} className="mr-2" />
                            {t('purchase_return.filters', 'Filters')}
                        </h3>
                        <button
                            onClick={resetFilters}
                            className="btn btn-xs btn-ghost"
                        >
                            {t('purchase_return.reset_filters', 'Reset')}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="form-control">
                            <label className="label py-1">
                                <span className="label-text text-xs">
                                    {t('purchase_return.search', 'Search')}
                                </span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="input input-bordered input-sm w-full pl-9"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={t('purchase_return.search_placeholder', 'Search by return no, supplier...')}
                                />
                                <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="form-control">
                            <label className="label py-1">
                                <span className="label-text text-xs">
                                    {t('purchase_return.status', 'Status')}
                                </span>
                            </label>
                            <select
                                className="select select-bordered select-sm w-full"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                {statusOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Type Filter */}
                        <div className="form-control">
                            <label className="label py-1">
                                <span className="label-text text-xs">
                                    {t('purchase_return.type', 'Type')}
                                </span>
                            </label>
                            <select
                                className="select select-bordered select-sm w-full"
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                            >
                                {typeOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Date Filter */}
                        <div className="form-control">
                            <label className="label py-1">
                                <span className="label-text text-xs">
                                    {t('purchase_return.date', 'Date')}
                                </span>
                            </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    className="input input-bordered input-sm w-full pl-9"
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                />
                                <Calendar size={14} className="absolute left-3 top-2.5 text-gray-400" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="card card-compact bg-base-100 border border-base-300">
                    <div className="card-body">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="card-title text-sm font-semibold">
                                    {t('purchase_return.total_returns', 'Total Returns')}
                                </h4>
                                <p className="text-2xl font-bold">{returns.total}</p>
                            </div>
                            <RefreshCw size={24} className="text-primary" />
                        </div>
                    </div>
                </div>

                <div className="card card-compact bg-warning/10 border border-warning">
                    <div className="card-body">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="card-title text-sm font-semibold text-warning">
                                    {t('purchase_return.pending', 'Pending')}
                                </h4>
                                <p className="text-2xl font-bold text-warning">
                                    {returns.data.filter(r => r.status === 'pending').length}
                                </p>
                            </div>
                            <Clock size={24} className="text-warning" />
                        </div>
                    </div>
                </div>

                <div className="card card-compact bg-[#1e4d2b] text-white border border-primary">
                    <div className="card-body">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="card-title text-sm font-semibold text-primary">
                                    {t('purchase_return.money_back', 'Money Back')}
                                </h4>
                                <p className="text-2xl font-bold text-primary">
                                    {returns.data.filter(r => r.return_type === 'money_back').length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card card-compact bg-info/10 border border-info">
                    <div className="card-body">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="card-title text-sm font-semibold text-info">
                                    {t('purchase_return.replacement', 'Replacement')}
                                </h4>
                                <p className="text-2xl font-bold text-info">
                                    {returns.data.filter(r => r.return_type === 'product_replacement').length}
                                </p>
                            </div>
                            <Package size={24} className="text-info" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Returns Table */}
            <div className="card card-compact bg-base-100 border border-base-300">
                <div className="card-body">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="card-title text-sm font-semibold">
                            {t('purchase_return.returns_list', 'Purchase Returns List')}
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                                {t('purchase_return.showing', 'Showing')} {returns.from}-{returns.to} {t('purchase_return.of', 'of')} {returns.total}
                            </span>
                        </div>
                    </div>

                    {sortedReturns.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="table table-zebra table-auto w-full">
                                <thead>
                                    <tr>
                                        {columns.map((column) => (
                                            <th key={column.key} className="whitespace-nowrap">
                                                <div className="flex items-center gap-1">
                                                    {column.label}
                                                    {column.sortable && (
                                                        <button
                                                            onClick={() => handleSort(column.key)}
                                                            className="btn btn-xs btn-ghost"
                                                        >
                                                            {sortConfig.key === column.key && sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                        </button>
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedReturns.map((row) => (
                                        <>
                                            <tr key={row.id} className="hover">
                                                {columns.map((column) => (
                                                    <td key={`${row.id}-${column.key}`}>
                                                        {column.render
                                                            ? column.render(row)
                                                            : row[column.key]
                                                        }
                                                    </td>
                                                ))}
                                            </tr>
                                            {expandedRows.includes(row.id) && (
                                                <tr>
                                                    <td colSpan={columns.length}>
                                                        {renderExpandedRow(row)}
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <RefreshCw size={48} className="mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-500 mb-2">
                                {t('purchase_return.no_returns_found', 'No purchase returns found')}
                            </h3>
                            <p className="text-gray-400 mb-4">
                                {t('purchase_return.no_returns_description', 'Create a new purchase return or adjust your filters')}
                            </p>
                            <button
                                onClick={() => router.visit(route("purchase-return.create"))}
                                className="btn bg-[#1e4d2b] text-white"
                            >
                                <RefreshCw size={16} className="mr-2" />
                                {t('purchase_return.create_first_return', 'Create Your First Return')}
                            </button>
                        </div>
                    )}

                    {/* Pagination */}
                    {returns.links && returns.links.length > 3 && (
                        <div className="flex justify-center mt-6">
                            <div className="join">
                                {returns.links.map((link, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            if (link.url) {
                                                router.get(link.url, {}, { preserveState: true });
                                            }
                                        }}
                                        className={`join-item btn btn-sm ${link.active ? 'bg-[#1e4d2b] text-white' : ''} ${!link.url ? 'btn-disabled' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title={t('purchase_return.confirm_delete', 'Confirm Delete')}
            >
                <div className="p-4">
                    <AlertCircle size={48} className="mx-auto text-error mb-4" />
                    <p className="text-center mb-4">
                        {t('purchase_return.delete_warning', 'Are you sure you want to delete this purchase return? This action cannot be undone.')}
                    </p>
                    {selectedReturn && (
                        <div className="bg-base-200 p-3 rounded-box mb-4">
                            <p><strong>{t('purchase_return.return_no', 'Return No')}:</strong> {selectedReturn.return_no}</p>
                            <p><strong>{t('purchase_return.amount', 'Amount')}:</strong> ৳{formatCurrency(selectedReturn.total_return_amount)}</p>
                            <p><strong>{t('purchase_return.status', 'Status')}:</strong> {selectedReturn.status}</p>
                        </div>
                    )}
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            className="btn btn-ghost"
                        >
                            {t('purchase_return.cancel', 'Cancel')}
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="btn btn-error"
                        >
                            <Trash2 size={16} className="mr-2" />
                            {t('purchase_return.delete', 'Delete')}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}