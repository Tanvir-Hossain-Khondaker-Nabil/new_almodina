import React from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Phone,
    MapPin,
    User,
    ShoppingCart,
    DollarSign,
    Calendar,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    Printer,
    Download,
    Building,
    Mail,
    Globe,
    Package,
    Truck,
    Wallet,
    CreditCard,
    TrendingUp,
    AlertCircle,
    ExternalLink,
    Copy,
    Box,
    Layers
} from 'lucide-react';

const Show = () => {
    const { props } = usePage();
    const { supplier, stats, breadcrumbs, flash } = props;

    // Use stats from backend instead of calculating here
    const totalPurchases = stats.total_purchases || 0;
    const totalAmount = stats.total_amount || 0;
    const totalPaid = stats.total_paid || 0;
    const totalDue = stats.total_due || 0;
    const paymentRatio = stats.payment_ratio || 0;

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    // Format date
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Copy to clipboard
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    // Calculate average purchase value
    const averagePurchase = totalPurchases > 0 ? totalAmount / totalPurchases : 0;

    return (
        <>
            <Head title={`Supplier - ${supplier.name}`} />

            <div className="min-h-screen bg-gray-50">
                {/* Flash Message */}
                {flash?.message && (
                    <div className="fixed top-4 right-4 z-50">
                        <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-in">
                            {flash.message}
                        </div>
                    </div>
                )}

                {/* Breadcrumb */}
                <div className="bg-white border-b px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Link
                                href={route('supplier.view')}
                                className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Suppliers
                            </Link>
                            <span>/</span>
                            <span className="text-gray-900 font-medium">{supplier.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${supplier.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {supplier.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {/* Header Section */}
                    <div className="bg-white rounded-2xl shadow-lg border p-6 mb-8">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl">
                                        <Building className="w-8 h-8 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                                            <h1 className="text-3xl font-bold text-gray-900">{supplier.name}</h1>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${supplier.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {supplier.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        
                                        {supplier.company && (
                                            <p className="text-lg text-gray-600 mb-2">
                                                <Building className="w-4 h-4 inline mr-2" />
                                                {supplier.company}
                                            </p>
                                        )}
                                        {supplier.description && (
                                            <p className="text-gray-500 mb-4">{supplier.description}</p>
                                        )}
                                        
                                        {/* Contact Info Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                            {supplier.contact_person && (
                                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                    <User className="w-5 h-5 text-blue-500" />
                                                    <div>
                                                        <p className="text-xs text-gray-500">Contact Person</p>
                                                        <p className="font-medium">{supplier.contact_person}</p>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {supplier.email && (
                                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                    <Mail className="w-5 h-5 text-green-500" />
                                                    <div className="flex-1">
                                                        <p className="text-xs text-gray-500">Email</p>
                                                        <div className="flex items-center justify-between">
                                                            <a 
                                                                href={`mailto:${supplier.email}`}
                                                                className="font-medium text-blue-600 hover:text-blue-800 truncate"
                                                            >
                                                                {supplier.email}
                                                            </a>
                                                            <button
                                                                onClick={() => copyToClipboard(supplier.email)}
                                                                className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2"
                                                            >
                                                                <Copy className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {supplier.phone && (
                                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                    <Phone className="w-5 h-5 text-purple-500" />
                                                    <div className="flex-1">
                                                        <p className="text-xs text-gray-500">Phone</p>
                                                        <div className="flex items-center justify-between">
                                                            <a 
                                                                href={`tel:${supplier.phone}`}
                                                                className="font-medium text-blue-600 hover:text-blue-800"
                                                            >
                                                                {supplier.phone}
                                                            </a>
                                                            <button
                                                                onClick={() => copyToClipboard(supplier.phone)}
                                                                className="text-gray-400 hover:text-gray-600 ml-2"
                                                            >
                                                                <Copy className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {supplier.address && (
                                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                    <MapPin className="w-5 h-5 text-red-500" />
                                                    <div className="flex-1">
                                                        <p className="text-xs text-gray-500">Address</p>
                                                        <p className="font-medium">{supplier.address}</p>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {supplier.website && (
                                                <div className="md:col-span-2 flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                    <Globe className="w-5 h-5 text-indigo-500" />
                                                    <div className="flex-1">
                                                        <p className="text-xs text-gray-500">Website</p>
                                                        <div className="flex items-center justify-between">
                                                            <a 
                                                                href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 truncate"
                                                            >
                                                                {supplier.website}
                                                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                                            </a>
                                                            <button
                                                                onClick={() => copyToClipboard(supplier.website)}
                                                                className="text-gray-400 hover:text-gray-600 ml-2"
                                                            >
                                                                <Copy className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Creator Info */}
                                        {supplier.creator && (
                                            <div className="mt-6 pt-6 border-t border-gray-200">
                                                <p className="text-sm text-gray-500">
                                                    Created by: <span className="font-medium text-gray-700">{supplier.creator.name}</span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 min-w-[200px]">
                                
                                <Link
                                    href={route('purchase.create', { supplier_id: supplier.id })}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg"
                                >
                                    <Truck className="w-4 h-4" />
                                    New Purchase
                                </Link>
                                
                                <button
                                    onClick={() => {
                                        if (confirm('Are you sure you want to delete this supplier? This action cannot be undone.')) {
                                            router.delete(route('supplier.destroy', supplier.id));
                                        }
                                    }}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main Stats Cards - 4 Cards in One Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Total Purchases Card */}
                        <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-lg border border-blue-100 p-6 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                                    <Package className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-xs font-medium px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                                    {totalPurchases} {totalPurchases === 1 ? 'order' : 'orders'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 font-medium mb-1">Total Purchases</p>
                            <p className="text-2xl font-bold text-gray-900 mb-2">{totalPurchases}</p>
                            <div className="flex items-center text-xs text-gray-500">
                                <span className="flex items-center">
                                    <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                                    All time records
                                </span>
                            </div>
                        </div>

                        {/* Total Amount Card */}
                        <div className="bg-gradient-to-br from-white to-green-50 rounded-2xl shadow-lg border border-green-100 p-6 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md">
                                    <DollarSign className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-xs font-medium px-3 py-1 bg-green-100 text-green-800 rounded-full">
                                    Total Value
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 font-medium mb-1">Total Amount</p>
                            <p className="text-2xl font-bold text-gray-900 mb-2">{formatCurrency(totalAmount)}</p>
                            <div className="text-xs text-gray-500">
                                Average: {formatCurrency(averagePurchase)}
                            </div>
                        </div>

                        {/* Total Paid Card */}
                        <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-lg border border-purple-100 p-6 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md">
                                    <CreditCard className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-xs font-medium px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
                                    {paymentRatio.toFixed(1)}% paid
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 font-medium mb-1">Total Paid</p>
                            <p className="text-2xl font-bold text-gray-900 mb-2">{formatCurrency(totalPaid)}</p>
                            <div className={`text-xs font-medium ${totalPaid === totalAmount ? 'text-green-600' : 'text-yellow-600'}`}>
                                {totalPaid === totalAmount ? '✓ Fully paid' : 'Partial payment'}
                            </div>
                        </div>

                        {/* Supplier Due Card */}
                        <div className="bg-gradient-to-br from-white to-red-50 rounded-2xl shadow-lg border border-red-100 p-6 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-md">
                                    <AlertCircle className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-xs font-medium px-3 py-1 bg-red-100 text-red-800 rounded-full">
                                    {stats.current_due > 0 ? 'Payment Due' : 'Clear'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 font-medium mb-1">Current Due</p>
                            <p className="text-2xl font-bold text-gray-900 mb-2">{formatCurrency(stats.current_due)}</p>
                            <div className="flex items-center justify-between">
                                <div className={`text-xs font-medium ${stats.current_due > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {stats.current_due > 0 ? '⚠️ Payment due' : '✓ No due'}
                                </div>
                                {stats.current_due > 0 && (
                                    <Link
                                        href={route('purchase.create', { supplier_id: supplier.id })}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        Pay Now →
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Second Row - Advance and Combined Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Advance Amount Card */}
                        <div className="bg-gradient-to-br from-white to-indigo-50 rounded-2xl shadow-lg border border-indigo-100 p-6 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-md">
                                    <Wallet className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Advance Amount</p>
                                    <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.advance_amount)}</p>
                                    <p className="text-xs text-gray-500 mt-1">Paid in advance</p>
                                </div>
                            </div>
                        </div>

                        {/* Total Due (All Purchases) Card */}
                        <div className="bg-gradient-to-br from-white to-yellow-50 rounded-2xl shadow-lg border border-yellow-100 p-6 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-md">
                                    <DollarSign className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Total Due (All)</p>
                                    <p className="text-xl font-bold text-gray-900">{formatCurrency(totalDue)}</p>
                                    <p className="text-xs text-gray-500 mt-1">Across all purchases</p>
                                </div>
                            </div>
                        </div>

                        {/* Outstanding Balance */}
                        <div className="bg-gradient-to-br from-white to-cyan-50 rounded-2xl shadow-lg border border-cyan-100 p-6 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl shadow-md">
                                    <Layers className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Outstanding</p>
                                    <p className="text-xl font-bold text-gray-900">
                                        {formatCurrency(Math.max(0, stats.current_due - stats.advance_amount))}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Due - Advance</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Purchases Section */}
                    <div className="bg-white rounded-2xl shadow-lg border overflow-hidden mb-8">
                        <div className="px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-white">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Purchase History</h2>
                                    <p className="text-sm text-gray-500">All purchases from this supplier</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-500">
                                        {totalPurchases} purchase(s) found
                                    </span>
                                    {/* <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                                        <Download className="w-4 h-4" />
                                        Export
                                    </button> */}
                                </div>
                            </div>
                        </div>

                        {supplier.purchases && supplier.purchases.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Invoice #
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Total Amount
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Paid
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Due
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {supplier.purchases.map((purchase) => (
                                            <tr key={purchase.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        #{purchase.purchase_no || purchase.id}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(purchase.created_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {formatCurrency(purchase.grand_total)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                                    {formatCurrency(purchase.paid_amount)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                                    {formatCurrency(purchase.grand_total - purchase.paid_amount)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${(purchase.grand_total - purchase.paid_amount) == 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                        {(purchase.grand_total - purchase.paid_amount) == 0 ? 'Paid' : 'Due'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <div className="flex items-center gap-3">
                                                        <Link
                                                            href={route('purchase.show', purchase.id)}
                                                            className="text-blue-600 hover:text-blue-900 font-medium"
                                                        >
                                                            View
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Purchases Found</h3>
                                <p className="text-gray-500 mb-6">No purchase records found for this supplier.</p>
                                <Link
                                    href={route('purchase.create', { supplier_id: supplier.id })}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md"
                                >
                                    <Truck className="w-4 h-4" />
                                    Create First Purchase
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Purchase Details Section (with items and payments) */}
                    {supplier.purchases && supplier.purchases.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
                            <div className="px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-white">
                                <h2 className="text-xl font-bold text-gray-900">Purchase Details</h2>
                                <p className="text-sm text-gray-500">Detailed view of each purchase with items and payments</p>
                            </div>
                            <div className="p-6">
                                {supplier.purchases.map((purchase) => (
                                    <div key={purchase.id} className="mb-8 last:mb-0 border border-gray-200 rounded-xl p-6 bg-gray-50">
                                        {/* Purchase Header */}
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        Invoice #{purchase.purchase_no || purchase.id}
                                                    </h3>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${(purchase.grand_total - purchase.paid_amount)  == 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                        {(purchase.grand_total - purchase.paid_amount) == 0 ? 'Paid' : 'Due: ' + formatCurrency(purchase.grand_total - purchase.paid_amount)}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        {formatDate(purchase.created_at)}
                                                    </span>
                                                    {purchase.creator && (
                                                        <span className="flex items-center gap-1">
                                                            <User className="w-4 h-4" />
                                                            Created by: {purchase.creator.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-gray-900">
                                                    {formatCurrency(purchase.grand_total)}
                                                </p>
                                                <div className="flex gap-4 mt-2 text-sm">
                                                    <span className="text-green-600">
                                                        Paid: {formatCurrency(purchase.paid_amount)}
                                                    </span>
                                                    <span className="text-red-600">
                                                        Due: {formatCurrency(purchase.grand_total - purchase.paid_amount)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Purchase Items */}
                                        {purchase.items && purchase.items.length > 0 && (
                                            <div className="mb-6">
                                                <h4 className="text-sm font-medium text-gray-700 mb-3">Purchased Items</h4>
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full bg-white rounded-lg border">
                                                        <thead className="bg-gray-100">
                                                            <tr>
                                                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                                                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Variant</th>
                                                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                                                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {purchase.items.map((item) => (
                                                                <tr key={item.id} className="border-t border-gray-200">
                                                                    <td className="py-3 px-4">
                                                                        <div>
                                                                            <p className="font-medium text-gray-900">
                                                                                {item.product?.name || 'N/A'}
                                                                            </p>
                                                                            {item.product?.product_no && (
                                                                                <p className="text-xs text-gray-500">Product No: {item.product.product_no}</p>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className='text-left p-2 print:p-1'>
                                                                        {(() => {
                                                                                const variant = item.variant;
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

                                                                                return <>{attrsText || 'N/A'}</>;
                                                                            })()}<br />
                                                                    </td>
                                                                    
                                                                    <td className='text-left p-2 print:p-1'>
                                                                        {(() => {
                                                                                const variant = item.variant;
                                                                                let attrsText = '';

                                                                                if (variant.attribute_values) {
                                                                                if (typeof variant.attribute_values === 'object') {
                                                                                    attrsText = Object.entries(variant.attribute_values)
                                                                                    .map(([key, value]) => `${value}`)
                                                                                    .join(', ');
                                                                                } 
                                                                                }

                                                                                return <>{attrsText || 'N/A'}</>;
                                                                            })()}<br />
                                                                        
                                                                            <p className="text-xs text-gray-500">SKU: {item.variant?.sku}</p>
                                                                    </td>

                                                                    <td className="py-3 px-4">{item.quantity}</td>
                                                                    <td className="py-3 px-4">{formatCurrency(item.unit_price)}</td>
                                                                    <td className="py-3 px-4 font-medium text-gray-900">
                                                                        {formatCurrency(item.total_price)}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {/* Payments */}
                                        {purchase.payments && purchase.payments.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700 mb-3">Payments</h4>
                                                <div className="space-y-3">
                                                    {purchase.payments.map((payment) => (
                                                        <div key={payment.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 bg-green-100 rounded-lg">
                                                                    <DollarSign className="w-4 h-4 text-green-600" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-900">
                                                                        Payment #{payment.id}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">
                                                                        {formatDate(payment.created_at)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-lg font-bold text-green-600">
                                                                    +{formatCurrency(payment.amount)}
                                                                </p>
                                                                {payment.payment_method && (
                                                                    <p className="text-xs text-gray-500">
                                                                        {payment.payment_method}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add some custom styles for animations */}
            <style jsx>{`
                @keyframes slide-in {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out;
                }
            `}</style>
        </>
    );
};

export default Show;