import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    ToggleLeft, 
    ToggleRight, 
    TestTube, 
    Send,
    DollarSign,
    RefreshCw,
    Wifi,
    WifiOff
} from 'lucide-react';

import DeleteModal from '../../Components/DeleteModal';

export default function Index({ templates, filters, totalTemplates, activeTemplates }) {
    const [search, setSearch] = useState(filters.search || '');
    const [activeFilter, setActiveFilter] = useState(filters.is_active || '');
    const [deleteModal, setDeleteModal] = useState({ open: false, id: null });

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            router.get(route('sms-templates.index'), {
                search: search,
                is_active: activeFilter,
            }, {
                preserveState: true,
                replace: true,
            });
        }
    };

    const handleStatusFilter = (status) => {
        setActiveFilter(status);
        router.get(route('sms-templates.index'), {
            search: search,
            is_active: status,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setSearch('');
        setActiveFilter('');
        router.get(route('sms-templates.index'));
    };

    const toggleStatus = (template) => {
        router.post(route('sms-templates.toggle-status', template.id), {}, {
            preserveScroll: true,
            onSuccess: () => {
                // Optional: show toast notification
            },
        });
    };

    const handleDelete = () => {
        router.delete(route('sms-templates.destroy', deleteModal.id), {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteModal({ open: false, id: null });
            },
        });
    };

    const testGateway = (template) => {
        router.post(route('sms-templates.test', template.id), {}, {
            preserveScroll: true,
            onSuccess: (response) => {
                // Success message will come from controller
            },
            onError: (errors) => {
                // Error message will come from controller
            },
        });
    };

    const checkBalance = (template) => {
        router.post(route('sms-templates.check-balance', template.id), {}, {
            preserveScroll: true,
            onSuccess: (response) => {
                // Success message will come from controller
            },
            onError: (errors) => {
                // Error message will come from controller
            },
        });
    };

    const sendTestSms = (template) => {
        router.visit(route('sms-templates.send-form', template.id));
    };

    // Helper to mask sensitive data
    const maskApiKey = (apiKey) => {
        if (!apiKey) return 'Not configured';
        if (apiKey.includes('***')) return apiKey; // Already masked
        return apiKey.substring(0, 4) + '***' + apiKey.substring(apiKey.length - 4);
    };

    const maskApiSecret = (apiSecret) => {
        if (!apiSecret) return 'Not configured';
        if (apiSecret.includes('***')) return apiSecret; // Already masked
        return '********' + apiSecret.substring(apiSecret.length - 8);
    };

    return (
        <>
            <Head title="SMS Gateways" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">SMS Gateways</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Configure and manage SMS gateway providers
                            </p>
                        </div>
                        <Link
                            href={route('sms-templates.create')}
                            className="btn bg-[#1e4d2b] text-white hover:bg-[#163820]"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Gateway
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Total Gateways</p>
                                    <p className="text-2xl font-semibold text-gray-900">{totalTemplates}</p>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <Wifi className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Active Gateways</p>
                                    <p className="text-2xl font-semibold text-green-600">{activeTemplates}</p>
                                </div>
                                <div className="p-3 bg-green-50 rounded-lg">
                                    <Wifi className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Inactive Gateways</p>
                                    <p className="text-2xl font-semibold text-red-600">{totalTemplates - activeTemplates}</p>
                                </div>
                                <div className="p-3 bg-red-50 rounded-lg">
                                    <WifiOff className="w-6 h-6 text-red-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-lg shadow p-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search gateways..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyDown={handleSearch}
                                        className="pl-10 w-full input input-bordered"
                                    />
                                </div>
                            </div>
                            <div>
                                <select
                                    value={activeFilter}
                                    onChange={(e) => handleStatusFilter(e.target.value)}
                                    className="select select-bordered w-full"
                                >
                                    <option value="">All Status</option>
                                    <option value="1">Active Only</option>
                                    <option value="0">Inactive Only</option>
                                </select>
                            </div>
                            <div>
                                <button
                                    onClick={clearFilters}
                                    className="btn btn-outline w-full"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Gateways Table */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        {templates.data.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-gray-400 mb-4">
                                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No gateways configured</h3>
                                <p className="text-gray-500 mb-6">
                                    Get started by adding your first SMS gateway provider.
                                </p>
                                <Link
                                    href={route('sms-templates.create')}
                                    className="btn bg-[#1e4d2b] text-white hover:bg-[#163820]"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Gateway
                                </Link>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Gateway Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                API Configuration
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Balance
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
                                        {templates.data.map((template) => (
                                            <tr key={template.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {template.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        Sender ID: {template.sender_id}
                                                    </div>
                                                    {template.notes && (
                                                        <div className="text-xs text-gray-400 mt-1 truncate max-w-xs">
                                                            {template.notes}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        <div className="text-xs">
                                                            <span className="text-gray-500">URL:</span>
                                                            <span className="ml-1 font-medium truncate max-w-xs block">
                                                                {template.api_url}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs">
                                                            <span className="text-gray-500">API Key:</span>
                                                            <span className="ml-1 font-mono">
                                                                {maskApiKey(template.api_key)}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs">
                                                            <span className="text-gray-500">API Secret:</span>
                                                            <span className="ml-1 font-mono">
                                                                {maskApiSecret(template.api_secret)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                                                        <span className="text-sm font-medium">
                                                            {template.balance || 'Unknown'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => toggleStatus(template)}
                                                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                                            template.is_active
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                        }`}
                                                    >
                                                        {template.is_active ? (
                                                            <>
                                                                <ToggleRight className="w-4 h-4 mr-1" />
                                                                Active
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ToggleLeft className="w-4 h-4 mr-1" />
                                                                Inactive
                                                            </>
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex items-center space-x-2">
                                                        
                                                        <Link
                                                            href={route('sms-templates.edit', template.id)}
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                            title="Edit"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Link>
                                                        <button
                                                            onClick={() => setDeleteModal({ open: true, id: template.id })}
                                                            className="text-red-600 hover:text-red-900"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {templates.data.length > 0 && (
                            <div className="px-6 py-4 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-700">
                                        Showing <span className="font-medium">{templates.from}</span> to{' '}
                                        <span className="font-medium">{templates.to}</span> of{' '}
                                        <span className="font-medium">{templates.total}</span> results
                                    </div>
                                    <div className="flex space-x-2">
                                        {templates.links.map((link, index) => (
                                            <Link
                                                key={index}
                                                href={link.url || '#'}
                                                className={`px-3 py-1 rounded-md text-sm font-medium ${
                                                    link.active
                                                        ? 'bg-[#1e4d2b] text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                disabled={!link.url}
                                            >
                                                {link.label.replace('&laquo;', '«').replace('&raquo;', '»')}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <DeleteModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, id: null })}
                onConfirm={handleDelete}
                title="Delete SMS Gateway"
                message="Are you sure you want to delete this gateway configuration? This action cannot be undone."
            />
        </>
    );
}