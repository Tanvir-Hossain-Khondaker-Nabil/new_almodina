import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Create({ roles }) {
    const { data, setData, errors, post, processing } = useForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        password: '',
        password_confirmation: '',
        roles: [],
        is_active: true
    });

    const handleRoleChange = (roleName, isChecked) => {
        if (isChecked) {
            setData('roles', [...data.roles, roleName]);
        } else {
            setData('roles', data.roles.filter(role => role !== roleName));
        }
    };

    const handleSelectAll = (isSelected) => {
        if (isSelected) {
            setData('roles', [...roles]);
        } else {
            setData('roles', []);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('userlist.store'));
    };

    return (
        <>
            <Head>
                <title>Create User</title>
            </Head>
            <div className="py-12">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-800">Create New User</h2>
                                <p className="text-gray-600 mt-1">
                                    Create a new user account with specific roles and permissions.
                                </p>
                            </div>

                            <form onSubmit={submit}>
                                {/* Basic Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                            Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                        />
                                        {errors.name && (
                                            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                            Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                        />
                                        {errors.email && (
                                            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Contact Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                        />
                                        {errors.phone && (
                                            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                                            Address
                                        </label>
                                        <input
                                            type="text"
                                            id="address"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            value={data.address}
                                            onChange={(e) => setData('address', e.target.value)}
                                        />
                                        {errors.address && (
                                            <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                            Password *
                                        </label>
                                        <input
                                            type="password"
                                            id="password"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                        />
                                        {errors.password && (
                                            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">
                                            Confirm Password *
                                        </label>
                                        <input
                                            type="password"
                                            id="password_confirmation"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Roles */}
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Assign Roles *
                                        </label>
                                        <button
                                            type="button"
                                            className="text-sm text-blue-600 hover:text-blue-900"
                                            onClick={() => handleSelectAll(data.roles.length !== roles.length)}
                                        >
                                            {data.roles.length === roles.length ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {roles && roles.length > 0 ? (
                                            roles.map((role) => (
                                                <div key={role} className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        id={`role-${role}`}
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                        checked={data.roles.includes(role)}
                                                        onChange={(e) => handleRoleChange(role, e.target.checked)}
                                                    />
                                                    <label 
                                                        htmlFor={`role-${role}`}
                                                        className="ml-2 text-sm text-gray-700 capitalize"
                                                    >
                                                        {role}
                                                    </label>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-500">No roles available. Please create roles first.</p>
                                        )}
                                    </div>
                                    {errors.roles && (
                                        <p className="mt-1 text-sm text-red-600">{errors.roles}</p>
                                    )}
                                </div>

                                {/* Status */}
                                <div className="mb-6">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="is_active"
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                        />
                                        <label 
                                            htmlFor="is_active"
                                            className="ml-2 text-sm text-gray-700"
                                        >
                                            Active User
                                        </label>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Active users can log in to the system. Inactive users cannot log in.
                                    </p>
                                </div>

                                {/* Buttons */}
                                <div className="flex items-center justify-end space-x-4">
                                    <Link
                                        href={route('userlist.view')}
                                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                                    >
                                        {processing ? 'Creating...' : 'Create User'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}