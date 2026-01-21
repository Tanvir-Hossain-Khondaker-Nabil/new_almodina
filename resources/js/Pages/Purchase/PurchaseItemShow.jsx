import { Link, router } from "@inertiajs/react";
import PageHeader from "../../components/PageHeader";
import { 
    ArrowLeft, 
    Eye, 
    Package, 
    User, 
    Building, 
    Calendar,
    DollarSign,
    Percent,
    Hash,
    FileText,
    Trash2,
    Printer,
    Download,
    Truck,
    Receipt,
    ShieldCheck
} from "lucide-react";
import { toast } from "react-toastify";
import { useRef } from "react";

export default function PurchaseItemShow({ purchaseItem, isShadowUser,business }) {
    const printRef = useRef();

    console.log('Business Info:', business);

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this purchase item? This action cannot be undone.')) {
            router.delete(route('purchases.items.destroy', { id: purchaseItem.id }), {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Purchase item deleted successfully');
                },
                onError: () => {
                    toast.error('Failed to delete purchase item');
                }
            });
        }
    };

    const calculateItemTotal = () => {
        const cost = parseFloat(purchaseItem.unit_price) || 0;
        const quantity = parseFloat(purchaseItem.quantity) || 0;
        const tax = parseFloat(purchaseItem.tax_rate) || 0;
        
        const subtotal = cost * quantity;
        const taxAmount = (subtotal * tax) / 100;
        return (subtotal + taxAmount).toFixed(2);
    };

    const calculateTaxAmount = () => {
        const cost = parseFloat(purchaseItem.unit_price) || 0;
        const quantity = parseFloat(purchaseItem.quantity) || 0;
        const tax = parseFloat(purchaseItem.tax_rate) || 0;
        
        return ((cost * quantity * tax) / 100).toFixed(2);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDateForPrint = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const getVariantText = () => {
        if (!purchaseItem.variant) return purchaseItem.variant_name;
        
        const variant = purchaseItem.variant;
        let attrsText = '';
        
        if (variant.attribute_values) {
            if (typeof variant.attribute_values === 'object') {
                attrsText = Object.entries(variant.attribute_values)
                    .map(([key, value]) => `${value}`)
                    .join(', ');
            } else {
                attrsText = variant.attribute_values;
            }
        }
        
        return attrsText  ;
    };

    const getBrandText = () => {
        if (!purchaseItem.variant) return 'N/A';
        
        const variant = purchaseItem.variant;
        let attrsText = '';
        
        if (variant.attribute_values) {
            if (typeof variant.attribute_values === 'object') {
                attrsText = Object.entries(variant.attribute_values)
                    .map(([key, value]) => `${key}`)
                    .join(', ');
            } else {
                attrsText = variant.attribute_values;
            }
        }
        
        return attrsText || 'N/A';
    };

    const getPaymentStatusBadge = (status) => {
        const badges = {
            'paid': 'badge-success',
            'partial': 'badge-warning',
            'pending': 'badge-error',
            'due': 'badge-error'
        };
        
        return badges[status] || 'badge-info';
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Purchase Item Receipt - #${purchaseItem.id}</title>
                <style>
                    @media print {
                        @page {
                            margin: 0.2in;
                            size: A4;
                        }
                        body {
                            margin: 0;
                            padding: 0;
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            color: #1a202c;
                            line-height: 1.3;
                            font-size: 12px;
                            background: #fff;
                        }
                        .print-container {
                            max-width: 100%;
                            margin: 0 auto;
                            padding: 0;
                        }
                        .no-print { display: none !important; }
                        .print-break { page-break-inside: avoid; }
                        .print-mt-1 { margin-top: 0.25rem; }
                        .print-mt-2 { margin-top: 0.5rem; }
                        .print-mt-3 { margin-top: 0.75rem; }
                        .print-mb-1 { margin-bottom: 0.25rem; }
                        .print-mb-2 { margin-bottom: 0.5rem; }
                        .print-mb-3 { margin-bottom: 0.75rem; }
                        .print-mb-4 { margin-bottom: 1rem; }
                        .print-p-2 { padding: 0.5rem; }
                        .print-p-3 { padding: 0.75rem; }
                        .print-p-4 { padding: 1rem; }
                        .print-border { border: 1px solid #e2e8f0; }
                        .print-border-t { border-top: 2px solid #10b981; }
                        .print-border-b { border-bottom: 1px solid #e2e8f0; }
                        .print-bg-green-50 { background-color: #f0fdf4; }
                        .print-bg-blue-50 { background-color: #ebf8ff; }
                        .print-bg-gray-50 { background-color: #f7fafc; }
                        .print-text-center { text-align: center; }
                        .print-text-right { text-align: right; }
                        .print-text-left { text-align: left; }
                        .print-text-xs { font-size: 0.75rem; }
                        .print-text-sm { font-size: 0.875rem; }
                        .print-text-base { font-size: 1rem; }
                        .print-text-lg { font-size: 1.125rem; }
                        .print-text-xl { font-size: 1.25rem; }
                        .print-font-bold { font-weight: bold; }
                        .print-font-semibold { font-weight: 600; }
                        .print-font-medium { font-weight: 500; }
                        .print-text-gray-600 { color: #718096; }
                        .print-text-gray-700 { color: #4a5568; }
                        .print-text-gray-800 { color: #2d3748; }
                        .print-text-gray-900 { color: #1a202c; }
                        .print-text-green-600 { color: #059669; }
                        .print-text-green-700 { color: #047857; }
                        .print-text-blue-600 { color: #3182ce; }
                        .print-text-red-600 { color: #e53e3e; }
                        .print-text-purple-600 { color: #805ad5; }
                        .print-rounded { border-radius: 0.25rem; }
                        .print-rounded-lg { border-radius: 0.375rem; }
                        .print-grid { display: grid; }
                        .print-grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                        .print-grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
                        .print-grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
                        .print-gap-2 { gap: 0.5rem; }
                        .print-gap-3 { gap: 0.75rem; }
                        .print-gap-4 { gap: 1rem; }
                        .print-flex { display: flex; }
                        .print-flex-col { flex-direction: column; }
                        .print-justify-between { justify-content: space-between; }
                        .print-justify-end { justify-content: flex-end; }
                        .print-justify-center { justify-content: center; }
                        .print-items-start { align-items: flex-start; }
                        .print-items-center { align-items: center; }
                        .print-space-y-1 > * + * { margin-top: 0.25rem; }
                        .print-space-y-2 > * + * { margin-top: 0.5rem; }
                        .print-w-full { width: 100%; }
                        .print-w-48 { width: 12rem; }
                        .print-w-64 { width: 16rem; }
                        .table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 11px; }
                        .table th, .table td { padding: 6px 8px; text-align: left; border-bottom: 1px solid #e2e8f0; }
                        .table th { background-color: #edf2f7; font-weight: 600; color: #4a5568; }
                        .table tbody tr:last-child td { border-bottom: none; }
                        .highlight-box { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 0.4rem 0.75rem; border-radius: 0.25rem; }
                        .accent-border { border-left: 3px solid #10b981; }
                        .section-header { padding: 0.5rem 0.75rem; background-color: #f7fafc; border-radius: 0.25rem; margin-bottom: 0.75rem; font-weight: 600; color: #2d3748; font-size: 0.875rem; }
                        .info-card { padding: 0.75rem; background-color: white; border: 1px solid #e2e8f0; border-radius: 0.375rem; margin-bottom: 0.75rem; }
                        .divider { height: 1px; background: linear-gradient(to right, transparent, #e2e8f0, transparent); margin: 0.75rem 0; }
                        .badge { display: inline-block; padding: 0.2rem 0.4rem; font-size: 0.7rem; font-weight: 600; border-radius: 0.2rem; }
                        .badge-success { background-color: #d1fae5; color: #065f46; }
                        .badge-warning { background-color: #fef3c7; color: #92400e; }
                        .badge-error { background-color: #fee2e2; color: #991b1b; }
                        .badge-info { background-color: #dbeafe; color: #1e40af; }
                        .badge-primary { background-color: #e0e7ff; color: #3730a3; }
                        .compact { margin: 0; padding: 0; }
                    }
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    @page { size: A4; }
                </style>
            </head>
            <body>
                <div class="print-container">
                    ${printRef.current.innerHTML}
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() {
                            window.close();
                        }, 100);
                    };
                </script>
            </body>
            </html>
        `;
        
        printWindow.document.write(printContent);
        printWindow.document.close();
    };

    const handleDownload = () => {
        handlePrint();
    };

    return (
        <>
            <div className="bg-white rounded-box p-5">
                <PageHeader 
                    title="Iduvisul Purchase Items" 
                    description="Detailed information about purchased inventory items"
                />
                
                {/* Header with Actions */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('purchase.items')}
                            className="btn btn-ghost btn-circle"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Purchase Item Details</h1>
                            <p className="text-gray-600">Complete information about the purchased item</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="btn btn-outline btn-sm no-print"
                        >
                            <Printer size={14} />
                            Print
                        </button>
                        <button
                            onClick={handleDownload}
                            className="btn btn-outline btn-sm no-print"
                        >
                            <Download size={14} />
                            Download
                        </button>
                        {/* <Link
                            href={route('purchases.show', { id: purchaseItem.purchase_id })}
                            className="btn bg-[#1e4d2b] text-white btn-sm no-print"
                        >
                            <Eye size={14} />
                            View Purchase
                        </Link> */}
                        {!isShadowUser && (
                            <button
                                onClick={handleDelete}
                                className="btn btn-error btn-sm no-print"
                            >
                                <Trash2 size={14} />
                                Delete
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Information */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Product Information Card */}
                        <div className="card bg-base-100 border">
                            <div className="card-body">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-[#1e4d2b] text-white rounded-box">
                                        <Package className="w-6 h-6 text-primary" />
                                    </div>
                                    <h2 className="card-title">Product Information</h2>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="label font-semibold">Product Name</label>
                                        <p className="text-lg">{purchaseItem.product?.name || purchaseItem?.product_name}</p>
                                    </div>
                                    <div>
                                        <label className="label font-semibold">Product Code</label>
                                        <p className="text-lg">{purchaseItem.product?.product_no || purchaseItem?.product_name}</p>
                                    </div>
                                    <div>
                                        <label className="label font-semibold">Variant</label>
                                        <p>{getVariantText()}</p>
                                        <span className="text-sm text-gray-500">
                                            {purchaseItem.variant?.sku ? `SKU: ${purchaseItem.variant.sku}` :  'No Sku'}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="label font-semibold">Batch Number</label>
                                        <p className="text-lg">
                                            {purchaseItem.batch_number || <span className="text-gray-400">Not specified</span>}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Purchase & Pricing Information */}
                        <div className="card bg-base-100 border">
                            <div className="card-body">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-success/10 rounded-box">
                                        <DollarSign className="w-6 h-6 text-success" />
                                    </div>
                                    <h2 className="card-title">Pricing Information</h2>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="label font-semibold">Unit Cost</label>
                                        <p className="text-xl font-bold text-success">
                                            {parseFloat(purchaseItem.unit_price).toFixed(2)} Tk
                                        </p>
                                    </div>
                                    <div>
                                        <label className="label font-semibold">Quantity</label>
                                        <p className="text-xl font-bold">
                                            <Hash size={16} className="inline mr-1" />
                                            {purchaseItem.quantity}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="label font-semibold">Tax Rate</label>
                                        <p className="text-xl font-bold text-warning">
                                            {purchaseItem.tax_rate || 0}%
                                        </p>
                                    </div>
                                    <div>
                                        <label className="label font-semibold">Tax Amount</label>
                                        <p className="text-lg font-bold text-purple-600">
                                            {calculateTaxAmount()} Tk
                                        </p>
                                    </div>
                                    <div>
                                        <label className="label font-semibold">Subtotal</label>
                                        <p className="text-lg font-bold">
                                            {(purchaseItem.unit_price * purchaseItem.quantity).toFixed(2)} Tk
                                        </p>
                                    </div>
                                    <div>
                                        <label className="label font-semibold">Total Amount</label>
                                        <p className="text-2xl font-bold text-primary">
                                            {calculateItemTotal()} Tk
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Information */}
                    <div className="space-y-6">
                        {/* Supplier Information */}
                        <div className="card bg-base-100 border">
                            <div className="card-body">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-info/10 rounded-box">
                                        <Truck className="w-6 h-6 text-info" />
                                    </div>
                                    <h2 className="card-title">Supplier</h2>
                                </div>
                                
                                <div className="space-y-3">
                                    <div>
                                        <label className="label font-semibold">Name</label>
                                        <p>{purchaseItem.purchase?.supplier?.name || purchaseItem?.supplier?.name || purchaseItem?.supplier_id}</p>
                                    </div>
                                   <div>
                                        <label className="label font-semibold">Phone</label>
                                        <p>
                                            {purchaseItem.purchase?.supplier?.phone
                                                ? purchaseItem.purchase.supplier.phone
                                                : purchaseItem?.supplier?.phone || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="label font-semibold">Email</label>
                                        <p>
                                            {purchaseItem.purchase?.supplier?.email
                                                ? purchaseItem.purchase.supplier.email
                                                : purchaseItem?.supplier?.email || 'N/A'}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="label font-semibold">Address</label>
                                        <p>
                                            {purchaseItem.purchase?.supplier?.address
                                                ? purchaseItem.purchase.supplier.address
                                                : purchaseItem?.supplier?.address || 'N/A'}
                                        </p>
                                    </div>
                         
                                </div>
                            </div>
                        </div>

                        {/* Warehouse & Purchase Info */}
                        <div className="card bg-base-100 border">
                            <div className="card-body">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-warning/10 rounded-box">
                                        <Building className="w-6 h-6 text-warning" />
                                    </div>
                                    <h2 className="card-title">Location & Purchase</h2>
                                </div>
                                
                                <div className="space-y-3">
                                    <div>
                                        <label className="label font-semibold">Warehouse</label>
                                        <p>{purchaseItem.warehouse?.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="label font-semibold">Purchase Invoice</label>
                                        <p className="font-mono">{purchaseItem.purchase?.purchase_no || ('pickup-' + purchaseItem.id)}</p>
                                    </div>
                                    <div>
                                        <label className="label font-semibold">Payment Status</label>
                                        <span className={`badge rounded  ${getPaymentStatusBadge(purchaseItem.purchase?.payment_status)}`}>
                                             { purchaseItem.purchase?.payment_status || 'Paid'}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="label font-semibold">Purchased By</label>
                                        <p>{purchaseItem.purchase?.user?.name || 'System Admin'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Timestamp Information */}
                        <div className="card bg-base-100 border">
                            <div className="card-body">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-gray-100 rounded-box">
                                        <Calendar className="w-6 h-6 text-gray-600" />
                                    </div>
                                    <h2 className="card-title">Timestamps</h2>
                                </div>
                                
                                <div className="space-y-3">
                                    <div>
                                        <label className="label font-semibold">Purchase Date</label>
                                        <p>{formatDate(purchaseItem.created_at)}</p>
                                    </div>
                                    {purchaseItem.purchase?.purchase_date && (
                                        <div>
                                            <label className="label font-semibold">Order Date</label>
                                            <p>{formatDate(purchaseItem.purchase.purchase_date)}</p>
                                        </div>
                                    )}
                                    <div>
                                        <label className="label font-semibold">Last Updated</label>
                                        <p>{formatDate(purchaseItem.updated_at)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Calculation Breakdown */}
                <div className="mt-6 card bg-base-100 border">
                    <div className="card-body">
                        <h3 className="card-title mb-4">Calculation Breakdown</h3>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
                            <div className="p-4 bg-base-200 rounded-box">
                                <div className="text-sm text-gray-600">Unit Cost</div>
                                <div className="text-lg font-bold">{parseFloat(purchaseItem.unit_price).toFixed(2)} Tk</div>
                            </div>
                            <div className="p-4 bg-base-200 rounded-box">
                                <div className="text-sm text-gray-600">Quantity</div>
                                <div className="text-lg font-bold">{purchaseItem.quantity}</div>
                            </div>
                            <div className="p-4 bg-base-200 rounded-box">
                                <div className="text-sm text-gray-600">Subtotal</div>
                                <div className="text-lg font-bold">
                                    {(purchaseItem.unit_price * purchaseItem.quantity).toFixed(2)} Tk
                                </div>
                            </div>
                            <div className="p-4 bg-purple-50 rounded-box">
                                <div className="text-sm text-gray-600">Tax ({purchaseItem.tax_rate || 0}%)</div>
                                <div className="text-lg font-bold text-purple-600">
                                    {calculateTaxAmount()} Tk
                                </div>
                            </div>
                            <div className="p-4 bg-success/10 rounded-box">
                                <div className="text-sm text-gray-600">Final Total</div>
                                <div className="text-lg font-bold text-success">
                                    {calculateItemTotal()} Tk
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes Section */}
                {purchaseItem.purchase?.notes && (
                    <div className="mt-6 card bg-base-100 border">
                        <div className="card-body">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-info/10 rounded-box">
                                    <FileText className="w-6 h-6 text-info" />
                                </div>
                                <h2 className="card-title">Purchase Notes</h2>
                            </div>
                            <div className="bg-base-100 p-4 rounded-box">
                                <p className="whitespace-pre-line">{purchaseItem.purchase.notes}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Hidden Print View - COMPACT VERSION */}
            <div className="hidden">
                <div ref={printRef} className="print-p-3 compact">
                    {/* Header */}
                    <div className="print-text-center print-mb-4">
                        <div className="highlight-box print-mb-3">
                            <h1 className="print-text-xl print-font-bold">PURCHASE ITEM RECEIPT</h1>
                            <p className="print-text-xs print-mt-1">Official Purchase Item Confirmation</p>
                        </div>
                        
                        <div className="print-flex print-justify-center print-gap-4">
                            <div className="print-text-center">
                                <p className="print-text-xs print-font-medium print-text-gray-700">Receipt #</p>
                                <p className="print-text-sm print-font-bold print-text-green-700">PURCHASE-ITEM-{purchaseItem.id}</p>
                            </div>
                            <div className="print-text-center">
                                <p className="print-text-xs print-font-medium print-text-gray-700">Invoice</p>
                                <p className="print-text-sm print-font-bold print-text-green-700">{purchaseItem.purchase?.purchase_no || ('pickup-' + purchaseItem.id)}</p>
                            </div>
                            <div className="print-text-center">
                                <p className="print-text-xs print-font-medium print-text-gray-700">Date</p>
                                <p className="print-text-sm print-font-bold print-text-green-700">{formatDateForPrint(purchaseItem.created_at)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Company & Supplier Info */}
                    <div className="print-grid print-grid-cols-2 print-gap-3 print-mb-4">
                        <div className="info-card accent-border">
                            <h3 className="print-text-sm print-font-semibold print-mb-2 print-text-gray-800">TO</h3>
                            <div className="print-space-y-1">
                                <p className="print-text-base print-font-bold print-text-gray-900">{business?.name || 'Business Name'}</p>
                                <p className="print-text-xs print-text-gray-700">{business?.address || '123 Business Street'}</p>
                                <p className="print-text-xs print-text-gray-700">{business?.email || 'info@iduvisul.com'} ( {business?.phone || 'N/A'} )</p>
                                <p className="print-text-xs print-text-gray-700">{business?.website || 'N/A'}</p>


                                <div className="print-mt-2">
                                    <span className="badge badge-success">Purchase Item</span>
                                    <span className={`badge ${getPaymentStatusBadge(purchaseItem.purchase?.payment_status)} print-ml-2`}>
                                        {purchaseItem.purchase?.payment_status || 'Paid'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="info-card accent-border">
                            <h3 className="print-text-sm print-font-semibold print-mb-2 print-text-gray-800">FROM</h3>
                            <div className="print-space-y-1">
                                <p className="print-text-base print-font-bold print-text-gray-900">
                                    {purchaseItem.purchase?.supplier?.name || purchaseItem?.supplier?.name || purchaseItem?.supplier_id}
                                </p>
                                {purchaseItem.purchase?.supplier?.phone && (
                                    <p className="print-text-xs print-text-gray-700"> {purchaseItem.purchase.supplier.phone || 'N/A'}</p>
                                )}
                                <p className="print-text-xs print-text-gray-700"> { purchaseItem?.supplier?.phone || ''}</p>

                                {purchaseItem.purchase?.supplier?.email && (
                                    <p className="print-text-xs print-text-gray-700"> {purchaseItem?.supplier?.email || 'N/A'}</p>
                                )}
                                <p className="print-text-xs print-text-gray-700"> { purchaseItem?.supplier?.email || ''}</p>

                                {purchaseItem.purchase?.supplier?.address && (
                                    <p className="print-text-xs print-text-gray-700"> {purchaseItem.purchase.supplier.address   || 'N/A'}</p>
                                )}
                                    <p className="print-text-xs print-text-gray-700"> { purchaseItem?.supplier?.address || 'N/A'}</p>
                                <div className="divider print-my-2"></div>
                                <p className="print-text-xs print-text-gray-600">Generated: {formatDate(new Date().toISOString())}</p>
                            </div>
                        </div>
                    </div>

                    {/* Product & Purchase Details */}
                    <div className="section-header print-mb-3">PRODUCT & PURCHASE DETAILS</div>
                    
                    <div className="print-grid print-grid-cols-2 print-gap-3 print-mb-4">
                        <div>
                            <div className="info-card print-p-2">
                                <h4 className="print-text-xs print-font-semibold print-text-gray-700 print-mb-2">Product Info</h4>
                                <div className="print-space-y-2">
                                    <div className="print-flex print-justify-between">
                                        <span className="print-text-xs print-text-gray-600">Name:</span>
                                        <span className="print-text-xs print-font-medium">{purchaseItem.product?.name || purchaseItem.product_name}</span>
                                    </div>
                                    <div className="print-flex print-justify-between">
                                        <span className="print-text-xs print-text-gray-600">Code:</span>
                                        <span className="print-text-xs print-font-medium">{purchaseItem.product?.product_no || purchaseItem.product_name}</span>
                                    </div>
                                    <div className="print-flex print-justify-between">
                                        <span className="print-text-xs print-text-gray-600">Variant:</span>
                                        <span className="print-text-xs print-font-medium">{getVariantText()}</span>
                                    </div>
                                    <div className="print-flex print-justify-between">
                                        <span className="print-text-xs print-text-gray-600">Batch:</span>
                                        <span className="print-text-xs print-font-medium">{purchaseItem.purchase?.stock?.batch_no || 'pickup-' + purchaseItem.id}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="info-card print-p-2">
                                <h4 className="print-text-xs print-font-semibold print-text-gray-700 print-mb-2">Purchase Info</h4>
                                <div className="print-space-y-2">
                                    <div className="print-flex print-justify-between">
                                        <span className="print-text-xs print-text-gray-600">Warehouse:</span>
                                        <span className="print-text-xs print-font-medium">{purchaseItem.warehouse?.name || 'N/A'}</span>
                                    </div>
                                    <div className="print-flex print-justify-between">
                                        <span className="print-text-xs print-text-gray-600">Purchased By:</span>
                                        <span className="print-text-xs print-font-medium">{purchaseItem.purchase?.user?.name || 'System Admin'}</span>
                                    </div>
                                    <div className="print-flex print-justify-between">
                                        <span className="print-text-xs print-text-gray-600">Order Date:</span>
                                        <span className="print-text-xs print-font-medium">
                                            {purchaseItem.purchase?.purchase_date ? 
                                                formatDateForPrint(purchaseItem.purchase.purchase_date) : 
                                                formatDateForPrint(purchaseItem.created_at)}
                                        </span>
                                    </div>
                                    <div className="print-flex print-justify-between">
                                        <span className="print-text-xs print-text-gray-600">Status:</span>
                                        <span className={`badge ${getPaymentStatusBadge(purchaseItem.purchase?.payment_status)}`}>
                                            {purchaseItem.purchase?.payment_status || 'pending'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pricing Table */}
                    <div className="section-header print-mb-3">PRICING BREAKDOWN</div>
                    
                    <div className="print-mb-4">
                        <table className="table print-mb-3">
                            <thead>
                                <tr>
                                    <th className="print-text-left print-p-2">Item</th>
                                    <th className="print-text-right print-p-2">Qty</th>
                                    <th className="print-text-right print-p-2">Unit Cost</th>
                                    <th className="print-text-right print-p-2">Tax%</th>
                                    <th className="print-text-right print-p-2">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="print-p-2 print-font-medium">{purchaseItem.product?.name}</td>
                                    <td className="print-p-2 print-text-right">{purchaseItem.quantity}</td>
                                    <td className="print-p-2 print-text-right">{parseFloat(purchaseItem.unit_price).toFixed(2)} Tk</td>
                                    <td className="print-p-2 print-text-right">{purchaseItem.tax_rate || 0}%</td>
                                    <td className="print-p-2 print-text-right print-font-semibold">
                                        {(purchaseItem.unit_price * purchaseItem.quantity).toFixed(2)} Tk
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="print-flex print-justify-end">
                            <div className="print-w-48 print-space-y-2">
                                <div className="print-flex print-justify-between">
                                    <span className="print-text-xs print-text-gray-600">Subtotal:</span>
                                    <span className="print-text-xs print-font-medium">
                                        {(purchaseItem.unit_price * purchaseItem.quantity).toFixed(2)} Tk
                                    </span>
                                </div>
                                <div className="print-flex print-justify-between">
                                    <span className="print-text-xs print-text-gray-600">Tax ({purchaseItem.tax_rate || 0}%):</span>
                                    <span className="print-text-xs print-font-medium print-text-purple-600">
                                        +{calculateTaxAmount()} Tk
                                    </span>
                                </div>
                                <div className="divider print-my-2"></div>
                                <div className="print-flex print-justify-between">
                                    <span className="print-text-sm print-font-bold print-text-gray-900">Total:</span>
                                    <span className="print-text-base print-font-bold print-text-green-600">
                                        {calculateItemTotal()} Tk
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="section-header print-mb-3">SUMMARY</div>
                    
                    <div className="print-grid print-grid-cols-4 print-gap-2 print-mb-4">
                        <div className="print-p-2 print-bg-green-50 print-rounded print-text-center">
                            <div className="print-text-xs print-font-medium print-text-green-700 print-mb-1">UNIT COST</div>
                            <div className="print-text-sm print-font-bold print-text-gray-900">{parseFloat(purchaseItem.unit_price).toFixed(2)} Tk</div>
                        </div>
                        <div className="print-p-2 print-bg-green-50 print-rounded print-text-center">
                            <div className="print-text-xs print-font-medium print-text-green-700 print-mb-1">QUANTITY</div>
                            <div className="print-text-sm print-font-bold print-text-gray-900">{purchaseItem.quantity}</div>
                        </div>
                        <div className="print-p-2 print-bg-green-50 print-rounded print-text-center">
                            <div className="print-text-xs print-font-medium print-text-green-700 print-mb-1">TAX RATE</div>
                            <div className="print-text-sm print-font-bold print-text-gray-900">{purchaseItem.tax_rate || 0}%</div>
                        </div>
                        <div className="print-p-2 print-bg-gradient-to-r print-from-green-400 print-to-emerald-600 print-rounded print-text-center">
                            <div className="print-text-xs print-font-medium print-text-white print-mb-1">TOTAL</div>
                            <div className="print-text-sm print-font-bold print-text-white">{calculateItemTotal()} Tk</div>
                        </div>
                    </div>

                    {purchaseItem.purchase?.notes && (
                        <>
                            <div className="section-header print-mb-3">NOTES</div>
                            <div className="print-p-3 print-bg-gray-50 print-rounded print-mb-4">
                                <p className="print-text-xs print-text-gray-700 whitespace-pre-line">
                                    {purchaseItem.purchase.notes}
                                </p>
                            </div>
                        </>
                    )}

                    <div className="divider print-mb-3"></div>
                    
                    <div className="print-text-center">
                        <p className="print-text-xs print-font-medium print-text-gray-700 print-mb-2">
                            Inventory Management Auto Receipt • Thank you for your partnership!
                        </p>
                        <div className="print-mt-3 print-text-xs print-text-gray-400">
                            <p>{business?.name || 'Iduvisul Business Solutions'} • Email: {business?.email || 'info@iduvisul.com'}</p>
                            <p className="print-mt-1">Generated: {formatDate(new Date().toISOString())}</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}