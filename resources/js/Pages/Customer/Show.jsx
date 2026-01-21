import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
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
    Wallet,
    CreditCard,
    TrendingUp,
    AlertCircle
} from 'lucide-react';

const Show = () => {
    const { props } = usePage();
    const { customer, stats, breadcrumbs } = props;

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

    return (
        <>
            <Head title={`Customer - ${customer.customer_name}`} />

            <div className="min-h-screen bg-gray-50">
                {/* Breadcrumb */}
                <div className="bg-white border-b px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Link
                            href={route('customer.index')}
                            className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Customers
                        </Link>
                        <span>/</span>
                        <span className="text-gray-900 font-medium">{customer.customer_name}</span>
                    </div>
                </div>

                <div className="p-6">
                    {/* Header Section */}
                    <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        {customer.customer_name}
                                    </h1>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${customer.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {customer.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <Phone className="w-5 h-5 text-blue-500" />
                                        <span>{customer.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <MapPin className="w-5 h-5 text-green-500" />
                                        <span>{customer.address || 'No address provided'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <User className="w-5 h-5 text-purple-500" />
                                        <span>Created by: {customer.creator?.name || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards - 4 Cards in One Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Total Sales Card */}
                        <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-lg border border-blue-100 p-6 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                                    <ShoppingCart className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-xs font-medium px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                                    {stats.total_sales} transactions
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 font-medium mb-1">Total Sales</p>
                            <p className="text-2xl font-bold text-gray-900 mb-2">{stats.total_sales}</p>
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
                            <p className="text-2xl font-bold text-gray-900 mb-2">{formatCurrency(stats.total_amount)}</p>
                            <div className="text-xs text-gray-500">
                                Average: {formatCurrency(stats.total_sales > 0 ? stats.total_amount / stats.total_sales : 0)}
                            </div>
                        </div>

                        {/* Total Paid Card */}
                        <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-lg border border-purple-100 p-6 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md">
                                    <CreditCard className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-xs font-medium px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
                                    {stats.total_paid > 0 ? `${((stats.total_paid / stats.total_amount) * 100).toFixed(1)}% paid` : 'No payments'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 font-medium mb-1">Total Paid</p>
                            <p className="text-2xl font-bold text-gray-900 mb-2">{formatCurrency(stats.total_paid)}</p>
                            <div className="text-xs text-green-600 font-medium">
                                ✓ Payment received
                            </div>
                        </div>

                        {/* Current Due Card */}
                        <div className="bg-gradient-to-br from-white to-red-50 rounded-2xl shadow-lg border border-red-100 p-6 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-md">
                                    <AlertCircle className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-xs font-medium px-3 py-1 bg-red-100 text-red-800 rounded-full">
                                    {stats.total_due > 0 ? 'Pending' : 'Clear'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 font-medium mb-1">Current Due</p>
                            <p className="text-2xl font-bold text-gray-900 mb-2">{formatCurrency(customer.due_amount)}</p>
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-red-600 font-medium">
                                    {customer.due_amount > 0 ? '⚠️ Payment due' : '✓ No due'}
                                </div>
                                {customer.due_amount > 0 && (
                                    <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                                        Collect →
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Second Row - Advance Amount and Combined Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Advance Amount Card */}
                        <div className="bg-gradient-to-br from-white to-indigo-50 rounded-2xl shadow-lg border border-indigo-100 p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-md">
                                    <Wallet className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Advance Amount</p>
                                    <p className="text-xl font-bold text-gray-900">{formatCurrency(customer.advance_amount)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Total Due Summary Card */}
                        <div className="bg-gradient-to-br from-white to-yellow-50 rounded-2xl shadow-lg border border-yellow-100 p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-md">
                                    <DollarSign className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Total Due (All)</p>
                                    <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.total_due)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Payment Ratio Card */}
                        <div className="bg-gradient-to-br from-white to-teal-50 rounded-2xl shadow-lg border border-teal-100 p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-md">
                                    <CheckCircle className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Payment Ratio</p>
                                    <p className="text-xl font-bold text-gray-900">
                                        {stats.total_amount > 0 
                                            ? `${((stats.total_paid / stats.total_amount) * 100).toFixed(1)}%`
                                            : '0%'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Sales Section */}
                    <div className="bg-white rounded-xl shadow-sm border">
                        <div className="px-6 py-4 border-b">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-gray-900">Recent Sales</h2>
                                <span className="text-sm text-gray-500">
                                    {customer.sales.length} sale(s) found
                                </span>
                            </div>
                        </div>

                        {customer.sales.length > 0 ? (
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
                                                Type
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
                                        {customer.sales.map((sale) => (
                                            <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        #{sale.invoice_no || sale.id}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(sale.created_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {sale.type || 'Retail'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {formatCurrency(sale.grand_total)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                                    {formatCurrency(sale.paid_amount)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                                    {formatCurrency(sale.due_amount)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${sale.due_amount == 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                        {sale.due_amount == 0 ? 'Paid' : 'Due'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <div className="text-center gap-2">
                                                        <Link
                                                            href={route('sales.show', sale.id)}
                                                            className="text-blue-600 hover:text-blue-900"
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
                                <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Sales Found</h3>
                                <p className="text-gray-500">This customer hasn't made any purchases yet.</p>
                            </div>
                        )}
                    </div>

                    {/* Sales Items Details (Accordion) */}
                    {customer.sales.length > 0 && (
                        <div className="mt-6 bg-white rounded-xl shadow-sm border">
                            <div className="px-6 py-4 border-b">
                                <h2 className="text-lg font-semibold text-gray-900">Sale Details</h2>
                            </div>
                            <div className="p-6">
                                {customer.sales.map((sale) => (
                                    <div key={sale.id} className="mb-6 last:mb-0 border rounded-lg p-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <div>
                                                <h3 className="font-medium text-gray-900">
                                                    Invoice #{sale.invoice_no || sale.id}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {formatDate(sale.created_at)} •
                                                    Sold by: {sale.creator?.name || 'Unknown'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-semibold">
                                                    {formatCurrency(sale.grand_total)}
                                                </p>
                                                <p className={`text-sm ${sale.due_amount === 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {sale.due_amount === 0 ? 'Fully Paid' : `Due: ${formatCurrency(sale.due_amount)}`}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Products List */}
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full bg-gray-50 rounded-lg">
                                                <thead>
                                                    <tr className="bg-gray-100">
                                                        <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                                        <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                                                        <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase">Varient</th>
                                                        <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                                        <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                                        <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sale.items.map((item) => (
                                                        <tr key={item.id} className="border-t">
                                                            <td className="py-3 px-4">
                                                                <div>
                                                                    <p className="font-medium">{item.product?.name || 'N/A'}</p>
                                                                    {item.product?.product_no && (
                                                                        <p className="text-xs text-gray-500">SKU: {item.product.product_no}</p>
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
                                                            <td className="py-3 px-4 font-medium">{formatCurrency(item.total_price)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {sale.payments && sale.payments.length > 0 && (
                                            <div className="mt-4 pt-4 border-t">
                                                <h4 className="font-medium text-gray-900 mb-2">Payments</h4>
                                                <div className="space-y-2">
                                                    {sale.payments.map((payment) => (
                                                        <div key={payment.id} className="flex justify-between items-center text-sm">
                                                            <span className="text-gray-600">
                                                                {formatDate(payment.created_at)}
                                                            </span>
                                                            <span className="font-medium text-green-600">
                                                                +{formatCurrency(payment.amount)}
                                                            </span>
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
        </>
    );
};

export default Show;