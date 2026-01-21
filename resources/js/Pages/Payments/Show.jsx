import React from "react";
import PageHeader from "../../components/PageHeader";
import { 
    ArrowLeft, 
    Download, 
    Printer, 
    User, 
    Receipt, 
    Calendar,
    DollarSign,
    CreditCard,
    FileText,
    Building,
    Smartphone,
    Globe,
    Truck,
    Package,
    Users
} from "lucide-react";
import { Link, usePage } from "@inertiajs/react";
import { useTranslation } from "../../hooks/useTranslation";

export default function PaymentShow({ payment, business, isShadowUser }) {
    const { auth } = usePage().props;
    const { t, locale } = useTranslation();

    // Check if this is a customer payment (has customer or sale)
    const isCustomerPayment = payment.customer || payment.sale;
    
    // Check if this is a supplier payment (has supplier or purchase)
    const isSupplierPayment = payment.supplier || payment.purchase;

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BD', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-GB', {
            timeZone: "Asia/Dhaka",
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    // Get payment method icon and color
    const getPaymentMethodDetails = (method) => {
        const details = {
            cash: { 
                icon: DollarSign, 
                color: "text-success",
                bgColor: "bg-success/10",
                label: t('payment.cash', 'Cash')
            },
            card: { 
                icon: CreditCard, 
                color: "text-primary",
                bgColor: "bg-[#1e4d2b] text-white",
                label: t('payment.card', 'Card')
            },
            bank: { 
                icon: Building, 
                color: "text-info",
                bgColor: "bg-info/10",
                label: t('payment.bank', 'Bank Transfer')
            },
            mobile: { 
                icon: Smartphone, 
                color: "text-warning",
                bgColor: "bg-warning/10",
                label: t('payment.mobile', 'Mobile Banking')
            },
            online: { 
                icon: Globe, 
                color: "text-secondary",
                bgColor: "bg-secondary/10",
                label: t('payment.online', 'Online Payment')
            },
        };
        return details[method] || { 
            icon: CreditCard, 
            color: "text-gray-500",
            bgColor: "bg-gray-100",
            label: method
        };
    };

    const methodDetails = getPaymentMethodDetails(payment.payment_method);
    const MethodIcon = methodDetails.icon;

    // Handle print
    const handlePrint = () => {
        window.print();
    };

    // Get status label
    const getStatusLabel = (status) => {
        const labels = {
            completed: t('payment.completed', 'Completed'),
            pending: t('payment.pending', 'Pending'),
            failed: t('payment.failed', 'Failed'),
        };
        return labels[status] || status;
    };

    // Get payment type label
    const getPaymentTypeLabel = () => {
        if (isCustomerPayment) {
            return t('payment.customer_payment', 'Customer Payment');
        }
        if (isSupplierPayment) {
            return t('payment.supplier_payment', 'Supplier Payment');
        }
        return t('payment.other_payment', 'Other Payment');
    };

    return (
        <div className={`bg-white rounded-box ${locale === 'bn' ? 'bangla-font' : ''}`}>
            {/* Header */}
            <div className="p-5 border-b print:border-none">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route("payments.index")}
                            className="btn btn-ghost btn-sm"
                        >
                            <ArrowLeft size={16} />
                            {t('payment.back_to_payments', 'Back to Payments')}
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {t('payment.show_title', 'Payment Receipt')}
                            </h1>
                            <p className="text-gray-500 text-sm">
                                {getPaymentTypeLabel()} • {formatDate(payment.created_at)}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 print:hidden">
                        <button
                            onClick={handlePrint}
                            className="btn btn-outline btn-sm"
                        >
                            <Printer size={16} />
                            {t('payment.print', 'Print')}
                        </button>
                        <button
                            onClick={handlePrint}
                            className="btn btn-outline btn-sm"
                        >
                            <Download size={16} />
                            {t('payment.download', 'Download')}
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-5">
                {/* Payment Summary Card */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Payment Information */}
                    <div className="bg-base-100 rounded-box p-6 border">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <DollarSign size={20} className="text-success" />
                            {t('payment.payment_information', 'Payment Information')}
                        </h2>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">
                                    {t('payment.payment_id', 'Payment ID')}:
                                </span>
                                <span className="font-mono font-semibold">#{payment.id}</span>
                            </div>
                            <div className="flex justify-between items-center ">
                                <span className="text-gray-600">
                                    {t('payment.payment_type', 'Payment Type')}:
                                </span>
                                <span className="badge badge-info rounded">
                                    {getPaymentTypeLabel()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">
                                    {t('payment.transaction_reference', 'Transaction Ref')}:
                                </span>
                                <span className="font-mono font-semibold">
                                    {payment.txn_ref || "N/A"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">
                                    {t('payment.amount', 'Amount')}:
                                </span>
                                <span className="text-success font-bold text-lg">
                                    {formatCurrency(payment.amount)} {t('payment.currency', 'Tk')}
                                </span>
                            </div>
                            <div className="flex justify-between items-center ">
                                <span className="text-gray-600">
                                    {t('payment.status', 'Status')}:
                                </span>
                                <span className="badge badge-success badge-lg rounded">
                                    {getStatusLabel(payment.status)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="bg-base-100 rounded-box p-6 border">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <CreditCard size={20} className="text-primary" />
                            {t('payment.payment_method', 'Payment Method')}
                        </h2>
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${methodDetails.bgColor}`}>
                                <MethodIcon size={24} className={methodDetails.color} />
                            </div>
                            <div>
                                <p className="font-semibold text-lg">
                                    {methodDetails.label}
                                </p>
                                <p className="text-gray-500 text-sm">
                                    {formatDate(payment.created_at)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Related Document (Sale or Purchase) */}
                    <div className="bg-base-100 rounded-box p-6 border">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            {isCustomerPayment ? (
                                <Receipt size={20} className="text-info" />
                            ) : (
                                <Package size={20} className="text-warning" />
                            )}
                            {isCustomerPayment 
                                ? t('payment.related_sale', 'Related Sale') 
                                : t('payment.related_purchase', 'Related Purchase')
                            }
                        </h2>
                        {isCustomerPayment && payment.sale ? (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">
                                        {t('payment.invoice_no', 'Invoice No')}:
                                    </span>
                                    <Link
                                        href={route("sales.show", { sale: payment.sale.id })}
                                        className="font-mono font-semibold text-primary hover:underline"
                                    >
                                        {payment.sale.invoice_no}
                                    </Link>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">
                                        {t('payment.sale_total', 'Sale Total')}:
                                    </span>
                                    <span className="font-semibold">
                                        {formatCurrency(payment.sale.grand_total)} {t('payment.currency', 'Tk')}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">
                                        {t('payment.sale_status', 'Sale Status')}:
                                    </span>
                                    <span className={`badge capitalize ${
                                        payment.sale.status === 'completed' 
                                            ? 'badge-success' 
                                            : payment.sale.status === 'cancelled'
                                            ? 'badge-error'
                                            : 'badge-warning'
                                    }`}>
                                        {getStatusLabel(payment.sale.status)}
                                    </span>
                                </div>
                            </div>
                        ) : isSupplierPayment && payment.purchase ? (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">
                                        {t('payment.purchase_invoice', 'Purchase Invoice')}:
                                    </span>                                    
                                    <Link
                                        href={`purchase.show", ${payment.purchase.id}` }
                                        className="font-mono font-semibold text-primary hover:underline"
                                    >
                                        {payment.purchase.purchase_no || `PUR-${payment.purchase.id}`}
                                    </Link>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">
                                        {t('payment.purchase_total', 'Purchase Total')}:
                                    </span>
                                    <span className="font-semibold">
                                        {formatCurrency(payment.purchase.grand_total)} {t('payment.currency', 'Tk')}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">
                                        {t('payment.purchase_status', 'Purchase Status')}:
                                    </span>
                                    <span className={`badge capitalize rounded ${
                                        payment.purchase.status === 'completed' 
                                            ? 'badge-success' 
                                            : payment.purchase.status === 'cancelled'
                                            ? 'badge-error'
                                            : 'badge-warning'
                                    }`}>
                                        {getStatusLabel(payment.purchase.status)}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">
                                {isCustomerPayment 
                                    ? t('payment.no_related_sale', 'No related sale found')
                                    : t('payment.no_related_purchase', 'No related purchase found')
                                }
                            </p>
                        )}
                    </div>
                </div>

                {/* Party and Transaction Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Customer/Supplier Information */}
                    <div className="bg-base-100 rounded-box p-6 border">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            {isCustomerPayment ? (
                                <User size={20} className="text-warning" />
                            ) : (
                                <Truck size={20} className="text-purple-600" />
                            )}
                            {isCustomerPayment 
                                ? t('payment.customer_information', 'Customer Information')
                                : t('payment.supplier_information', 'Supplier Information')
                            }
                        </h2>
                        {isCustomerPayment && payment.customer ? (
                            <div className="space-y-3">
                                <div>
                                    <p className="font-semibold text-lg">
                                        {payment.customer.customer_name}
                                    </p>
                                    {payment.customer.phone && (
                                        <p className="text-gray-600">
                                            📞 {payment.customer.phone}
                                        </p>
                                    )}
                                    {payment.customer.email && (
                                        <p className="text-gray-600">
                                            ✉️ {payment.customer.email}
                                        </p>
                                    )}
                                    {payment.customer.address && (
                                        <p className="text-gray-600 text-sm mt-2">
                                            📍 {payment.customer.address}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : isSupplierPayment && payment.supplier ? (
                            <div className="space-y-3">
                                <div>
                                    <p className="font-semibold text-lg">
                                        {payment.supplier.supplier_name}
                                    </p>
                                    {payment.supplier.phone && (
                                        <p className="text-gray-600">
                                            📞 {payment.supplier.phone}
                                        </p>
                                    )}
                                    {payment.supplier.email && (
                                        <p className="text-gray-600">
                                            ✉️ {payment.supplier.email}
                                        </p>
                                    )}
                                    {payment.supplier.address && (
                                        <p className="text-gray-600 text-sm mt-2">
                                            📍 {payment.supplier.address}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="font-semibold text-lg">
                                    {isCustomerPayment 
                                        ? t('payment.walk_in_customer', 'Walk-in Customer')
                                        : t('payment.walk_in_supplier', 'Direct Supplier')
                                    }
                                </p>
                                <p className="text-gray-500 text-sm">
                                    {isCustomerPayment 
                                        ? t('payment.no_customer_info', 'No customer information available')
                                        : t('payment.no_supplier_info', 'No supplier information available')
                                    }
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Transaction Details */}
                    <div className="bg-base-100 rounded-box p-6 border">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Calendar size={20} className="text-info" />
                            {t('payment.transaction_details', 'Transaction Details')}
                        </h2>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">
                                    {t('payment.payment_date', 'Payment Date')}:
                                </span>
                                <span className="font-semibold">
                                    {formatDate(payment.created_at)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">
                                    {t('payment.processed_by', 'Processed By')}:
                                </span>
                                <span className="font-semibold">
                                    {auth.user?.name || "System"}
                                </span>
                            </div>
                            {business && (
                                <div className="flex justify-between text-right">
                                    <span className="text-gray-600">
                                        {t('payment.business', 'Business')}:
                                    </span>
                                    <span className="font-semibold">
                                        {business.name}
                                        <br />
                                        ({business.phone})
                                    </span>
                                </div>
                            )}
                            {payment.updated_at !== payment.created_at && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        {t('payment.last_updated', 'Last Updated')}:
                                    </span>
                                    <span className="font-semibold">
                                        {formatDate(payment.updated_at)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Notes Section */}
                {payment.note && (
                    <div className="bg-base-100 rounded-box p-6 border mb-8">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <FileText size={20} className="text-gray-600" />
                            {t('payment.payment_notes', 'Payment Notes')}
                        </h2>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-gray-700 whitespace-pre-wrap">
                                {payment.note}
                            </p>
                        </div>
                    </div>
                )}

                {/* Items Section (Sale Items or Purchase Items) */}
                {isCustomerPayment && payment.sale?.items && payment.sale.items.length > 0 && (
                    <div className="bg-base-100 rounded-box p-6 border">
                        <h2 className="text-lg font-semibold mb-4">
                            {t('payment.sale_items', 'Sale Items')}
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="table table-auto w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th>{t('payment.product', 'Product')}</th>
                                        <th>{t('payment.brand', 'Brand')}</th>
                                        <th>{t('payment.variant', 'Variant')}</th>
                                        <th>{t('payment.quantity', 'Quantity')}</th>
                                        <th>{t('payment.unit_price', 'Unit Price')}</th>
                                        <th>{t('payment.total', 'Total')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payment.sale.items.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td>
                                                <div>
                                                    <p className="font-medium">
                                                        {item.product?.name || "Unknown Product"}
                                                    </p>
                                                    {item.product?.product_no && (
                                                        <p className="text-sm text-gray-500">
                                                            {t('payment.sku', 'SKU')}: {item.product.product_no}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="text-left">
                                                {item.variant && (
                                                    <>
                                                    {(() => {
                                                        const variant = item.variant;
                                                        let attrsText = '';

                                                        if (variant.attribute_values) {
                                                        if (typeof variant.attribute_values === 'object') {
                                                            attrsText = Object.entries(variant.attribute_values)
                                                            .map(([key, value]) => `${key}`)
                                                            .join(', ');
                                                        } 
                                                        }

                                                        return <>{attrsText || 'N/A'}</>;
                                                    })()}
                                                 
                                                    </>
                                                )}
                                            </td>
                                            <td className="text-left">
                                                {item.variant && (
                                                    <>
                                                    {(() => {
                                                        const variant = item.variant;
                                                        let attrsText = '';

                                                        if (variant.attribute_values) {
                                                        if (typeof variant.attribute_values === 'object') {
                                                            attrsText = Object.entries(variant.attribute_values)
                                                            .map(([key, value]) => ` ${value}`)
                                                            .join(', ');
                                                        } else {
                                                            attrsText = variant.attribute_values;
                                                        }
                                                        }

                                                        return <>{attrsText || 'N/A'}</>;
                                                    })()}
                                                    <br />
                                                    <span className="text-sm text-gray-500">
                                                        {item.variant?.sku || t('payment.no_sku', 'No SKU')}
                                                    </span>
                                                    </>
                                                )}
                                            </td>
                                            <td className="font-semibold">
                                                {item.quantity}
                                            </td>
                                            <td className="font-semibold">
                                                {formatCurrency(item.unit_price)} {t('payment.currency', 'Tk')}
                                            </td>
                                            <td className="font-semibold text-success">
                                                {formatCurrency(item.total_price)} {t('payment.currency', 'Tk')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {isSupplierPayment && payment.purchase?.items && payment.purchase.items.length > 0 && (
                    <div className="bg-base-100 rounded-box p-6 border">
                        <h2 className="text-lg font-semibold mb-4">
                            {t('payment.purchase_items', 'Purchase Items')}
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="table table-auto w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th>{t('payment.product', 'Product')}</th>
                                        <th>{t('payment.variant', 'Variant')}</th>
                                        <th>{t('payment.quantity', 'Quantity')}</th>
                                        <th>{t('payment.unit_price', 'Unit Price')}</th>
                                        <th>{t('payment.total', 'Total')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payment.purchase.items.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td>
                                                <div>
                                                    <p className="font-medium">
                                                        {item.product?.name || "Unknown Product"}
                                                    </p>
                                                    {item.product?.product_no && (
                                                        <p className="text-sm text-gray-500">
                                                            {t('payment.sku', 'SKU')}: {item.product.product_no}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="text-left">
                                                {item.variant && (
                                                    <>
                                                    {(() => {
                                                        const variant = item.variant;
                                                        let attrsText = '';

                                                        if (variant.attribute_values) {
                                                        if (typeof variant.attribute_values === 'object') {
                                                            attrsText = Object.entries(variant.attribute_values)
                                                            .map(([key, value]) => `${key}: ${value}`)
                                                            .join(', ');
                                                        } else {
                                                            attrsText = variant.attribute_values;
                                                        }
                                                        }

                                                        return <>{attrsText || 'N/A'}</>;
                                                    })()}
                                                    <br />
                                                    <span className="text-sm text-gray-500">
                                                        {item.variant?.sku || t('payment.no_sku', 'No SKU')}
                                                    </span>
                                                    </>
                                                )}
                                            </td>
                                            <td className="font-semibold">
                                                {item.quantity}
                                            </td>
                                            <td className="font-semibold">
                                                {formatCurrency(item.unit_price)} {t('payment.currency', 'Tk')}
                                            </td>
                                            <td className="font-semibold text-success">
                                                {formatCurrency(item.total_price)} {t('payment.currency', 'Tk')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Print Footer */}
                <div className="hidden print:block mt-12 pt-8 border-t">
                    <div className="text-center text-gray-500">
                        <p className="font-semibold">
                            {t('payment.thank_you', 'Thank you for your business!')}
                        </p>
                        {business && (
                            <div className="mt-2 text-sm">
                                <p>{business.business_name}</p>
                                {business.address && <p>{business.address}</p>}
                                {business.phone && <p>📞 {business.phone}</p>}
                                {business.email && <p>✉️ {business.email}</p>}
                            </div>
                        )}
                        <p className="text-sm mt-2">
                            {t('payment.computer_generated', 'This is a computer generated receipt')}
                        </p>
                        <p className="text-xs mt-2">
                            {t('payment.printed_on', 'Printed on')}: {formatDate(new Date().toISOString())}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}