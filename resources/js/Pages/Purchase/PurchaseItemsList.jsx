import { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader";
import { Link, router, useForm, usePage } from "@inertiajs/react";
import { Eye, Search, Filter, Frown, ChevronDown, ChevronUp, Package, Building, Calendar } from "lucide-react";
import { toast } from "react-toastify";

export default function PurchaseItemsList({ purchaseItems, filters, isShadowUser }) {
    const { flash } = usePage().props;
    const [expandedRow, setExpandedRow] = useState(null);
    
    // Handle search and filtering
    const searchForm = useForm({
        product_id: filters.product_id || "",
        date_from: filters.date_from || "",
        date_to: filters.date_to || "",
    });

    const handleFilterChange = (field, value) => {
        searchForm.setData(field, value);
    };

    const handleSearch = () => {
        searchForm.get(route("purchaseItems.list"), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        searchForm.reset();
        router.get(route("purchaseItems.list"));
    };

    // Toggle row expansion
    const toggleRow = (index) => {
        setExpandedRow(expandedRow === index ? null : index);
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Format date for input
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toISOString().split('T')[0];
    };

    // Calculate item total
    const calculateItemTotal = (item) => {
        const price = parseFloat(item.unit_price) || 0;
        const quantity = parseFloat(item.quantity) || 0;
        const discount = parseFloat(item.discount) || 0;
        
        const subtotal = price * quantity;
        const discountAmount = (subtotal * discount) / 100;
        return (subtotal - discountAmount).toFixed(2);
    };

    // Get variant text
    const getVariantText = (variant) => {
        if (!variant) return 'N/A';
        
        let attrsText = '';
        if (variant.attribute_values) {
            if (typeof variant.attribute_values === 'object') {
                attrsText = Object.entries(variant.attribute_values)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(', ');
            } else {
                attrsText = variant.attribute_values;
            }
        }
        
        return attrsText || 'N/A';
    };

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    // Calculate summary statistics
    const calculateSummaryStats = () => {
        const stats = purchaseItems.data.reduce((acc, item) => {
            acc.totalItems += 1;
            acc.totalQuantity += parseFloat(item.quantity) || 0;
            acc.totalAmount += parseFloat(calculateItemTotal(item)) || 0;
            return acc;
        }, {
            totalItems: 0,
            totalQuantity: 0,
            totalAmount: 0
        });

        stats.averagePerItem = stats.totalAmount / (stats.totalItems || 1);

        return stats;
    };

    const stats = calculateSummaryStats();

    return (
        <div className="bg-white rounded-box p-5">
            <PageHeader 
                title="All Purchase Items" 
                description="Comprehensive list of all purchased items with detailed information"
            />

            {/* Filters Section */}
            <div className="bg-base-100 rounded-box border border-base-content/5 p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-neutral">Filters</h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={clearFilters}
                            className="btn btn-ghost btn-sm"
                        >
                            Clear
                        </button>
                        <button
                            onClick={handleSearch}
                            className="btn bg-[#1e4d2b] text-white btn-sm"
                        >
                            <Search size={14} />
                            Search
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Product Filter */}
                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">Product ID</legend>
                        <input
                            type="text"
                            className="input input-sm"
                            placeholder="Enter product ID..."
                            value={searchForm.data.product_id}
                            onChange={(e) => handleFilterChange("product_id", e.target.value)}
                        />
                    </fieldset>

                    {/* Date From Filter */}
                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">Date From</legend>
                        <input
                            type="date"
                            className="input input-sm"
                            value={searchForm.data.date_from}
                            onChange={(e) => handleFilterChange("date_from", e.target.value)}
                        />
                    </fieldset>

                    {/* Date To Filter */}
                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">Date To</legend>
                        <input
                            type="date"
                            className="input input-sm"
                            value={searchForm.data.date_to}
                            onChange={(e) => handleFilterChange("date_to", e.target.value)}
                        />
                    </fieldset>
                </div>
            </div>

            {/* Purchase Items Table */}
            <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-100">
                {purchaseItems.data.length > 0 ? (
                    <table className="table">
                        <thead className={`${isShadowUser ? 'bg-warning' : 'bg-[#1e4d2b] text-white'} text-white`}>
                            <tr>
                                <th className="w-8"></th>
                                <th>Product</th>
                                <th>Purchase</th>
                                <th>Price</th>
                                <th>Qty</th>
                                <th>Discount</th>
                                <th>Total</th>
                                <th>Warehouse</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchaseItems.data.map((item, index) => (
                                <>
                                    <tr key={item.id} className="hover:bg-base-200">
                                        <td>
                                            <button
                                                onClick={() => toggleRow(index)}
                                                className="btn btn-ghost btn-xs"
                                            >
                                                {expandedRow === index ? (
                                                    <ChevronUp size={14} />
                                                ) : (
                                                    <ChevronDown size={14} />
                                                )}
                                            </button>
                                        </td>
                                        <td>
                                            <div className="max-w-[200px]">
                                                <div className="font-medium text-sm">
                                                    {item.product?.name || item?.product_name} 
                                                    {item.product?.product_no && ` (${item.product.product_no})`}
                                                </div>
                                                {item.variant && (
                                                    <div className="text-xs text-gray-500">
                                                        Variant: {getVariantText(item.variant)}
                                                        {item.variant?.sku && ` (${item.variant.sku})`}
                                                    </div>
                                                )}
                                                    {item?.variant_name} 

                                            </div>
                                        </td>
                                        <td>
                                            <div className="max-w-[150px]">
                                                <div className="text-sm">
                                                    Purchase #{item.purchase_id}
                                                </div>
                                                {item.purchase?.reference_no && (
                                                    <div className="text-xs text-gray-500">
                                                        Ref: {item.purchase.reference_no}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-sm font-medium text-success">
                                                {parseFloat(item.unit_price).toFixed(2)} Tk
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-sm">
                                                {item.quantity}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-sm">
                                                {item.discount || 0}%
                                            </div>
                                        </td>
                                        <td>
                                            <div className="font-semibold text-primary">
                                                {calculateItemTotal(item)} Tk
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-sm">
                                                {item?.warehouse?.name || 'N/A'}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-xs text-gray-500">
                                                {formatDate(item.created_at)}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1">
                                          
                                                <Link
                                                    href={route('purchaseItems.show', { id: item.id })}
                                                    className="btn btn-ghost btn-xs"
                                                    title="View Purchase Item"
                                                >
                                                    <Package size={12} />
                                                </Link>
                                                {/* {item.product && (
                                                    <Link
                                                        href={route('products.show', { id: item.product_id })}
                                                        className="btn btn-ghost btn-xs"
                                                        title="View Product"
                                                    >
                                                        <Package size={12} />
                                                    </Link>
                                                )} */}
                                            </div>
                                        </td>
                                    </tr>
                                    
                                    {/* Expanded Row Details */}
                                    {expandedRow === index && (
                                        <tr className="bg-base-200">
                                            <td colSpan="10">
                                                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                                    <div>
                                                        <strong style={{ fontSize: '16px' }}>Product Details</strong>
                                                        <div className="mt-2 space-y-1">
                                                            <div><strong>Name:</strong> {item.product?.name || item.product_name}</div>
                                                            <div><strong>Code:</strong> {item.product?.product_no || item.product_name}</div>
                                                            {item.product?.category && (
                                                                <div><strong>Category:</strong> {item.product.category.name || 'N/A'}</div>
                                                            )}
                                                            {item.product?.brand && (
                                                                <div><strong>Brand:</strong> {item.product.brand.name || 'N/A'}</div>
                                                            )}
                                                            {item.variant && (
                                                                <div>
                                                                    <strong>Variant:</strong> {getVariantText(item.variant)}
                                                                    {item.variant?.sku && ` (SKU: ${item.variant.sku})`}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <strong style={{ fontSize: '16px' }}>Purchase Details</strong>
                                                        <div className="mt-2 space-y-1">
                                                            <div><strong>Purchase ID:</strong> {item.purchase_id || 0}</div>
                                                            <div><strong>Status:</strong> {item.purchase?.status || 'Completed'}</div>
                                                            <div><strong>Supplier:</strong> {item.purchase?.supplier?.name || item?.supplier?.name || 'N/A'}</div>
                                                            <div><strong>Payment Status:</strong> {item.purchase?.payment_status || 'Paid'}</div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <strong style={{ fontSize: '16px' }}>Pricing Details</strong>
                                                        <div className="mt-2 space-y-1">
                                                            <div><strong>Unit Price:</strong> {parseFloat(item.unit_price).toFixed(2)} Tk</div>
                                                            <div><strong>Quantity:</strong> {item.quantity}</div>
                                                            <div><strong>Discount:</strong> {item.discount || 0}%</div>
                                                            <div><strong>Tax Rate:</strong> {item.tax_rate || 0}%</div>
                                                            <div className="border-t pt-1 mt-1">
                                                                <strong>Subtotal:</strong> {(item.unit_price * item.quantity).toFixed(2)} Tk
                                                            </div>
                                                            <div className="font-semibold text-primary">
                                                                <strong>Total:</strong> {calculateItemTotal(item)} Tk
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="md:col-span-3 lg:col-span-3">
                                                        <strong style={{ fontSize: '16px' }}>Additional Information</strong>
                                                        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            <div>
                                                                <div><strong>Warehouse:</strong> {item?.warehouse?.name || 'N/A'}</div>
                                                                <div><strong>Created By:</strong> {item.purchase?.creator?.name || 'System Admin'}</div>
                                                            </div>
                                                            <div>
                                                                <div><strong>Purchase Date:</strong> {item?.created_at ? formatDate(item.created_at) : 'N/A'}</div>
                                                                {/* <div><strong>Expected Date:</strong> {item.purchase?.expected_date ? formatDate(item.purchase.expected_date) : 'N/A'}</div> */}
                                                            </div>
                                                            <div>
                                                                <div><strong>Created At:</strong> {formatDate(item.created_at)}</div>
                                                                <div><strong>Updated At:</strong> {formatDate(item.updated_at)}</div>
                                                            </div>
                                                        </div>
                                                        {item.purchase?.notes && (
                                                            <div className="mt-3 p-2 bg-gray-50 rounded">
                                                                <strong>Notes:</strong> {item.purchase.notes}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="border border-gray-200 rounded-box px-5 py-10 flex flex-col justify-center items-center gap-2">
                        <Frown size={20} className="text-gray-500" />
                        <h1 className="text-gray-500 text-sm">
                            No purchase items found!
                        </h1>
                        <p className="text-gray-400 text-xs">
                            Try adjusting your filters or check back later.
                        </p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {purchaseItems.data.length > 0 && (
                <div className="flex items-center justify-between mt-4 px-2">
                    <div className="text-sm text-gray-600">
                        Showing {purchaseItems.from} to {purchaseItems.to} of {purchaseItems.total} entries
                    </div>
                    <div className="join">
                        {purchaseItems.prev_page_url && (
                            <Link
                                href={purchaseItems.prev_page_url}
                                className="join-item btn btn-sm"
                                preserveScroll
                                preserveState
                            >
                                Previous
                            </Link>
                        )}

                        {purchaseItems.links.slice(1, -1).map((link, index) => (
                            <Link
                                key={index}
                                href={link.url}
                                className={`join-item btn btn-sm ${
                                    link.active ? 'bg-[#1e4d2b] text-white' : ''
                                }`}
                                preserveScroll
                                preserveState
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}

                        {purchaseItems.next_page_url && (
                            <Link
                                href={purchaseItems.next_page_url}
                                className="join-item btn btn-sm"
                                preserveScroll
                                preserveState
                            >
                                Next
                            </Link>
                        )}
                    </div>
                </div>
            )}

            {/* Summary Stats */}
            {purchaseItems.data.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                    <div className="stat bg-[#1e4d2b] text-white rounded-box">
                        <div className="stat-title">Total Items</div>
                        <div className="stat-value text-primary text-lg">
                            {stats.totalItems}
                        </div>
                    </div>
                    <div className="stat bg-success/10 rounded-box">
                        <div className="stat-title">Total Quantity</div>
                        <div className="stat-value text-success text-lg">
                            {stats.totalQuantity.toFixed(0)}
                        </div>
                    </div>
                    <div className="stat bg-warning/10 rounded-box">
                        <div className="stat-title">Total Amount</div>
                        <div className="stat-value text-warning text-lg">
                            {stats.totalAmount.toFixed(2)} Tk
                        </div>
                    </div>
                    <div className="stat bg-info/10 rounded-box">
                        <div className="stat-title">Avg. per Item</div>
                        <div className="stat-value text-info text-lg">
                            {stats.averagePerItem.toFixed(2)} Tk
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}