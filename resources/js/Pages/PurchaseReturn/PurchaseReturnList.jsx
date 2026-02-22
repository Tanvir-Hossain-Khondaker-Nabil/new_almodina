import { useState, useEffect } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import PageHeader from '@/Components/PageHeader';
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
    Plus,
    FileText,
    ArrowLeft,
    User,
    Hash,
    Building,
    Warehouse as WarehouseIcon,
} from 'lucide-react';

export default function Index({ returns, filters, summary, isShadowUser }) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [returnType, setReturnType] = useState(filters.return_type || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [expandedRows, setExpandedRows] = useState([]);
    const [selectedReturn, setSelectedReturn] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const applyFilters = () => {
        const params = {};
        if (search) params.search = search;
        if (status) params.status = status;
        if (returnType) params.return_type = returnType;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;

        router.get(route('purchase-return.list'), params, {
            preserveState: true,
            replace: true,
        });
    };

    const resetFilters = () => {
        setSearch('');
        setStatus('');
        setReturnType('');
        setDateFrom('');
        setDateTo('');
        router.get(route('purchase-return.list'), {}, {
            preserveState: true,
            replace: true,
        });
    };

    const formatCurrency = (value) => {
        const num = Number(value) || 0;
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(num);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-GB');
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: <span className="badge badge-warning">Pending</span>,
            approved: <span className="badge badge-info">Approved</span>,
            completed: <span className="badge badge-success">Completed</span>,
            cancelled: <span className="badge badge-error">Cancelled</span>,
        };
        return badges[status] || <span className="badge">{status}</span>;
    };

    const getTypeBadge = (type) => {
        if (type === 'money_back') {
            return <span className="badge badge-primary">Money Back</span>;
        } else if (type === 'product_replacement') {
            return <span className="badge badge-warning">Replacement</span>;
        }
        return <span className="badge">{type}</span>;
    };

    const handleApprove = (id) => {
        if (!confirm('Are you sure you want to approve this return?')) return;

        router.post(route('purchase-return.approve', id), {}, {
            preserveScroll: true,
            onSuccess: () => router.reload(),
        });
    };

    const handleComplete = (id) => {
        if (!confirm('Are you sure you want to complete this return?')) return;

        router.post(route('purchase-return.complete', id), {}, {
            preserveScroll: true,
            onSuccess: () => router.reload(),
        });
    };

    const handleDelete = (returnItem) => {
        setSelectedReturn(returnItem);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (!selectedReturn) return;

        router.delete(route('purchase-return.destroy', selectedReturn.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowDeleteModal(false);
                setSelectedReturn(null);
            },
        });
    };

    const toggleRowExpand = (id) => {
        setExpandedRows(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // Auto-apply search after delay
    useEffect(() => {
        const timer = setTimeout(applyFilters, 500);
        return () => clearTimeout(timer);
    }, [search]);

    // Apply other filters immediately
    useEffect(() => {
        applyFilters();
    }, [status, returnType, dateFrom, dateTo]);

    return (
        <div>
            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <PageHeader
                        title="Purchase Returns"
                        subtitle="Manage and track purchase returns"
                    >
                        <div className="flex items-center gap-3">
                            <Link
                                href={route('purchase.list')}
                                className="btn btn-sm btn-ghost"
                            >
                                <ArrowLeft size={16} className="mr-2" />
                                Back to Purchases
                            </Link>
                            <Link
                                href={route('purchase-return.create')}
                                className="btn btn-sm btn-primary"
                            >
                                <Plus size={16} className="mr-2" />
                                Create Return
                            </Link>
                        </div>
                    </PageHeader>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-500">Total Returns</h3>
                                        <p className="text-2xl font-bold mt-1">{summary.total}</p>
                                    </div>
                                    <RefreshCw size={24} className="text-primary" />
                                </div>
                            </div>
                        </div>

                        <div className="card bg-warning/10 border border-warning">
                            <div className="card-body p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold text-warning">Pending</h3>
                                        <p className="text-2xl font-bold mt-1 text-warning">{summary.pending}</p>
                                    </div>
                                    <Clock size={24} className="text-warning" />
                                </div>
                            </div>
                        </div>

                        <div className="card bg-success/10 border border-success">
                            <div className="card-body p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold text-success">Completed</h3>
                                        <p className="text-2xl font-bold mt-1 text-success">{summary.completed}</p>
                                    </div>
                                    <CheckCircle size={24} className="text-success" />
                                </div>
                            </div>
                        </div>

                        <div className="card bg-primary/10 border border-primary">
                            <div className="card-body p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold text-primary">Money Back</h3>
                                        <p className="text-2xl font-bold mt-1 text-primary">{summary.money_back}</p>
                                    </div>
                                    <DollarSign size={24} className="text-primary" />
                                </div>
                            </div>
                        </div>

                        <div className="card bg-warning/10 border border-warning">
                            <div className="card-body p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold text-warning">Replacement</h3>
                                        <p className="text-2xl font-bold mt-1 text-warning">{summary.replacement}</p>
                                    </div>
                                    <Package size={24} className="text-warning" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="card bg-base-100 border border-base-300 mb-6">
                        <div className="card-body">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="card-title text-sm font-semibold">
                                    <Filter size={16} className="mr-2" />
                                    Filters
                                </h3>
                                <button
                                    onClick={resetFilters}
                                    className="btn btn-xs btn-ghost"
                                >
                                    Reset
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div className="form-control">
                                    <label className="label py-1">
                                        <span className="label-text">Search</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="input input-bordered w-full pl-9"
                                            placeholder="Search by return no, supplier..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                        <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                                    </div>
                                </div>

                                <div className="form-control">
                                    <label className="label py-1">
                                        <span className="label-text">Status</span>
                                    </label>
                                    <select
                                        className="select select-bordered w-full"
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                    >
                                        <option value="">All Status</option>
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>

                                <div className="form-control">
                                    <label className="label py-1">
                                        <span className="label-text">Type</span>
                                    </label>
                                    <select
                                        className="select select-bordered w-full"
                                        value={returnType}
                                        onChange={(e) => setReturnType(e.target.value)}
                                    >
                                        <option value="">All Types</option>
                                        <option value="money_back">Money Back</option>
                                        <option value="product_replacement">Product Replacement</option>
                                    </select>
                                </div>

                                <div className="form-control">
                                    <label className="label py-1">
                                        <span className="label-text">Date From</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            className="input input-bordered w-full pl-9"
                                            value={dateFrom}
                                            onChange={(e) => setDateFrom(e.target.value)}
                                        />
                                        <Calendar size={16} className="absolute left-3 top-3 text-gray-400" />
                                    </div>
                                </div>

                                <div className="form-control">
                                    <label className="label py-1">
                                        <span className="label-text">Date To</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            className="input input-bordered w-full pl-9"
                                            value={dateTo}
                                            onChange={(e) => setDateTo(e.target.value)}
                                        />
                                        <Calendar size={16} className="absolute left-3 top-3 text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Returns Table */}
                    <div className="card bg-base-100 border border-base-300">
                        <div className="card-body">
                            <div className="overflow-x-auto">
                                <table className="table table-zebra w-full">
                                    <thead>
                                        <tr>
                                            <th>Return No</th>
                                            <th>Purchase No</th>
                                            <th>Supplier</th>
                                            <th>Type</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {returns.data.map((item) => (
                                            <>
                                                <tr key={item.id}>
                                                    <td>
                                                        <div className="font-medium">{item.return_no}</div>
                                                        <div className="text-xs text-gray-500">
                                                            {formatDate(item.return_date)}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div>{item.purchase?.purchase_no || 'N/A'}</div>
                                                    </td>
                                                    <td>
                                                        <div>{item.supplier?.name || 'N/A'}</div>
                                                        {item.supplier?.company && (
                                                            <div className="text-xs text-gray-500">
                                                                {item.supplier.company}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>{getTypeBadge(item.return_type)}</td>
                                                    <td>
                                                        <div className="font-medium">
                                                            ৳{formatCurrency(item.total_return_amount)}
                                                        </div>
                                                    </td>
                                                    <td>{getStatusBadge(item.status)}</td>
                                                    <td>{formatDate(item.created_at)}</td>
                                                    <td>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => toggleRowExpand(item.id)}
                                                                className="btn btn-xs btn-ghost"
                                                            >
                                                                {expandedRows.includes(item.id) ? (
                                                                    <ChevronUp size={14} />
                                                                ) : (
                                                                    <ChevronDown size={14} />
                                                                )}
                                                            </button>

                                                            <Link
                                                                href={route('purchase-return.show', item.id)}
                                                                className="btn btn-xs btn-ghost"
                                                            >
                                                                <Eye size={14} />
                                                            </Link>

                                                            {item.status === 'pending' && (
                                                                <button
                                                                    onClick={() => handleApprove(item.id)}
                                                                    className="btn btn-xs btn-success"
                                                                >
                                                                    <CheckCircle size={14} />
                                                                </button>
                                                            )}

                                                            {item.status === 'approved' && (
                                                                <button
                                                                    onClick={() => handleComplete(item.id)}
                                                                    className={`btn btn-xs ${item.return_type === 'money_back' ? 'btn-primary' : 'btn-warning'}`}
                                                                >
                                                                    {item.return_type === 'money_back' ? (
                                                                        <DollarSign size={14} />
                                                                    ) : (
                                                                        <Package size={14} />
                                                                    )}
                                                                </button>
                                                            )}

                                                            {item.status === 'pending' && (
                                                                <button
                                                                    onClick={() => handleDelete(item)}
                                                                    className="btn btn-xs btn-error"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>

                                                {expandedRows.includes(item.id) && (
                                                    <tr>
                                                        <td colSpan="8" className="bg-base-100">
                                                            <div className="p-4 border-t border-base-300">
                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                    <div>
                                                                        <h4 className="font-semibold text-sm mb-2">Details</h4>
                                                                        <div className="space-y-2 text-sm">
                                                                            <div className="flex justify-between">
                                                                                <span className="text-gray-600">Warehouse:</span>
                                                                                <span>{item.warehouse?.name || 'N/A'}</span>
                                                                            </div>
                                                                            <div className="flex justify-between">
                                                                                <span className="text-gray-600">Created By:</span>
                                                                                <span>{item.creator?.name || 'System'}</span>
                                                                            </div>
                                                                            <div className="flex justify-between">
                                                                                <span className="text-gray-600">Payment Type:</span>
                                                                                <span>{item.payment_type || 'N/A'}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div>
                                                                        <h4 className="font-semibold text-sm mb-2">Amount Details</h4>
                                                                        <div className="space-y-2 text-sm">
                                                                            <div className="flex justify-between">
                                                                                <span className="text-gray-600">Total Return:</span>
                                                                                <span className="font-medium">
                                                                                    ৳{formatCurrency(item.total_return_amount)}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex justify-between">
                                                                                <span className="text-gray-600">Refunded:</span>
                                                                                <span className="text-success">
                                                                                    ৳{formatCurrency(item.refunded_amount)}
                                                                                </span>
                                                                            </div>
                                                                            {item.return_type === 'product_replacement' && (
                                                                                <div className="flex justify-between">
                                                                                    <span className="text-gray-600">Replacement Total:</span>
                                                                                    <span className="text-warning">
                                                                                        ৳{formatCurrency(item.replacement_total || 0)}
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <div>
                                                                        <h4 className="font-semibold text-sm mb-2">Reason & Notes</h4>
                                                                        <p className="text-sm text-gray-700">{item.reason || 'No reason provided'}</p>
                                                                        {item.notes && (
                                                                            <p className="text-xs text-gray-500 mt-2">{item.notes}</p>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="mt-4 pt-4 border-t border-base-300">
                                                                    <div className="flex gap-2">
                                                                        <Link
                                                                            href={route('purchase-return.show', item.id)}
                                                                            className="btn btn-sm btn-outline"
                                                                        >
                                                                            <Eye size={14} className="mr-2" />
                                                                            View Details
                                                                        </Link>

                                                                        {item.status === 'pending' && (
                                                                            <button
                                                                                onClick={() => handleApprove(item.id)}
                                                                                className="btn btn-sm btn-success"
                                                                            >
                                                                                <CheckCircle size={14} className="mr-2" />
                                                                                Approve
                                                                            </button>
                                                                        )}

                                                                        {item.status === 'approved' && (
                                                                            <button
                                                                                onClick={() => handleComplete(item.id)}
                                                                                className={`btn btn-sm ${item.return_type === 'money_back' ? 'btn-primary' : 'btn-warning'}`}
                                                                            >
                                                                                {item.return_type === 'money_back' ? (
                                                                                    <>
                                                                                        <DollarSign size={14} className="mr-2" />
                                                                                        Complete Refund
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <Package size={14} className="mr-2" />
                                                                                        Complete Replacement
                                                                                    </>
                                                                                )}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        ))}
                                    </tbody>
                                </table>

                                {returns.data.length === 0 && (
                                    <div className="text-center py-12">
                                        <RefreshCw size={48} className="mx-auto text-gray-300 mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-500 mb-2">
                                            No purchase returns found
                                        </h3>
                                        <p className="text-gray-400 mb-4">
                                            Create a new purchase return or adjust your filters
                                        </p>
                                        <Link
                                            href={route('purchase-return.create')}
                                            className="btn btn-primary"
                                        >
                                            <Plus size={16} className="mr-2" />
                                            Create Return
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Pagination */}
                            {returns.links && returns.links.length > 3 && (
                                <div className="flex justify-center mt-6">
                                    <div className="join">
                                        {returns.links.map((link, index) => (
                                            <button
                                                key={index}
                                                onClick={() => {
                                                    if (link.url) {
                                                        router.get(link.url);
                                                    }
                                                }}
                                                className={`join-item btn btn-sm ${link.active ? 'btn-primary' : ''} ${!link.url ? 'btn-disabled' : ''}`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold">Confirm Delete</h3>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="btn btn-sm btn-circle"
                            >
                                ✕
                            </button>
                        </div>

                        <AlertCircle size={48} className="mx-auto text-error mb-4" />

                        <p className="text-center mb-4">
                            Are you sure you want to delete this purchase return? This action cannot be undone.
                        </p>

                        {selectedReturn && (
                            <div className="bg-base-200 p-3 rounded-box mb-4">
                                <p><strong>Return No:</strong> {selectedReturn.return_no}</p>
                                <p><strong>Amount:</strong> ৳{formatCurrency(selectedReturn.total_return_amount)}</p>
                                <p><strong>Status:</strong> {selectedReturn.status}</p>
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="btn btn-ghost"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="btn btn-error"
                            >
                                <Trash2 size={16} className="mr-2" />
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}