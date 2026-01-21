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
    ChevronRight,
    CheckCircle,
    Truck,
    Package2
} from "lucide-react";
import { toast } from "react-toastify";
import { useState } from "react";

export default function SaleItemShow({ saleItem }) {
    const [isPrinting, setIsPrinting] = useState(false);

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this sales item? This action cannot be undone.')) {
            router.delete(route('sales.items.destroy', { id: saleItem.id }), {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Sales item deleted successfully');
                },
                onError: () => {
                    toast.error('Failed to delete sales item');
                }
            });
        }
    };

    const calculateItemTotal = () => {
        const price = parseFloat(saleItem.unit_price) || 0;
        const quantity = parseFloat(saleItem.quantity) || 0;
        const discount = parseFloat(saleItem.sale?.discount) || 0;
        
        const subtotal = price * quantity;
        const discountAmount = (subtotal * discount) / 100;
        return (subtotal - discountAmount).toFixed(2);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount) => {
        if (!amount) amount = 0;
        return parseFloat(amount).toFixed(2);
    };

    const getVariantText = () => {
        if (!saleItem.variant) return 'N/A';
        
        const variant = saleItem.variant;
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
        
        return attrsText || 'N/A';
    };

    const getBrandText = () => {
        if (!saleItem.variant) return 'N/A';
        
        const variant = saleItem.variant;
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

    const handlePrint = () => {
        setIsPrinting(true);
        
        const printContent = document.createElement('div');
        printContent.innerHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>SALES ITEM RECEIPT - #${saleItem.id}</title>
                <style>
                    @page {
                        size: A4;
                        margin: 0.2in;
                    }
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                        font-family: Arial, sans-serif;
                    }
                    body {
                        font-size: 11px;
                        color: #000;
                    }
                    .invoice-paper {
                        width: 100%;
                        padding: 5px;
                    }
                    .text-xss {
                        font-size: 0.65rem;
                        line-height: 0.9rem;
                    }
                    .border-dashed-black {
                        border-bottom: 1px dashed black;
                    }
                    .invoice-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 2px;
                    }
                    .invoice-table th {
                        padding: 3px 4px;
                        border: 1px solid #000;
                        font-weight: 600;
                        text-align: center;
                        background-color: #f0f0f0;
                    }
                    .invoice-table td {
                        padding: 3px 4px;
                        border: 1px solid #ccc;
                        vertical-align: top;
                    }
                    .header-red {
                        background-color: #dc2626;
                        color: white;
                        padding: 2px 12px;
                        font-size: 9px;
                        font-weight: bold;
                        width: 50%;
                        display: inline-block;
                        margin-bottom: 15px;
                    }
                    .company-name {
                        font-size: 20px;
                        font-weight: 900;
                        letter-spacing: 0.5px;
                        margin-bottom: 2px;
                    }
                    .company-red {
                        color: #dc2626;
                    }
                    .grid-4col {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 8px;
                        margin-bottom: 10px;
                    }
                    .flex-container {
                        display: flex;
                        align-items: center;
                        border-bottom: 1px solid #000;
                        padding-bottom: 8px;
                        margin-bottom: 8px;
                    }
                    .logo-space {
                        margin-right: 15px;
                        flex-shrink: 0;
                    }
                    .logo-svg {
                        height: 35px;
                        width: 35px;
                        color: #dc2626;
                    }
                    .company-info {
                        flex-grow: 1;
                    }
                    .office-info {
                        width: 35%;
                        display: flex;
                        font-size: 0.65rem;
                        line-height: 0.85rem;
                    }
                    .office-left, .office-right {
                        padding: 0 5px;
                    }
                    .office-left {
                        border-right: 1px solid #ccc;
                        width: 55%;
                    }
                    .office-right {
                        width: 45%;
                        padding-left: 8px;
                    }
                    .office-title {
                        font-weight: 700;
                        text-transform: uppercase;
                        margin-bottom: 2px;
                    }
                    .detail-grid {
                        margin: 5px 0;
                    }
                    .detail-item {
                        margin-bottom: 3px;
                    }
                    .detail-label {
                        font-weight: 600;
                        display: inline-block;
                        width: 80px;
                    }
                    .detail-value {
                        float: right;
                        text-align: right;
                        font-weight: 500;
                    }
                    .table-footer-row {
                        border: 1px solid #ccc;
                        height: 30px;
                    }
                    .signature-grid {
                        display: grid;
                        grid-template-columns: 2fr 1fr 1fr 1fr;
                        gap: 10px;
                        margin-top: 10px;
                        padding-top: 8px;
                        border-top: 1px solid #000;
                    }
                    .signature-box {
                        text-align: center;
                    }
                    .signature-title {
                        font-weight: 700;
                        border-bottom: 1px dashed #000;
                        width: 70%;
                        margin: 0 auto 3px auto;
                        padding-bottom: 1px;
                    }
                    .signature-text {
                        font-size: 0.6rem;
                        line-height: 0.8rem;
                    }
                    .software-info {
                        text-align: right;
                        font-size: 0.55rem;
                        color: #666;
                        margin-top: 5px;
                    }
                    .text-left { text-align: left; }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .font-bold { font-weight: 700; }
                    .font-semibold { font-weight: 600; }
                    .float-right { float: right; }
                    .w-3 { width: 3%; }
                    .w-10 { width: 10%; }
                    .w-30 { width: 30%; }
                    .w-5 { width: 5%; }
                    .w-7 { width: 7%; }
                    .w-8 { width: 8%; }
                    .w-55 { width: 55%; }
                    .w-45 { width: 45%; }
                    .border-r { border-right: 1px solid #ccc; }
                    .border-b { border-bottom: 1px solid #000; }
                    .border-t { border-top: 1px solid #000; }
                    .mb-1 { margin-bottom: 3px; }
                    .mt-2 { margin-top: 8px; }
                    .pt-4 { padding-top: 16px; }
                    .col-span-2 { grid-column: span 2; }
                    .highlight-box {
                        background-color: #dc2626;
                        color: white;
                        padding: 4px 8px;
                        font-weight: bold;
                        text-align: center;
                        margin-bottom: 8px;
                    }
                    .summary-box {
                        margin-top: 10px;
                        padding: 8px;
                        border: 1px solid #000;
                        border-radius: 4px;
                    }
                    .summary-title {
                        font-weight: 700;
                        font-size: 12px;
                        margin-bottom: 6px;
                        border-bottom: 1px solid #ccc;
                        padding-bottom: 2px;
                    }
                    .summary-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 4px;
                    }
                </style>
            </head>
            <body>
                <div class="invoice-paper">
                    <div class="header-red">
                        SALES ITEM RECEIPT
                    </div>
                    
                    <div class="flex-container">
                        <div class="logo-space">
                            <svg class="logo-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        
                        <div class="company-info">
                            <h1 class="company-name">
                                SALES ITEM RECEIPT
                            </h1>
                            <p class="text-xss text-gray-700">Detailed item sale confirmation</p>
                        </div>

                        <div class="office-info">
                            <div class="office-left">
                                <p class="office-title">Receipt Info</p>
                                <p>Receipt #: ${saleItem.id}</p>
                                <p class="font-semibold">Date: ${formatDate(saleItem.created_at)}</p>
                                <p>Generated: ${new Date().toLocaleDateString()}</p>
                            </div>
                            <div class="office-right">
                                <p class="office-title">Sale Info</p>
                                <p>Invoice: ${saleItem.sale?.invoice_no || 'N/A'}</p>
                                <p class="font-semibold">Status: ${saleItem.sale?.status?.toUpperCase() || 'COMPLETED'}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="highlight-box">
                        ITEM SALE DETAILS
                    </div>
                    
                    <div class="grid-4col detail-grid">
                        <div>
                            <div class="detail-item">
                                <span class="detail-label">Item ID:</span>
                                <span class="detail-value">${saleItem.id}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Sale ID:</span>
                                <span class="detail-value">${saleItem.sale_id}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Invoice No:</span>
                                <span class="detail-value">${saleItem.sale?.invoice_no || 'N/A'}</span>
                            </div>
                        </div>
                        <div>
                            <div class="detail-item">
                                <span class="detail-label">Product:</span>
                                <span class="detail-value">${saleItem.product?.name || 'N/A'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Code:</span>
                                <span class="detail-value">${saleItem.product?.product_no || 'N/A'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Brand:</span>
                                <span class="detail-value">${getBrandText()}</span>
                            </div>
                        </div>
                        <div>
                            <div class="detail-item">
                                <span class="detail-label">Customer:</span>
                                <span class="detail-value">${saleItem.sale?.customer?.customer_name || 'Walk-in Customer'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Phone:</span>
                                <span class="detail-value">${saleItem.sale?.customer?.phone || 'N/A'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Address:</span>
                                <span class="detail-value">${saleItem.sale?.customer?.address || 'N/A'}</span>
                            </div>
                        </div>
                        <div>
                            <div class="detail-item">
                                <span class="detail-label">Warehouse:</span>
                                <span class="detail-value">${saleItem.warehouse?.name || 'N/A'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Sold By:</span>
                                <span class="detail-value">${saleItem.sale?.user?.name || 'System Admin'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Date:</span>
                                <span class="detail-value">${formatDate(saleItem.created_at)}</span>
                            </div>
                        </div>
                    </div>

                    <table class="invoice-table">
                        <thead>
                            <tr>
                                <th class="w-3">SL</th>
                                <th class="w-10">Part No.</th>
                                <th class="w-30 text-left">Description</th>
                                <th class="w-10">Variant</th>
                                <th class="w-10">Brand</th>
                                <th class="w-5">Qty.</th>
                                <th class="w-10">Pcs.</th>
                                <th class="w-7">Price</th>
                                <th class="w-7">Discount</th>
                                <th class="w-8">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="text-center">1</td>
                                <td class="text-center">${saleItem.product?.product_no || 'N/A'}</td>
                                <td class="text-left">${saleItem.product?.name || 'N/A'}</td>
                                <td class="text-center">${getVariantText()}</td>
                                <td class="text-center">${getBrandText()}</td>
                                <td class="text-center">${saleItem.quantity}</td>
                                <td class="text-center">${formatCurrency(saleItem.unit_price)}</td>
                                <td class="text-right">${formatCurrency(saleItem.unit_price)}</td>
                                <td class="text-right">${saleItem.sale?.discount || 0}%</td>
                                <td class="text-right font-bold">${calculateItemTotal()}</td>
                            </tr>
                            <tr class="table-footer-row">
                                <td colspan="10"></td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <!-- Summary Section -->
                    <div class="summary-box">
                        <div class="summary-title">PRICING SUMMARY</div>
                        <div class="grid-4col">
                            <div>
                                <div class="summary-row">
                                    <span>Unit Price:</span>
                                    <span class="font-bold">${formatCurrency(saleItem.unit_price)} Tk</span>
                                </div>
                                <div class="summary-row">
                                    <span>Quantity:</span>
                                    <span class="font-bold">${saleItem.quantity}</span>
                                </div>
                            </div>
                            <div>
                                <div class="summary-row">
                                    <span>Subtotal:</span>
                                    <span class="font-bold">${(parseFloat(saleItem.unit_price) * parseFloat(saleItem.quantity)).toFixed(2)} Tk</span>
                                </div>
                                <div class="summary-row">
                                    <span>Discount:</span>
                                    <span class="font-bold">${saleItem.sale?.discount || 0}%</span>
                                </div>
                            </div>
                            <div>
                                <div class="summary-row">
                                    <span>Discount Amount:</span>
                                    <span class="font-bold">${((parseFloat(saleItem.unit_price) * parseFloat(saleItem.quantity) * (saleItem.sale?.discount || 0)) / 100).toFixed(2)} Tk</span>
                                </div>
                                <div class="summary-row">
                                    <span>VAT:</span>
                                    <span class="font-bold">${saleItem.sale?.vat_tax || 0}%</span>
                                </div>
                            </div>
                            <div>
                                <div class="summary-row">
                                    <span>Final Total:</span>
                                    <span class="font-bold">${calculateItemTotal()} Tk</span>
                                </div>
                                <div class="summary-row">
                                    <span>Sale Type:</span>
                                    <span class="font-bold">${saleItem.sale?.type?.toUpperCase() || 'CASH'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="signature-grid">
                        <div class="signature-box text-left">
                            <p class="signature-title">Checked By</p>
                            <p class="signature-text">Item sale verified and validated by system.</p>
                        </div>
                        <div class="signature-box">
                            <p class="signature-title">Approved</p>
                            <p class="signature-text">(Signature & Seal)</p>
                        </div>
                        <div class="signature-box">
                            <p class="signature-title">Accounts</p>
                            <p class="signature-text">(Signature & Seal)</p>
                        </div>
                        <div class="signature-box">
                            <p class="signature-title">Software By</p>
                            <div class="software-info">
                                <p>TETRA SOFT</p>
                                <p>Phone 01911-387001</p>
                            </div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        const printWindow = window.open('', '_blank', 'width=900,height=600');
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.close();
        
        printWindow.onload = function() {
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
                setIsPrinting(false);
            }, 500);
        };
    };

    const handleDownload = () => {
        handlePrint();
    };

    return (
        <div className="bg-gray-50 min-h-screen p-4">
            {/* Header Actions */}
            <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="bg-red-700 text-white py-1 px-4 text-xs font-bold inline-block mb-2">
                            SALES ITEM RECEIPT
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800">Sales Item Details</h1>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                            <span>Item ID: {saleItem.id}</span>
                            <ChevronRight size={12} />
                            <span>Invoice: {saleItem.sale?.invoice_no || 'N/A'}</span>
                            <ChevronRight size={12} />
                            <span>{formatDate(saleItem.created_at)}</span>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => router.visit(route("salesItems.list"))}
                            className="btn btn-sm btn-ghost border border-gray-300"
                        >
                            <ArrowLeft size={15} className="mr-1" />
                            Back to List
                        </button>
                        <Link
                            href={route('sales.show', { id: saleItem.sale_id })}
                            className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Eye size={15} className="mr-1" />
                            View Sale
                        </Link>
                        <button
                            onClick={handlePrint}
                            className="btn btn-sm bg-red-700 hover:bg-red-800 text-white"
                            disabled={isPrinting}
                        >
                            <Printer size={15} className="mr-1" />
                            Print Receipt
                            {isPrinting && <span className="loading loading-spinner loading-xs ml-1"></span>}
                        </button>
                        <button
                            onClick={handleDownload}
                            className="btn btn-sm bg-gray-800 hover:bg-[#1e4d2b] text-white text-white"
                            disabled={isPrinting}
                        >
                            <Download size={15} className="mr-1" />
                            Download PDF
                            {isPrinting && <span className="loading loading-spinner loading-xs ml-1"></span>}
                        </button>
                        <button
                            onClick={handleDelete}
                            className="btn btn-sm bg-red-600 hover:bg-red-700 text-white"
                        >
                            <Trash2 size={15} className="mr-1" />
                            Delete
                        </button>
                    </div>
                </div>
            </div>

            {/* Invoice Design */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-300">
                {/* Header */}
                <div className="flex items-center border-b border-black pb-4 mb-4">
                    <div className="mr-4 flex-shrink-0">
                        <svg className="h-10 w-10 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    
                    <div className="flex-grow">
                        <h1 className="text-2xl font-extrabold tracking-tight">
                            SALES ITEM RECEIPT
                        </h1>
                        <p className="text-xs text-gray-600">Detailed item sale confirmation</p>
                    </div>

                    <div className="w-1/3 flex text-xs text-gray-700">
                        <div className="w-55 pr-4 border-r border-gray-300">
                            <p className="font-bold uppercase text-xs">Receipt Info</p>
                            <p className="text-xs leading-tight mt-1">Receipt #: {saleItem.id}</p>
                            <p className="font-semibold text-xs mt-1">Date: {formatDate(saleItem.created_at)}</p>
                            <p className="text-xs mt-1">Generated: {new Date().toLocaleDateString()}</p>
                        </div>
                        <div className="w-45 pl-4">
                            <p className="font-bold uppercase text-xs">Sale Info</p>
                            <p className="text-xs leading-tight mt-1">Invoice: {saleItem.sale?.invoice_no || 'N/A'}</p>
                            <p className="font-semibold text-xs mt-1">Status: {saleItem.sale?.status?.toUpperCase() || 'COMPLETED'}</p>
                        </div>
                    </div>
                </div>

                {/* Highlight Box */}
                <div className="bg-red-700 text-white py-1 px-4 text-sm font-bold text-center mb-4">
                    ITEM SALE DETAILS
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-4 gap-4 text-xs mb-6">
                    {/* Column 1 */}
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <span className="font-semibold">Item ID:</span>
                            <span>{saleItem.id}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Sale ID:</span>
                            <span>{saleItem.sale_id}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Invoice No:</span>
                            <span>{saleItem.sale?.invoice_no || 'N/A'}</span>
                        </div>
                    </div>
                    
                    {/* Column 2 */}
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <span className="font-semibold">Product:</span>
                            <span className="text-right">{saleItem.product?.name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Code:</span>
                            <span>{saleItem.product?.product_no || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Brand:</span>
                            <span>{getBrandText()}</span>
                        </div>
                    </div>
                    
                    {/* Column 3 */}
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <span className="font-semibold">Customer:</span>
                            <span className="text-right">{saleItem.sale?.customer?.customer_name || 'Walk-in Customer'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Phone:</span>
                            <span>{saleItem.sale?.customer?.phone || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Address:</span>
                            <span className="text-right text-xs">{saleItem.sale?.customer?.address || 'N/A'}</span>
                        </div>
                    </div>
                    
                    {/* Column 4 */}
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <span className="font-semibold">Warehouse:</span>
                            <span>{saleItem.warehouse?.name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Sold By:</span>
                            <span>{saleItem.sale?.user?.name || 'System Admin'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Date:</span>
                            <span>{formatDate(saleItem.created_at)}</span>
                        </div>
                    </div>
                </div>

                {/* Item Table */}
                <div className="mb-8">
                    <table className="w-full text-xs border border-black">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="w-[3%] p-1 border border-black text-center font-semibold">SL</th>
                                <th className="w-[10%] p-1 border border-black text-center font-semibold">Part No.</th>
                                <th className="w-[30%] p-1 border border-black text-left font-semibold">Description</th>
                                <th className="w-[10%] p-1 border border-black text-center font-semibold">Variant</th>
                                <th className="w-[10%] p-1 border border-black text-center font-semibold">Brand</th>
                                <th className="w-[5%] p-1 border border-black text-center font-semibold">Qty.</th>
                                <th className="w-[10%] p-1 border border-black text-center font-semibold">Pcs.</th>
                                <th className="w-[7%] p-1 border border-black text-center font-semibold">Price</th>
                                <th className="w-[7%] p-1 border border-black text-center font-semibold">Discount</th>
                                <th className="w-[8%] p-1 border border-black text-center font-semibold">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="hover:bg-gray-50">
                                <td className="p-1 border border-gray-300 text-center">1</td>
                                <td className="p-1 border border-gray-300 text-center font-mono">
                                    {saleItem.product?.product_no || 'N/A'}
                                </td>
                                <td className="p-1 border border-gray-300 text-left">
                                    <div className="font-medium">{saleItem.product?.name || 'N/A'}</div>
                                    <div className="text-xs text-gray-500">
                                        Code: {saleItem.product?.product_no || 'N/A'}
                                    </div>
                                </td>
                                <td className="p-1 border border-gray-300 text-center">
                                    {getVariantText()}
                                </td>
                                <td className="p-1 border border-gray-300 text-center">
                                    {getBrandText()}
                                </td>
                                <td className="p-1 border border-gray-300 text-center font-bold">
                                    {saleItem.quantity}
                                </td>
                                <td className="p-1 border border-gray-300 text-center font-mono">
                                    {formatCurrency(saleItem.unit_price)}
                                </td>
                                <td className="p-1 border border-gray-300 text-right font-mono">
                                    {formatCurrency(saleItem.unit_price)}
                                </td>
                                <td className="p-1 border border-gray-300 text-right">
                                    {saleItem.sale?.discount || 0}%
                                </td>
                                <td className="p-1 border border-gray-300 text-right font-mono font-bold text-blue-600">
                                    {calculateItemTotal()}
                                </td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="10" className="h-8 border border-gray-300"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Summary Section */}
                <div className="bg-gray-50 p-4 rounded border border-gray-300 mb-6">
                    <div className="border-b border-black pb-2 mb-3">
                        <h3 className="text-sm font-bold text-gray-800">PRICING SUMMARY</h3>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-xs text-gray-700">Unit Price:</span>
                                <span className="text-xs font-bold">{formatCurrency(saleItem.unit_price)} Tk</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-xs text-gray-700">Quantity:</span>
                                <span className="text-xs font-bold">{saleItem.quantity}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-xs text-gray-700">Subtotal:</span>
                                <span className="text-xs font-bold">
                                    {(parseFloat(saleItem.unit_price) * parseFloat(saleItem.quantity)).toFixed(2)} Tk
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-xs text-gray-700">Discount:</span>
                                <span className="text-xs font-bold">{saleItem.sale?.discount || 0}%</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-xs text-gray-700">Discount Amount:</span>
                                <span className="text-xs font-bold text-red-600">
                                    -{((parseFloat(saleItem.unit_price) * parseFloat(saleItem.quantity) * (saleItem.sale?.discount || 0)) / 100).toFixed(2)} Tk
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-xs text-gray-700">VAT:</span>
                                <span className="text-xs font-bold">{saleItem.sale?.vat_tax || 0}%</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-xs text-gray-700">Final Total:</span>
                                <span className="text-xs font-bold text-green-600">{calculateItemTotal()} Tk</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-xs text-gray-700">Sale Type:</span>
                                <span className={`text-xs font-bold ${saleItem.sale?.type === 'cash' ? 'text-green-600' : 'text-blue-600'}`}>
                                    {saleItem.sale?.type?.toUpperCase() || 'CASH'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detailed Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Product Details */}
                    <div className="bg-blue-50 p-4 rounded border border-blue-200">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="bg-blue-100 p-2 rounded">
                                <Package size={16} className="text-blue-600" />
                            </div>
                            <h4 className="font-bold text-sm text-blue-700">Product Details</h4>
                        </div>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-gray-700">Name:</span>
                                <span className="font-medium">{saleItem.product?.name || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-700">Code:</span>
                                <span className="font-medium">{saleItem.product?.product_no || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-700">Brand:</span>
                                <span className="font-medium">{getBrandText()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-700">Variant:</span>
                                <span className="font-medium">{getVariantText()}</span>
                            </div>
                            {saleItem.variant?.sku && (
                                <div className="flex justify-between">
                                    <span className="text-gray-700">SKU:</span>
                                    <span className="font-medium">{saleItem.variant.sku}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Customer Details */}
                    <div className="bg-green-50 p-4 rounded border border-green-200">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="bg-green-100 p-2 rounded">
                                <User size={16} className="text-green-600" />
                            </div>
                            <h4 className="font-bold text-sm text-green-700">Customer Details</h4>
                        </div>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-gray-700">Name:</span>
                                <span className="font-medium">{saleItem.sale?.customer?.customer_name || 'Walk-in Customer'}</span>
                            </div>
                            {saleItem.sale?.customer?.phone && (
                                <div className="flex justify-between">
                                    <span className="text-gray-700">Phone:</span>
                                    <span className="font-medium">{saleItem.sale.customer.phone}</span>
                                </div>
                            )}
                            {saleItem.sale?.customer?.email && (
                                <div className="flex justify-between">
                                    <span className="text-gray-700">Email:</span>
                                    <span className="font-medium">{saleItem.sale.customer.email}</span>
                                </div>
                            )}
                            {saleItem.sale?.customer?.address && (
                                <div className="flex justify-between">
                                    <span className="text-gray-700">Address:</span>
                                    <span className="font-medium text-xs">{saleItem.sale.customer.address}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sale Details */}
                    <div className="bg-purple-50 p-4 rounded border border-purple-200">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="bg-purple-100 p-2 rounded">
                                <DollarSign size={16} className="text-purple-600" />
                            </div>
                            <h4 className="font-bold text-sm text-purple-700">Sale Details</h4>
                        </div>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-gray-700">Warehouse:</span>
                                <span className="font-medium">{saleItem.warehouse?.name || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-700">Sold By:</span>
                                <span className="font-medium">{saleItem.sale?.user?.name || 'System Admin'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-700">Sale Date:</span>
                                <span className="font-medium">{formatDate(saleItem.created_at)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-700">Status:</span>
                                <span className={`font-medium ${saleItem.sale?.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                                    {saleItem.sale?.status?.toUpperCase() || 'COMPLETED'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-700">Type:</span>
                                <span className={`font-medium ${saleItem.sale?.type === 'cash' ? 'text-green-600' : 'text-blue-600'}`}>
                                    {saleItem.sale?.type?.toUpperCase() || 'CASH'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Signature Section */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs border-t border-black pt-4">
                    <div className="col-span-2">
                        <p className="font-bold border-b border-dashed border-black w-2/3 text-center mb-2">Checked By</p>
                        <p className="text-xs text-gray-700">
                            Item sale verified and validated by system. All details confirmed.
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="font-bold border-b border-dashed border-black w-2/3 mx-auto mb-2">Approved</p>
                        <p className="text-xs text-gray-700">(Signature & Seal)</p>
                    </div>
                    <div className="text-center">
                        <p className="font-bold border-b border-dashed border-black w-2/3 mx-auto mb-2">Software</p>
                        <p className="text-xs text-gray-700">TETRA SOFT</p>
                        <p className="text-[0.6rem] text-gray-500">Phone 01911-387001</p>
                    </div>
                </div>

                {/* Notes Section */}
                {saleItem.sale?.notes && (
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                        <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                            <FileText size={14} />
                            Additional Notes
                        </h4>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{saleItem.sale.notes}</p>
                    </div>
                )}
            </div>
        </div>
    );
}