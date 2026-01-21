import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

export default function Dashboard({ employee, leave_balance, monthly_leaves, pending_leaves, total_leave_taken }) {
    const [activeTab, setActiveTab] = useState('overview');

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-BD', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getLeaveTypeLabel = (type) => {
        const labels = {
            'sick': 'Sick Leave',
            'casual': 'Casual Leave',
            'earned': 'Earned Leave',
            'maternity': 'Maternity Leave',
            'paternity': 'Paternity Leave',
            'unpaid': 'Unpaid Leave'
        };
        return labels[type] || type;
    };

    const getStatusColor = (status) => {
        const colors = {
            'approved': 'bg-green-100 text-green-800',
            'pending': 'bg-yellow-100 text-yellow-800',
            'rejected': 'bg-red-100 text-red-800',
            'cancelled': 'bg-gray-100 text-gray-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getLeaveTypeColor = (type) => {
        const colors = {
            'sick': 'bg-red-50 text-red-700',
            'casual': 'bg-blue-50 text-blue-700',
            'earned': 'bg-green-50 text-green-700',
            'maternity': 'bg-purple-50 text-purple-700',
            'paternity': 'bg-indigo-50 text-indigo-700',
            'unpaid': 'bg-gray-50 text-gray-700',
        };
        return colors[type] || 'bg-gray-50 text-gray-700';
    };

    return (
        <>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Leave Dashboard</h1>
                    <p className="text-gray-600">Manage your leave applications and balance</p>
                </div>
                <Link
                    href={route('leave.create')}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                    <span className="mr-2">➕</span> Apply for Leave
                </Link>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'overview'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('balance')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'balance'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Leave Balance
                    </button>
                    <button
                        onClick={() => setActiveTab('applications')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'applications'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        My Applications
                    </button>
                </nav>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-blue-600 text-xl">📋</span>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <div className="text-sm text-gray-500">Total Leave Taken</div>
                                    <div className="text-2xl font-bold text-gray-900">{total_leave_taken || 0} days</div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                                        <span className="text-yellow-600 text-xl">⏳</span>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <div className="text-sm text-gray-500">Pending Applications</div>
                                    <div className="text-2xl font-bold text-gray-900">{pending_leaves || 0}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                        <span className="text-green-600 text-xl">✅</span>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <div className="text-sm text-gray-500">Approved This Month</div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        {monthly_leaves?.filter(l => l.status === 'approved').length || 0}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                        <span className="text-purple-600 text-xl">📅</span>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <div className="text-sm text-gray-500">This Month</div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        {new Date().toLocaleString('default', { month: 'long' })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Leave Balance Summary */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-medium text-gray-900">Leave Balance Summary</h2>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {Object.entries(leave_balance).map(([type, balance]) => (
                                    <div key={type} className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLeaveTypeColor(type)}`}>
                                                {getLeaveTypeLabel(type)}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-gray-900">{balance} days</div>
                                            <div className="text-sm text-gray-500">Available</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Balance Tab */}
            {activeTab === 'balance' && (
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">Detailed Leave Balance</h2>
                    </div>
                    <div className="p-6">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Leave Type
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Annual Entitlement
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Used
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Available
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Remarks
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {Object.entries(leave_balance).map(([type, balance]) => {
                                        const annualEntitlement = {
                                            'sick': 14,
                                            'casual': 10,
                                            'earned': 'Accumulated',
                                            'maternity': 120,
                                            'paternity': 15,
                                            'unpaid': 'Unlimited'
                                        }[type];
                                        
                                        const used = type === 'earned' 
                                            ? total_leave_taken || 0
                                            : annualEntitlement - balance;
                                        
                                        return (
                                            <tr key={type}>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLeaveTypeColor(type)}`}>
                                                        {getLeaveTypeLabel(type)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {annualEntitlement}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {used} days
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                                    {balance} days
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-500">
                                                    {type === 'earned' ? 'Accumulates 1.5 days/month' : 
                                                     type === 'unpaid' ? 'No salary deduction' : 
                                                     'With salary'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h3 className="text-sm font-medium text-blue-800 mb-2">📝 Leave Policy Notes:</h3>
                            <ul className="text-sm text-blue-700 space-y-1">
                                <li>• Sick Leave: Requires medical certificate for more than 2 consecutive days</li>
                                <li>• Casual Leave: Minimum 1 day notice required</li>
                                <li>• Earned Leave: Accumulates 1.5 days per month (18 days per year)</li>
                                <li>• Maternity Leave: 120 days for female employees only</li>
                                <li>• Paternity Leave: 15 days for male employees only</li>
                                <li>• Unpaid Leave: No salary during leave period</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Applications Tab */}
            {activeTab === 'applications' && (
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-lg font-medium text-gray-900">My Leave Applications</h2>
                        <Link
                            href={route('leave.index')}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            View All →
                        </Link>
                    </div>
                    <div className="p-6">
                        {monthly_leaves && monthly_leaves.length > 0 ? (
                            <div className="space-y-4">
                                {monthly_leaves.map((leave) => (
                                    <div key={leave.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getLeaveTypeColor(leave.type)}`}>
                                                        {getLeaveTypeLabel(leave.type)}
                                                    </span>
                                                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(leave.status)}`}>
                                                        {leave.status?.charAt(0).toUpperCase() + leave.status?.slice(1)}
                                                    </span>
                                                    {leave.is_half_day && (
                                                        <span className="px-2 py-1 text-xs rounded-full font-medium bg-yellow-100 text-yellow-800">
                                                            Half Day
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-900 mb-1">
                                                    {leave.reason}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {formatDate(leave.start_date)} - {formatDate(leave.end_date)} 
                                                    • {leave.total_days} day(s)
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-gray-500 mb-1">
                                                    Applied: {formatDate(leave.created_at)}
                                                </div>
                                                {leave.attachment && (
                                                    <a 
                                                        href={`/storage/${leave.attachment}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center"
                                                    >
                                                        📎 Attachment
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {leave.status === 'rejected' && leave.rejection_reason && (
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <div className="text-sm text-red-600">
                                                    <span className="font-medium">Rejection Reason:</span> {leave.rejection_reason}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {leave.status === 'approved' && leave.approved_by && (
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <div className="text-sm text-green-600">
                                                    ✓ Approved by {leave.approver?.name || 'Admin'} on {formatDate(leave.approved_at)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="text-gray-400 text-4xl mb-4">📋</div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No leave applications this month</h3>
                                <p className="text-gray-500 mb-4">
                                    You haven't applied for any leave in {new Date().toLocaleString('default', { month: 'long' })}.
                                </p>
                                <Link
                                    href={route('leave.create')}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
                                >
                                    <span className="mr-2">➕</span>
                                    Apply for Leave
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}