import PageHeader from "../../components/PageHeader";
import { Link, router, usePage } from "@inertiajs/react";
import { ArrowLeft, Warehouse, Package, Search, Filter, Shield } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "../../hooks/useTranslation";

export default function WarehouseProducts({ warehouse, products, isShadowUser }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterOutOfStock, setFilterOutOfStock] = useState(false);
    const { t, locale } = useTranslation();

    // Helper function to safely format numbers
    const formatNumber = (value) => {
        const num = Number(value) || 0;
        return num.toFixed(2);
    };

    // Helper function to safely get number value
    const getNumber = (value) => {
        return Number(value) || 0;
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'BDT'
        }).format(amount || 0);
    };

    // Format variant display name from attribute_values
    const formatVariantDisplay = (variant) => {
        if (!variant.attribute_values || Object.keys(variant.attribute_values).length === 0) {
            return t('warehouse.default_variant', 'Default Variant');
        }

        const parts = [];
        for (const [attributeCode, value] of Object.entries(variant.attribute_values)) {
            parts.push(`${attributeCode}: ${value}`);
        }

        return parts.join(' | ');
    };

    // Filter products based on search and stock filter
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.product_no.toLowerCase().includes(searchTerm.toLowerCase());
        
        const hasStock = filterOutOfStock ? getNumber(product.total_stock) > 0 : true;
        
        return matchesSearch && hasStock;
    });

    // Calculate warehouse statistics
    const totalProducts = filteredProducts.length;
    const totalItems = filteredProducts.reduce((sum, product) => sum + getNumber(product.total_stock), 0);
    const totalValue = filteredProducts.reduce((sum, product) => {
        return sum + product.variants.reduce((variantSum, variant) => {
            return variantSum + getNumber(variant.stock_value);
        }, 0);
    }, 0);

    return (
        <div className={`bg-white rounded-box p-5 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <PageHeader
                title={`${t('warehouse.warehouse_stock', 'Warehouse Stock')}: ${warehouse.name}`}
                subtitle={`${t('warehouse.stock_overview', 'Stock overview for')} ${warehouse.name} (${warehouse.code})`}
            >
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                    <button
                        onClick={() => router.visit(route("warehouse.list"))}
                        className="btn btn-sm btn-ghost"
                    >
                        <ArrowLeft size={15} /> {t('warehouse.back_to_list', 'Back to List')}
                    </button>
                    {isShadowUser && (
                        <span className="badge badge-warning badge-lg">
                            <Shield size={12} className="mr-1" />
                            {t('warehouse.shadow_warehouse', 'Shadow Warehouse')}
                        </span>
                    )}
                </div>
            </PageHeader>

            {/* Warehouse Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className={`stat rounded-box ${isShadowUser ? 'bg-warning/10' : 'bg-base-200'}`}>
                    <div className="stat-figure text-primary">
                        <Package size={24} />
                    </div>
                    <div className="stat-title">{t('warehouse.total_products', 'Total Products')}</div>
                    <div className="stat-value text-primary">{totalProducts}</div>
                    <div className="stat-desc">{t('warehouse.different_products', 'Different products')}</div>
                </div>

                <div className={`stat rounded-box ${isShadowUser ? 'bg-warning/10' : 'bg-base-200'}`}>
                    <div className="stat-figure text-secondary">
                        <Warehouse size={24} />
                    </div>
                    <div className="stat-title">{t('warehouse.total_items', 'Total Items')}</div>
                    <div className="stat-value text-secondary">{totalItems}</div>
                    <div className="stat-desc">{t('warehouse.units_in_stock', 'Units in stock')}</div>
                </div>

                <div className={`stat rounded-box ${isShadowUser ? 'bg-warning/10' : 'bg-base-200'}`}>
                    <div className="stat-figure text-accent">
                        <span className="text-2xl">৳</span>
                    </div>
                    <div className="stat-title">
                        {isShadowUser 
                            ? t('warehouse.shadow_value', 'Shadow Value')
                            : t('warehouse.stock_value', 'Stock Value')
                        }
                    </div>
                    <div className="stat-value text-accent">
                        {formatCurrency(totalValue)}
                    </div>
                    <div className="stat-desc">
                        {isShadowUser 
                            ? t('warehouse.shadow_value', 'Shadow value')
                            : t('warehouse.current_stock_value', 'Current stock value')
                        }
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-base-200 rounded-box">
                <div className="flex-1">
                    <label className="input input-bordered flex items-center gap-2">
                        <Search size={16} />
                        <input
                            type="text"
                            className="grow"
                            placeholder={t('warehouse.search_products', 'Search products by name or code...')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </label>
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={16} />
                    <label className="cursor-pointer label">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-primary"
                            checked={filterOutOfStock}
                            onChange={(e) => setFilterOutOfStock(e.target.checked)}
                        />
                        <span className="label-text ml-2">
                            {t('warehouse.hide_out_of_stock', 'Hide out of stock')}
                        </span>
                    </label>
                </div>
            </div>

            {/* Products Table */}
            <div className="overflow-x-auto">
                {filteredProducts.length > 0 ? (
                    <div className="space-y-4">
                        {filteredProducts.map((product) => {
                            const productTotalStock = getNumber(product.total_stock);
                            const productTotalValue = product.variants.reduce((sum, variant) => sum + getNumber(variant.stock_value), 0);
                            
                            return (
                                <div key={product.id} className="border border-gray-200 rounded-box">
                                    {/* Product Header */}
                                    <div className="bg-gray-50 p-4 rounded-t-box border-b">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold text-lg">{product.name}</h3>
                                                <p className="text-sm text-gray-600">
                                                    {t('warehouse.code', 'Code')}: {product.product_no} | 
                                                    {t('product.category', 'Category')}: {product.category?.name || 'N/A'} |
                                                    {t('warehouse.total_items', 'Total Stock')}: <span className={`font-bold ${productTotalStock === 0 ? 'text-error' : 'text-success'}`}>
                                                        {productTotalStock}
                                                    </span>
                                                </p>
                                                {product.description && (
                                                    <p className="text-sm text-gray-500 mt-1">{product.description}</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <div className={`badge ${isShadowUser ? 'badge-warning' : 'badge-primary'}`}>
                                                    {t('warehouse.product', 'Product')}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {product.variants.length} {t('warehouse.variants', 'variant(s)')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Variants Table */}
                                    <div className="p-4">
                                        <table className="table table-auto w-full">
                                            <thead className={isShadowUser ? "bg-warning text-warning-content" : "bg-[#1e4d2b] text-white text-primary-content"}>
                                                <tr>
                                                    <th className="bg-opacity-20">{t('warehouse.variant', 'Variant')}</th>
                                                    <th className="bg-opacity-20">{t('warehouse.sku', 'SKU')}</th>
                                                    <th className="bg-opacity-20 text-right">{t('warehouse.stock', 'Stock')}</th>
                                                    <th className="bg-opacity-20 text-right">
                                                        {t('warehouse.purchase_price', 'Purchase Price')}
                                                    </th>
                                                    <th className="bg-opacity-20 text-right">
                                                        {t('warehouse.sale_price', 'Sale Price')}
                                                    </th>
                                                    <th className="bg-opacity-20 text-right">
                                                        {t('warehouse.stock_value', 'Stock Value')}
                                                    </th>
                                                    <th className="bg-opacity-20">{t('warehouse.status', 'Status')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {product.variants.map((variant) => {
                                                    const stockQuantity = getNumber(variant.stock_quantity);
                                                    const purchasePrice = getNumber(variant.purchase_price);
                                                    const salePrice = getNumber(variant.sale_price);
                                                    const stockValue = getNumber(variant.stock_value);
                                                    
                                                    return (
                                                        <tr key={variant.id} className="hover:bg-base-100">
                                                            <td>
                                                                <div className="font-medium">
                                                                    {formatVariantDisplay(variant)}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <code className="text-xs bg-base-200 px-1 rounded">
                                                                    {variant.sku || 'N/A'}
                                                                </code>
                                                            </td>
                                                            <td className="text-right">
                                                                <span className={`font-bold ${stockQuantity === 0 ? 'text-error' : 'text-success'}`}>
                                                                    {stockQuantity}
                                                                </span>
                                                            </td>
                                                            <td className="text-right font-mono">
                                                                {formatCurrency(purchasePrice)}
                                                            </td>
                                                            <td className="text-right font-mono">
                                                                {formatCurrency(salePrice)}
                                                            </td>
                                                            <td className="text-right font-mono font-semibold">
                                                                {formatCurrency(stockValue)}
                                                            </td>
                                                            <td>
                                                                <span className={`badge badge-${stockQuantity === 0 ? 'error' : stockQuantity < 10 ? 'warning' : 'success'}`}>
                                                                    {stockQuantity === 0 
                                                                        ? t('warehouse.out_of_stock', 'Out of Stock')
                                                                        : stockQuantity < 10 
                                                                            ? t('warehouse.low_stock', 'Low Stock')
                                                                            : t('warehouse.in_stock', 'In Stock')
                                                                    }
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>

                                        {/* Product Summary */}
                                        <div className="mt-4 pt-4 border-t">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="font-semibold">
                                                    {t('warehouse.product_summary', 'Product Summary')}:
                                                </span>
                                                <div className="flex gap-4">
                                                    <span>
                                                        {t('warehouse.variants', 'Variants')}: {product.variants.length}
                                                    </span>
                                                    <span>
                                                        {t('warehouse.total_items', 'Total Stock')}: {productTotalStock}
                                                    </span>
                                                    <span className="font-semibold">
                                                        {t('warehouse.total_items', 'Total Value')}: {formatCurrency(productTotalValue)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-box">
                        <Package size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-500">
                            {searchTerm || filterOutOfStock 
                                ? t('warehouse.no_products_match', 'No products match your search criteria') 
                                : t('warehouse.no_products_in_stock', 'No products in stock')
                            }
                        </h3>
                        <p className="text-gray-400 mt-2">
                            {searchTerm || filterOutOfStock 
                                ? t('warehouse.adjust_search', 'Try adjusting your search or filter criteria') 
                                : t('warehouse.no_stock_available', 'This warehouse currently has no products in stock')
                            }
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}