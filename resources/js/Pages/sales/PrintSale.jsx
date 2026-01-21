// resources/js/Pages/Sales/Print.jsx
import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Printer, Download, Eye, ChevronLeft, Smartphone, FileText } from 'lucide-react';

export default function PrintSale({ sale, receiptHtml }) {
    const { auth } = usePage().props;
    const [isPrinting, setIsPrinting] = useState(false);
    
    const handlePrintReceipt = async () => {
        setIsPrinting(true);
        try {
            const response = await router.post(route('sales.print-receipt', sale.id));
            
            if (response.ok) {
                alert('Receipt sent to printer successfully!');
            } else {
                alert('Failed to print receipt');
            }
        } catch (error) {
            console.error('Print error:', error);
            alert('Error printing receipt');
        } finally {
            setIsPrinting(false);
        }
    };
    
    const handleDownloadPdf = () => {
        window.open(route('sales.download-pdf', sale.id), '_blank');
    };
    
    const handleViewReceipt = () => {
        window.open(route('sales.preview-receipt', sale.id), '_blank', 'width=400,height=600');
    };
    
    const handleDownloadText = () => {
        window.open(route('sales.receipt-text', sale.id), '_blank');
    };
    
    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            <Head title={`Print Invoice - #${sale.id}`} />
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Link
                        href={route('sales.index')}
                        className="btn btn-ghost btn-sm hover:bg-gray-100"
                    >
                        <ChevronLeft size={20} />
                        Back to Sales
                    </Link>
                    <h1 className="text-2xl font-black text-gray-900">
                        Invoice #{sale.id}
                    </h1>
                </div>
                
                <div className="text-sm text-gray-600">
                    {new Date(sale.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
                <button
                    onClick={handlePrintReceipt}
                    disabled={isPrinting}
                    className="btn bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                >
                    {isPrinting ? (
                        <>
                            <span className="loading loading-spinner loading-sm"></span>
                            Printing...
                        </>
                    ) : (
                        <>
                            <Printer size={18} />
                            Print Receipt (POS)
                        </>
                    )}
                </button>
                
                <button
                    onClick={handleDownloadPdf}
                    className="btn bg-blue-600 text-white hover:bg-blue-700"
                >
                    <Download size={18} />
                    Download PDF
                </button>
                
                <button
                    onClick={handleViewReceipt}
                    className="btn bg-purple-600 text-white hover:bg-purple-700"
                >
                    <Eye size={18} />
                    Preview Receipt
                </button>
                
                <button
                    onClick={handleDownloadText}
                    className="btn bg-gray-600 text-white hover:bg-gray-700"
                >
                    <FileText size={18} />
                    Download as Text
                </button>
                
                <button
                    onClick={() => window.print()}
                    className="btn bg-amber-600 text-white hover:bg-amber-700"
                >
                    <Printer size={18} />
                    Print Page
                </button>
            </div>
            
            {/* Receipt Preview */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Receipt Preview</h2>
                    <div className="text-sm text-gray-500">
                        80mm Thermal Paper Size
                    </div>
                </div>
                
                {/* Receipt Container */}
                <div className="receipt-container mx-auto" style={{ maxWidth: '300px' }}>
                    <div dangerouslySetInnerHTML={{ __html: receiptHtml }} />
                </div>
            </div>
            
            {/* Original Print View (for A4 printing) */}
            <div className="bg-white rounded-lg shadow-lg p-8 print:shadow-none print:border-0">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 mb-2">
                            INVOICE
                        </h2>
                        <p className="text-gray-600">#{sale.id}</p>
                    </div>
                    
                    <div className="text-right">
                        <div className="text-2xl font-black text-green-600 mb-2">
                            ৳{parseFloat(sale.grand_total).toFixed(2)}
                        </div>
                        <div className={`badge font-bold text-white px-3 py-1 ${
                            sale.status === 'completed' ? 'bg-green-600' :
                            sale.status === 'pending' ? 'bg-yellow-600' :
                            'bg-red-600'
                        }`}>
                            {sale.status.toUpperCase()}
                        </div>
                    </div>
                </div>
                
                {/* Customer Info */}
                {sale.customer && (
                    <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-bold text-gray-900 mb-2">Bill To:</h3>
                        <p className="text-gray-700 font-bold">{sale.customer.name}</p>
                        {sale.customer.phone && (
                            <p className="text-gray-600">Phone: {sale.customer.phone}</p>
                        )}
                        {sale.customer.email && (
                            <p className="text-gray-600">Email: {sale.customer.email}</p>
                        )}
                        {sale.customer.address && (
                            <p className="text-gray-600">Address: {sale.customer.address}</p>
                        )}
                    </div>
                )}
                
                {/* Items Table */}
                <div className="overflow-x-auto mb-8">
                    <table className="table w-full">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="py-3 font-bold text-gray-900">Product</th>
                                <th className="py-3 font-bold text-gray-900 text-right">Price</th>
                                <th className="py-3 font-bold text-gray-900 text-right">Qty</th>
                                <th className="py-3 font-bold text-gray-900 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sale.items.map((item, index) => (
                                <tr key={item.id} className="border-b border-gray-200">
                                    <td className="py-3">
                                        <div>
                                            <p className="font-bold text-gray-900">{item.product.name}</p>
                                            {item.variant && (
                                                <p className="text-sm text-gray-600">Variant: {item.variant.name}</p>
                                            )}
                                            {item.warehouse && (
                                                <p className="text-xs text-gray-500">Warehouse: {item.warehouse.name}</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-3 text-right font-mono">
                                        ৳{parseFloat(item.unit_price).toFixed(2)}
                                    </td>
                                    <td className="py-3 text-right font-mono">
                                        {item.quantity}
                                    </td>
                                    <td className="py-3 text-right font-mono font-bold">
                                        ৳{parseFloat(item.total_price).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* Totals */}
                <div className="flex justify-end">
                    <div className="w-full md:w-1/2">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal:</span>
                                <span className="font-mono">৳{parseFloat(sale.subtotal).toFixed(2)}</span>
                            </div>
                            {sale.tax_amount > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Tax ({sale.tax_rate}%):</span>
                                    <span className="font-mono">৳{parseFloat(sale.tax_amount).toFixed(2)}</span>
                                </div>
                            )}
                            {sale.discount_amount > 0 && (
                                <div className="flex justify-between text-red-600">
                                    <span>Discount:</span>
                                    <span className="font-mono">-৳{parseFloat(sale.discount_amount).toFixed(2)}</span>
                                </div>
                            )}
                            {sale.shipping_cost > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Shipping:</span>
                                    <span className="font-mono">৳{parseFloat(sale.shipping_cost).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="border-t border-gray-300 pt-2 mt-2">
                                <div className="flex justify-between text-lg font-bold">
                                    <span className="text-gray-900">Grand Total:</span>
                                    <span className="text-green-600">
                                        ৳{parseFloat(sale.grand_total).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Payment Info */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <h4 className="font-bold text-gray-900 mb-2">Payment Information</h4>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Payment Method:</span>
                                <span className="font-bold">{sale.payment_method}</span>
                            </div>
                            {sale.paid_amount > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Paid Amount:</span>
                                    <span className="font-mono">৳{parseFloat(sale.paid_amount).toFixed(2)}</span>
                                </div>
                            )}
                            {sale.change_amount > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Change:</span>
                                    <span className="font-mono">৳{parseFloat(sale.change_amount).toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Footer */}
                <div className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
                    <p>Thank you for your business!</p>
                    <p className="mt-1">{auth.user.outlet?.name || 'Store'}</p>
                    <p className="mt-1">For any inquiries, please contact us at: {auth.user.outlet?.phone || 'N/A'}</p>
                </div>
            </div>
            
            {/* Print Styles */}
            <style>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    
                    body {
                        background: white !important;
                    }
                    
                    .receipt-container {
                        display: none !important;
                    }
                    
                    .print\:shadow-none {
                        box-shadow: none !important;
                    }
                    
                    .print\:border-0 {
                        border: 0 !important;
                    }
                }
            `}</style>
        </div>
    );
}