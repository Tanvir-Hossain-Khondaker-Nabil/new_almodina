import React, { useState } from "react";
import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import { Frown, Pen, Plus, Trash2, X, CheckCircle, XCircle } from "lucide-react";
import { router, useForm, usePage } from "@inertiajs/react";
import axios from "axios";
import { useTranslation } from "../../hooks/useTranslation";

export default function Index({ modules, filters }) {
    const { auth } = usePage().props;
    const { t, locale } = useTranslation();
    const [model, setModel] = useState(false);
    const [editProcessing, setEditProcessing] = useState(false);

    // Modal close handle
    const modelClose = () => {
        moduleForm.reset();
        setModel(false);
    };

    // Handle search
    const searchForm = useForm({
        search: filters.search || "",
    });
    
    const handleSearch = (e) => {
        const value = e.target.value;
        searchForm.setData("search", value);

        router.get(route("modules.index"), 
            { search: value }, 
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            }
        );
    };

    // Handle form submission
    const moduleForm = useForm({
        id: "",
        name: "",
        description: "",
        is_active: true,
    });

    const handleModuleCreateForm = (e) => {
        e.preventDefault();

        if (moduleForm.data.id) {
            // Update existing module
            moduleForm.put(route("modules.update", { module: moduleForm.data.id }), {
                onSuccess: () => {
                    moduleForm.reset();
                    setModel(false);
                },
            });
        } else {
            // Create new module
            moduleForm.post(route("modules.store"), {
                onSuccess: () => {
                    moduleForm.reset();
                    setModel(false);
                },
            });
        }
    };

    // Handle module edit
    const handleModuleEdit = (id) => {
        setEditProcessing(true);
        axios.get(route("modules.edit", { module: id })).then((res) => {
            const data = res.data.module;
            moduleForm.setData({
                id: data.id,
                name: data.name,
                description: data.description || "",
                is_active: Boolean(data.is_active),
            });
            setModel(true);
        }).finally(() => {
            setEditProcessing(false);
        });
    };

    // Handle module delete
    const handleDelete = (id) => {
        if (confirm(t('module.delete_confirmation', 'Are you sure you want to delete this module?'))) {
            router.delete(route("modules.destroy", { module: id }), {
                preserveScroll: true,
                onSuccess: () => {
                    alert(t('module.deleted_successfully', 'Module deleted successfully!'));
                },
            });
        }
    };

    // Format date based on locale
    const formatDate = (dateString) => {
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        
        if (locale === 'bn') {
            return new Date(dateString).toLocaleDateString('bn-BD', options);
        } else {
            return new Date(dateString).toLocaleDateString('en-US', options);
        }
    };

    // Truncate text for description
    const truncateText = (text, maxLength = 100) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    return (
        <div className={`bg-white rounded-box p-5 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <PageHeader
                title={t('module.title', 'Modules')}
                subtitle={t('module.subtitle', 'Manage your application modules from here.')}
            >
                <div className="flex items-center gap-3">
                    <input
                        type="search"
                        onChange={handleSearch}
                        value={searchForm.data.search}
                        placeholder={t('module.search_placeholder', 'Search modules...')}
                        className="input input-sm input-bordered w-64"
                    />
                        <button
                            onClick={() => setModel(true)}
                            className="btn bg-[#1e4d2b] text-white btn-sm"
                        >
                            <Plus size={15} /> {t('module.add_new', 'Add New')}
                        </button>
                </div>
            </PageHeader>

            <div className="overflow-x-auto">
                {modules.data.length > 0 ? (
                    <table className="table table-auto w-full">
                        <thead className="bg-[#1e4d2b] text-white text-white">
                            <tr>
                                <th className="w-12">#</th>
                                <th>{t('module.name', 'Name')}</th>
                                <th>{t('module.description', 'Description')}</th>
                                <th>{t('module.status', 'Status')}</th>
                                <th>{t('module.created_at', 'Created At')}</th>
                                <th>{t('module.updated_at', 'Updated At')}</th>
                                <th className="w-32">{t('module.actions', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {modules.data.map((module, index) => (
                                <tr key={module.id} className={!module.is_active ? 'opacity-70' : ''}>
                                    <th>{index + 1}</th>
                                    <td>
                                        <div className="font-semibold">{module.name}</div>
                                    </td>
                                    <td>
                                        <div className="text-sm text-gray-600 max-w-md">
                                            {module.description ? truncateText(module.description) : (
                                                <span className="text-gray-400 italic">
                                                    {t('module.no_description', 'No description')}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${module.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {module.is_active ? (
                                                <>
                                                    <CheckCircle size={10} />
                                                    <span>{t('module.active', 'Active')}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle size={10} />
                                                    <span>{t('module.inactive', 'Inactive')}</span>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="text-sm text-gray-600">
                                            {formatDate(module.created_at)}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="text-sm text-gray-600">
                                            {formatDate(module.updated_at)}
                                        </div>
                                    </td>
                                    <td>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    disabled={editProcessing}
                                                    onClick={() => handleModuleEdit(module.id)}
                                                    className="btn btn-xs btn-warning"
                                                >
                                                    <Pen size={12} /> {t('module.edit', 'Edit')}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(module.id)}
                                                    className="btn btn-xs btn-error"
                                                >
                                                    <Trash2 size={12} /> {t('module.delete', 'Delete')}
                                                </button>
                                            </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="border border-gray-200 rounded-box px-5 py-16 flex flex-col justify-center items-center gap-3 text-center">
                        <Frown size={40} className="text-gray-400" />
                        <div>
                            <h3 className="text-gray-500 font-medium mb-1">
                                {t('module.no_modules_found', 'No modules found')}
                            </h3>
                            <p className="text-gray-400 text-sm">
                                {searchForm.data.search 
                                    ? t('module.no_matching_modules', 'No modules matching ":search"', {
                                        search: searchForm.data.search
                                    })
                                    : t('module.get_started_message', 'Get started by adding your first module')
                                }
                            </p>
                        </div>
                            <button
                                onClick={() => setModel(true)}
                                className="btn bg-[#1e4d2b] text-white btn-sm"
                            >
                                <Plus size={15} /> {t('module.add_new_module', 'Add New Module')}
                            </button>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {modules.data.length > 0 && (
                <div className="mt-6">
                    <Pagination data={modules} />
                </div>
            )}

            {/* Add/Edit Modal */}
            <dialog className={`modal ${model ? 'modal-open' : ''}`}>
                <div className="modal-box max-w-2xl">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-6">
                        <h1 className="text-lg font-semibold text-gray-900">
                            {moduleForm.data.id 
                                ? t('module.edit_module', 'Edit Module')
                                : t('module.add_new_module', 'Add New Module')
                            }
                        </h1>
                        <button
                            onClick={modelClose}
                            className="btn btn-circle btn-xs btn-ghost"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <form onSubmit={handleModuleCreateForm} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            {/* Module Name */}
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend">
                                    {t('module.name_field', 'Module Name')}
                                    <span className="text-red-500 ml-1">*</span>
                                </legend>
                                <input
                                    type="text"
                                    value={moduleForm.data.name}
                                    onChange={(e) => moduleForm.setData("name", e.target.value)}
                                    className="input input-bordered w-full"
                                    placeholder={t('module.name_placeholder', 'Enter module name')}
                                    required
                                />
                                {moduleForm.errors.name && (
                                    <div className="text-red-500 text-sm mt-1">
                                        {moduleForm.errors.name}
                                    </div>
                                )}
                            </fieldset>

                            {/* Status */}
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend">
                                    {t('module.status_field', 'Status')}
                                </legend>
                                <label className="label cursor-pointer justify-start gap-3">
                                    <input
                                        type="checkbox"
                                        checked={moduleForm.data.is_active}
                                        onChange={(e) => moduleForm.setData("is_active", e.target.checked)}
                                        className="toggle toggle-primary"
                                    />
                                    <span className="label-text">
                                        {moduleForm.data.is_active 
                                            ? t('module.active_status', 'Active')
                                            : t('module.inactive_status', 'Inactive')
                                        }
                                    </span>
                                </label>
                            </fieldset>
                        </div>

                        {/* Description */}
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">
                                {t('module.description_field', 'Description')}
                            </legend>
                            <textarea
                                value={moduleForm.data.description}
                                onChange={(e) => moduleForm.setData("description", e.target.value)}
                                className="textarea textarea-bordered w-full"
                                rows="4"
                                placeholder={t('module.description_placeholder', 'Enter module description...')}
                            />
                            {moduleForm.errors.description && (
                                <div className="text-red-500 text-sm mt-1">
                                    {moduleForm.errors.description}
                                </div>
                            )}
                        </fieldset>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={moduleForm.processing}
                                className="btn bg-[#1e4d2b] text-white flex-1"
                            >
                                {moduleForm.processing 
                                    ? t('module.processing', 'Processing...')
                                    : moduleForm.data.id 
                                        ? t('module.update_module', 'Update Module')
                                        : t('module.add_module', 'Add Module')
                                }
                            </button>
                            <button
                                type="button"
                                onClick={modelClose}
                                className="btn btn-ghost"
                            >
                                {t('module.cancel', 'Cancel')}
                            </button>
                        </div>
                    </form>
                </div>
            </dialog>
        </div>
    );
}