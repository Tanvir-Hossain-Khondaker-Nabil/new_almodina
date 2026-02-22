import { Head, Link } from '@inertiajs/react';
import PageHeader from '@/Components/PageHeader';
import {
    ArrowLeft,
    DollarSign,
    Package,
    Calendar,
    User,
    Building,
    Warehouse as WarehouseIcon,
    FileText,
    Printer,
    Download,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    RefreshCw,
    Hash,
    Eye,
    Edit,
    Trash2,
} from 'lucide-react';

export default function Show({ return: returnItem, isShadowUser }) {
    const formatCurrency = (value) => {
        const num = Number(value) || 0;
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(num);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: <span className="badge badge-warning">Pending</span>,
            approved: <span className="badge badge-info">Approved</span>,
            completed: <span className="badge badge-success">Completed</span>,
            cancelled: <span className="badge badge-error">Cancelled</span>,
        };
        return badges[status];
    };

    const getTypeBadge = (type) => {
        if (type === 'money_back') {
            return <span className="badge badge-primary">Money Back</span>;
        } else if (type === 'product_replacement') {
            return <span className="badge badge-warning">Replacement</span>;
        }
        return <span className="badge">{type}</span>;
    };

    return (
        <div className="py-6">
            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <PageHeader
                    title={`Purchase Return: ${returnItem.return_no}`}
                    subtitle={`Status: ${returnItem.status} | Type: ${returnItem.return_type}`}
                >
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('purchase-return.list')}
                            className="btn btn-sm btn-ghost"
                        >
                            <ArrowLeft size={16} className="mr-2" />
                            Back to List
                        </Link>

                        {returnItem.status === 'pending' && (
                            <>
                                {/* <Link
                                    href={route('purchase-return.edit', returnItem.id)}
                                    className="btn btn-sm btn-warning"
                                >
                                    <Edit size={16} className="mr-2" />
                                    Edit
                                </Link> */}

                                <Link
                                    href={route('purchase-return.destroy', returnItem.id)}
                                    method="delete"
                                    as="button"
                                    className="btn btn-sm btn-error"
                                    onClick={(e) => {
                                        if (!confirm('Are you sure you want to delete this return?')) {
                                            e.preventDefault();
                                        }
                                    }}
                                >
                                    <Trash2 size={16} className="mr-2" />
                                    Delete
                                </Link>
                            </>
                        )}
                    </div>
                </PageHeader>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Left Column - Return Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Info Card */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body">
                                <h3 className="card-title text-sm font-semibold mb-4">
                                    Return Information
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Hash size={16} className="text-gray-400" />
                                            <div>
                                                <div className="text-xs text-gray-500">Return No</div>
                                                <div className="font-medium">{returnItem.return_no}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Calendar size={16} className="text-gray-400" />
                                            <div>
                                                <div className="text-xs text-gray-500">Return Date</div>
                                                <div className="font-medium">{formatDate(returnItem.return_date)}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <FileText size={16} className="text-gray-400" />
                                            <div>
                                                <div className="text-xs text-gray-500">Status</div>
                                                <div>{getStatusBadge(returnItem.status)}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Hash size={16} className="text-gray-400" />
                                            <div>
                                                <div className="text-xs text-gray-500">Purchase No</div>
                                                <div className="font-medium">{returnItem.purchase?.purchase_no || 'N/A'}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Building size={16} className="text-gray-400" />
                                            <div>
                                                <div className="text-xs text-gray-500">Supplier</div>
                                                <div className="font-medium">{returnItem.supplier?.name || 'N/A'}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <WarehouseIcon size={16} className="text-gray-400" />
                                            <div>
                                                <div className="text-xs text-gray-500">Warehouse</div>
                                                <div className="font-medium">{returnItem.warehouse?.name || 'N/A'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Reason & Notes */}
                                <div className="mt-6 pt-6 border-t border-base-300">
                                    <h4 className="font-semibold text-sm mb-2">Reason for Return</h4>
                                    <p className="text-gray-700">{returnItem.reason || 'No reason provided'}</p>

                                    {returnItem.notes && (
                                        <>
                                            <h4 className="font-semibold text-sm mt-4 mb-2">Additional Notes</h4>
                                            <p className="text-gray-600 text-sm">{returnItem.notes}</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Items to Return */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body">
                                <h3 className="card-title text-sm font-semibold mb-4 flex items-center gap-2">
                                    <Package size={16} />
                                    Items to Return ({returnItem.items?.length || 0})
                                </h3>

                                {returnItem.items && returnItem.items.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="table table-zebra w-full">
                                            <thead>
                                                <tr>
                                                    <th>Product</th>
                                                    <th>Variant</th>
                                                    <th className="text-right">Quantity</th>
                                                    <th className="text-right">Unit Price</th>
                                                    <th className="text-right">Total</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {returnItem.items.map((item, index) => (
                                                    <tr key={index}>
                                                        <td>
                                                            <div className="font-medium">{item.product?.name || 'Unknown'}</div>
                                                        </td>
                                                        <td>{item.variant?.name || 'Default'}</td>
                                                        <td className="text-right">{item.return_quantity}</td>
                                                        <td className="text-right">
                                                            ৳{formatCurrency(item.unit_price)}
                                                        </td>
                                                        <td className="text-right font-medium">
                                                            ৳{formatCurrency(item.total_price)}
                                                        </td>
                                                        <td>
                                                            <span className={`badge badge-sm ${item.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                                                                {item.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr>
                                                    <td colSpan="4" className="text-right font-semibold">
                                                        Total Return Value:
                                                    </td>
                                                    <td className="text-right font-bold text-lg">
                                                        ৳{formatCurrency(returnItem.total_return_amount)}
                                                    </td>
                                                    <td></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Package size={32} className="mx-auto text-gray-300 mb-2" />
                                        <p className="text-gray-500">No items to return</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Replacement Products (if applicable) */}
                        {returnItem.return_type === 'product_replacement' && returnItem.replacementProducts && returnItem.replacementProducts.length > 0 && (
                            <div className="card bg-base-100 border border-base-300">
                                <div className="card-body">
                                    <h3 className="card-title text-sm font-semibold mb-4 flex items-center gap-2">
                                        <RefreshCw size={16} />
                                        Replacement Products ({returnItem.replacementProducts.length})
                                    </h3>

                                    <div className="overflow-x-auto">
                                        <table className="table table-zebra w-full">
                                            <thead>
                                                <tr>
                                                    <th>Product</th>
                                                    <th>Variant</th>
                                                    <th className="text-right">Quantity</th>
                                                    <th className="text-right">Unit Price</th>
                                                    <th className="text-right">Total</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {returnItem.replacementProducts.map((product, index) => (
                                                    <tr key={index}>
                                                        <td>
                                                            <div className="font-medium">{product.product?.name || 'Unknown'}</div>
                                                        </td>
                                                        <td>{product.variant?.name || 'Default'}</td>
                                                        <td className="text-right">{product.quantity}</td>
                                                        <td className="text-right">
                                                            ৳{formatCurrency(product.unit_price)}
                                                        </td>
                                                        <td className="text-right font-medium">
                                                            ৳{formatCurrency(product.total_price)}
                                                        </td>
                                                        <td>
                                                            <span className={`badge badge-sm ${product.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                                                                {product.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr>
                                                    <td colSpan="4" className="text-right font-semibold">
                                                        Total Replacement Value:
                                                    </td>
                                                    <td className="text-right font-bold text-lg text-warning">
                                                        ৳{formatCurrency(returnItem.replacement_total || 0)}
                                                    </td>
                                                    <td></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>

                                    {/* Net Difference */}
                                    <div className="mt-6 pt-6 border-t border-base-300">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="font-semibold">Net Difference</div>
                                                <div className="text-sm text-gray-500">
                                                    Replacement Value - Return Value
                                                </div>
                                            </div>
                                            <div className={`text-xl font-bold ${(returnItem.replacement_total - returnItem.total_return_amount) > 0 ? 'text-error' : 'text-success'}`}>
                                                {returnItem.replacement_total - returnItem.total_return_amount > 0 ? '+' : ''}
                                                ৳{formatCurrency(returnItem.replacement_total - returnItem.total_return_amount)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Summary & Actions */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Summary Card */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body">
                                <h3 className="card-title text-sm font-semibold mb-4">
                                    Summary
                                </h3>

                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Return Type:</span>
                                        <span>{getTypeBadge(returnItem.return_type)}</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Payment Type:</span>
                                        <span>{returnItem.payment_type || 'N/A'}</span>
                                    </div>

                                    <div className="divider"></div>

                                    <div className="flex justify-between">
                                        <span className="font-medium">Total Return:</span>
                                        <span className="font-bold">৳{formatCurrency(returnItem.total_return_amount)}</span>
                                    </div>

                                    {returnItem.return_type === 'money_back' && (
                                        <div className="flex justify-between">
                                            <span className="font-medium">Refunded Amount:</span>
                                            <span className="font-bold text-success">
                                                ৳{formatCurrency(returnItem.refunded_amount)}
                                            </span>
                                        </div>
                                    )}

                                    {returnItem.return_type === 'product_replacement' && (
                                        <div className="flex justify-between">
                                            <span className="font-medium">Replacement Total:</span>
                                            <span className="font-bold text-warning">
                                                ৳{formatCurrency(returnItem.replacement_total || 0)}
                                            </span>
                                        </div>
                                    )}

                                    
                                </div>
                            </div>
                        </div>

                        {/* Timeline Card */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body">
                                <h3 className="card-title text-sm font-semibold mb-4">
                                    Timeline
                                </h3>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0">
                                            <User size={16} className="text-gray-400" />
                                        </div>
                                        <div>
                                            <div className="font-medium">Created</div>
                                            <div className="text-sm text-gray-500">
                                                By {returnItem.creator?.name || 'System'} on {formatDate(returnItem.created_at)}
                                            </div>
                                        </div>
                                    </div>

                                    {returnItem.approved_at && (
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0">
                                                <CheckCircle size={16} className="text-success" />
                                            </div>
                                            <div>
                                                <div className="font-medium">Approved</div>
                                                <div className="text-sm text-gray-500">
                                                    {returnItem.approver?.name ? `By ${returnItem.approver.name} on ` : ''}
                                                    {formatDate(returnItem.approved_at)}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {returnItem.completed_at && (
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0">
                                                <CheckCircle size={16} className="text-success" />
                                            </div>
                                            <div>
                                                <div className="font-medium">Completed</div>
                                                <div className="text-sm text-gray-500">
                                                    {returnItem.completer?.name ? `By ${returnItem.completer.name} on ` : ''}
                                                    {formatDate(returnItem.completed_at)}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {returnItem.cancelled_at && (
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0">
                                                <XCircle size={16} className="text-error" />
                                            </div>
                                            <div>
                                                <div className="font-medium">Cancelled</div>
                                                <div className="text-sm text-gray-500">
                                                    {returnItem.canceller?.name ? `By ${returnItem.canceller.name} on ` : ''}
                                                    {formatDate(returnItem.cancelled_at)}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions Card */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body">
                                <h3 className="card-title text-sm font-semibold mb-4">
                                    Actions
                                </h3>

                                <div className="space-y-3">
                                    <Link
                                        href={route('purchase.show', returnItem.purchase_id)}
                                        className="btn btn-outline w-full justify-start"
                                    >
                                        <Eye size={16} className="mr-2" />
                                        View Purchase
                                    </Link>
                                   
                                </div>

                                {/* Status Actions */}
                                <div className="mt-6 pt-6 border-t border-base-300">
                                    {returnItem.status === 'pending' && (
                                        <Link
                                            href={route('purchase-return.approve', returnItem.id)}
                                            method="post"
                                            as="button"
                                            className="btn btn-success w-full"
                                            onClick={(e) => {
                                                if (!confirm('Are you sure you want to approve this return?')) {
                                                    e.preventDefault();
                                                }
                                            }}
                                        >
                                            <CheckCircle size={16} className="mr-2" />
                                            Approve Return
                                        </Link>
                                    )}

                                    {returnItem.status === 'approved' && (
                                        <Link
                                            href={route('purchase-return.complete', returnItem.id)}
                                            method="post"
                                            as="button"
                                            className={`btn w-full ${returnItem.return_type === 'money_back' ? 'btn-primary' : 'btn-warning'}`}
                                            onClick={(e) => {
                                                const message = returnItem.return_type === 'money_back'
                                                    ? 'Are you sure you want to complete this refund?'
                                                    : 'Are you sure you want to complete this product replacement?';
                                                if (!confirm(message)) {
                                                    e.preventDefault();
                                                }
                                            }}
                                        >
                                            {returnItem.return_type === 'money_back' ? (
                                                <>
                                                    <DollarSign size={16} className="mr-2" />
                                                    Complete Refund
                                                </>
                                            ) : (
                                                <>
                                                    <Package size={16} className="mr-2" />
                                                    Complete Replacement
                                                </>
                                            )}
                                        </Link>
                                    )}

                                    {/* {(returnItem.status === 'pending' || returnItem.status === 'approved') && (
                                        <Link
                                            href={route('purchase-return.cancel', returnItem.id)}
                                            method="post"
                                            as="button"
                                            className="btn btn-error w-full mt-3"
                                            onClick={(e) => {
                                                if (!confirm('Are you sure you want to cancel this return?')) {
                                                    e.preventDefault();
                                                }
                                            }}
                                        >
                                            <XCircle size={16} className="mr-2" />
                                            Cancel Return
                                        </Link>
                                    )} */}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}