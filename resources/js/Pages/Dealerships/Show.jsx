import React from "react";
import { 
    ArrowLeft, 
    Download, 
    Printer, 
    User, 
    Calendar,
    CreditCard,
    FileText,
    Clock,
    Building,
    Phone,
    Mail,
    MapPin,
    CheckCircle,
    XCircle,
    AlertCircle,
    Star,
    Shield,
    FileCheck,
    BadgeDollarSign,
    Target,
    BarChart3
} from "lucide-react";
import { Link, usePage } from "@inertiajs/react";

export default function DealershipShow({ delership }) {
    const { auth } = usePage().props;

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount || 0);
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString("en-US", {
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
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    // Get status details
    const getStatusDetails = (status) => {
        const details = {
            active: { 
                icon: CheckCircle, 
                color: "text-success",
                bgColor: "bg-success/10",
                badge: "badge-success",
                label: "Active"
            },
            pending: { 
                icon: Clock, 
                color: "text-warning",
                bgColor: "bg-warning/10",
                badge: "badge-warning",
                label: "Pending"
            },
            suspended: { 
                icon: XCircle, 
                color: "text-error",
                bgColor: "bg-error/10",
                badge: "badge-error",
                label: "Suspended"
            },
            inactive: { 
                icon: Shield, 
                color: "text-gray-500",
                bgColor: "bg-gray-100",
                badge: "badge-neutral",
                label: "Inactive"
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

    // Get rating stars
    const getRatingStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating || 0);
        const hasHalfStar = (rating || 0) % 1 >= 0.5;

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(<Star key={i} size={16} className="text-yellow-400 fill-current" />);
            } else if (i === fullStars && hasHalfStar) {
                stars.push(<Star key={i} size={16} className="text-yellow-400 fill-current" />);
            } else {
                stars.push(<Star key={i} size={16} className="text-gray-300" />);
            }
        }
        return stars;
    };

    // Calculate contract days remaining
    const getContractDaysRemaining = () => {
        if (!delership.contract_end) return 0;
        const endDate = new Date(delership.contract_end);
        const today = new Date();
        const diffTime = endDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const statusDetails = getStatusDetails(delership.status);
    const StatusIcon = statusDetails.icon;
    const daysRemaining = getContractDaysRemaining();

    // Handle print
    const handlePrint = () => {
        window.print();
    };

    // Check if document exists
    const hasDocument = (doc) => {
        return doc && doc !== 'null' && doc !== '';
    };

    return (
        <div className="bg-white rounded-box">
            {/* Header */}
            <div className="p-5 border-b print:border-none">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route("dealerships.index")}
                            className="btn btn-ghost btn-sm"
                        >
                            <ArrowLeft size={16} />
                            Back to Dealerships
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Dealership Details
                            </h1>
                            <p className="text-gray-500 text-sm">
                                Complete dealership information and business details
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 print:hidden">
                        <button
                            onClick={handlePrint}
                            className="btn btn-outline btn-sm"
                        >
                            <Printer size={16} />
                            Print
                        </button>
                        <button
                            onClick={handlePrint}
                            className="btn btn-outline btn-sm"
                        >
                            <Download size={16} />
                            Download
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-5">
                {/* Dealership Summary Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Basic Information */}
                    <div className="bg-base-100 rounded-box p-6 border">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Building size={20} className="text-primary" />
                            Dealership Information
                        </h2>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Dealership ID:</span>
                                <span className="font-mono font-semibold">#{delership.id}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Status:</span>
                                <span className={`badge ${statusDetails.badge} badge-lg capitalize flex items-center gap-1`}>
                                    <StatusIcon size={14} />
                                    {statusDetails.label}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Dealership Name:</span>
                                <span className="font-semibold">
                                    {delership.name || "N/A"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Owner:</span>
                                <span className="font-semibold">
                                    {delership.owner_name || "N/A"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Company:</span>
                                <span className="font-semibold">
                                    {delership.company?.name || "N/A"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-base-100 rounded-box p-6 border">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Phone size={20} className="text-info" />
                            Contact Information
                        </h2>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Mail size={16} className="text-green-600" />
                                <span className="text-gray-700">{delership.email || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone size={16} className="text-blue-600" />
                                <span className="text-gray-700">{delership.phone || "N/A"}</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <MapPin size={16} className="text-red-600 mt-0.5" />
                                <span className="text-gray-700 text-sm">
                                    {delership.address || "No address provided"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Business Rating */}
                    <div className="bg-base-100 rounded-box p-6 border">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <BarChart3 size={20} className="text-warning" />
                            Business Performance
                        </h2>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Total Sales:</span>
                                <span className="text-success font-bold text-lg">
                                    {formatCurrency(delership.total_sales)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Total Orders:</span>
                                <span className="font-semibold">
                                    {delership.total_orders || 0}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Customer Rating:</span>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1">
                                        {getRatingStars(delership.rating)}
                                    </div>
                                    <span className="text-sm text-gray-600">
                                        ({delership.rating || 0}/5)
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Last Order:</span>
                                <span className="font-semibold text-sm">
                                    {formatDateOnly(delership.last_order_date)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Financial & Contract Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Financial Information */}
                    <div className="bg-base-100 rounded-box p-6 border">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <CreditCard size={20} className="text-success" />
                            Financial Information
                        </h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Advance Amount:</span>
                                <span className="text-success font-bold text-lg">
                                    {formatCurrency(delership.advance_amount)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Due Amount:</span>
                                <span className={`font-bold text-lg ${
                                    (delership.due_amount || 0) > 0 ? 'text-error' : 'text-success'
                                }`}>
                                    {formatCurrency(delership.due_amount)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Credit Limit:</span>
                                <span className="text-info font-bold text-lg">
                                    {formatCurrency(delership.credit_limit)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Payment Terms:</span>
                                <span className="font-semibold">
                                    {delership.payment_terms || "Standard"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Contract Information */}
                    <div className="bg-base-100 rounded-box p-6 border">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Calendar size={20} className="text-purple-600" />
                            Contract Details
                        </h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Contract Start:</span>
                                <span className="font-semibold">
                                    {formatDateOnly(delership.contract_start)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Contract End:</span>
                                <span className="font-semibold">
                                    {formatDateOnly(delership.contract_end)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Days Remaining:</span>
                                <span className={`font-semibold ${
                                    daysRemaining < 30 ? 'text-error' : daysRemaining < 90 ? 'text-warning' : 'text-success'
                                }`}>
                                    {daysRemaining} days
                                </span>
                            </div>
                            {hasDocument(delership.contract_file) && (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Contract File:</span>
                                    <a 
                                        href={`/storage/${delership.contract_file}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="btn bg-[#1e4d2b] text-white btn-xs"
                                    >
                                        <FileText size={12} /> View Contract
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Legal Documents & Business IDs */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Business Identification */}
                    <div className="bg-base-100 rounded-box p-6 border">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <FileCheck size={20} className="text-blue-600" />
                            Business Identification
                        </h2>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Trade License No:</span>
                                <span className="font-mono font-semibold">
                                    {delership.trade_license_no || "N/A"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">TIN No:</span>
                                <span className="font-mono font-semibold">
                                    {delership.tin_no || "N/A"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">NID No:</span>
                                <span className="font-mono font-semibold">
                                    {delership.nid_no || "N/A"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Document Attachments */}
                    <div className="bg-base-100 rounded-box p-6 border">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <FileText size={20} className="text-green-600" />
                            Document Attachments
                        </h2>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Agreement Document:</span>
                                {hasDocument(delership.agreement_doc) ? (
                                    <a 
                                        href={`/storage/${delership.agreement_doc}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="btn bg-[#1e4d2b] text-white btn-xs"
                                    >
                                        <Download size={12} /> Download
                                    </a>
                                ) : (
                                    <span className="text-gray-400 text-sm">Not uploaded</span>
                                )}
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Bank Guarantee:</span>
                                {hasDocument(delership.bank_guarantee_doc) ? (
                                    <a 
                                        href={`/storage/${delership.bank_guarantee_doc}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="btn bg-[#1e4d2b] text-white btn-xs"
                                    >
                                        <Download size={12} /> Download
                                    </a>
                                ) : (
                                    <span className="text-gray-400 text-sm">Not uploaded</span>
                                )}
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Trade License:</span>
                                {hasDocument(delership.trade_license_doc) ? (
                                    <a 
                                        href={`/storage/${delership.trade_license_doc}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="btn bg-[#1e4d2b] text-white btn-xs"
                                    >
                                        <Download size={12} /> Download
                                    </a>
                                ) : (
                                    <span className="text-gray-400 text-sm">Not uploaded</span>
                                )}
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">NID Document:</span>
                                {hasDocument(delership.nid_doc) ? (
                                    <a 
                                        href={`/storage/${delership.nid_doc}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="btn bg-[#1e4d2b] text-white btn-xs"
                                    >
                                        <Download size={12} /> Download
                                    </a>
                                ) : (
                                    <span className="text-gray-400 text-sm">Not uploaded</span>
                                )}
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Tax Clearance:</span>
                                {hasDocument(delership.tax_clearance_doc) ? (
                                    <a 
                                        href={`/storage/${delership.tax_clearance_doc}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="btn bg-[#1e4d2b] text-white btn-xs"
                                    >
                                        <Download size={12} /> Download
                                    </a>
                                ) : (
                                    <span className="text-gray-400 text-sm">Not uploaded</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Approval Information & Timeline */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Approval Information */}
                    <div className="bg-base-100 rounded-box p-6 border">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Shield size={20} className="text-orange-600" />
                            Approval Information
                        </h2>
                        {delership.approved_by ? (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Approved By:</span>
                                    <span className="font-semibold">
                                        {delership.approver?.name || "N/A"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Approval Date:</span>
                                    <span className="font-semibold">
                                        {formatDate(delership.approved_at)}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <Clock size={32} className="text-warning mx-auto mb-2" />
                                <p className="text-warning font-medium">Pending Approval</p>
                                <p className="text-gray-500 text-sm">This dealership is waiting for approval</p>
                            </div>
                        )}
                    </div>

                    {/* Timeline Information */}
                    <div className="bg-base-100 rounded-box p-6 border">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Clock size={20} className="text-cyan-600" />
                            Timeline Information
                        </h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Created:</span>
                                <span className="font-semibold">
                                    {formatDate(delership.created_at)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Last Updated:</span>
                                <span className="font-semibold">
                                    {formatDate(delership.updated_at)}
                                </span>
                            </div>
                            {delership.last_order_date && (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Last Order Date:</span>
                                    <span className="font-semibold">
                                        {formatDate(delership.last_order_date)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Remarks Section */}
                {delership.remarks && (
                    <div className="bg-base-100 rounded-box p-6 border mb-8">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <FileText size={20} className="text-gray-600" />
                            Remarks & Notes
                        </h2>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-gray-700 whitespace-pre-wrap">
                                {delership.remarks}
                            </p>
                        </div>
                    </div>
                )}

                {/* Print Footer */}
                <div className="hidden print:block mt-12 pt-8 border-t">
                    <div className="text-center text-gray-500">
                        <p className="font-semibold">Dealership Management System</p>
                        <p className="text-sm">This is a computer generated dealership report</p>
                        <p className="text-xs mt-2">
                            Printed on: {formatDate(new Date().toISOString())}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}