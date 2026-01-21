import { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader";
import { Link, router, useForm, usePage } from "@inertiajs/react";
import { Eye, Search, Filter, Frown, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "react-toastify";
import Select from "react-select";

export default function AllSalesItems({ salesItems }) {
    const { flash, isShadowUser } = usePage().props;
    const [expandedRow, setExpandedRow] = useState(null);
    const [filters, setFilters] = useState({
        search: "",
        customer: "",
        product: "",
        warehouse: "",
    });

    // Handle search and filtering
    const handleFilter = (field, value) => {
        const newFilters = { ...filters, [field]: value };
        setFilters(newFilters);
        const queryString = {};
        if (newFilters.search) queryString.search = newFilters.search;
        if (newFilters.customer) queryString.customer_id = newFilters.customer;
        if (newFilters.product) queryString.product_id = newFilters.product;
        if (newFilters.warehouse) queryString.warehouse_id = newFilters.warehouse;
        router.get(route("salesItems.list"), queryString, { preserveScroll: true, preserveState: true, replace: true });
    };

    const handleKeyPress = (e) => {
        if (e.key == 'Enter') {
            const queryString = {};
            if (filters.search) queryString.search = filters.search;
            if (filters.customer) queryString.customer_id = filters.customer;
            if (filters.product) queryString.product_id = filters.product;
            if (filters.warehouse) queryString.warehouse_id = filters.warehouse;
            router.get(route("salesItems.list"), queryString, { preserveScroll: true, preserveState: true, replace: true });
        }
    };

    const clearFilters = () => {
        setFilters({ search: "", customer: "", product: "", warehouse: "" });
        router.get(route("salesItems.list"), {}, { replace: true });
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

    // Format currency
    const formatCurrency = (amount) => {
        const num = parseFloat(amount) || 0;
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
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

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const safeSalesItems = salesItems?.data || [];

    return (
        <div className="bg-white rounded-box p-5">
            <PageHeader
                title="All Sales Items"
                description="Comprehensive list of all sold items with detailed information"
            />

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
                            onClick={() => {
                                const queryString = {};
                                if (filters.search) queryString.search = filters.search;
                                if (filters.customer) queryString.customer_id = filters.customer;
                                if (filters.product) queryString.product_id = filters.product;
                                if (filters.warehouse) queryString.warehouse_id = filters.warehouse;
                                router.get(route("salesItems.list"), queryString, { preserveScroll: true, preserveState: true, replace: true });
                            }}
                            className="btn bg-[#1e4d2b] text-white btn-sm"
                        >
                            <Search size={14} />
                            Search
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">Search</legend>
                        <input
                            type="text"
                            className="input input-sm"
                            placeholder="Product name, code..."
                            value={filters.search}
                            onChange={(e) => handleFilter("search", e.target.value)}
                            onKeyPress={handleKeyPress}
                        />
                    </fieldset>

                    {/* Customer Filter */}
                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">Customer</legend>
                        <input
                            type="text"
                            className="input input-sm"
                            placeholder="Customer name..."
                            value={filters.customer}
                            onChange={(e) => handleFilter("customer", e.target.value)}
                            onKeyPress={handleKeyPress}
                        />
                    </fieldset>

                    {/* Product Filter */}
                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">Product</legend>
                        <input
                            type="text"
                            className="input input-sm"
                            placeholder="Product name..."
                            value={filters.product}
                            onChange={(e) => handleFilter("product", e.target.value)}
                            onKeyPress={handleKeyPress}
                        />
                    </fieldset>

                    {/* Warehouse Filter */}
                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">Warehouse</legend>
                        <input
                            type="text"
                            className="input input-sm"
                            placeholder="Warehouse name..."
                            value={filters.warehouse}
                            onChange={(e) => handleFilter("warehouse", e.target.value)}
                            onKeyPress={handleKeyPress}
                        />
                    </fieldset>
                </div>
            </div>

            {/* Sales Items Table */}
            <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-100">
                {safeSalesItems.length > 0 ? (
                    <table className="table">
                        <thead className={`${isShadowUser ? 'bg-warning' : 'bg-[#1e4d2b] text-white'} text-white`}>
                            <tr>
                                <th className="w-8"></th>
                                <th>Product</th>
                                <th>Customer</th>
                                <th>Price</th>
                                <th>Qty</th>
                                <th>Discount</th>
                                <th>Type</th>
                                <th>Total</th>
                                <th>Warehouse</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {safeSalesItems.map((item, index) => (
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
                                                    {item.product?.name ?? item.product_name}
                                                </div>

                                                <div className="text-xs text-gray-500">
                                                    {item.variant
                                                        ? `Variant: ${item.variant.sku ?? ''}`
                                                        : item.variant_name
                                                    }
                                                </div>
                                            </div>

                                        </td>
                                        <td>
                                            <div className="max-w-[150px]">
                                                <div className="text-sm">
                                                    {item.sale?.customer?.customer_name || 'Walk-in Customer'}
                                                </div>
                                                {item.sale?.customer?.phone && (
                                                    <div className="text-xs text-gray-500">
                                                        {item.sale.customer.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-sm">
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
                                                {item.sale.discount}%
                                            </div>
                                        </td>

                                        <td>
                                            <div className="badge badge-info badge-sm">
                                                <strong>{item.sale.type}</strong>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="font-semibold text-primary">
                                                {calculateItemTotal(item)} Tk
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-sm">
                                                {item.warehouse?.name || 'N/A'}
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
                                                    href={route('sales.items.show', { id: item.id })}
                                                    className="btn btn-ghost btn-xs"
                                                    title="View Sale"
                                                >
                                                    <Eye size={12} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Expanded Row Details */}
                                    {expandedRow === index && (
                                        <tr className="bg-base-200">
                                            <td colSpan="10">
                                                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                        <strong style={{ fontSize: '16px' }}>Product Details:</strong>
                                                        <div><strong>Name:</strong> {item.product?.name || item?.product_name}</div>
                                                        {item.variant && (
                                                        <div><strong>Brand:</strong>
                                                            {(() => {
                                                                const variant = item.variant;
                                                                let attrsText = '';

                                                                if (variant.attribute_values) {
                                                                    if (typeof variant.attribute_values === 'object') {
                                                                        attrsText = Object.entries(variant.attribute_values)
                                                                            .map(([key, value]) => ` ${key}`)
                                                                            .join(', ');
                                                                    } else {
                                                                        attrsText = variant.attribute_values;
                                                                    }
                                                                }

                                                                return (
                                                                    <>
                                                                        {attrsText || 'N/A'}
                                                                    </>
                                                                );
                                                            })()}<br />
                                                            </div>
                                                        )}

                                                        <div><strong>Code:</strong> {item.product?.product_no || 'N/A'}</div>
                                                        {item.variant && (
                                                            <div>
                                                                <strong>Variant:</strong>{' '}
                                                                {(() => {
                                                                    const variant = item.variant;
                                                                    let attrsText = '';

                                                                    if (variant.attribute_values) {
                                                                        if (typeof variant.attribute_values === 'object') {
                                                                            attrsText = Object.entries(variant.attribute_values)
                                                                                .map(([key, value]) => ` ${value}`)
                                                                                .join(', ');
                                                                        } else {
                                                                            attrsText = variant.attribute_values;
                                                                        }
                                                                    }

                                                                    return (
                                                                        <>
                                                                            {attrsText || 'N/A'} {variant.sku ? `(${variant.sku})` : ''}
                                                                        </>
                                                                    );
                                                                })()}
                                                            </div>
                                                        )}

                                                    </div>
                                                    <div>
                                                        <strong style={{ fontSize: '16px' }}>Sale Details:</strong>
                                                        <div> <strong>Sale ID:</strong> {item.sale_id}</div>
                                                        <div><strong>Invoice:</strong> {item.sale?.invoice_no || 'N/A'}</div>
                                                        <div> <strong>Status:</strong> {item.sale?.status || 'N/A'}</div>
                                                    </div>
                                                    <div>
                                                        <strong style={{ fontSize: '16px' }}>Pricing:</strong>
                                                        <div><strong>Unit Price:</strong> {parseFloat(item.unit_price).toFixed(2)} Tk</div>
                                                        <div><strong>Quantity:</strong> {item.quantity}</div>
                                                        <div><strong>Discount:</strong> {item.sale?.discount}%</div>
                                                        <div><strong>VAT:</strong> {item.sale?.vat_tax}%</div>
                                                        <div><strong>Total:</strong> {calculateItemTotal(item)} Tk</div>
                                                    </div>
                                                    <div>
                                                        <strong style={{ fontSize: '16px' }}>Additional Info:</strong>
                                                        <div><strong>Warehouse:</strong> {item.warehouse?.name || 'N/A'}</div>
                                                        <div><strong>Sold By:</strong> System Admin</div>
                                                        <div><strong>Date:</strong> {formatDate(item.created_at)}</div>
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
                            No sales items found!
                        </h1>
                        <p className="text-gray-400 text-xs">
                            Try adjusting your filters or check back later.
                        </p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {safeSalesItems.length > 0 && (
                <div className="flex items-center justify-between mt-4 px-2">
                    <div className="text-sm text-gray-600">
                        Showing {salesItems.from || 0} to {salesItems.to || 0} of {salesItems.total || 0} entries
                    </div>
                    <div className="join">
                        {salesItems.prev_page_url && (
                            <Link
                                href={salesItems.prev_page_url}
                                className="join-item btn btn-sm"
                                preserveScroll
                                preserveState
                            >
                                Previous
                            </Link>
                        )}

                        {salesItems.links?.slice(1, -1).map((link, index) => (
                            <Link
                                key={index}
                                href={link.url}
                                className={`join-item btn btn-sm ${link.active ? 'bg-[#1e4d2b] text-white' : ''
                                    }`}
                                preserveScroll
                                preserveState
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}

                        {salesItems.next_page_url && (
                            <Link
                                href={salesItems.next_page_url}
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
            {safeSalesItems.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                    <div className="stat bg-[#1e4d2b] text-white rounded-box">
                        <div className="stat-title">Total Items</div>
                        <div className="stat-value text-primary text-lg">
                            {salesItems.total || 0}
                        </div>
                    </div>
                    <div className="stat bg-success/10 rounded-box">
                        <div className="stat-title">Total Quantity</div>
                        <div className="stat-value text-success text-lg">
                            {safeSalesItems.reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0)}
                        </div>
                    </div>
                    <div className="stat bg-warning/10 rounded-box">
                        <div className="stat-title">Total Sales</div>
                        <div className="stat-value text-warning text-lg">
                            {safeSalesItems.reduce((sum, item) => sum + parseFloat(calculateItemTotal(item) || 0), 0).toFixed(2)} Tk
                        </div>
                    </div>
                    <div className="stat bg-info/10 rounded-box">
                        <div className="stat-title">Avg. per Item</div>
                        <div className="stat-value text-info text-lg">
                            {(safeSalesItems.reduce((sum, item) => sum + parseFloat(calculateItemTotal(item) || 0), 0) / safeSalesItems.length).toFixed(2)} Tk
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}