import React, { useRef } from "react";
import PageHeader from "../../components/PageHeader";
import { 
    ArrowLeft, 
    Download, 
    Printer, 
    User, 
    Calendar,
    CreditCard,
    FileText,
    Clock,
    Zap,
    Building,
    Smartphone,
    Globe,
    CheckCircle,
    XCircle,
    AlertCircle,
    PauseCircle,
    Tag,
    Grid,
    DollarSign,
    Star,
    Shield,
    Target,
    BarChart
} from "lucide-react";
import { Link, usePage } from "@inertiajs/react";
import { useTranslation } from "../../hooks/useTranslation";

export default function SubscriptionShow({ subscription , paymentTotal }) {
    const { auth } = usePage().props;
    const { t, locale } = useTranslation();
    const printRef = useRef(null);

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US', {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    // Format date only (without time)
    const formatDateOnly = (dateString) => {
        return new Date(dateString).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    // Format date for print (compact)
    const formatDateForPrint = (dateString) => {
        return new Date(dateString).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    // Get status details
    const getStatusDetails = (status) => {
        const details = {
            1: { 
                icon: CheckCircle, 
                color: "text-success",
                bgColor: "bg-success/10",
                badge: "badge-success",
                label: t('payments.active', 'Active')
            },
            3: { 
                icon: XCircle, 
                color: "text-error",
                bgColor: "bg-error/10",
                badge: "badge-error",
                label: t('payments.cancelled', 'Canceled')
            },
            2: { 
                icon: AlertCircle, 
                color: "text-warning",
                bgColor: "bg-warning/10",
                badge: "badge-warning",
                label: t('payments.expired', 'Expired')
            },
            4: { 
                icon: Clock, 
                color: "text-info",
                bgColor: "bg-info/10",
                badge: "badge-info",
                label: t('payments.pending', 'Pending')
            },
        };
        return details[status] || { 
            icon: AlertCircle, 
            color: "text-gray-500",
            bgColor: "bg-gray-100",
            badge: "badge-gray-500",
            label: status
        };
    };

    // Get plan type badge
    const getPlanTypeBadge = (type) => {
        const typeMap = {
            '1': { label: t('plan.free', 'Free'), class: 'badge-info' },
            '2': { label: t('plan.premium', 'Premium'), class: 'badge-primary' },
        };
        return typeMap[type] || { label: type, class: 'badge-neutral' };
    };

    // Handle print
    const handlePrint = () => {
        const printContent = printRef.current.innerHTML;
        
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) {
            alert('Please allow popups for printing');
            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="${locale}">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${t('payments.subscription_details', 'Subscription Details')} - #${subscription.id}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@300;400;500;600;700&display=swap');
                    
                    * {
                        font-family: ${locale === 'bn' ? "'Noto Sans Bengali', sans-serif" : "'Inter', sans-serif"};
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                        font-size: 10pt;
                    }
                    
                    body {
                        background-color: #ffffff;
                        padding: 10px;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    
                    @page {
                        size: A4 portrait;
                        margin: 10mm;
                    }
                    
                    @media print {
                        body {
                            padding: 0 !important;
                            margin: 0 !important;
                            font-size: 9pt !important;
                        }
                        
                        .print-container {
                            box-shadow: none !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                        
                        .watermark {
                            display: block !important;
                        }
                        
                        .page-break {
                            page-break-before: always;
                        }
                    }
                    
                    .print-container {
                        max-width: 190mm;
                        margin: 0 auto;
                        background: white;
                        padding: 15px;
                    }
                    
                    .watermark {
                        position: fixed;
                        opacity: 0.02;
                        font-size: 80px;
                        transform: rotate(-45deg);
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%) rotate(-45deg);
                        color: #000;
                        z-index: -1;
                        pointer-events: none;
                        display: none;
                        font-weight: bold;
                    }
                    
                    .badge {
                        padding: 2px 8px;
                        border-radius: 12px;
                        font-size: 9px;
                        font-weight: 600;
                        display: inline-block;
                    }
                    
                    .badge-success {
                        background-color: #10b981 !important;
                        color: white !important;
                    }
                    
                    .badge-warning {
                        background-color: #f59e0b !important;
                        color: white !important;
                    }
                    
                    .badge-error {
                        background-color: #ef4444 !important;
                        color: white !important;
                    }
                    
                    .badge-info {
                        background-color: #3b82f6 !important;
                        color: white !important;
                    }
                    
                    .badge-primary {
                        background-color: #8b5cf6 !important;
                        color: white !important;
                    }
                    
                    .section-divider {
                        border-bottom: 1px solid #e5e7eb;
                        margin: 15px 0;
                    }
                    
                    .compact-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 15px;
                        font-size: 9px;
                    }
                    
                    .compact-table th {
                        background-color: #f3f4f6 !important;
                        padding: 8px;
                        text-align: left;
                        font-size: 9px;
                        color: #374151;
                        border: 1px solid #e5e7eb;
                        font-weight: 600;
                    }
                    
                    .compact-table td {
                        padding: 8px;
                        border: 1px solid #e5e7eb;
                        font-size: 9px;
                    }
                    
                    .compact-table tfoot td {
                        background-color: #f9fafb !important;
                        font-weight: 600;
                    }
                    
                    .print-gradient-header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    
                    .print-bg-gray-50 {
                        background-color: #f9fafb !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    
                    .print-bg-blue-50 {
                        background-color: #eff6ff !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    
                    .print-bg-green-50 {
                        background-color: #f0fdf4 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    
                    .info-box {
                        border: 1px solid #e5e7eb;
                        border-radius: 6px;
                        padding: 10px;
                        margin-bottom: 10px;
                    }
                    
                    h1 { font-size: 18px !important; }
                    h2 { font-size: 16px !important; }
                    h3 { font-size: 14px !important; }
                    h4 { font-size: 12px !important; }
                    p { font-size: 10px !important; }
                    .text-xs { font-size: 8px !important; }
                    .text-sm { font-size: 9px !important; }
                    .text-base { font-size: 10px !important; }
                    .text-lg { font-size: 12px !important; }
                    .text-xl { font-size: 14px !important; }
                    .text-2xl { font-size: 16px !important; }
                    .text-3xl { font-size: 18px !important; }
                </style>
            </head>
            <body>
                <div class="watermark">${t('payments.subscription', 'SUBSCRIPTION')}</div>
                <div class="print-container">
                    ${printContent}
                </div>
                <script>
                    // Auto print and close
                    window.onload = function() {
                        window.focus();
                        setTimeout(function() {
                            window.print();
                        }, 300);
                    };
                    
                    window.onafterprint = function() {
                        setTimeout(function() {
                            window.close();
                        }, 500);
                    };
                    
                    // Fallback close button
                    document.addEventListener('keydown', function(e) {
                        if (e.key === 'Escape') {
                            window.close();
                        }
                    });
                </script>
            </body>
            </html>
        `);

        printWindow.document.close();
    };

    // Handle download (opens print dialog)
    const handleDownload = () => {
        handlePrint();
    };

    // Calculate days remaining
    const getDaysRemaining = () => {
        if (!subscription.end_date) return 0;
        const endDate = new Date(subscription.end_date);
        const today = new Date();
        const diffTime = endDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const daysRemaining = getDaysRemaining();
    const statusDetails = getStatusDetails(subscription.status);
    const StatusIcon = statusDetails.icon;
    const planTypeBadge = subscription.plan ? getPlanTypeBadge(subscription.plan.plan_type) : null;

    return (
        <div className={`bg-white rounded-box ${locale === 'bn' ? 'bangla-font' : ''}`}>
            {/* Header */}
            <div className="p-5 border-b print:border-none">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route("subscriptions.index")}
                            className="btn btn-ghost btn-sm no-print"
                        >
                            <ArrowLeft size={16} />
                            {t('payments.back', 'Back to Subscriptions')}
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {t('payments.subscription_details', 'Subscription Details')}
                            </h1>
                            <p className="text-gray-500 text-sm">
                                {t('payments.subscription_information', 'Subscription information and billing history')}
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
                            {t('payments.download', 'Download PDF')}
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-5">
                {/* Main Content - Visible on Screen */}
                <div className="no-print">
                    {/* Subscription Summary Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                        {/* Subscription Information */}
                        <div className="bg-base-100 rounded-box p-6 border">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Zap size={20} className="text-warning" />
                                {t('payments.subscription_information', 'Subscription Information')}
                            </h2>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">{t('payments.subscription_id', 'Subscription ID')}:</span>
                                    <span className="font-mono font-semibold">#{subscription.id}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">{t('payments.status', 'Status')}:</span>
                                    <span className={`badge ${statusDetails.badge} badge-lg capitalize`}>
                                        {statusDetails.label}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">{t('payments.plan', 'Plan')}:</span>
                                    <span className="font-semibold">
                                        {subscription.plan?.name || "N/A"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">{t('payments.created', 'Created')}:</span>
                                    <span className="font-semibold text-sm">
                                        {formatDateOnly(subscription.created_at)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Billing Information */}
                        <div className="bg-base-100 rounded-box p-6 border">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <CreditCard size={20} className="text-primary" />
                                {t('payments.billing_information', 'Billing Information')}
                            </h2>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">{t('payments.price', 'Price')}:</span>
                                    <span className="text-success font-bold text-lg">
                                        {formatCurrency(subscription.plan?.price || 0)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">{t('payments.amount_paid', 'Amount Paid')}:</span>
                                    <span className="font-semibold text-green-600">
                                        {formatCurrency(paymentTotal)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">{t('payments.payment_method', 'Payment Method')}:</span>
                                    <span className="font-semibold capitalize">
                                        {subscription?.payments?.[0]?.payment_method || "Cash"}
                                    </span>
                                </div>
                                {subscription.transaction_id && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">{t('payments.transaction_id', 'Transaction ID')}:</span>
                                        <span className="font-mono text-sm">
                                            {subscription.transaction_id}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Timeline Information */}
                        <div className="bg-base-100 rounded-box p-6 border">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Calendar size={20} className="text-success" />
                                {t('payments.timeline', 'Timeline')}
                            </h2>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">{t('payments.start_date', 'Start Date')}:</span>
                                    <span className="font-semibold">
                                        {subscription.start_date ? formatDateOnly(subscription.start_date) : "N/A"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">{t('payments.end_date', 'End Date')}:</span>
                                    <span className="font-semibold">
                                        {subscription.end_date ? formatDateOnly(subscription.end_date) : "N/A"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">{t('payments.days_remaining', 'Days Remaining')}:</span>
                                    <span className={`font-semibold ${daysRemaining < 7 ? 'text-error' : 'text-success'}`}>
                                        {daysRemaining} {t('payments.days', 'days')}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">{t('payments.validity', 'Validity')}:</span>
                                    <span className="font-semibold">
                                        {subscription.plan?.validity || 0} {t('payments.days', 'days')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* User Information */}
                        <div className="bg-base-100 rounded-box p-6 border">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <User size={20} className="text-info" />
                                {t('payments.user_information', 'User Information')}
                            </h2>
                            {subscription.user ? (
                                <div className="space-y-3">
                                    <div>
                                        <p className="font-semibold text-lg">
                                            {subscription.user.name}
                                        </p>
                                        {subscription.user.email && (
                                            <p className="text-gray-600 text-sm">
                                                ✉️ {subscription.user.email}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">{t('payments.member_since', 'Member since')}:</span>
                                        <span className="font-semibold text-sm">
                                            {subscription.user.created_at ? formatDateOnly(subscription.user.created_at) : "N/A"}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="font-semibold text-lg">Manual Subscription</p>
                                    {subscription.user_email && (
                                        <p className="text-gray-600 text-sm">
                                            ✉️ {subscription.user_email}
                                        </p>
                                    )}
                                    <p className="text-gray-500 text-sm">{t('payments.manual_subscription', 'Subscription created manually')}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Plan Details Section */}
                    {subscription.plan && (
                        <div className="mb-8">
                            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 mb-6">
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Tag className="text-white" size={24} />
                                            <h2 className="text-xl font-semibold text-white">
                                                {t('plan.plan_details', 'Plan Details')}
                                            </h2>
                                        </div>
                                        <span className={`badge ${planTypeBadge?.class || 'badge-neutral'} badge-lg rounded-full`}>
                                            {planTypeBadge?.label || 'Unknown'}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6">
                                    {/* Plan Overview */}
                                    <div className="mb-6">
                                        <h3 className="text-2xl font-bold text-gray-800 mb-2">{subscription.plan.name}</h3>
                                        {subscription.plan.description && (
                                            <p className="text-gray-600 mb-4">{subscription.plan.description}</p>
                                        )}
                                        
                                        {/* Plan Stats */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <DollarSign className="text-blue-600" size={20} />
                                                    <span className="text-sm font-medium text-gray-700">{t('plan.price', 'Price')}</span>
                                                </div>
                                                <p className="text-xl font-bold text-blue-800">{formatCurrency(subscription.plan.price)}</p>
                                            </div>
                                            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Calendar className="text-green-600" size={20} />
                                                    <span className="text-sm font-medium text-gray-700">{t('plan.validity', 'Validity')}</span>
                                                </div>
                                                <p className="text-xl font-bold text-green-800">{subscription.plan.validity} {t('plan.days', 'days')}</p>
                                            </div>
                                            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Grid className="text-purple-600" size={20} />
                                                    <span className="text-sm font-medium text-gray-700">{t('plan.product_range', 'Product Range')}</span>
                                                </div>
                                                <p className="text-xl font-bold text-purple-800">{subscription.plan.product_range || 0}</p>
                                            </div>
                                            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Clock className="text-orange-600" size={20} />
                                                    <span className="text-sm font-medium text-gray-700">{t('plan.total_sales', 'Total Sales')}</span>
                                                </div>
                                                <p className="text-xl font-bold text-orange-800">{subscription.plan.total_sell || 0}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Included Modules */}
                                    <div className="mb-6">
                                        <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                            <Grid size={20} className="text-green-600" />
                                            {t('plan.included_modules', 'Included Modules')}
                                            <span className="text-sm font-normal text-gray-500">
                                                ({subscription.plan.modules?.length || 0} {t('plan.modules', 'modules')})
                                            </span>
                                        </h4>
                                        {subscription.plan.modules && subscription.plan.modules.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {subscription.plan.modules.map((module) => (
                                                    <div 
                                                        key={module.id}
                                                        className="p-4 rounded-xl border-2 border-green-200 bg-green-50"
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                                                                <Grid size={20} className="text-green-600" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <h3 className="font-semibold text-gray-800 mb-1">{module.name}</h3>
                                                                {module.description && (
                                                                    <p className="text-sm text-gray-600">{module.description}</p>
                                                                )}
                                                            </div>
                                                            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                                                <CheckCircle size={12} className="text-white" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                                <Grid size={32} className="text-gray-300 mx-auto mb-2" />
                                                <p className="text-gray-500">{t('plan.no_modules', 'No modules included in this plan')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Payment History */}
                    <div className="bg-base-100 rounded-box p-6 border mb-8">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <CreditCard size={20} className="text-success" />
                            {t('payments.payment_history', 'Payment History')}
                        </h2>
                        {subscription.payments && subscription.payments.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="table table-auto w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th>{t('payments.payment_id', 'Payment ID')}</th>
                                            <th>{t('payments.date', 'Date')}</th>
                                            <th>{t('payments.amount', 'Amount')}</th>
                                            <th>{t('payments.method', 'Method')}</th>
                                            <th>{t('payments.status', 'Status')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {subscription.payments.map((payment) => (
                                            <tr key={payment.id} className="hover:bg-gray-50">
                                                <td className="font-mono font-semibold">
                                                   {payment.transaction_id || `#${payment.id}`}
                                                </td>
                                                <td className="font-semibold">
                                                    {formatDate(payment.payment_date)}
                                                </td>
                                                <td className="font-semibold text-success">
                                                    {formatCurrency(payment.amount)}
                                                </td>
                                                <td className="capitalize">
                                                    {payment.payment_method} 
                                                    <br />
                                                    ({payment.transaction_id || "N/A"})
                                                </td>
                                                <td>
                                                    <span className={`badge ${
                                                        payment.status === 'completed' 
                                                            ? 'badge-success' 
                                                            : payment.status === 'failed'
                                                            ? 'badge-error'
                                                            : 'badge-warning'
                                                    } capitalize rounded`}>
                                                        {payment.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <CreditCard size={48} className="text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">{t('payments.no_payment_history', 'No payment history available')}</p>
                                <p className="text-sm text-gray-400 mt-1">
                                    {subscription.payment_method && (
                                        <>Payment Method: {subscription.payment_method} | Transaction ID: {subscription.transaction_id || "N/A"}</>
                                    )}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Notes Section */}
                    {subscription.notes && (
                        <div className="bg-base-100 rounded-box p-6 border mb-8">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <FileText size={20} className="text-gray-600" />
                                {t('payments.subscription_notes', 'Subscription Notes')}
                            </h2>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-gray-700 whitespace-pre-wrap">
                                    {subscription.notes}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Print Footer */}
                    <div className="hidden print:block mt-12 pt-8 border-t">
                        <div className="text-center text-gray-500">
                            <p className="font-semibold">{t('payments.subscription_management_system', 'Subscription Management System')}</p>
                            <p className="text-sm">{t('payments.computer_generated_report', 'This is a computer generated subscription report')}</p>
                            <p className="text-xs mt-2">
                                {t('payments.printed_on', 'Printed on')}: {formatDate(new Date().toISOString())}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Hidden Print Template - Optimized for 1-2 pages */}
                <div ref={printRef} style={{ display: 'none' }}>
                    {/* Print Header - Compact */}
                    <div className="print-gradient-header p-4 mb-6 rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h1 className="text-lg font-bold text-white mb-1">
                                    {t('payments.subscription_report', 'SUBSCRIPTION REPORT')}
                                </h1>
                                <p className="text-white/80 text-xs">
                                    {t('payments.official_document', 'Official Document')}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-white/90 text-xs font-medium mb-1">{t('payments.report_id', 'Report ID')}</div>
                                <div className="text-white font-bold text-sm">SUB-{subscription.id}</div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="bg-white/10 p-2 rounded">
                                <div className="text-white/80 text-xs mb-1">Subscription #</div>
                                <div className="text-white font-bold text-sm">#{subscription.id}</div>
                            </div>
                            <div className="bg-white/10 p-2 rounded">
                                <div className="text-white/80 text-xs mb-1">Date</div>
                                <div className="text-white font-bold text-sm">{formatDateForPrint(new Date().toISOString())}</div>
                            </div>
                            <div className="bg-white/10 p-2 rounded">
                                <div className="text-white/80 text-xs mb-1">Status</div>
                                <div className={`badge ${statusDetails.badge} font-bold text-xs mx-auto`}>
                                    {statusDetails.label}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Company & Client Info - Compact */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="print-bg-blue-50 p-3 rounded border border-blue-200">
                            <h3 className="text-sm font-bold text-gray-800 mb-2">
                                <i className="fas fa-building mr-2 text-blue-600"></i>
                                {t('payments.company_info', 'COMPANY')}
                            </h3>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-gray-900">Your Company</p>
                                <p className="text-xs text-gray-700">123 Business Street</p>
                                <p className="text-xs text-gray-700">contact@company.com</p>
                                <p className="text-xs text-gray-700">+123 456 7890</p>
                            </div>
                        </div>

                        <div className="print-bg-gray-50 p-3 rounded border border-gray-200">
                            <h3 className="text-sm font-bold text-gray-800 mb-2">
                                <i className="fas fa-user mr-2 text-gray-600"></i>
                                {t('payments.customer_info', 'CUSTOMER')}
                            </h3>
                            {subscription.user ? (
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-gray-900">{subscription.user.name}</p>
                                    {subscription.user.email && (
                                        <p className="text-xs text-gray-700">{subscription.user.email}</p>
                                    )}
                                    {subscription.user.phone && (
                                        <p className="text-xs text-gray-700">{subscription.user.phone}</p>
                                    )}
                                    <p className="text-xs text-gray-600">
                                        Member since: {formatDateForPrint(subscription.user.created_at)}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-gray-900">
                                        {subscription.user_name || t('payments.manual_customer', 'Manual Customer')}
                                    </p>
                                    {subscription.user_email && (
                                        <p className="text-xs text-gray-700">{subscription.user_email}</p>
                                    )}
                                    <p className="text-xs text-gray-500 italic">
                                        Manual Subscription
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Subscription Summary - Compact */}
                    <div className="mb-6">
                        <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center">
                            <i className="fas fa-bolt mr-2 text-yellow-600"></i>
                            {t('payments.subscription_summary', 'SUMMARY')}
                        </h3>
                        
                        {/* Summary Cards - Smaller */}
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            <div className="info-box text-center">
                                <div className="text-xs text-gray-700 mb-1">Plan</div>
                                <div className="text-sm font-bold text-gray-900">{subscription.plan?.name || "N/A"}</div>
                            </div>
                            
                            <div className="info-box text-center">
                                <div className="text-xs text-gray-700 mb-1">Price</div>
                                <div className="text-sm font-bold text-green-600">{formatCurrency(subscription.plan?.price || 0)}</div>
                            </div>
                            
                            <div className="info-box text-center">
                                <div className="text-xs text-gray-700 mb-1">Validity</div>
                                <div className="text-sm font-bold text-blue-600">{subscription.plan?.validity || 0}d</div>
                            </div>
                            
                            <div className="info-box text-center">
                                <div className="text-xs text-gray-700 mb-1">Remaining</div>
                                <div className={`text-sm font-bold ${daysRemaining < 7 ? 'text-red-600' : 'text-green-600'}`}>
                                    {daysRemaining}d
                                </div>
                            </div>
                        </div>

                        {/* Timeline & Billing - Side by side */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-xs font-semibold text-gray-800 mb-2">Timeline</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-xs text-gray-600">Start:</span>
                                        <span className="text-xs font-medium">{subscription.start_date ? formatDateForPrint(subscription.start_date) : "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-xs text-gray-600">End:</span>
                                        <span className="text-xs font-medium">{subscription.end_date ? formatDateForPrint(subscription.end_date) : "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-xs text-gray-600">Created:</span>
                                        <span className="text-xs font-medium">{formatDateForPrint(subscription.created_at)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="text-xs font-semibold text-gray-800 mb-2">Billing</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-xs text-gray-600">Paid:</span>
                                        <span className="text-xs font-medium text-green-600">{formatCurrency(paymentTotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-xs text-gray-600">Method:</span>
                                        <span className="text-xs font-medium capitalize">
                                            {subscription?.payments?.[0]?.payment_method || "Cash"}
                                        </span>
                                    </div>
                                    {subscription.transaction_id && (
                                        <div className="flex justify-between">
                                            <span className="text-xs text-gray-600">Txn ID:</span>
                                            <span className="text-xs font-mono">{subscription.transaction_id}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Plan Details - Compact */}
                    {subscription.plan && (
                        <div className="mb-6">
                            <div className="section-divider"></div>
                            <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center">
                                <i className="fas fa-tag mr-2 text-blue-600"></i>
                                {t('plan.plan_details', 'PLAN DETAILS')}
                            </h3>
                            
                            <div className="print-bg-gray-50 p-3 rounded border border-gray-200 mb-4">
                                <div className="mb-3">
                                    <h4 className="text-sm font-bold text-gray-800 mb-1">{subscription.plan.name}</h4>
                                    {subscription.plan.description && (
                                        <p className="text-xs text-gray-600 mb-3">{subscription.plan.description}</p>
                                    )}
                                    
                                    <div className="grid grid-cols-4 gap-2">
                                        <div className="text-center p-2 bg-white rounded border border-gray-200">
                                            <div className="text-xs text-gray-600 mb-1">Price</div>
                                            <div className="text-xs font-bold text-blue-700">{formatCurrency(subscription.plan.price)}</div>
                                        </div>
                                        <div className="text-center p-2 bg-white rounded border border-gray-200">
                                            <div className="text-xs text-gray-600 mb-1">Validity</div>
                                            <div className="text-xs font-bold text-green-700">{subscription.plan.validity}d</div>
                                        </div>
                                        <div className="text-center p-2 bg-white rounded border border-gray-200">
                                            <div className="text-xs text-gray-600 mb-1">Products</div>
                                            <div className="text-xs font-bold text-purple-700">{subscription.plan.product_range || 0}</div>
                                        </div>
                                        <div className="text-center p-2 bg-white rounded border border-gray-200">
                                            <div className="text-xs text-gray-600 mb-1">Sales Limit</div>
                                            <div className="text-xs font-bold text-orange-700">{subscription.plan.total_sell || 0}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Modules - Compact */}
                                {subscription.plan.modules && subscription.plan.modules.length > 0 && (
                                    <div className="print-bg-white p-3 rounded border border-gray-200">
                                        <h4 className="text-xs font-semibold text-gray-800 mb-2">
                                            Modules ({subscription.plan.modules.length})
                                        </h4>
                                        <div className="grid grid-cols-2 gap-1">
                                            {subscription.plan.modules.slice(0, 6).map((module, index) => (
                                                <div key={index} className="flex items-center gap-1 p-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                                    <span className="text-xs text-gray-700 truncate">{module.name}</span>
                                                </div>
                                            ))}
                                            {subscription.plan.modules.length > 6 && (
                                                <div className="col-span-2 text-xs text-gray-500 text-center pt-1">
                                                    +{subscription.plan.modules.length - 6} more modules
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Payment History - Compact */}
                    {subscription.payments && subscription.payments.length > 0 && (
                        <div className="mb-6">
                            <div className="section-divider"></div>
                            <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center">
                                <i className="fas fa-credit-card mr-2 text-green-600"></i>
                                {t('payments.payment_history', 'PAYMENTS')}
                            </h3>
                            
                            <table className="compact-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Txn ID</th>
                                        <th className="text-right">Amount</th>
                                        <th>Method</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subscription.payments.slice(0, 5).map((payment) => (
                                        <tr key={payment.id}>
                                            <td>{formatDateForPrint(payment.payment_date)}</td>
                                            <td className="font-mono text-xs">{payment.transaction_id ? payment.transaction_id.slice(0, 8) + '...' : `#${payment.id}`}</td>
                                            <td className="text-right font-medium text-green-600">{formatCurrency(payment.amount)}</td>
                                            <td className="capitalize text-xs">{payment.payment_method}</td>
                                            <td>
                                                <span className={`badge ${
                                                    payment.status === 'completed' ? 'badge-success' : 
                                                    payment.status === 'failed' ? 'badge-error' : 
                                                    'badge-warning'
                                                }`}>
                                                    {payment.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                {subscription.payments.length > 5 && (
                                    <tfoot>
                                        <tr>
                                            <td colSpan="5" className="text-center text-xs text-gray-500 py-2">
                                                Showing 5 of {subscription.payments.length} payments
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                                <tfoot>
                                    <tr>
                                        <td colSpan="2" className="text-right text-xs font-bold text-gray-800">
                                            Total Paid:
                                        </td>
                                        <td className="text-right text-xs font-bold text-green-600">
                                            {formatCurrency(paymentTotal)}
                                        </td>
                                        <td colSpan="2"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}

                    {/* Notes - Compact */}
                    {subscription.notes && (
                        <div className="mb-6">
                            <div className="section-divider"></div>
                            <h3 className="text-base font-bold text-gray-800 mb-2 flex items-center">
                                <i className="fas fa-file-text mr-2 text-gray-600"></i>
                                {t('payments.notes', 'NOTES')}
                            </h3>
                            <div className="print-bg-gray-50 p-3 rounded border border-gray-200">
                                <p className="text-xs text-gray-700 whitespace-pre-wrap line-clamp-3">{subscription.notes}</p>
                            </div>
                        </div>
                    )}

                    {/* Footer - Compact */}
                    <div className="mt-8 pt-4 border-t border-gray-300">
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="text-center">
                                <p className="text-xs font-medium text-gray-700 mb-1">Generated By</p>
                                <p className="text-xs text-gray-600">{auth.user?.name || 'System'}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-medium text-gray-700 mb-1">Generated On</p>
                                <p className="text-xs text-gray-600">{formatDateForPrint(new Date().toISOString())}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-medium text-gray-700 mb-1">Ref ID</p>
                                <p className="text-xs text-gray-600 font-mono">SUB-{subscription.id}</p>
                            </div>
                        </div>
                        
                        <div className="text-center">
                            <div className="inline-flex items-center gap-1 bg-gray-100 px-3 py-1 rounded text-xs">
                                <i className="fas fa-shield-alt text-gray-500"></i>
                                <span className="text-gray-600">Computer Generated Report</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                                © ${new Date().getFullYear()} Your Company
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}