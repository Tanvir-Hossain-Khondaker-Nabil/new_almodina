import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import { Link, router, useForm, usePage } from "@inertiajs/react";
import { Eye, Frown, Pen, Plus, Trash2, Package, DollarSign, ChevronDown, ChevronRight, Tag, Info, Barcode, Printer, Copy } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "../../hooks/useTranslation";

export default function Product({ product, filters }) {
    const { auth } = usePage().props;
    const { t, locale } = useTranslation();
    const [expandedProducts, setExpandedProducts] = useState({});
    const [selectedBarcode, setSelectedBarcode] = useState(null);
    const [showBarcodeModal, setShowBarcodeModal] = useState(false);

    // handle search
    const searchForm = useForm({
        search: filters.search || "",
    });
    
    const handleSearch = (e) => {
        const value = e.target.value;
        searchForm.setData("search", value);

        const queryString = value ? { search: value } : {};
        router.get(route("product.list"), queryString, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    // Toggle variant expansion
    const toggleExpand = (productId) => {
        setExpandedProducts(prev => ({
            ...prev,
            [productId]: !prev[productId]
        }));
    };

    // Format variant display for attribute-based variants
    const formatVariantDisplay = (variant) => {
        if (!variant.attribute_values || Object.keys(variant.attribute_values).length === 0) {
            return t('product.default_variant', 'Default Variant');
        }

        const parts = [];
        for (const [attributeCode, value] of Object.entries(variant.attribute_values)) {
            parts.push(`${attributeCode}: ${value}`);
        }

        return parts.join(' | ');
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'BDT'
        }).format(amount || 0);
    };

    // Calculate total stock for a product
    const calculateTotalStock = (productItem) => {
        if (!productItem.variants || productItem.variants.length === 0) {
            return 0;
        }

        return productItem.variants.reduce((total, variant) => {
            return total + (variant.stock?.quantity || 0);
        }, 0);
    };

    // Get average price
    const getAveragePrice = (productItem) => {
        if (!productItem.variants || productItem.variants.length === 0) {
            return 0;
        }

        const variantsWithPrice = productItem.variants.filter(variant => {
            return (variant.stock?.sale_price || 0) > 0;
        });
        
        if (variantsWithPrice.length === 0) return 0;
        
        const totalPrice = variantsWithPrice.reduce((sum, variant) => {
            return sum + (variant.stock?.sale_price || 0);
        }, 0);
        
        return totalPrice / variantsWithPrice.length;
    };

    // Get unique attributes count for a product
    const getUniqueAttributesCount = (productItem) => {
        if (!productItem.variants || productItem.variants.length === 0) {
            return 0;
        }
        
        const allAttributes = new Set();
        
        productItem.variants.forEach((variant) => {
            if (variant.attribute_values && Object.keys(variant.attribute_values).length > 0) {
                Object.keys(variant.attribute_values).forEach((attributeCode) => {
                    allAttributes.add(attributeCode);
                });
            }
        });
        
        return allAttributes.size;
    };

    // Get barcodes for a variant
    const getVariantBarcodes = (variant) => {
        if (!variant.stock) return [];
        
        // Check if stock has barcode directly
        if (variant.stock.barcode) {
            return [{
                barcode: variant.stock.barcode,
                batch_no: variant.stock.batch_no,
                quantity: variant.stock.quantity,
                purchase_price: variant.stock.purchase_price,
                sale_price: variant.stock.sale_price,
                warehouse_id: variant.stock.warehouse_id
            }];
        }
        
        return [];
    };

    // Copy barcode to clipboard
    const copyBarcode = (barcode) => {
        navigator.clipboard.writeText(barcode).then(() => {
            alert("Barcode copied to clipboard!");
        });
    };

    // Print barcode
    const printBarcode = (barcode, productName, variantName) => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Print Barcode - ${productName}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
                    .barcode-container { margin: 20px 0; }
                    .barcode-text { font-family: monospace; font-size: 14px; margin-top: 10px; }
                    .product-info { margin-bottom: 20px; }
                    .product-name { font-weight: bold; font-size: 16px; }
                    .variant-name { font-size: 14px; color: #666; }
                    @media print {
                        body { padding: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="product-info">
                    <div class="product-name">${productName}</div>
                    <div class="variant-name">${variantName}</div>
                </div>
                <div class="barcode-container">
                    <img src="${generateBarcodeImage(barcode)}" alt="Barcode ${barcode}" style="max-width: 100%; height: auto;" />
                    <div class="barcode-text">${barcode}</div>
                </div>
                <div class="no-print" style="margin-top: 30px;">
                    <button onclick="window.print()">Print Barcode</button>
                    <button onclick="window.close()">Close</button>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    // Generate barcode image URL
    const generateBarcodeImage = (barcode) => {
        // This should call your backend barcode generation endpoint
        // For now, using a placeholder or dummy barcode generator
        return `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(barcode)}&code=Code128&dpi=96`;
    };

    // View barcode details
    const viewBarcodeDetails = (barcode, productName, variantName, stockDetails) => {
        setSelectedBarcode({
            barcode,
            productName,
            variantName,
            ...stockDetails
        });
        setShowBarcodeModal(true);
    };

    return (
        <div className={`bg-white rounded-box p-5 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            {/* Barcode Modal */}
            {showBarcodeModal && selectedBarcode && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Barcode className="text-blue-600" size={20} />
                                    Barcode Details
                                </h3>
                                <button
                                    onClick={() => setShowBarcodeModal(false)}
                                    className="btn btn-ghost btn-circle btn-sm"
                                >
                                    &times;
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="text-center">
                                    <div className="mb-4">
                                        <div className="text-sm text-gray-600 mb-1">Product</div>
                                        <div className="font-bold text-lg">{selectedBarcode.productName}</div>
                                        <div className="text-sm text-gray-500">{selectedBarcode.variantName}</div>
                                    </div>

                                    

                                    <div className="barcode-container bg-white p-4 rounded-lg border border-gray-200">
                                        <img 
                                            src={generateBarcodeImage(selectedBarcode.barcode)} 
                                            alt={`Barcode ${selectedBarcode.barcode}`}
                                            className="mx-auto max-w-full h-32"
                                        />
                                        <div className="font-mono text-sm mt-2">{selectedBarcode.barcode}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                                        <div className="text-xs text-gray-600">Batch No</div>
                                        <div className="font-mono text-sm font-bold">{selectedBarcode.batch_no || 'N/A'}</div>
                                    </div>
                                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                                        <div className="text-xs text-gray-600">Quantity</div>
                                        <div className="text-sm font-bold">{selectedBarcode.quantity || 0}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                                        <div className="text-xs text-gray-600">Purchase Price</div>
                                        <div className="text-sm font-bold">{formatCurrency(selectedBarcode.purchase_price)}</div>
                                    </div>
                                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                                        <div className="text-xs text-gray-600">Sale Price</div>
                                        <div className="text-sm font-bold">{formatCurrency(selectedBarcode.sale_price)}</div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-gray-200 mt-6">
                                    <button
                                        onClick={() => copyBarcode(selectedBarcode.barcode)}
                                        className="btn btn-outline flex-1"
                                    >
                                        <Copy size={16} className="mr-2" />
                                        Copy Barcode
                                    </button>
                                    <button
                                        onClick={() => printBarcode(selectedBarcode.barcode, selectedBarcode.productName, selectedBarcode.variantName)}
                                        className="btn bg-blue-600 text-white flex-1"
                                    >
                                        <Printer size={16} className="mr-2" />
                                        Print Barcode
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <PageHeader
                title={t('product.product_list', 'Product List')}
                subtitle={t('product.subtitle', 'Manage your all products from here.')}
            >
                <div className="flex items-center gap-3">
                    <input
                        type="search"
                        onChange={handleSearch}
                        value={searchForm.data.search}
                        placeholder={t('product.search_placeholder', 'Search products...')}
                        className="input input-sm"
                    />
                    <button
                        onClick={() => router.visit(route("product.add"))}
                        className="btn bg-[#1e4d2b] text-white btn-sm"
                    >
                        <Plus size={15} /> {t('product.add_new', 'Add New')}
                    </button>
                </div>
            </PageHeader>

            <div className="overflow-x-auto">
                {product.data.length > 0 ? (
                    <table className="table table-auto w-full">
                        <thead className="bg-[#1e4d2b] text-white">
                            <tr>
                                <th></th>
                                <th>{t('product.product_code', 'Product Code')}</th>
                                <th>{t('product.product_name', 'Product Name')}</th>
                                <th>{t('product.category', 'Category')}</th>
                                <th>{t('product.attributes', 'Attributes')}</th>
                                <th>{t('product.total_stock', 'Total Stock')}</th>
                                <th>{t('product.variants', 'Variants')}</th>
                                <th>{t('product.barcodes', 'Barcodes')}</th>
                                <th>{t('product.actions', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {product.data.map((productItem, index) => {
                                const totalStock = calculateTotalStock(productItem);
                                const avgPrice = getAveragePrice(productItem);
                                const attributesCount = getUniqueAttributesCount(productItem);
                                const isExpanded = expandedProducts[productItem.id];
                                const variantsCount = productItem.variants?.length || 0;
                                
                                // Calculate total barcodes for this product
                                const totalBarcodes = productItem.variants?.reduce((total, variant) => {
                                    return total + getVariantBarcodes(variant).length;
                                }, 0) || 0;
                                
                                return (
                                    <>
                                        <tr key={productItem.id} className="hover:bg-gray-50">
                                            <th>
                                                {variantsCount > 1 && (
                                                    <button
                                                        onClick={() => toggleExpand(productItem.id)}
                                                        className="btn btn-ghost btn-xs"
                                                        title={isExpanded ? "Hide variants" : "Show variants"}
                                                    >
                                                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                    </button>
                                                )}
                                            </th>
                                            <td className="font-mono">{productItem.product_no}</td>
                                            <td>
                                                <div>
                                                    <div className="font-medium">{productItem.name}</div>
                                                    {productItem.description && (
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {productItem.description.length > 50 
                                                                ? `${productItem.description.substring(0, 50)}...`
                                                                : productItem.description
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge badge-outline">
                                                    {productItem.category?.name || t('product.not_available', 'N/A')}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <Tag size={14} className="text-purple-600" />
                                                    <span className="text-sm">
                                                        {attributesCount} {attributesCount === 1 
                                                            ? t('product.attribute', 'attribute') 
                                                            : t('product.attributes_plural', 'attributes')
                                                        }
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <Package size={16} className="text-blue-600" />
                                                    <div>
                                                        <div className={`font-bold text-lg ${totalStock === 0 ? 'text-error' : totalStock < 10 ? 'text-warning' : 'text-success'}`}>
                                                            {totalStock}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {t('product.units', 'units')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            
                                            <td className="max-w-[300px]">
                                                <div className="flex flex-col gap-2">
                                                    {!isExpanded && variantsCount > 1 && (
                                                        <button
                                                            onClick={() => toggleExpand(productItem.id)}
                                                            className="btn btn-ghost btn-xs w-full text-primary"
                                                        >
                                                            <ChevronDown size={12} className="mr-1" />
                                                            Show {variantsCount} variants
                                                        </button>
                                                    )}
                                                    
                                                    {(isExpanded || variantsCount <= 1) && productItem.variants?.map((variant, i) => {
                                                        const hasAttributes = variant.attribute_values && Object.keys(variant.attribute_values).length > 0;
                                                        const variantStock = variant.stock?.quantity || 0;
                                                        const variantPrice = variant.stock?.sale_price || 0;
                                                        const barcodes = getVariantBarcodes(variant);
                                                        
                                                        
                                                        return (
                                                            <div
                                                                key={variant.id}
                                                                className={`border p-2 rounded text-xs ${
                                                                    hasAttributes 
                                                                        ? 'border-primary bg-[#1e4d2b] text-white' 
                                                                        : 'border-dashed border-neutral'
                                                                }`}
                                                            >
                                                                <div className="flex justify-between items-start">
                                                                    <div className="flex-1">
                                                                        <div className="font-medium">
                                                                            {formatVariantDisplay(variant)}
                                                                        </div>
                                                                        
                                                                        <div className="flex gap-4 mt-1 text-xs">
                                                                            <span>
                                                                                {t('product.stock', 'Stock')}: {variantStock}
                                                                            </span>
                                                                            {variantPrice > 0 && (
                                                                                <span>
                                                                                    {t('product.price', 'Price')}: {formatCurrency(variantPrice)}
                                                                                </span>
                                                                            )}
                                                                            {barcodes.length > 0 && (
                                                                                <span className="flex items-center gap-1">
                                                                                    <Barcode size={10} />
                                                                                    {barcodes.length} barcode(s)
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    
                                                    {isExpanded && variantsCount > 1 && (
                                                        <button
                                                            onClick={() => toggleExpand(productItem.id)}
                                                            className="btn btn-ghost btn-xs w-full text-primary mt-2"
                                                        >
                                                            <ChevronRight size={12} className="mr-1" />
                                                            Hide variants
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <Barcode size={14} className="text-blue-600" />
                                                        <span className="text-sm font-bold">
                                                            {totalBarcodes} {totalBarcodes === 1 ? 'barcode' : 'barcodes'}
                                                        </span>
                                                    </div>
                                                    
                                                    {totalBarcodes > 0 && (
                                                        <div className="space-y-1">
                                                            {productItem.stocks?.map((variant, vIndex) => 
                                                               <div key={`${variant.id}-${vIndex}`} className="flex items-center justify-between bg-gray-50 p-1 rounded text-xs">
                                                                        <span className="font-mono truncate max-w-[80px]">
                                                                            {variant.barcode}
                                                                        </span>
                                                                        <div className="flex gap-1">
                                                                            <button
                                                                                onClick={() => viewBarcodeDetails(
                                                                                    variant.barcode,
                                                                                    productItem.name,
                                                                                    formatVariantDisplay(variant),
                                                                                    variant
                                                                                )}
                                                                                className="btn btn-xs btn-ghost"
                                                                                title="View Barcode"
                                                                            >
                                                                                <Eye size={10} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => copyBarcode(variant.barcode)}
                                                                                className="btn btn-xs btn-ghost"
                                                                                title="Copy Barcode"
                                                                            >
                                                                                <Copy size={10} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    
                                                    {totalBarcodes === 0 && (
                                                        <span className="text-xs text-gray-500 italic">
                                                            No barcodes assigned
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={route(
                                                            "product.add",
                                                            { id: productItem.id }
                                                        )}
                                                        className="btn btn-xs btn-warning"
                                                        title={t('product.edit', 'Edit Product')}
                                                    >
                                                        <Pen size={10} /> {t('product.edit', 'Edit')}
                                                    </Link>
                                                    
                                                    <Link
                                                        href={route(
                                                            "product.del",
                                                            {
                                                                id: productItem.id,
                                                            }
                                                        )}
                                                        onClick={(e) => {
                                                            if (
                                                                !confirm(
                                                                    t('product.delete_confirmation', 'Are you sure you want to delete this product? This action cannot be undone.')
                                                                )
                                                            ) {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                        className="btn btn-xs btn-error"
                                                        title={t('product.delete', 'Delete Product')}
                                                    >
                                                        <Trash2 size={10} /> {t('product.delete', 'Delete')}
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                        
                                        {/* Expanded variants row for better mobile view */}
                                        {isExpanded && (
                                            <tr>
                                                <td colSpan="9" className="bg-gray-50 p-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {productItem.variants?.map((variant, i) => {
                                                            const barcodes = getVariantBarcodes(variant);
                                                            const variantStock = variant.stock?.quantity || 0;
                                                            const variantPrice = variant.stock?.sale_price || 0;
                                                            
                                                            return (
                                                                <div key={variant.id} className="border rounded-lg p-3 bg-white">
                                                                    <div className="font-medium mb-2">
                                                                        {formatVariantDisplay(variant)}
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                                                        <div className="text-sm">
                                                                            <div className="text-gray-600">Stock</div>
                                                                            <div className="font-bold">{variantStock}</div>
                                                                        </div>
                                                                        <div className="text-sm">
                                                                            <div className="text-gray-600">Price</div>
                                                                            <div className="font-bold">{formatCurrency(variantPrice)}</div>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {barcodes.length > 0 ? (
                                                                        <div>
                                                                            <div className="text-sm font-medium mb-2 flex items-center gap-2">
                                                                                <Barcode size={12} />
                                                                                Barcodes ({barcodes.length})
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                {barcodes.map((barcodeData, index) => (
                                                                                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded text-xs">
                                                                                        <div>
                                                                                            <div className="font-mono">{barcodeData.barcode}</div>
                                                                                            <div className="text-gray-500">Batch: {barcodeData.batch_no}</div>
                                                                                        </div>
                                                                                        <div className="flex gap-1">
                                                                                            <button
                                                                                                onClick={() => viewBarcodeDetails(
                                                                                                    barcodeData.barcode,
                                                                                                    productItem.name,
                                                                                                    formatVariantDisplay(variant),
                                                                                                    barcodeData
                                                                                                )}
                                                                                                className="btn btn-xs btn-ghost"
                                                                                            >
                                                                                                <Eye size={10} />
                                                                                            </button>
                                                                                            <button
                                                                                                onClick={() => copyBarcode(barcodeData.barcode)}
                                                                                                className="btn btn-xs btn-ghost"
                                                                                            >
                                                                                                <Copy size={10} />
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="text-sm text-gray-500 italic">
                                                                            No barcodes for this variant
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div className="border border-gray-200 rounded-box px-5 py-10 flex flex-col justify-center items-center gap-2">
                        <Frown size={20} className="text-gray-500" />
                        <h1 className="text-gray-500 text-sm">
                            {t('product.no_products_found', 'No products found!')}
                        </h1>
                        <button
                            onClick={() => router.visit(route("product.add"))}
                            className="btn bg-[#1e4d2b] text-white btn-sm"
                        >
                            <Plus size={15} /> {t('product.add_new_product', 'Add new product')}
                        </button>
                    </div>
                )}
            </div>

            {/* pagination */}
            <Pagination data={product} />
        </div>
    );
}