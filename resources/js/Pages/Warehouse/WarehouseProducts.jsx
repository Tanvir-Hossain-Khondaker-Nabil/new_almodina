import PageHeader from "../../components/PageHeader";
import { router } from "@inertiajs/react";
import { ArrowLeft, Warehouse, Package, Search, Filter, Shield } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "../../hooks/useTranslation";

export default function WarehouseProducts({ warehouse, products = [], isShadowUser }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterOutOfStock, setFilterOutOfStock] = useState(false);
    const { t, locale } = useTranslation();

    const getNumber = (v) => Number(v) || 0;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", { style: "currency", currency: "BDT" }).format(amount || 0);
    };

    // ✅ Full display name from attribute_values
    const getVariantFullName = (variant) => {
        const attrs = variant?.attribute_values || {};
        const keys = Object.keys(attrs || {});
        if (!keys.length) return t("warehouse.default_variant", "Default Variant");

        // nicer order: Color/Size first if exists
        const priority = ["color", "Colour", "size", "Size", "model", "Model"];
        const ordered = [
            ...priority.filter((k) => keys.includes(k)),
            ...keys.filter((k) => !priority.includes(k)),
        ];

        return ordered
            .map((k) => `${k}: ${String(attrs[k] ?? "").trim()}`)
            .filter((x) => !x.endsWith(":"))
            .join(" | ");
    };

    const filteredProducts = (products || []).filter((p) => {
        const name = String(p?.name || "").toLowerCase();
        const code = String(p?.product_no || "").toLowerCase();
        const q = String(searchTerm || "").toLowerCase();

        const matchesSearch = name.includes(q) || code.includes(q);
        const hasStock = filterOutOfStock ? getNumber(p?.total_stock) > 0 : true;

        return matchesSearch && hasStock;
    });

    const totalProducts = filteredProducts.length;
    const totalItems = filteredProducts.reduce((sum, p) => sum + getNumber(p.total_stock), 0);
    const totalValue = filteredProducts.reduce((sum, p) => {
        return (
            sum +
            (p?.variants || []).reduce((variantSum, v) => {
                return variantSum + (v?.batches || []).reduce((batchSum, b) => batchSum + getNumber(b.stock_value), 0);
            }, 0)
        );
    }, 0);

    return (
        <div className={`bg-white rounded-box p-5 ${locale === "bn" ? "bangla-font" : ""}`}>
            <PageHeader
                title={`${t("warehouse.warehouse_stock", "Warehouse Stock")}: ${warehouse?.name}`}
                subtitle={`${t("warehouse.stock_overview", "Stock overview for")} ${warehouse?.name} (${warehouse?.code})`}
            >
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                    <button onClick={() => router.visit(route("warehouse.list"))} className="btn btn-sm btn-ghost">
                        <ArrowLeft size={15} /> {t("warehouse.back_to_list", "Back to List")}
                    </button>

                    {isShadowUser && (
                        <span className="badge badge-warning badge-lg">
                            <Shield size={12} className="mr-1" />
                            {t("warehouse.shadow_warehouse", "Shadow Warehouse")}
                        </span>
                    )}
                </div>
            </PageHeader>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className={`stat rounded-box ${isShadowUser ? "bg-warning/10" : "bg-base-200"}`}>
                    <div className="stat-figure text-primary">
                        <Package size={24} />
                    </div>
                    <div className="stat-title">{t("warehouse.total_products", "Total Products")}</div>
                    <div className="stat-value text-primary">{totalProducts}</div>
                    <div className="stat-desc">{t("warehouse.different_products", "Different products")}</div>
                </div>

                <div className={`stat rounded-box ${isShadowUser ? "bg-warning/10" : "bg-base-200"}`}>
                    <div className="stat-figure text-secondary">
                        <Warehouse size={24} />
                    </div>
                    <div className="stat-title">{t("warehouse.total_items", "Total Items")}</div>
                    <div className="stat-value text-secondary">{totalItems}</div>
                    <div className="stat-desc">{t("warehouse.units_in_stock", "Units in stock")}</div>
                </div>

                <div className={`stat rounded-box ${isShadowUser ? "bg-warning/10" : "bg-base-200"}`}>
                    <div className="stat-figure text-accent">
                        <span className="text-2xl">৳</span>
                    </div>
                    <div className="stat-title">{isShadowUser ? "Shadow Value" : "Stock Value"}</div>
                    <div className="stat-value text-accent">{formatCurrency(totalValue)}</div>
                    <div className="stat-desc">{isShadowUser ? "Shadow value" : "Current stock value"}</div>
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
                            placeholder={t("warehouse.search_products", "Search products by name or code...")}
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
                        <span className="label-text ml-2">{t("warehouse.hide_out_of_stock", "Hide out of stock")}</span>
                    </label>
                </div>
            </div>

            {/* Products */}
            <div className="overflow-x-auto">
                {filteredProducts.length > 0 ? (
                    <div className="space-y-4">
                        {filteredProducts.map((product) => {
                            const productTotalStock = getNumber(product.total_stock);
                            const productTotalValue = (product?.variants || []).reduce((sum, v) => {
                                return sum + (v?.batches || []).reduce((bSum, b) => bSum + getNumber(b.stock_value), 0);
                            }, 0);

                            return (
                                <div key={product.id} className="border border-gray-200 rounded-box">
                                    <div className="bg-gray-50 p-4 rounded-t-box border-b">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold text-lg">{product.name}</h3>
                                                <p className="text-sm text-gray-600">
                                                    Code: {product.product_no} | Category: {product.category?.name || "N/A"} | Total Stock:{" "}
                                                    <span className={`font-bold ${productTotalStock === 0 ? "text-error" : "text-success"}`}>
                                                        {productTotalStock}
                                                    </span>
                                                </p>
                                                {product.description && <p className="text-sm text-gray-500 mt-1">{product.description}</p>}
                                            </div>
                                            <div className="text-right">
                                                <div className={`badge ${isShadowUser ? "badge-warning" : "badge-primary"}`}>Product</div>
                                                <div className="text-xs text-gray-500 mt-1">{(product?.variants || []).length} variant(s)</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4">
                                        <table className="table table-auto w-full">
                                            <thead className={isShadowUser ? "bg-warning text-warning-content" : "bg-[#1e4d2b] text-white"}>
                                                <tr>
                                                    <th>Variant</th>
                                                    <th className="text-right">Total Stock</th>
                                                    <th className="text-right">Total Value</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {(product?.variants || []).map((variant) => {
                                                    const vTotal = (variant?.batches || []).reduce(
                                                        (sum, b) => sum + getNumber(b.stock_quantity),
                                                        0
                                                    );

                                                    const vValue = (variant?.batches || []).reduce((sum, b) => sum + getNumber(b.stock_value), 0);

                                                    const fullName = getVariantFullName(variant);
                                                    const skuText = String(variant?.sku || "").trim() || `VAR-${variant?.id}`;

                                                    return (
                                                        <>
                                                            {/* Variant row */}
                                                            <tr key={`v-${variant.id}`} className="bg-base-100">
                                                                <td>
                                                                    <div className="font-semibold">{fullName}</div>
                                                                </td>
                                                                <td className="text-right font-bold">{vTotal}</td>
                                                                <td className="text-right font-mono font-semibold">{formatCurrency(vValue)}</td>
                                                                <td>
                                                                    <span className={`badge badge-${vTotal === 0 ? "error" : vTotal < 10 ? "warning" : "success"}`}>
                                                                        {vTotal === 0 ? "Out of Stock" : vTotal < 10 ? "Low Stock" : "In Stock"}
                                                                    </span>
                                                                </td>
                                                            </tr>

                                                            {/* Batch rows */}
                                                            {(variant?.batches || []).map((b) => {
                                                                const qty = getNumber(b.stock_quantity);
                                                                return (
                                                                    <tr key={`b-${variant.id}-${b.stock_id}`} className="hover:bg-base-200/30">
                                                                        <td className="text-sm text-gray-600">
                                                                            <div className="flex flex-col">
                                                                                <span className="font-mono font-bold text-gray-800">
                                                                                    Batch: {b.batch_no || "N/A"}
                                                                                </span>
                                                                                <span className="text-xs text-gray-500">Barcode: {b.barcode || "-"}</span>
                                                                            </div>
                                                                        </td>

                                                                        <td className="text-right">
                                                                            <span className={`font-bold ${qty === 0 ? "text-error" : "text-success"}`}>{qty}</span>
                                                                        </td>

                                                                        <td className="text-right font-mono">{formatCurrency(getNumber(b.stock_value))}</td>

                                                                        <td className="text-sm text-gray-500">
                                                                            PP: {formatCurrency(getNumber(b.purchase_price))} | SP: {formatCurrency(getNumber(b.sale_price))}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </>
                                                    );
                                                })}
                                            </tbody>
                                        </table>

                                        <div className="mt-4 pt-4 border-t">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="font-semibold">Product Summary:</span>
                                                <div className="flex gap-4 flex-wrap justify-end">
                                                    <span>Variants: {(product?.variants || []).length}</span>
                                                    <span>Total Stock: {productTotalStock}</span>
                                                    <span className="font-semibold">Total Value: {formatCurrency(productTotalValue)}</span>
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
                            {searchTerm || filterOutOfStock ? "No products match your search criteria" : "No products in stock"}
                        </h3>
                        <p className="text-gray-400 mt-2">
                            {searchTerm || filterOutOfStock ? "Try adjusting your search or filter criteria" : "This warehouse currently has no products in stock"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
