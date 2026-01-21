import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

// Icons
const Search = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
);
const Filter = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
);
const Plus = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14" /><path d="M12 5v14" /></svg>
);
const Users = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);
const Shield = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /></svg>
);
const CheckCircle = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg>
);
const XCircle = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>
);

export default function Index({ users, roles, filters, statistics }) {
    const { auth } = usePage().props;
    const { data, setData, get } = useForm({
        search: filters?.search || '',
        role: filters?.role || '',
        sort_by: filters?.sort_by || 'created_at',
        sort_order: filters?.sort_order || 'desc',
        page: filters?.page || 1,
    });

    const handleFilter = () => {
        get(route('users.index'), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setData({
            search: '',
            role: '',
            sort_by: 'created_at',
            sort_order: 'desc',
            page: 1,
        });
        get(route('users.index'), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePageChange = (page) => {
        setData({ ...data, page });
        get(route('users.index'), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleStatusToggle = (userId, currentStatus) => {
        if (confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`)) {
            fetch(route('users.toggle-status', userId), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                },
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Refresh the page to get updated data
                    get(route('users.index'), {
                        preserveState: true,
                        preserveScroll: true,
                    });
                } else {
                    alert(data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to update user status.');
            });
        }
    };

    // Convert users to array for calculations
    const usersArray = users.data || [];

    return (
        <>
            <Head>
                <title>Users Management</title>
            </Head>
            
            <div className="min-h-screen bg-white p-4 sm:p-8 font-sans text-gray-900">
                {/* Header Section */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-semibold text-gray-900">Users Management</h1>
                            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-sm font-medium text-blue-700">
                                {statistics.total_users} Users
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">Manage user accounts and permissions</p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href={route('users.create')}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Add User
                        </Link>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-blue-800">Total Users</div>
                                <div className="text-2xl font-bold text-blue-900">{statistics.total_users}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Shield className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-green-800">Admins</div>
                                <div className="text-2xl font-bold text-green-900">{statistics.admins_count}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Users className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-purple-800">Sellers</div>
                                <div className="text-2xl font-bold text-purple-900">{statistics.sellers_count}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <CheckCircle className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-orange-800">Active Users</div>
                                <div className="text-2xl font-bold text-orange-900">{statistics.active_users}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters and Search Bar */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Filter Tabs */}
                    {/* <div className="flex w-full sm:w-auto rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
                        <button
                            onClick={handleReset}
                            className="flex-1 sm:flex-none rounded-md bg-gray-50 px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm transition-all"
                        >
                            All Users
                        </button>
                        {roles.map((role) => (
                            <button
                                key={role}
                                onClick={() => {
                                    setData({ ...data, role, page: 1 });
                                    handleFilter();
                                }}
                                className={`flex-1 sm:flex-none rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                                    data.role === role
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                            </button>
                        ))}
                    </div> */}

                    {/* Search and Filter */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={data.search}
                                    onChange={(e) => setData('search', e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                                    className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-shadow"
                                />
                            </div>
                            <button
                                onClick={handleFilter}
                                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
                            >
                                <Filter className="h-4 w-4" />
                                Filter
                            </button>
                            <button
                                onClick={handleReset}
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Table */}
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                    <table className="w-full min-w-[1000px] border-collapse text-left text-sm text-gray-500">
                        <thead className="bg-gray-50 text-xs font-medium uppercase text-gray-500">
                            <tr>
                                <th className="px-6 py-4 w-[250px]">User Details</th>
                                <th className="px-6 py-4 w-[200px]">Roles</th>
                                <th className="px-6 py-4 w-[150px]">Status</th>
                                <th className="px-6 py-4 w-[150px]">Join Date</th>
                                {/* <th className="px-6 py-4 w-[100px]">Last Login</th> */}
                                {/* <th className="px6 py-4 w-[150px]">Actions</th> */}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 border-t border-gray-200">
                            {usersArray.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 flex-shrink-0">
                                                {user.avatar ? (
                                                    <img
                                                        src={`/media/uploads/${user.avatar}`}
                                                        alt={user.name}
                                                        className="h-10 w-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <span className="text-blue-600 font-medium">
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{user.name}</div>
                                                <div className="text-xs text-gray-500">{user.email}</div>
                                                <div className="text-xs text-gray-500">{user.phone}</div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {user.roles.map(role => (
                                                <span
                                                    key={role}
                                                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                                        role === 'admin'
                                                            ? 'bg-red-50 text-red-700 ring-red-600/20'
                                                            : role === 'seller'
                                                            ? 'bg-green-50 text-green-700 ring-green-600/20'
                                                            : role === 'buyer'
                                                            ? 'bg-blue-50 text-blue-700 ring-blue-600/20'
                                                            : 'bg-gray-50 text-gray-600 ring-gray-500/10'
                                                    }`}
                                                >
                                                    {role}
                                                </span>
                                            ))}
                                        </div>
                                    </td>


                                    <td className="px-6 py-4 text-gray-500">{user.join_at}</td>
                                    
                                    <td className="px-6 py-4 text-gray-500">
                                        {user.last_login ? user.last_login : 'Never'}
                                    </td>

                                    {/* <td className="px-6 py-4">
                                        <div className="flex gap-2"> */}
                                            {/* <Link
                                                href={route('users.show', user.id)}
                                                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
                                            >
                                                View
                                            </Link> */}
                                            {/* <Link
                                                href={route('users.edit', user.id)}
                                                className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm hover:bg-blue-100 transition-colors"
                                            >
                                                Edit
                                            </Link> */}
                                            {/* {user.id !== auth.id && !user.roles.includes('Super Admin') && (
                                                <Link
                                                    method="delete"
                                                    href={route('users.destroy', user.id)}
                                                    className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm hover:bg-red-100 transition-colors"
                                                    as="button"
                                                    onClick={(e) => {
                                                        if (!confirm('Are you sure you want to delete this user?')) {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                >
                                                    Delete
                                                </Link>
                                            )} */}
                                        {/* </div>
                                    </td> */}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Empty State */}
                    {usersArray.length === 0 && (
                        <div className="text-center py-12">
                            <div className="mx-auto h-12 w-12 text-gray-400">
                                <Users className="h-12 w-12" />
                            </div>
                            <h3 className="mt-2 text-sm font-semibold text-gray-900">No users found</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {data.search || data.role
                                    ? 'Try changing your filters or search term.'
                                    : 'Get started by creating a new user.'}
                            </p>
                            <div className="mt-6">
                                <Link
                                    href={route('users.create')}
                                    className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                                >
                                    <Plus className="-ml-0.5 mr-1.5 h-5 w-5" />
                                    Add User
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Pagination */}
                    {users.meta && users.meta.total > 0 && (
                        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-4">
                            <div className="text-sm text-gray-700">
                                Showing {((users.meta.current_page - 1) * users.meta.per_page) + 1} to {Math.min(users.meta.current_page * users.meta.per_page, users.meta.total)} of {users.meta.total} users
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handlePageChange(users.meta.current_page - 1)}
                                    disabled={users.meta.current_page === 1}
                                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
                                </button>
                                <div className="flex gap-1">
                                    {Array.from({ length: Math.min(5, users.meta.last_page) }, (_, i) => {
                                        let pageNum;
                                        if (users.meta.last_page <= 5) {
                                            pageNum = i + 1;
                                        } else if (users.meta.current_page <= 3) {
                                            pageNum = i + 1;
                                        } else if (users.meta.current_page >= users.meta.last_page - 2) {
                                            pageNum = users.meta.last_page - 4 + i;
                                        } else {
                                            pageNum = users.meta.current_page - 2 + i;
                                        }

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => handlePageChange(pageNum)}
                                                className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors ${
                                                    pageNum === users.meta.current_page
                                                        ? 'bg-blue-600 text-white'
                                                        : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={() => handlePageChange(users.meta.current_page + 1)}
                                    disabled={users.meta.current_page === users.meta.last_page}
                                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}