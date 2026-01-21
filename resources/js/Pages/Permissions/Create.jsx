import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Create({ permissions }) {
    const { data, setData, errors, post, processing } = useForm({
        name: '',
        permissions: []
    });

    const [selectedPermissions, setSelectedPermissions] = useState({});

    const handlePermissionChange = (permissionName, isChecked) => {
        setSelectedPermissions(prev => ({
            ...prev,
            [permissionName]: isChecked
        }));

        if (isChecked) {
            setData('permissions', [...data.permissions, permissionName]);
        } else {
            setData('permissions', data.permissions.filter(p => p !== permissionName));
        }
    };

    const handleSelectAll = (modulePermissions, isSelected) => {
        const newSelected = { ...selectedPermissions };
        const newPermissions = [...data.permissions];

        modulePermissions.forEach(perm => {
            newSelected[perm.name] = isSelected;
            if (isSelected && !newPermissions.includes(perm.name)) {
                newPermissions.push(perm.name);
            } else if (!isSelected) {
                const index = newPermissions.indexOf(perm.name);
                if (index > -1) {
                    newPermissions.splice(index, 1);
                }
            }
        });

        setSelectedPermissions(newSelected);
        setData('permissions', newPermissions);
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('roles.store'));
    };

    return (
        <>
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <form onSubmit={submit}>
                                {/* Role Name */}
                                <div className="mb-6">
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                        Role Name *
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

                                {/* Permissions */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-4">
                                        Permissions *
                                    </label>
                                    
                                    {permissions.map((module) => (
                                        <div key={module.module} className="mb-6 border border-gray-200 rounded-lg">
                                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-lg font-medium text-gray-900">
                                                        {module.module} Management
                                                    </h4>
                                                    <button
                                                        type="button"
                                                        className="text-sm text-blue-600 hover:text-blue-900"
                                                        onClick={() => handleSelectAll(
                                                            module.permissions, 
                                                            !module.permissions.every(p => selectedPermissions[p.name])
                                                        )}
                                                    >
                                                        {module.permissions.every(p => selectedPermissions[p.name]) 
                                                            ? 'Deselect All' 
                                                            : 'Select All'
                                                        }
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {module.permissions.map((permission) => (
                                                    <div key={permission.name} className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            id={`perm-${permission.name}`}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                            checked={selectedPermissions[permission.name] || false}
                                                            onChange={(e) => handlePermissionChange(
                                                                permission.name, 
                                                                e.target.checked
                                                            )}
                                                        />
                                                        <label 
                                                            htmlFor={`perm-${permission.name}`}
                                                            className="ml-2 text-sm text-gray-700"
                                                        >
                                                            {permission.label}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {errors.permissions && (
                                        <p className="mt-1 text-sm text-red-600">{errors.permissions}</p>
                                    )}
                                </div>

                                {/* Selected Permissions Count */}
                                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-blue-700">
                                        {data.permissions.length} permissions selected
                                    </p>
                                </div>

                                {/* Buttons */}
                                <div className="flex items-center justify-end space-x-4">
                                    <Link
                                        href={route('roles.index')}
                                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                                    >
                                        {processing ? 'Creating...' : 'Create Role'}
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
