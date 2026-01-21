import { Link, usePage } from "@inertiajs/react";
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
    CheckCircle,
    Clock,
    XCircle,
    BadgeCheck
} from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "../../hooks/useTranslation";

export default function PaymentView({ payment }) {
    const { auth } = usePage().props;
    const { t, locale } = useTranslation();
    const printRef = useRef();

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US', {
            timeZone: "UTC",
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    const formatDateOnly = (dateString) => {
        return new Date(dateString).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
            timeZone: "UTC",
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const getPaymentMethodDetails = (method) => {
        const details = {
            cash: { 
                icon: DollarSign, 
                color: "text-green-600",
                bgColor: "bg-green-50",
                borderColor: "border-green-200",
                label: t('payments.cash', 'Cash')
            },
            card: { 
                icon: CreditCard, 
                color: "text-blue-600",
                bgColor: "bg-blue-50",
                borderColor: "border-blue-200",
                label: t('payments.card', 'Credit Card')
            },
            bank: { 
                icon: Building, 
                color: "text-purple-600",
                bgColor: "bg-purple-50",
                borderColor: "border-purple-200",
                label: t('payments.bank', 'Bank Transfer')
            },
            mobile: { 
                icon: Smartphone, 
                color: "text-orange-600",
                bgColor: "bg-orange-50",
                borderColor: "border-orange-200",
                label: t('payments.mobile', 'Mobile Banking')
            },
            online: { 
                icon: Globe, 
                color: "text-cyan-600",
                bgColor: "bg-cyan-50",
                borderColor: "border-cyan-200",
                label: t('payments.online', 'Online Payment')
            },
        };
        return details[method] || { 
            icon: CreditCard, 
            color: "text-gray-500",
            bgColor: "bg-gray-50",
            borderColor: "border-gray-200",
            label: method
        };
    };

    const getStatusDetails = (status) => {
        const details = {
            completed: { 
                icon: CheckCircle, 
                color: "text-green-600",
                bgColor: "bg-green-50",
                borderColor: "border-green-200",
                label: t('payments.completed', 'Completed')
            },
            pending: { 
                icon: Clock, 
                color: "text-yellow-600",
                bgColor: "bg-yellow-50",
                borderColor: "border-yellow-200",
                label: t('payments.pending', 'Pending')
            },
            failed: { 
                icon: XCircle, 
                color: "text-red-600",
                bgColor: "bg-red-50",
                borderColor: "border-red-200",
                label: t('payments.failed', 'Failed')
            },
            refunded: { 
                icon: BadgeCheck, 
                color: "text-blue-600",
                bgColor: "bg-blue-50",
                borderColor: "border-blue-200",
                label: t('payments.refunded', 'Refunded')
            },
        };
        return details[status] || { 
            icon: Clock, 
            color: "text-gray-500",
            bgColor: "bg-gray-50",
            borderColor: "border-gray-200",
            label: status
        };
    };

    const methodDetails = getPaymentMethodDetails(payment.payment_method);
    const MethodIcon = methodDetails.icon;

    const statusDetails = getStatusDetails(payment.status);
    const StatusIcon = statusDetails.icon;

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${t('payments.payment_receipt', 'Payment Receipt')} - #${payment.id}</title>
                <style>
                    @media print {
                        @page {
                            margin: 0.5in;
                            size: A4;
                        }
                        body {
                            margin: 0;
                            padding: 0;
                            font-family: Arial, sans-serif;
                            color: #000;
                        }
                        .print-container {
                            max-width: 100%;
                            margin: 0 auto;
                            padding: 0;
                        }
                        .no-print { display: none !important; }
                        .print-break { page-break-inside: avoid; }
                        .print-mt-4 { margin-top: 1rem; }
                        .print-mb-4 { margin-bottom: 0.3rem; }
                        .print-mb-6 { margin-bottom: 1.5rem; }
                        .print-p-4 { padding: 0.2rem; }
                        .print-p-6 { padding: 1.5rem; }
                        .print-border { border: 1px solid #e5e7eb; }
                        .print-border-t { border-top: 1px solid #e5e7eb; }
                        .print-border-b { border-bottom: 1px solid #e5e7eb; }
                        .print-bg-gray-50 { background-color: #f9fafb; }
                        .print-text-center { text-align: center; }
                        .print-text-right { text-align: right; }
                        .print-text-sm { font-size: 0.875rem; }
                        .print-text-lg { font-size: 1.125rem; }
                        .print-text-xl { font-size: 1.25rem; }
                        .print-text-2xl { font-size: 1.5rem; }
                        .print-text-3xl { font-size: 1.875rem; }
                        .print-font-bold { font-weight: bold; }
                        .print-font-semibold { font-weight: 600; }
                        .print-text-gray-600 { color: #4b5563; }
                        .print-text-gray-700 { color: #374151; }
                        .print-text-gray-900 { color: #111827; }
                        .print-grid { display: grid; }
                        .print-grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                        .print-gap-4 { gap: 1rem; }
                        .print-gap-6 { gap: 1.5rem; }
                        .print-gap-8 { gap: 2rem; }
                        .print-flex { display: flex; }
                        .print-justify-between { justify-content: space-between; }
                        .print-items-start { align-items: flex-start; }
                        .print-space-y-2 > * + * { margin-top: 0.25rem; }
                        .print-space-y-3 > * + * { margin-top: 0.25rem; }
                        .print-w-full { width: 100%; }
                        .print-capitalize { text-transform: capitalize; }
                        .print-rounded { border-radius: 0.375rem; }
                        .print-mb-3 { margin-bottom: 0.75rem; }
                        .print-mb-2 { margin-bottom: 0.5rem; }
                        .print-mt-2 { margin-top: 0.5rem; }
                        .print-mt-8 { margin-top: 0.5rem; }
                        .print-pt-4 { padding-top: 1rem; }
                        .print-pt-6 { padding-top: 0.5rem; }
                        .print-pb-2 { padding-bottom: 0.5rem; }
                        .print-pb-4 { padding-bottom: 1rem; }
                    }
                    body { font-family: Arial, sans-serif; line-height: 1.6; }
                    .header { border-bottom: 2px solid #000; margin-bottom: 2rem; }
                    .section { margin-bottom: 1.5rem; }
                    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
                    .border-bottom { border-bottom: 1px solid #e5e7eb; padding-bottom: 0.5rem; }
                    .footer { border-top: 2px solid #000; margin-top: 2rem; padding-top: 1rem; }
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
            <div className={`bg-white rounded-box ${locale === 'bn' ? 'bangla-font' : ''}`}>
                <div className="p-3 border-b print:border-none no-print">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <Link
                                href={route("subscriptions.payments")}
                                className="btn btn-ghost btn-sm no-print"
                            >
                                <ArrowLeft size={16} />
                                {t('payments.back', 'Back to Payments')}
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {t('payments.payment_receipt', 'Payment Receipt')}
                                </h1>
                                <p className="text-gray-500 text-sm">
                                    {t('payments.payment_details', 'Payment details and transaction information')}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2 no-print">
                            <button
                                onClick={handlePrint}
                                className="btn btn-outline btn-sm"
                            >
                                <Printer size={16} />
                                {t('payments.print', 'Print')}
                            </button>
                            <button
                                onClick={handleDownload}
                                className="btn btn-outline btn-sm"
                            >
                                <Download size={16} />
                                {t('payments.download', 'Download')}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-3 no-print">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        <div className="bg-base-100 rounded-box p-6 border">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <DollarSign size={20} className="text-green-600" />
                                {t('payments.payment_information', 'Payment Information')}
                            </h2>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">{t('payments.payment_id', 'Payment ID')}:</span>
                                    <span className="font-mono font-semibold">#{payment.id}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">{t('payments.transaction_ref', 'Transaction Ref')}:</span>
                                    <span className="font-mono font-semibold">
                                        {payment.transaction_id || "N/A"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">{t('payments.amount', 'Amount')}:</span>
                                    <span className="text-green-600 font-bold text-lg">
                                        {formatCurrency(payment.amount)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">{t('payments.status', 'Status')}:</span>
                                    <span className={`badge ${statusDetails.bgColor} ${statusDetails.borderColor} ${statusDetails.color} badge-lg capitalize flex items-center gap-1`}>
                                        <StatusIcon size={14} />
                                        {statusDetails.label}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-base-100 rounded-box p-6 border">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <CreditCard size={20} className="text-blue-600" />
                                {t('payments.payment_method', 'Payment Method')}
                            </h2>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-full ${methodDetails.bgColor}`}>
                                    <MethodIcon size={24} className={methodDetails.color} />
                                </div>
                                <div>
                                    <p className="font-semibold text-lg capitalize">
                                        {methodDetails.label}
                                    </p>
                                    <p className="text-gray-500 text-sm">
                                        {payment.payment_date ? formatDate(payment.payment_date) : formatDate(payment.created_at)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-base-100 rounded-box p-6 border">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Receipt size={20} className="text-purple-600" />
                                {t('payments.related_subscription', 'Related Subscription')}
                            </h2>
                            {payment.subscription ? (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">{t('payments.subscription_id', 'Subscription ID')}:</span>
                                        <Link
                                            href={route("subscriptions.show", { subscription: payment.subscription.id })}
                                            className="font-mono font-semibold text-primary hover:underline"
                                        >
                                            #{payment.subscription.id}
                                        </Link>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">{t('payments.plan', 'Plan')}:</span>
                                        <span className="font-semibold">
                                            {payment.subscription.plan?.name || "N/A"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">{t('payments.plan_price', 'Plan Price')}:</span>
                                        <span className="font-semibold">
                                            {formatCurrency(payment.subscription.plan?.price || 0)}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">{t('payments.no_related_subscription', 'No related subscription found')}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <div className="bg-base-100 rounded-box p-6 border">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <User size={20} className="text-orange-600" />
                                {t('payments.customer_information', 'Customer Information')}
                            </h2>
                            {payment.subscription?.user ? (
                                <div className="space-y-3">
                                    <div>
                                        <p className="font-semibold text-lg">
                                            {payment.subscription.user.name}
                                        </p>
                                        {payment.subscription.user.email && (
                                            <p className="text-gray-600">
                                                ✉️ {payment.subscription.user.email}
                                            </p>
                                        )}
                                        {payment.subscription.user.phone && (
                                            <p className="text-gray-600">
                                                📞 {payment.subscription.user.phone}
                                            </p>
                                        )}
                                        {payment.subscription.user.address && (
                                            <p className="text-gray-600 text-sm mt-2">
                                                📍 {payment.subscription.user.address}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <p className="font-semibold text-lg">{t('payments.no_customer_information', 'No Customer Information')}</p>
                                    <p className="text-gray-500 text-sm">{t('payments.customer_details_not_available', 'Customer details not available')}</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-base-100 rounded-box p-6 border">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Calendar size={20} className="text-cyan-600" />
                                {t('payments.transaction_details', 'Transaction Details')}
                            </h2>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">{t('payments.payment_date', 'Payment Date')}:</span>
                                    <span className="font-semibold">
                                        {payment.payment_date ? formatDate(payment.payment_date) : formatDate(payment.created_at)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">{t('payments.processed_at', 'Processed At')}:</span>
                                    <span className="font-semibold">
                                        {formatDate(payment.created_at)}
                                    </span>
                                </div>
                                {payment.updated_at !== payment.created_at && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">{t('payments.last_updated', 'Last Updated')}:</span>
                                        <span className="font-semibold">
                                            {formatDate(payment.updated_at)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {payment.subscription?.plan && (
                        <div className="bg-base-100 rounded-box p-6 border mb-8">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <FileText size={20} className="text-gray-600" />
                                {t('payments.plan_details', 'Plan Details')}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="text-center p-4 border rounded-lg bg-blue-50 border-blue-200">
                                    <p className="text-sm text-gray-600">{t('payments.plan_name', 'Plan Name')}</p>
                                    <p className="font-semibold text-blue-700">{payment.subscription.plan.name}</p>
                                </div>
                                <div className="text-center p-4 border rounded-lg bg-green-50 border-green-200">
                                    <p className="text-sm text-gray-600">{t('payments.plan_price', 'Plan Price')}</p>
                                    <p className="font-semibold text-green-700">{formatCurrency(payment.subscription.plan.price)}</p>
                                </div>
                                <div className="text-center p-4 border rounded-lg bg-purple-50 border-purple-200">
                                    <p className="text-sm text-gray-600">{t('payments.billing_cycle', 'Billing Cycle')}</p>
                                    <p className="font-semibold text-purple-700 capitalize">
                                        {payment.subscription.plan.billing_cycle || 'Monthly'}
                                    </p>
                                </div>
                                <div className="text-center p-4 border rounded-lg bg-orange-50 border-orange-200">
                                    <p className="text-sm text-gray-600">{t('payments.validity', 'Validity')}</p>
                                    <p className="font-semibold text-orange-700">
                                        {payment.subscription.plan.validity || '30'} {t('payments.days', 'days')}
                                    </p>
                                </div>
                            </div>
                            {payment.subscription.plan.description && (
                                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm font-medium text-gray-700 mb-2">{t('payments.description', 'Description')}:</p>
                                    <p className="text-gray-600">{payment.subscription.plan.description}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {payment.notes && (
                        <div className="bg-base-100 rounded-box p-6 border mb-8">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <FileText size={20} className="text-gray-600" />
                                {t('payments.payment_notes', 'Payment Notes')}
                            </h2>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-gray-700 whitespace-pre-wrap">
                                    {payment.notes}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="hidden">
                <div ref={printRef} className="print-p-4">
                    <div className="print-text-center print-border-b print-pb-2 print-mb-4">
                        <h1 className="print-text-3xl print-font-bold print-text-gray-900">{t('payments.payment_receipt', 'PAYMENT RECEIPT')}</h1>
                        <p className="print-text-gray-600">{t('payments.official_payment_confirmation', 'Official Payment Confirmation')}</p>
                        <p className="print-text-sm print-text-gray-500 print-mt-2">
                            {t('payments.generated_on', 'Generated on')}: {formatDate(new Date().toISOString())}
                        </p>
                    </div>

                    <div className="print-flex print-justify-between print-items-start print-mb-4">
                        <div>
                            <h2 className="print-text-xl print-font-bold">Your Company Name</h2>
                            <p className="print-text-gray-600">123 Business Street</p>
                            <p className="print-text-gray-600">City, State 12345</p>
                            <p className="print-text-gray-600">contact@company.com</p>
                        </div>
                        <div className="print-text-right">
                            <p className="print-text-lg print-font-semibold">{t('payments.receipt', 'Receipt')} #: {payment.id}</p>
                            <p className="print-text-gray-600">{t('payments.date', 'Date')}: {formatDateOnly(payment.payment_date || payment.created_at)}</p>
                        </div>
                    </div>

                    <div className="print-grid print-grid-cols-2 print-gap-8 print-mb-4 print-break">
                        <div>
                            <h3 className="print-text-lg print-font-semibold print-mb-3 print-border-b print-pb-2">{t('payments.payment_information', 'Payment Information')}</h3>
                            <div className="print-space-y-2">
                                <div className="print-flex print-justify-between">
                                    <span className="print-font-medium">{t('payments.payment_id', 'Payment ID')}:</span>
                                    <span>#{payment.id}</span>
                                </div>
                                <div className="print-flex print-justify-between">
                                    <span className="print-font-medium">{t('payments.transaction_id', 'Transaction ID')}:</span>
                                    <span>{payment.transaction_id || "N/A"}</span>
                                </div>
                                <div className="print-flex print-justify-between">
                                    <span className="print-font-medium">{t('payments.amount', 'Amount')}:</span>
                                    <span className="print-font-bold">{formatCurrency(payment.amount)}</span>
                                </div>
                                <div className="print-flex print-justify-between">
                                    <span className="print-font-medium">{t('payments.status', 'Status')}:</span>
                                    <span className="print-font-semibold print-capitalize">{payment.status}</span>
                                </div>
                                <div className="print-flex print-justify-between">
                                    <span className="print-font-medium">{t('payments.method', 'Method')}:</span>
                                    <span className="print-capitalize">{payment.payment_method}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="print-text-lg print-font-semibold print-mb-3 print-border-b print-pb-2">{t('payments.customer_information', 'Customer Information')}</h3>
                            {payment.subscription?.user ? (
                                <div className="print-space-y-2">
                                    <div>
                                        <span className="print-font-medium">{t('payments.name', 'Name')}: </span>
                                        <span>{ payment.subscription.user.name}</span>
                                    </div>
                                    {payment.subscription.user.email && (
                                        <div>
                                            <span className="print-font-medium">{t('payments.email', 'Email')}: </span>
                                            <span>{ payment.subscription.user.email}</span>
                                        </div>
                                    )}
                                    {payment.subscription.user.phone && (
                                        <div>
                                            <span className="print-font-medium">{t('payments.phone', 'Phone')}: </span>
                                            <span>{ payment.subscription.user.phone}</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p>{t('payments.no_customer_information_available', 'No customer information available')}</p>
                            )}
                        </div>
                    </div>

                    {payment.subscription && (
                        <div className="print-mb-6 print-break">
                            <h3 className="print-text-lg print-font-semibold print-mb-3 print-border-b print-pb-2">{t('payments.subscription_details', 'Subscription Details')}</h3>
                            <div className="print-grid print-grid-cols-2 print-gap-4">
                                <div>
                                    <span className="print-font-medium">{t('payments.subscription_id', 'Subscription ID')}: </span>
                                    <p>#{ payment.subscription.id}</p>
                                </div>
                                <div>
                                    <span className="print-font-medium">{t('payments.plan', 'Plan')}:</span>
                                    <p>{payment.subscription.plan?.name || "N/A"}</p>
                                </div>
                                <div>
                                    <span className="print-font-medium">{t('payments.plan_price', 'Plan Price')}:</span>
                                    <p>{payment.subscription.plan?.price || 0} Tk Only</p>
                                </div>
                                <div>
                                    <span className="print-font-medium">{t('payments.billing_cycle', 'Billing Cycle')}:</span>
                                    <p className="print-capitalize">{payment.subscription.plan?.billing_cycle || "Monthly"}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {payment.notes && (
                        <div className="print-mb-6 print-break">
                            <h3 className="print-text-lg print-font-semibold print-mb-2">{t('payments.notes', 'Notes')}</h3>
                            <p className="print-text-gray-700 print-border print-p-4 print-rounded print-bg-gray-50">{payment.notes}</p>
                        </div>
                    )}

                    <div className="print-border-t print-pt-6 print-mt-8 print-text-center">
                        <p className="print-text-gray-600">{t('payments.thank_you_business', 'Thank you for your business!')}</p>
                        <p className="print-text-sm print-text-gray-500 print-mt-2">
                            {t('payments.computer_generated_receipt', 'This is a computer-generated receipt. No signature required.')}
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}