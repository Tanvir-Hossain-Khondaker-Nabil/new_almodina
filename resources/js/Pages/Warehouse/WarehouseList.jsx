import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import { Link, router, useForm, usePage } from "@inertiajs/react";
import { Edit, Plus, Trash2, Frown, Warehouse as WarehouseIcon, Eye, Shield } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";

export default function WarehouseList({ warehouses, filters, isShadowUser }) {
    const { auth } = usePage().props;
    const { t, locale } = useTranslation();

    const searchForm = useForm({
        search: filters.search || "",
    });

    const handleSearch = (e) => {
        const value = e.target.value;
        searchForm.setData("search", value);

        const queryString = value ? { search: value } : {};
        router.get(route("warehouse.list"), queryString, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = (id) => {
        if (confirm(t('warehouse.delete_confirmation', 'Are you sure you want to delete this warehouse?'))) {
            router.delete(route("warehouse.destroy", id));
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'BDT'
        }).format(amount || 0);
    };

    return (
        <div className={`bg-white rounded-box p-5 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <PageHeader
                title={t('warehouse.title', 'Warehouse Management')}
                subtitle={isShadowUser 
                    ? t('warehouse.subtitle_shadow', 'Manage shadow warehouses and inventory')
                    : t('warehouse.subtitle', 'Manage your warehouses and inventory')
                }
            >
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <div className="flex gap-2">
                        <input
                            type="search"
                            onChange={handleSearch}
                            value={searchForm.data.search}
                            placeholder={t('warehouse.search_placeholder', 'Search warehouses...')}
                            className="input input-sm input-bordered"
                        />
                            <Link
                                href={route("warehouse.create")}
                                className={`btn btn-sm ${isShadowUser ? 'btn-warning' : 'bg-[#1e4d2b] text-white'}`}
                            >
                                <Plus size={15} /> 
                                {t('warehouse.add_warehouse', 'Add New Warehouse')}
                            </Link>
                    </div>
                </div>
            </PageHeader>

            <div className="overflow-x-auto">
                {warehouses.data.length > 0 ? (
                    <table className="table table-auto w-full">
                        <thead className={isShadowUser ? "bg-warning text-warning-content" : "bg-[#1e4d2b] text-white text-primary-content"}>
                            <tr>
                                <th className="bg-opacity-20">#</th>
                                <th>{t('warehouse.name', 'Name')}</th>
                                <th>{t('warehouse.code', 'Code')}</th>
                                <th>{t('warehouse.contact', 'Contact')}</th>
                                <th>{t('warehouse.address', 'Address')}</th>
                                <th>{t('warehouse.status', 'Status')}</th>
                                <th>{t('warehouse.total_products', 'Total Products')}</th>
                                <th>{t('warehouse.stock_value', 'Stock Value')}</th>
                                <th>{t('warehouse.actions', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {warehouses.data.map((warehouse, index) => (
                                <tr key={warehouse.id} className="hover:bg-base-100">
                                    <th className="bg-base-200">{index + 1}</th>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <WarehouseIcon size={16} className={isShadowUser ? "text-warning" : "text-primary"} />
                                            <div>
                                                <div className="font-medium">{warehouse.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="font-mono">{warehouse.code}</td>
                                    <td>
                                        <div className="text-sm">
                                            <div>{warehouse.phone || 'Contact with System Admin'}</div>
                                            <div className="text-gray-500">{warehouse.email || ''}</div>
                                        </div>
                                    </td>
                                    <td className="max-w-xs truncate">{warehouse.address}</td>
                                    <td>
                                        <span className={`badge badge-${warehouse.is_active ? 'success' : 'error'}`}>
                                            {warehouse.is_active 
                                                ? t('warehouse.active', 'Active')
                                                : t('warehouse.inactive', 'Inactive')
                                            }
                                        </span>
                                    </td>
                                    <td>{warehouse.total_products}</td>
                                    <td className="font-medium">
                                        <div className="flex items-center gap-1">
                                            {formatCurrency(warehouse.total_stock_value)}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={route("warehouse.edit", warehouse.id)}
                                                className="btn btn-xs btn-warning btn-outline"
                                            >
                                                <Edit size={12} /> {t('warehouse.edit', 'Edit')}
                                            </Link>
                                            <Link
                                                href={route("warehouse.show", warehouse.id)}
                                                className="btn btn-xs btn-info btn-outline"
                                            >
                                                <Eye size={12} /> {t('warehouse.view_stock', 'Stock')}
                                            </Link>
                                                <button
                                                    onClick={() => handleDelete(warehouse.id)}
                                                    className="btn btn-xs btn-error btn-outline"
                                                >
                                                    <Trash2 size={12} /> {t('warehouse.delete', 'Delete')}
                                                </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="border border-gray-200 rounded-box px-5 py-16 flex flex-col justify-center items-center gap-3">
                        <Frown size={40} className="text-gray-400" />
                        <h1 className="text-gray-500 text-lg font-medium">
                            {isShadowUser 
                                ? t('warehouse.no_shadow_warehouses', 'No shadow warehouses found!')
                                : t('warehouse.no_warehouses', 'No warehouses found!')
                            }
                        </h1>
                        <p className="text-gray-400 text-sm">
                            {isShadowUser 
                                ? t('warehouse.get_started_shadow', 'Get started by creating your first shadow warehouse')
                                : t('warehouse.get_started', 'Get started by creating your first warehouse')
                            }
                        </p>
                            <Link
                                href={route("warehouse.create")}
                                className={`btn btn-sm ${isShadowUser ? 'btn-warning' : 'bg-[#1e4d2b] text-white'} mt-2`}
                            >
                                <Plus size={15} /> 
                                {t('warehouse.add_warehouse', 'Add New Warehouse')}
                            </Link>
                    </div>
                )}
            </div>

            <Pagination data={warehouses} />
        </div>
    );
}