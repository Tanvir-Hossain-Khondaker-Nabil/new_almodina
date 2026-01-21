import React, { useState } from "react";
import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import { Frown, Pen, Plus, Trash2, X, Package, BarChart3 } from "lucide-react";
import { Link, router, useForm, usePage } from "@inertiajs/react";
import axios from "axios";
import { useTranslation } from "../../hooks/useTranslation";

export default function Category({ category, filters }) {
    const { auth } = usePage().props;
    const { t, locale } = useTranslation();
    const [model, setModel] = useState(false);
    const [editProccesing, setEditProccesing] = useState(false);

    // model close handle
    const modelClose = () => {
        userForm.reset();
        setModel(!model);
    };

    // handle search
    const searchForm = useForm({
        search: filters.search || "",
    });
    const handleSearch = (e) => {
        const value = e.target.value;
        searchForm.setData("search", value);

        const queryString = value ? { search: value } : {};

        router.get(route("category.view"), queryString, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    // handle edit
    const userForm = useForm({
        id: "",
        name: "",
    });
    const handleUserCreateForm = (e) => {
        e.preventDefault();

        userForm.post(route("category.store"), {
            onSuccess: () => {
                userForm.reset();
                setModel(!model);
            },
        });
    };

    // handle user update
    const userEdithandle = (id) => {
        setEditProccesing(true);
        axios.get(route("category.edit", { id: id })).then((res) => {
            const data = res.data.data;
            userForm.setData("id", data.id);
            userForm.setData("name", data.name);
            setModel(true);
        });
        setEditProccesing(false);
    };

    return (
        <div className={`bg-white rounded-box p-5 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <PageHeader
                title={t('category.title', 'Category List')}
                subtitle={t('category.subtitle', 'Manage your all categories from here.')}
            >
                <div className="flex items-center gap-3">
                    <input
                        type="search"
                        onChange={handleSearch}
                        value={searchForm.data.search}
                        placeholder={t('category.search_placeholder', 'Search categories...')}
                        className="input input-sm"
                    />
                        <button
                            onClick={() => setModel(!model)}
                            className="btn bg-[#1e4d2b] text-white btn-sm"
                        >
                            <Plus size={15} /> {t('category.add_new', 'Add New')}
                        </button>
                </div>
            </PageHeader>

            <div className="overflow-x-auto">
                {category.data.length > 0 ? (
                    <table className="table table-auto w-full">
                        <thead className="bg-[#1e4d2b] text-white text-white">
                            <tr>
                                <th></th>
                                <th>{t('category.name', 'Name')}</th>
                                <th>{t('category.products', 'Products')}</th>
                                <th>{t('category.join_at', 'Join at')}</th>
                                <th>{t('category.actions', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {category.data.map((user, index) => (
                                <tr key={index}>
                                    <th>{index + 1}</th>
                                    <td>
                                        <div className="font-medium">{user.name}</div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <Package size={16} className="text-blue-600" />
                                            <div>
                                                <div className="font-bold text-lg">{user.products_count || 0}</div>
                                                <div className="text-xs text-gray-500">
                                                    {t('category.products', 'products')}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{user.join_at}</td>
                                    <td>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    disabled={editProccesing}
                                                    onClick={() =>
                                                        userEdithandle(user.id)
                                                    }
                                                    className="btn btn-xs btn-info"
                                                >
                                                    <Pen size={10} /> {t('category.edit', 'Edit')}
                                                </button>
                                                <Link
                                                    href={route(
                                                        "category.del",
                                                        {
                                                            id: user.id,
                                                        }
                                                    )}
                                                    onClick={(e) => {
                                                        if (
                                                            !confirm(
                                                                t('category.delete_confirmation', 'Are you sure you want to delete this category?')
                                                            )
                                                        ) {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                    className="btn btn-xs btn-error"
                                                >
                                                    <Trash2 size={10} /> {t('category.delete', 'Delete')}
                                                </Link>
                                            </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="border border-gray-200 rounded-box px-5 py-10 flex flex-col justify-center items-center gap-2">
                        <Frown size={20} className="text-gray-500" />
                        <h1 className="text-gray-500 text-sm">
                            {t('category.no_categories_found', 'No categories found!')}
                        </h1>
                        <button
                            onClick={() => setModel(!model)}
                            className="btn bg-[#1e4d2b] text-white btn-sm"
                        >
                            <Plus size={15} /> {t('category.add_new', 'Add New')}
                        </button>
                    </div>
                )}
            </div>

            {/* pagination */}
            <Pagination data={category} />

            {/* user add && update model */}
            <dialog className="modal" open={model}>
                <div className="modal-box">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                        <h1 className="text-base font-medium text-gray-900">
                            {userForm.data.id 
                                ? t('category.update_category', 'Update Category') 
                                : t('category.add_new_category', 'Add New Category')
                            }
                        </h1>
                        <button
                            onClick={modelClose}
                            className="btn btn-circle btn-xs btn-error"
                        >
                            <X size={10} />
                        </button>
                    </div>

                    <form onSubmit={handleUserCreateForm} className="space-y-2">
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">
                                {t('category.category_name', 'Category Name')}*
                            </legend>
                            <input
                                type="text"
                                value={userForm.data.name}
                                onChange={(e) =>
                                    userForm.setData("name", e.target.value)
                                }
                                className="input"
                                placeholder={t('category.type_here', 'Type here')}
                            />
                            {userForm.errors.name && (
                                <div className="text-red-500 text-sm">
                                    {userForm.errors.name}
                                </div>
                            )}
                        </fieldset>
                        <button
                            disabled={userForm.processing}
                            className="btn bg-[#1e4d2b] text-white"
                            type="submit"
                        >
                            {userForm.data.id 
                                ? t('category.update_category_btn', 'Update Category') 
                                : t('category.add_now_btn', 'Add Now')
                            }
                        </button>
                    </form>
                </div>
            </dialog>
        </div>
    );
}