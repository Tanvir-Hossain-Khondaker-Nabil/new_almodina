import React, { useState, useEffect } from "react";
import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import { Frown, Pen, Plus, Trash2, X, Search, Loader2, Image as ImageIcon } from "lucide-react";

import { useForm, usePage, router, Link } from "@inertiajs/react";

import { useTranslation } from "../../hooks/useTranslation";

export default function Index({ brands, filters }) {

    const { auth } = usePage().props;
    const { t, locale } = useTranslation();
    const [deleteLoading, setDeleteLoading] = useState(null);
    const [searchTimeout, setSearchTimeout] = useState(null);

    const searchForm = useForm({
        search: filters.search || "",
    });

    const handleSearch = (e) => {
        const value = e.target.value;
        searchForm.setData("search", value);

        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        const timeout = setTimeout(() => {
            router.get(route("brands.index"),
                { search: value },
                {
                    preserveScroll: true,
                    preserveState: true,
                    replace: true,
                }
            );
        }, 500);

        setSearchTimeout(timeout);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
        };
    }, [searchTimeout]);

    // Handle brand delete
    const handleDelete = (id) => {
        if (window.confirm(t('brand.delete_confirmation', 'Are you sure you want to delete this brand? This action cannot be undone.'))) {
            setDeleteLoading(id);
            router.delete(route("brands.destroy", { brand: id }), {
                preserveScroll: true,
                onError: () => {
                    alert(t('brand.delete_error', 'Failed to delete brand'));
                },
                onFinish: () => {
                    setDeleteLoading(null);
                }
            });
        }
    };

    // Format date based on locale
    const formatDate = (dateString) => {
        if (!dateString) return '-';

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '-';

            const options = {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            };

            if (locale === 'bn') {
                return date.toLocaleDateString('bn-BD', options);
            } else {
                return date.toLocaleDateString('en-US', options);
            }
        } catch (error) {
            console.error('Date formatting error:', error);
            return '-';
        }
    };

    // Truncate text for description
    const truncateText = (text, maxLength = 100) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    // Clear search
    const clearSearch = () => {
        searchForm.setData("search", "");
        router.get(route("brands.index"), {}, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    return (
        <div className={`bg-white rounded-box p-4 sm:p-6 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <PageHeader
                title={t('brand.title', 'Brands')}
                subtitle={t('brand.subtitle', 'Manage your product brands from here.')}
            >
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="search"
                            onChange={handleSearch}
                            value={searchForm.data.search}
                            placeholder={t('brand.search_placeholder', 'Search brands...')}
                            className="input input-sm input-bordered w-full sm:w-64 pl-10 pr-10"
                        />
                        {searchForm.data.search && (
                            <button
                                onClick={clearSearch}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                    <Link
                        href={route("brands.create")}
                        className="btn bg-[#1e4d2b] text-white btn-sm gap-2"
                    >
                        <Plus size={16} />
                        <span>{t('brand.add_new', 'Add New')}</span>
                    </Link>
                </div>
            </PageHeader>

            <div className="overflow-x-auto -mx-4 sm:mx-0">
                {brands.data.length > 0 ? (
                    <>
                        <div className="mb-4 text-sm text-gray-500">
                            {t('brand.total_found', 'Total :count brands found', { count: brands.total })}
                        </div>
                        <table className="table table-auto w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="w-12 text-center">#</th>
                                    <th>{t('brand.logo', 'Logo')}</th>
                                    <th>{t('brand.name', 'Name')}</th>
                                    <th className="hidden md:table-cell">{t('brand.slug', 'Slug')}</th>
                                    <th className="hidden md:table-cell">{t('brand.description', 'Description')}</th>
                                    <th className="hidden lg:table-cell">{t('brand.created_at', 'Created At')}</th>
                                    <th className="hidden lg:table-cell">{t('brand.updated_at', 'Updated At')}</th>
                                    <th className="w-32">{t('brand.actions', 'Actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {brands.data.map((brand, index) => (
                                    <tr key={brand.id}>
                                        <td className="text-center font-medium">
                                            {brands.from + index}
                                        </td>
                                        <td>
                                            {brand.logo ? (
                                                <div className="avatar">
                                                    <div className="w-10 h-10 rounded-full ring-1 ring-gray-200 ring-offset-2">
                                                        <img
                                                            src={brand.logo_url || `/storage/${brand.logo}`}
                                                            alt={brand.name}
                                                            className="object-cover w-full h-full"
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(brand.name)}&background=random`;
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center ring-1 ring-gray-200 ring-offset-2">
                                                    <ImageIcon size={20} className="text-gray-400" />
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div className="font-semibold">{brand.name}</div>
                                            <div className="text-xs text-gray-500 md:hidden mt-1">
                                                {brand.slug}
                                            </div>
                                        </td>
                                        <td className="hidden md:table-cell">
                                            <div className="text-sm text-gray-600 font-mono">
                                                {brand.slug}
                                            </div>
                                        </td>
                                        <td className="hidden md:table-cell">
                                            <div className="text-sm text-gray-600 max-w-md">
                                                {brand.description ? truncateText(brand.description) : (
                                                    <span className="text-gray-400 italic">
                                                        {t('brand.no_description', 'No description')}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="hidden lg:table-cell">
                                            <div className="text-sm text-gray-600 whitespace-nowrap">
                                                {formatDate(brand.created_at)}
                                            </div>
                                        </td>
                                        <td className="hidden lg:table-cell">
                                            <div className="text-sm text-gray-600 whitespace-nowrap">
                                                {formatDate(brand.updated_at)}
                                            </div>
                                        </td>
                                        <td>
                                                <div className="flex items-center gap-2">
                                                    <a
                                                        href={route("brands.edit", { brand: brand.id })}
                                                        className="btn btn-xs btn-outline btn-warning gap-1"
                                                    >
                                                        <Pen size={12} />
                                                        <span className="hidden sm:inline">{t('brand.edit', 'Edit')}</span>
                                                    </a>
                                                    <button
                                                        disabled={deleteLoading === brand.id}
                                                        onClick={() => handleDelete(brand.id)}
                                                        className="btn btn-xs btn-outline btn-error gap-1"
                                                    >
                                                        {deleteLoading === brand.id ? (
                                                            <Loader2 size={12} className="animate-spin" />
                                                        ) : (
                                                            <Trash2 size={12} />
                                                        )}
                                                        <span className="hidden sm:inline">{t('brand.delete', 'Delete')}</span>
                                                    </button>
                                                </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                ) : (
                    <div className="border border-gray-200 rounded-box px-4 sm:px-6 py-12 sm:py-16 flex flex-col justify-center items-center gap-4 text-center">
                        <div className="bg-gray-50 rounded-full p-4">
                            <Frown size={48} className="text-gray-400" />
                        </div>
                        <div className="max-w-md">
                            <h3 className="text-gray-500 font-medium mb-2">
                                {t('brand.no_brands_found', 'No brands found')}
                            </h3>
                            <p className="text-gray-400 text-sm">
                                {searchForm.data.search
                                    ? t('brand.no_matching_brands', 'No brands matching ":search"', {
                                        search: searchForm.data.search
                                    })
                                    : t('brand.get_started_message', 'Get started by adding your first brand')
                                }
                            </p>
                        </div>
                            <a
                                href={route("brands.create")}
                                className="btn bg-[#1e4d2b] text-white btn-sm gap-2"
                            >
                                <Plus size={16} />
                                <span>{t('brand.add_new_brand', 'Add New Brand')}</span>
                            </a>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {brands.data.length > 0 && brands.last_page > 1 && (
                <div className="mt-6">
                    <Pagination data={brands} />
                </div>
            )}
        </div>
    );
}