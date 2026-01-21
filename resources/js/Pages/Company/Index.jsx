import React, { useState } from "react";
import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import { Frown, Pen, Plus, Trash2, X, Mail, Phone, MapPin, Globe, CheckCircle, XCircle, Image } from "lucide-react";
import { router, useForm, usePage } from "@inertiajs/react";
import axios from "axios";
import { useTranslation } from "../../hooks/useTranslation";

export default function Index({ companies, filters }) {
    const { auth } = usePage().props;
    const { t, locale } = useTranslation();
    const [model, setModel] = useState(false);
    const [editProcessing, setEditProcessing] = useState(false);
    const [logoPreview, setLogoPreview] = useState(null);

    // Safely handle filters with default value
    const safeFilters = filters || {};
    
    // Model close handle
    const modelClose = () => {
        companyForm.reset();
        setLogoPreview(null);
        setModel(false);
    };

    // Handle search
    const searchForm = useForm({
        search: safeFilters.search || "",
    });
    
    const handleSearch = (e) => {
        const value = e.target.value;
        searchForm.setData("search", value);

        router.get(route("companies.index"), 
            { search: value }, 
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            }
        );
    };

    // Handle form submission
    const companyForm = useForm({
        id: "",
        name: "",
        email: "",
        phone: "",
        address: "",
        website: "",
        logo: null,
        status: "active",
    });

    const handleCompanyCreateForm = (e) => {
        e.preventDefault();

        if (companyForm.data.id) {
            // Update existing company
            companyForm.put(route("companies.update", { company: companyForm.data.id }), {
                onSuccess: () => {
                    companyForm.reset();
                    setLogoPreview(null);
                    setModel(false);
                },
            });
        } else {
            // Create new company
            companyForm.post(route("companies.store"), {
                onSuccess: () => {
                    companyForm.reset();
                    setLogoPreview(null);
                    setModel(false);
                },
            });
        }
    };

    // Handle logo file change
    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            companyForm.setData("logo", file);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setLogoPreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle company edit
    const handleCompanyEdit = (id) => {
        setEditProcessing(true);
        axios.get(route("companies.edit", { company: id })).then((res) => {
            const data = res.data;
            companyForm.setData({
                id: data.id,
                name: data.name,
                email: data.email || "",
                phone: data.phone || "",
                address: data.address || "",
                website: data.website || "",
                status: data.status,
                logo: null, // Reset logo file on edit
            });
            
            // Set logo preview if exists
            if (data.logo_url) {
                setLogoPreview(data.logo_url);
            } else {
                setLogoPreview(null);
            }
            
            setModel(true);
        }).catch((error) => {
            console.error("Error fetching company:", error);
        }).finally(() => {
            setEditProcessing(false);
        });
    };

    // Handle company delete
    const handleDelete = (id) => {
        if (confirm(t('company.delete_confirmation', 'Are you sure you want to delete this company?'))) {
            router.delete(route("companies.destroy", { company: id }), {
                preserveScroll: true,
                onSuccess: () => {
                    // Success message will come from backend
                },
                onError: (error) => {
                    console.error("Error deleting company:", error);
                }
            });
        }
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Status badge component
    const StatusBadge = ({ status }) => {
        return (
            <div className={`badge badge-sm ${status === 'active' ? 'badge-success' : 'badge-error'} gap-1`}>
                {status === 'active' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                {status === 'active' ? t('company.active', 'Active') : t('company.inactive', 'Inactive')}
            </div>
        );
    };

    // Safely handle companies data
    const companiesData = companies?.data || [];
    const hasCompanies = companiesData.length > 0;

    return (
        <div className={`bg-white rounded-box p-5 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <PageHeader
                title={t('company.companies_title', 'Companies')}
                subtitle={t('company.companies_subtitle', 'Manage all companies from here.')}
            >
                <div className="flex items-center gap-3">
                    <input
                        type="search"
                        onChange={handleSearch}
                        value={searchForm.data.search}
                        placeholder={t('company.search_placeholder', 'Search companies...')}
                        className="input input-sm input-bordered w-64"
                    />
                        <button
                            onClick={() => setModel(true)}
                            className="btn bg-[#1e4d2b] text-white btn-sm"
                        >
                            <Plus size={15} /> {t('company.add_new', 'Add New')}
                        </button>
                </div>
            </PageHeader>

            <div className="overflow-x-auto">
                {hasCompanies ? (
                    <table className="table table-auto w-full">
                        <thead className="bg-[#1e4d2b] text-white text-white">
                            <tr>
                                <th className="w-12">#</th>
                                <th>{t('company.company_details', 'Company Details')}</th>
                                <th>{t('company.contact_info', 'Contact Info')}</th>
                                <th>{t('company.status', 'Status')}</th>
                                <th>{t('company.added_on', 'Added On')}</th>
                                <th className="w-32">{t('company.actions', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companiesData.map((company, index) => (
                                <tr key={company.id}>
                                    <th>{index + 1}</th>
                                    <td>
                                        <div className="flex items-start gap-3">
                                            {company.logo_url && (
                                                <div className="avatar">
                                                    <div className="w-10 h-10 rounded">
                                                        <img 
                                                            src={company.logo_url} 
                                                            alt={company.name}
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            <div className="space-y-1">
                                                <div className="font-semibold">{company.name}</div>
                                                {company.website && (
                                                    <div className="flex items-center gap-1 text-sm text-blue-600">
                                                        <Globe size={12} />
                                                        <a 
                                                            href={company.website} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="hover:underline"
                                                        >
                                                            {t('company.website', 'Website')}
                                                        </a>
                                                    </div>
                                                )}
                                                {company.address && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <MapPin size={12} />
                                                        <span className="truncate max-w-xs">{company.address}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="space-y-1">
                                            {company.email && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Mail size={12} />
                                                    <span>{company.email}</span>
                                                </div>
                                            )}
                                            {company.phone && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Phone size={12} />
                                                    <span>{company.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <StatusBadge status={company.status} />
                                    </td>
                                    <td>
                                        <div className="text-sm text-gray-600">
                                            {formatDate(company.created_at)}
                                        </div>
                                    </td>
                                    <td>
                                        {auth?.role === "admin" ? (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    disabled={editProcessing}
                                                    onClick={() => handleCompanyEdit(company.id)}
                                                    className="btn btn-xs btn-warning"
                                                >
                                                    <Pen size={12} /> {t('company.edit', 'Edit')}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(company.id)}
                                                    className="btn btn-xs btn-error"
                                                >
                                                    <Trash2 size={12} /> {t('company.delete', 'Delete')}
                                                </button>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500">
                                                {t('company.no_permission', 'No permission')}
                                            </p>
                                        )}
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
                                {t('company.no_companies_found', 'No companies found')}
                            </h3>
                            <p className="text-gray-400 text-sm">
                                {searchForm.data.search 
                                    ? `${t('company.no_matching_companies', 'No companies matching')} "${searchForm.data.search}"`
                                    : t('company.add_first_company', 'Get started by adding your first company')
                                }
                            </p>
                        </div>
                            <button
                                onClick={() => setModel(true)}
                                className="btn bg-[#1e4d2b] text-white btn-sm"
                            >
                                <Plus size={15} /> {t('company.add_new_company', 'Add New Company')}
                            </button>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {hasCompanies && companies?.links && (
                <div className="mt-6">
                    <Pagination data={companies} />
                </div>
            )}

            {/* Add/Edit Modal */}
            <dialog className={`modal ${model ? 'modal-open' : ''}`}>
                <div className="modal-box max-w-2xl">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-6">
                        <h1 className="text-lg font-semibold text-gray-900">
                            {companyForm.data.id ? 
                                t('company.edit_company', 'Edit Company') : 
                                t('company.add_new_company_modal', 'Add New Company')
                            }
                        </h1>
                        <button
                            onClick={modelClose}
                            className="btn btn-circle btn-xs btn-ghost"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <form onSubmit={handleCompanyCreateForm} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Company Name */}
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend">
                                    {t('company.company_name', 'Company Name')}*
                                </legend>
                                <input
                                    type="text"
                                    value={companyForm.data.name}
                                    onChange={(e) => companyForm.setData("name", e.target.value)}
                                    className="input input-bordered w-full"
                                    placeholder={t('company.enter_company_name', 'Enter company name')}
                                    required
                                />
                                {companyForm.errors.name && (
                                    <div className="text-red-500 text-sm mt-1">
                                        {companyForm.errors.name}
                                    </div>
                                )}
                            </fieldset>

                            {/* Email */}
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend">
                                    {t('company.email', 'Email')}
                                </legend>
                                <input
                                    type="email"
                                    value={companyForm.data.email}
                                    onChange={(e) => companyForm.setData("email", e.target.value)}
                                    className="input input-bordered w-full"
                                    placeholder={t('company.enter_email', 'Enter email address')}
                                />
                                {companyForm.errors.email && (
                                    <div className="text-red-500 text-sm mt-1">
                                        {companyForm.errors.email}
                                    </div>
                                )}
                            </fieldset>

                            {/* Phone */}
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend">
                                    {t('company.phone', 'Phone')}
                                </legend>
                                <input
                                    type="tel"
                                    value={companyForm.data.phone}
                                    onChange={(e) => companyForm.setData("phone", e.target.value)}
                                    className="input input-bordered w-full"
                                    placeholder={t('company.enter_phone', 'Enter phone number')}
                                />
                                {companyForm.errors.phone && (
                                    <div className="text-red-500 text-sm mt-1">
                                        {companyForm.errors.phone}
                                    </div>
                                )}
                            </fieldset>

                            {/* Website */}
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend">
                                    {t('company.website', 'Website')}
                                </legend>
                                <input
                                    type="url"
                                    value={companyForm.data.website}
                                    onChange={(e) => companyForm.setData("website", e.target.value)}
                                    className="input input-bordered w-full"
                                    placeholder="https://example.com"
                                />
                                {companyForm.errors.website && (
                                    <div className="text-red-500 text-sm mt-1">
                                        {companyForm.errors.website}
                                    </div>
                                )}
                            </fieldset>

                            {/* Status */}
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend">
                                    {t('company.status', 'Status')}*
                                </legend>
                                <select
                                    value={companyForm.data.status}
                                    onChange={(e) => companyForm.setData("status", e.target.value)}
                                    className="select select-bordered w-full"
                                    required
                                >
                                    <option value="active">{t('company.active', 'Active')}</option>
                                    <option value="inactive">{t('company.inactive', 'Inactive')}</option>
                                </select>
                                {companyForm.errors.status && (
                                    <div className="text-red-500 text-sm mt-1">
                                        {companyForm.errors.status}
                                    </div>
                                )}
                            </fieldset>

                            {/* Logo Upload */}
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend">
                                    {t('company.company_logo', 'Company Logo')}
                                </legend>
                                <div className="space-y-3">
                                    <input
                                        type="file"
                                        onChange={handleLogoChange}
                                        accept="image/*"
                                        className="file-input file-input-bordered w-full"
                                    />
                                    {companyForm.errors.logo && (
                                        <div className="text-red-500 text-sm mt-1">
                                            {companyForm.errors.logo}
                                        </div>
                                    )}
                                    
                                    {/* Logo Preview */}
                                    {logoPreview && (
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-600 mb-2">
                                                {t('company.logo_preview', 'Preview')}:
                                            </p>
                                            <div className="avatar">
                                                <div className="w-16 h-16 rounded border">
                                                    <img 
                                                        src={logoPreview} 
                                                        alt="Logo preview" 
                                                        className="object-cover w-full h-full"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Current Logo (in edit mode) */}
                                    {companyForm.data.id && !logoPreview && (
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-600 mb-2">
                                                {t('company.current_logo', 'Current Logo')}:
                                            </p>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Image size={16} />
                                                <span>{t('company.no_changes', 'No changes')}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </fieldset>
                        </div>

                        {/* Address */}
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">
                                {t('company.address', 'Address')}
                            </legend>
                            <textarea
                                value={companyForm.data.address}
                                onChange={(e) => companyForm.setData("address", e.target.value)}
                                className="textarea textarea-bordered w-full"
                                rows="2"
                                placeholder={t('company.enter_address', 'Enter company address')}
                            />
                            {companyForm.errors.address && (
                                <div className="text-red-500 text-sm mt-1">
                                    {companyForm.errors.address}
                                </div>
                            )}
                        </fieldset>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={companyForm.processing}
                                className="btn bg-[#1e4d2b] text-white flex-1"
                            >
                                {companyForm.processing ? 
                                    t('company.processing', 'Processing...') : 
                                    companyForm.data.id ? 
                                        t('company.update_company', 'Update Company') : 
                                        t('company.add_company', 'Add Company')
                                }
                            </button>
                            <button
                                type="button"
                                onClick={modelClose}
                                className="btn btn-ghost"
                            >
                                {t('company.cancel', 'Cancel')}
                            </button>
                        </div>
                    </form>
                </div>
            </dialog>
        </div>
    );
}