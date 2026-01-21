import { Head, useForm, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function Leave({ leaves, filters, employees, leave_types, statuses }) {
    const [processing, setProcessing] = useState(false);
    const [selectedLeaves, setSelectedLeaves] = useState([]);

    const { data, setData, get } = useForm({
        status: filters.status || '',
        type: filters.type || '',
        employee_id: filters.employee_id || '',
        start_date: filters.start_date || '',
        end_date: filters.end_date || '',
    });

    const submit = (e) => {
        e.preventDefault();
        setProcessing(true);
        get(route('leave.index'), {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    };

    const handleApprove = async (leaveId) => {
        if (!confirm('Approve this leave application?')) return;
        
        try {
            await router.post(route('leave.approve', leaveId), {}, {
                preserveScroll: true,
            });
            // Refresh data
            get(route('leave.index'), {
                preserveState: true,
                preserveScroll: true,
            });
        } catch (error) {
            console.error('Approve error:', error);
            alert('Error approving leave');
        }
    };

    const handleReject = async (leaveId) => {
        const reason = prompt('Please enter rejection reason:');
        if (!reason || reason.trim().length < 10) {
            alert('Please provide a valid reason (min 10 characters)');
            return;
        }
        
        try {
            await router.post(route('leave.reject', leaveId), {
                rejection_reason: reason
            }, {
                preserveScroll: true,
            });
            // Refresh data
            get(route('leave.index'), {
                preserveState: true,
                preserveScroll: true,
            });
        } catch (error) {
            console.error('Reject error:', error);
            alert('Error rejecting leave');
        }
    };

    const handleCancel = async (leaveId) => {
        if (!confirm('Cancel this leave application?')) return;
        
        try {
            await router.post(route('leave.cancel', leaveId), {}, {
                preserveScroll: true,
            });
            // Refresh data
            get(route('leave.index'), {
                preserveState: true,
                preserveScroll: true,
            });
        } catch (error) {
            console.error('Cancel error:', error);
            alert('Error cancelling leave');
        }
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

    const getStatusIcon = (status) => {
        const icons = {
            'approved': '✅',
            'pending': '⏳',
            'rejected': '❌',
            'cancelled': '🚫',
        };
        return icons[status] || '📝';
    };

    const getTypeColor = (type) => {
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

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-BD', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatDuration = (leave) => {
        if (leave.is_half_day) {
            return `Half Day (${leave.half_day_type === 'first_half' ? 'First Half' : 'Second Half'})`;
        }
        return `${leave.total_days} Day${leave.total_days > 1 ? 's' : ''}`;
    };

    const calculateDaysExcludingFridays = (start, end) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        let days = 0;
        
        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
            // Skip Fridays (5 = Friday)
            if (date.getDay() !== 5) {
                days++;
            }
        }
        
        return days;
    };

    return (
        <>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
                    <p className="text-gray-600">Manage employee leave applications and approvals</p>
                </div>
                <div className="flex space-x-3">
                    <Link
                        href={route('leave.dashboard')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                        <span className="mr-2">📊</span> Leave Dashboard
                    </Link>
                    <Link
                        href={route('leave.create')}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                    >
                        <span className="mr-2">➕</span> Apply for Leave
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            📊 Status
                        </label>
                        <select
                            value={data.status}
                            onChange={e => setData('status', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Status</option>
                            {statuses.map(status => (
                                <option key={status.value} value={status.value}>
                                    {status.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            📝 Type
                        </label>
                        <select
                            value={data.type}
                            onChange={e => setData('type', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Types</option>
                            {leave_types.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            👤 Employee
                        </label>
                        <select
                            value={data.employee_id}
                            onChange={e => setData('employee_id', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Employees</option>
                            {employees.map(employee => (
                                <option key={employee.id} value={employee.id}>
                                    {employee.name} ({employee.employee_id})
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            📅 Start Date
                        </label>
                        <input
                            type="date"
                            value={data.start_date}
                            onChange={e => setData('start_date', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            📅 End Date
                        </label>
                        <input
                            type="date"
                            value={data.end_date}
                            onChange={e => setData('end_date', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    
                    <div className="col-span-1 md:col-span-2 lg:col-span-5 flex justify-end space-x-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
                        >
                            {processing ? (
                                <>
                                    <span className="animate-spin mr-2">⟳</span>
                                    Filtering...
                                </>
                            ) : (
                                <>
                                    <span className="mr-2">🔍</span>
                                    Filter
                                </>
                            )}
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => {
                                setData({
                                    status: '',
                                    type: '',
                                    employee_id: '',
                                    start_date: '',
                                    end_date: ''
                                });
                                setTimeout(() => {
                                    get(route('leave.index'), {
                                        preserveState: true,
                                        preserveScroll: true,
                                    });
                                }, 100);
                            }}
                            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center"
                        >
                            <span className="mr-2">🔄</span>
                            Reset
                        </button>
                    </div>
                </form>
            </div>

            {/* Leave Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-medium text-gray-900">
                            📋 Leave Applications
                        </h2>
                        <div className="text-sm text-gray-500 mt-1">
                            Total: {leaves.total} applications
                        </div>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Employee
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Leave Details
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Duration
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Dates
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
                            {leaves.data.length > 0 ? (
                                leaves.data.map((leave) => (
                                    <tr key={leave.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <span className="text-blue-600 font-medium">
                                                        {leave.employee?.name?.charAt(0) || 'E'}
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {leave.employee?.name || 'N/A'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {leave.employee?.employee_id || 'N/A'}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        {leave.employee?.department?.name || ''}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-1 ${getTypeColor(leave.type)}`}>
                                                    {leave.leave_type_name || leave.type}
                                                </span>
                                                <div className="text-sm text-gray-900">
                                                    {leave.reason?.length > 100 ? leave.reason.substring(0, 100) + '...' : leave.reason}
                                                </div>
                                                {leave.attachment && (
                                                    <a 
                                                        href={`/storage/${leave.attachment}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-blue-600 hover:text-blue-800 mt-1 flex items-center"
                                                    >
                                                        📎 Attachment
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm">
                                                <div className="font-medium text-gray-900">
                                                    {formatDuration(leave)}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {calculateDaysExcludingFridays(leave.start_date, leave.end_date)} working days
                                                </div>
                                                {leave.is_half_day && (
                                                    <div className="text-xs text-yellow-600">
                                                        Half Day
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm">
                                                <div className="font-medium text-gray-900">
                                                    {formatDate(leave.start_date)}
                                                </div>
                                                <div className="text-gray-500">to</div>
                                                <div className="font-medium text-gray-900">
                                                    {formatDate(leave.end_date)}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Applied: {formatDate(leave.created_at)}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col space-y-1">
                                                <span className={`px-2 py-1 text-xs rounded-full font-medium flex items-center justify-center ${getStatusColor(leave.status)}`}>
                                                    <span className="mr-1">{getStatusIcon(leave.status)}</span>
                                                    {leave.status?.charAt(0).toUpperCase() + leave.status?.slice(1)}
                                                </span>
                                                
                                                {leave.status === 'approved' && leave.approved_by && (
                                                    <div className="text-xs text-gray-500">
                                                        Approved by: {leave.approver?.name || 'Admin'}
                                                        <div>{formatDate(leave.approved_at)}</div>
                                                    </div>
                                                )}
                                                
                                                {leave.status === 'rejected' && leave.rejection_reason && (
                                                    <div className="text-xs text-red-500">
                                                        Reason: {leave.rejection_reason}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <Link
                                                    href={route('leave.show', leave.id)}
                                                    className="text-blue-600 hover:text-blue-900 transition-colors"
                                                    title="View Details"
                                                >
                                                    👁️
                                                </Link>
                                                
                                                {leave.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(leave.id)}
                                                            className="text-green-600 hover:text-green-900 transition-colors"
                                                            title="Approve"
                                                        >
                                                            ✅
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(leave.id)}
                                                            className="text-red-600 hover:text-red-900 transition-colors"
                                                            title="Reject"
                                                        >
                                                            ❌
                                                        </button>
                                                    </>
                                                )}
                                                
                                                {(leave.status === 'pending' && leave.employee_id === window.auth?.employee?.id) && (
                                                    <button
                                                        onClick={() => handleCancel(leave.id)}
                                                        className="text-yellow-600 hover:text-yellow-900 transition-colors"
                                                        title="Cancel"
                                                    >
                                                        🚫
                                                    </button>
                                                )}
                                                
                                                {leave.status !== 'approved' && (
                                                    <button
                                                        onClick={async () => {
                                                            if (confirm('Delete this leave application?')) {
                                                                try {
                                                                    await router.delete(route('leave.destroy', leave.id), {
                                                                        preserveScroll: true,
                                                                    });
                                                                    // Refresh data
                                                                    get(route('leave.index'), {
                                                                        preserveState: true,
                                                                        preserveScroll: true,
                                                                    });
                                                                } catch (error) {
                                                                    console.error('Delete error:', error);
                                                                    alert('Error deleting leave');
                                                                }
                                                            }
                                                        }}
                                                        className="text-red-600 hover:text-red-900 transition-colors"
                                                        title="Delete"
                                                    >
                                                        🗑️
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <div className="text-gray-400 text-4xl mb-4">📋</div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No leave applications found</h3>
                                        <p className="text-gray-500 mb-4">
                                            {filters.status || filters.type || filters.employee_id || filters.start_date || filters.end_date
                                                ? 'Try adjusting your filters'
                                                : 'No leave applications have been submitted yet'
                                            }
                                        </p>
                                        <Link
                                            href={route('leave.create')}
                                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center"
                                        >
                                            <span className="mr-2">➕</span>
                                            Apply for Leave
                                        </Link>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {leaves.links && leaves.links.length > 3 && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                Showing {leaves.from || 0} to {leaves.to || 0} of {leaves.total || 0} results
                            </div>
                            <div className="flex space-x-1">
                                {leaves.links.map((link, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            if (link.url) {
                                                setProcessing(true);
                                                get(link.url, {
                                                    preserveState: true,
                                                    preserveScroll: true,
                                                    onFinish: () => setProcessing(false),
                                                });
                                            }
                                        }}
                                        disabled={!link.url || link.active}
                                        className={`px-3 py-1 text-sm rounded transition-colors ${
                                            link.active 
                                                ? 'bg-blue-600 text-white' 
                                                : link.url
                                                    ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}