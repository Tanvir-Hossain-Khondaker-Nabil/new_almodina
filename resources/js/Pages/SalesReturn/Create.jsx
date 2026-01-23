import PageHeader from "../../components/PageHeader";
import { useForm, router } from "@inertiajs/react";
import toast from "react-hot-toast";
import {
    ArrowLeft, Plus, Trash2, Search, DollarSign, User,
    Building, Phone, Info, Edit, X, RefreshCw,
    Package, AlertCircle, CheckCircle, Clock, ShoppingCart,
    Calculator, AlertTriangle, CreditCard, Wallet,
    Ruler, Shield
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "../../hooks/useTranslation";

export default function AddSalesReturn({
    sale,
    saleItems,
    sales,
    products,
    unitConversions = {
        weight: { ton: 1000, kg: 1, gram: 0.001, pound: 0.453592 },
        volume: { liter: 1, ml: 0.001 },
        piece: { piece: 1, dozen: 12, box: 1 },
        length: { meter: 1, cm: 0.01, mm: 0.001 }
    }
}) {
    const { t, locale } = useTranslation();
    const [selectedItems, setSelectedItems] = useState([]);
    const [replacementProducts, setReplacementProducts] = useState([]);
    const [returnType, setReturnType] = useState('money_back');
    const [showReplacementSearch, setShowReplacementSearch] = useState(false);
    const [productSearch, setProductSearch] = useState("");
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [paymentType, setPaymentType] = useState('cash');
    const [selectedAccount, setSelectedAccount] = useState("");
    const [selectedSaleId, setSelectedSaleId] = useState(sale?.id || '');
    const [validationErrors, setValidationErrors] = useState({});
    const [showUnitInfo, setShowUnitInfo] = useState({});

    const searchRef = useRef(null);
    const dropdownRef = useRef(null);

    const form = useForm({
        sale_id: sale?.id || "",
        is_damaged: false,
        return_type: 'money_back',
        return_date: new Date().toISOString().split('T')[0],
        reason: "",
        notes: "",
        refunded_amount: 0,
        shadow_refunded_amount: 0,
        items: [],
        auto_approve: true
    });

    // ইউনিট কনভার্সন হেল্পার ফাংশন
    const convertToBase = useCallback((quantity, fromUnit, unitType) => {
        const conversions = unitConversions[unitType];
        if (!conversions || !conversions[fromUnit]) return quantity;
        return quantity * conversions[fromUnit];
    }, [unitConversions]);

    const convertFromBase = useCallback((quantity, toUnit, unitType) => {
        const conversions = unitConversions[unitType];
        if (!conversions || !conversions[toUnit]) return quantity;
        const conversion = conversions[toUnit];
        return conversion !== 0 ? quantity / conversion : quantity;
    }, [unitConversions]);

    const getAvailableUnits = useCallback((product) => {
        if (!product) return ['piece'];

        const unitType = product.unit_type || 'piece';
        const conversions = unitConversions[unitType];

        if (!conversions) return [product.default_unit || 'piece'];

        const purchaseUnit = product.default_unit || 'piece';
        const purchaseFactor = conversions[purchaseUnit] || 1;

        const available = [];
        for (const [unit, factor] of Object.entries(conversions)) {
            if (factor <= purchaseFactor) {
                available.push(unit);
            }
        }

        return available.sort((a, b) => (conversions[a] || 1) - (conversions[b] || 1));
    }, [unitConversions]);

    const convertUnitQuantity = useCallback((quantity, fromUnit, toUnit, unitType) => {
        if (fromUnit === toUnit) return quantity;

        const conversions = unitConversions[unitType];
        if (!conversions || !conversions[fromUnit] || !conversions[toUnit]) return quantity;

        const baseQuantity = quantity * conversions[fromUnit];
        return baseQuantity / conversions[toUnit];
    }, [unitConversions]);

    // টোটাল রিটার্ন ভ্যালু ক্যালকুলেট
    const calculateTotalReturn = useCallback(() => {
        return selectedItems.reduce((total, item) => {
            if (item.return_quantity > 0) {
                return total + (item.return_quantity * item.sale_price);
            }
            return total;
        }, 0);
    }, [selectedItems]);

    // টোটাল রিপ্লেসমেন্ট ভ্যালু ক্যালকুলেট
    const calculateReplacementTotal = useCallback(() => {
        return replacementProducts.reduce((total, product) => {
            const quantity = parseFloat(product.quantity) || 0;
            const salePrice = parseFloat(product.sale_price) || 0;
            return total + (quantity * salePrice);
        }, 0);
    }, [replacementProducts]);

    // নেট ডিফারেন্স
    const calculateNetDifference = useCallback(() => {
        const totalReturn = calculateTotalReturn();
        const replacementTotal = calculateReplacementTotal();
        return replacementTotal - totalReturn;
    }, [calculateTotalReturn, calculateReplacementTotal]);

    const formatCurrency = (value) => {
        const numValue = Number(value) || 0;
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(numValue);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // সেল সিলেকশন হ্যান্ডলার
    const handleSaleSelect = (e) => {
        const saleId = e.target.value;
        setSelectedSaleId(saleId);
        if (saleId) {
            router.visit(route('return.create', { sale_id: saleId }), {
                preserveScroll: true,
                preserveState: true
            });
        }
    };

    // ফর্ম ডেটা সিঙ্ক
    useEffect(() => {
        const totalReturn = calculateTotalReturn();
        const netDifference = calculateNetDifference();

        const itemsToSubmit = selectedItems
            .filter(item => item.return_quantity > 0)
            .map(item => ({
                sale_item_id: item.sale_item_id,
                return_quantity: parseFloat(item.return_quantity),
                unit: item.unit,
                reason: item.reason || 'Return requested'
            }));

        form.setData({
            ...form.data,
            sale_id: selectedSaleId,
            return_type: returnType,
            refunded_amount: returnType === 'money_back' ? totalReturn : 0,
            shadow_refunded_amount: returnType === 'money_back' ? totalReturn : 0,
            items: itemsToSubmit,
        });
    }, [
        selectedSaleId,
        returnType,
        paymentType,
        selectedAccount,
        selectedItems,
        calculateTotalReturn,
        calculateNetDifference
    ]);

    // সেল আইটেমস ইনিশিয়ালাইজ
    useEffect(() => {
        if (saleItems && saleItems.length > 0) {
            const initialItems = saleItems.map(item => ({
                sale_item_id: item.id,
                product_id: item.product_id,
                product_name: item.product_name,
                product_code: item.product_code,
                variant_id: item.variant_id,
                variant_name: item.variant_name,
                brand_name: item.brand_name,
                unit: item.unit || 'piece',
                available_units: item.available_units || ['piece'],
                return_quantity: 0,
                max_quantity: item.max_quantity,
                sale_price: parseFloat(item.sale_price) || 0,
                shadow_sale_price: parseFloat(item.shadow_sale_price) || 0,
                sale_quantity: item.sale_quantity,
                stock_quantity: item.stock_quantity || 0,
                base_stock_quantity: item.base_stock_quantity || 0,
                already_returned: item.already_returned || 0,
                reason: "",
                unit_type: item.unit_type || 'piece',
                default_unit: item.default_unit || 'piece',
                is_fraction_allowed: item.is_fraction_allowed || false
            }));
            setSelectedItems(initialItems);
        }
    }, [saleItems]);

    // প্রোডাক্ট সার্চ ফিল্টার
    useEffect(() => {
        if (productSearch.trim() && showReplacementSearch) {
            const filtered = products.filter(product =>
                product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                product.product_no.toLowerCase().includes(productSearch.toLowerCase()) ||
                (product.brand?.name && product.brand.name.toLowerCase().includes(productSearch.toLowerCase()))
            );
            setFilteredProducts(filtered);
        } else {
            setFilteredProducts([]);
        }
    }, [productSearch, products, showReplacementSearch]);

    // রিটার্ন আইটেম আপডেট
    const updateReturnItem = (index, field, value) => {
        const updated = [...selectedItems];
        const item = updated[index];

        if (field === 'return_quantity') {
            const quantity = parseFloat(value) || 0;

            // ফ্র্যাকশন চেক
            if (!item.is_fraction_allowed && quantity % 1 !== 0) {
                toast.error('Fractions are not allowed for this product');
                return;
            }

            // ম্যাক্সিমাম চেক
            if (quantity > item.max_quantity) {
                toast.error(`Cannot return more than ${item.max_quantity} ${item.unit}`);
                return;
            }

            updated[index].return_quantity = quantity;
        }
        else if (field === 'unit') {
            // ইউনিট চেঞ্জ ভ্যালিডেশন
            if (!item.available_units.includes(value)) {
                toast.error(`Cannot return in ${value.toUpperCase()} unit for this product`);
                return;
            }

            // কনভার্ট কোয়ান্টিটি
            const oldUnit = item.unit;
            const newUnit = value;

            if (oldUnit !== newUnit && item.return_quantity > 0) {
                const convertedQuantity = convertUnitQuantity(
                    item.return_quantity,
                    oldUnit,
                    newUnit,
                    item.unit_type || 'piece'
                );

                // স্টক চেক নতুন ইউনিটে
                const baseStock = item.base_stock_quantity;
                const requestedBase = convertToBase(convertedQuantity, newUnit, item.unit_type || 'piece');

                if (requestedBase > baseStock) {
                    toast.error('Exceeds available stock in new unit');
                    return;
                }

                updated[index].return_quantity = convertedQuantity;
            }

            updated[index].unit = value;
        }
        else {
            updated[index][field] = value;
        }

        setSelectedItems(updated);
    };

    // রিপ্লেসমেন্ট প্রোডাক্ট অ্যাড
    const addReplacementProduct = (product, variant) => {
        const availableUnits = getAvailableUnits(product);
        const defaultUnit = product.default_unit || availableUnits[0] || 'piece';

        const existing = replacementProducts.find(
            p => p.product_id === product.id && p.variant_id === variant.id
        );

        if (existing) {
            setReplacementProducts(replacementProducts.map(p =>
                p.product_id === product.id && p.variant_id === variant.id
                    ? { ...p, quantity: p.quantity + 1 }
                    : p
            ));
        } else {
            const variantName = variant.attribute_values
                ? Object.values(variant.attribute_values).join(', ')
                : 'Default Variant';

            setReplacementProducts([
                ...replacementProducts,
                {
                    product_id: product.id,
                    variant_id: variant.id,
                    product_name: product.name,
                    product_code: product.product_no,
                    variant_name: variantName,
                    brand_name: product.brand?.name || 'No Brand',
                    unit: defaultUnit,
                    available_units: availableUnits,
                    quantity: 1,
                    unit_price: variant.unit_cost || 0,
                    shadow_unit_price: variant.shadow_unit_cost || 0,
                    sale_price: variant.sale_price || variant.unit_cost || 0,
                    shadow_sale_price: variant.shadow_sale_price || variant.shadow_unit_cost || 0,
                    unit_type: product.unit_type || 'piece',
                    is_fraction_allowed: product.is_fraction_allowed || false
                }
            ]);
        }

        setProductSearch("");
        setShowReplacementSearch(false);
    };

    // রিপ্লেসমেন্ট প্রোডাক্ট আপডেট
    const updateReplacementProduct = (index, field, value) => {
        const updated = [...replacementProducts];
        const item = updated[index];

        if (field === 'quantity' || field === 'unit_price' || field === 'sale_price') {
            const numValue = parseFloat(value) || 0;

            if (field === 'quantity' && !item.is_fraction_allowed && numValue % 1 !== 0) {
                toast.error('Fractions are not allowed for this product');
                return;
            }

            updated[index][field] = numValue;
        }
        else if (field === 'unit') {
            if (!item.available_units.includes(value)) {
                toast.error(`Invalid unit ${value.toUpperCase()} for this product`);
                return;
            }
            updated[index].unit = value;
        }
        else {
            updated[index][field] = value;
        }

        setReplacementProducts(updated);
    };

    const removeReplacementProduct = (index) => {
        const updated = [...replacementProducts];
        updated.splice(index, 1);
        setReplacementProducts(updated);
    };

    // ইউনিট ইনফো টগল
    const toggleUnitInfo = (itemKey) => {
        setShowUnitInfo(prev => ({
            ...prev,
            [itemKey]: !prev[itemKey]
        }));
    };

    // ভ্যালিডেশন
    const validateForm = () => {
        const errors = {};

        if (!form.data.sale_id) {
            errors.sale_id = 'Please select a sale';
        }

        // if (!form.data.reason.trim()) {
        //     errors.reason = 'Please provide a reason for return';
        // }

        const hasReturnItems = selectedItems.some(item => item.return_quantity > 0);
        if (!hasReturnItems) {
            errors.items = 'Please select at least one item to return';
        }

        // কোয়ান্টিটি ভ্যালিডেশন
        selectedItems.forEach((item, index) => {
            if (item.return_quantity > item.max_quantity) {
                errors[`item_${index}`] = `Quantity exceeds available stock (max: ${item.max_quantity})`;
            }
        });




        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // সাবমিট
    const submit = (e) => {
        e.preventDefault();

        if (!validateForm()) {
            const firstError = Object.values(validationErrors)[0];
            toast.error(firstError);
            return;
        }

        form.post(route("return.store"), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Sales return created successfully');
                router.visit(route("salesReturn.list"));
            },
            onError: (errors) => {
                console.error("Form errors:", errors);
                const errorMessage = errors.message || errors.error || "Failed to create sales return";
                toast.error(errorMessage);
                setValidationErrors(errors);
            }
        });
    };

    // ক্যালকুলেটেড ভ্যালু
    const totalReturn = calculateTotalReturn();
    const replacementTotal = calculateReplacementTotal();
    const netDifference = calculateNetDifference();

    return (
        <div className={`bg-white rounded-box p-5 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <PageHeader
                title={t('sales_return.create_title', 'Create Sales Return')}
                subtitle={t('sales_return.create_subtitle', 'Process return for sold items')}
            >
                <button
                    onClick={() => router.visit(route("salesReturn.list"))}
                    className="btn btn-sm btn-ghost"
                >
                    <ArrowLeft size={15} /> {t('sales_return.back_to_list', 'Back to List')}
                </button>
            </PageHeader>

            {/* ভ্যালিডেশন এররস */}
            {Object.keys(validationErrors).length > 0 && (
                <div className="alert alert-error mb-6">
                    <AlertTriangle size={20} />
                    <div className="ml-2">
                        <h3 className="font-bold">Please fix the following errors:</h3>
                        <ul className="list-disc pl-5 mt-1">
                            {Object.values(validationErrors).map((error, index) => (
                                <li key={index} className="text-sm">{error}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* সেল সিলেকশন */}
            {!sale && (
                <div className="card card-compact bg-base-100 border border-base-300 mb-6">
                    <div className="card-body">
                        <h3 className="card-title text-sm font-semibold">
                            <ShoppingCart size={16} className="mr-2" />
                            {t('sales_return.select_sale', 'Select Sale')}
                        </h3>
                        <select
                            className="select select-bordered w-full"
                            value={selectedSaleId}
                            onChange={handleSaleSelect}
                        >
                            <option value="">{t('sales_return.select_sale_placeholder', 'Select a sale to return')}</option>
                            {sales?.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.invoice_no} - {s.customer?.customer_name} - {formatDate(s.created_at)} - ৳{formatCurrency(s.grand_total)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {sale && (
                <form onSubmit={submit}>
                    {/* সেল ইনফো */}
                    <div className="card card-compact bg-base-100 border border-base-300 mb-6">
                        <div className="card-body">
                            <h3 className="card-title text-sm font-semibold">
                                {t('sales_return.sale_info', 'Sale Information')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <span className="font-medium">Invoice No:</span>
                                    <span className="ml-2 font-mono">{sale.invoice_no}</span>
                                </div>
                                <div>
                                    <span className="font-medium">Customer:</span>
                                    <span className="ml-2">{sale.customer?.customer_name}</span>
                                </div>
                                <div>
                                    <span className="font-medium">Date:</span>
                                    <span className="ml-2">{formatDate(sale.created_at)}</span>
                                </div>
                                <div>
                                    <span className="font-medium">Total Amount:</span>
                                    <span className="ml-2 font-semibold">৳{formatCurrency(sale.grand_total)}</span>
                                </div>
                                <div>
                                    <span className="font-medium">Paid Amount:</span>
                                    <span className="ml-2">৳{formatCurrency(sale.paid_amount)}</span>
                                </div>
                                <div>
                                    <span className="font-medium">Due Amount:</span>
                                    <span className={`ml-2 ${sale.due_amount > 0 ? 'text-error' : 'text-success'}`}>
                                        ৳{formatCurrency(sale.due_amount)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        {/* লেফট কলাম - রিটার্ন ডিটেইলস */}
                        <div className="lg:col-span-1 space-y-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold">{t('sales_return.return_type', 'Return Type')} *</span>
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <label className={`card card-compact cursor-pointer ${returnType === 'money_back'
                                        ? 'bg-[#1e4d2b] text-white border border-primary'
                                        : 'bg-base-100 border border-base-300'
                                        }`}>
                                        <div className="card-body p-3">
                                            <input
                                                type="radio"
                                                className="radio"
                                                checked={returnType === 'money_back'}
                                                onChange={() => setReturnType('money_back')}
                                            />
                                            <div className="flex items-center gap-2 mt-1">
                                                <DollarSign size={16} />
                                                <span className="font-medium">Money Back</span>
                                            </div>
                                            <p className="text-xs opacity-80 mt-1">
                                                Refund amount to customer
                                            </p>
                                        </div>
                                    </label>
                                    <label className={`card card-compact cursor-pointer ${returnType === 'product_replacement'
                                        ? 'bg-warning/10 border border-warning'
                                        : 'bg-base-100 border border-base-300'
                                        }`}>
                                        <div className="card-body p-3">
                                            <input
                                                type="radio"
                                                className="radio radio-warning"
                                                checked={returnType === 'product_replacement'}
                                                onChange={() => setReturnType('product_replacement')}
                                            />
                                            <div className="flex items-center gap-2 mt-1">
                                                <RefreshCw size={16} />
                                                <span className="font-medium">Product Replacement</span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Replace with other products
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold">{t('sales_return.return_date', 'Return Date')} *</span>
                                </label>
                                <input
                                    type="date"
                                    className="input input-bordered w-full"
                                    value={form.data.return_date}
                                    onChange={(e) => form.setData("return_date", e.target.value)}
                                    required
                                />
                            </div>



                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold">{t('sales_return.reason', 'Reason for Return')} *</span>
                                </label>
                                <textarea
                                    className="textarea textarea-bordered w-full"
                                    rows="3"
                                    value={form.data.reason}
                                    onChange={(e) => form.setData("reason", e.target.value)}
                                    placeholder="Explain why customer is returning these items..."
                                // required
                                />
                                {validationErrors.reason && (
                                    <div className="text-error text-xs mt-1">{validationErrors.reason}</div>
                                )}
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold">{t('sales_return.notes', 'Additional Notes')}</span>
                                </label>
                                <textarea
                                    className="textarea textarea-bordered w-full"
                                    rows="2"
                                    value={form.data.notes}
                                    onChange={(e) => form.setData("notes", e.target.value)}
                                    placeholder="Any additional information..."
                                />
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-6">
                            <div>
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    {t('sales_return.items_to_return', 'Items to Return')}
                                    <span className="badge badge-primary badge-sm">
                                        {selectedItems.filter(item => item.return_quantity > 0).length}
                                    </span>
                                </h3>

                                {selectedItems.length > 0 ? (
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                        {selectedItems.map((item, index) => (
                                            <div key={index} className="card card-compact bg-base-100 border border-base-300">
                                                <div className="card-body">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex-1">
                                                            <h4 className="font-medium text-base">{item.product_name}</h4>
                                                            <div className="text-sm text-gray-600 space-y-1">
                                                                <div>
                                                                    <strong>Variant:</strong> {item.variant_name}
                                                                </div>
                                                                <div>
                                                                    <strong>Brand:</strong> {item.brand_name}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    Sold: {item.sale_quantity} {item.unit} •
                                                                    Available for return: {item.max_quantity} {item.unit}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                                        <div className="form-control">
                                                            <label className="label py-1">
                                                                <span className="label-text text-xs font-semibold">Quantity *</span>
                                                            </label>
                                                            <input
                                                                type="number"
                                                                step={item.is_fraction_allowed ? "0.001" : "1"}
                                                                min="0"
                                                                max={item.max_quantity}
                                                                className="input input-bordered input-sm w-full"
                                                                value={item.return_quantity}
                                                                onChange={(e) => updateReturnItem(index, 'return_quantity', e.target.value)}
                                                            />
                                                        </div>

                                                        <div className="form-control">
                                                            <label className="label py-1">
                                                                <span className="label-text text-xs font-semibold">Unit</span>
                                                            </label>
                                                            <select
                                                                className="select select-bordered select-sm w-full"
                                                                value={item.unit}
                                                                onChange={(e) => updateReturnItem(index, 'unit', e.target.value)}
                                                            >
                                                                {item.available_units?.map(unit => (
                                                                    <option key={unit} value={unit}>
                                                                        {unit.toUpperCase()}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        <div className="form-control">
                                                            <label className="label py-1">
                                                                <span className="label-text text-xs font-semibold">Sale Price</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                className="input input-bordered input-sm w-full bg-base-200"
                                                                value={`৳${formatCurrency(item.sale_price)}`}
                                                                readOnly
                                                            />
                                                        </div>

                                                        <div className="form-control">
                                                            <label className="label py-1">
                                                                <span className="label-text text-xs font-semibold">Total</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                className="input input-bordered input-sm w-full bg-base-200 font-semibold"
                                                                value={`৳${formatCurrency(item.return_quantity * item.sale_price)}`}
                                                                readOnly
                                                            />
                                                        </div>

                                                        <div className="form-control">
                                                            <label className="label py-1">
                                                                <span className="label-text text-xs font-semibold">Reason</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                className="input input-bordered input-sm w-full"
                                                                value={item.reason}
                                                                onChange={(e) => updateReturnItem(index, 'reason', e.target.value)}
                                                                placeholder="Why return?"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* ইউনিট ইনফো */}
                                                    {item.unit_type && item.unit_type !== 'piece' && (
                                                        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <Ruler size={14} className="text-blue-600" />
                                                                    <span className="text-sm font-medium text-blue-800">
                                                                        Unit Information
                                                                    </span>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-xs btn-ghost"
                                                                    onClick={() => toggleUnitInfo(`item_${index}`)}
                                                                >
                                                                    {showUnitInfo[`item_${index}`] ? 'Hide' : 'Show'}
                                                                </button>
                                                            </div>
                                                            {showUnitInfo[`item_${index}`] && (
                                                                <div className="mt-2 text-xs text-blue-700">
                                                                    <div>Unit Type: {item.unit_type.toUpperCase()}</div>
                                                                    <div>Default Unit: {item.default_unit.toUpperCase()}</div>
                                                                    <div>Available Units: {item.available_units.map(u => u.toUpperCase()).join(', ')}</div>
                                                                    <div>Fractions Allowed: {item.is_fraction_allowed ? 'Yes' : 'No'}</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="card card-compact bg-base-100 border-2 border-dashed border-base-300">
                                        <div className="card-body text-center py-8">
                                            <p className="text-gray-500">No items available for return</p>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4 p-3 bg-base-100 border border-base-300 rounded-box">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <span className="font-medium">Total Return Value:</span>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Items: {selectedItems.filter(item => item.return_quantity > 0).length}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold text-lg">৳{formatCurrency(totalReturn)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* সামারি */}
                    <div className="border-t border-base-300 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="card card-compact bg-base-100 border border-base-300">
                                <div className="card-body">
                                    <h4 className="card-title text-sm font-semibold">
                                        <Calculator size={16} className="inline mr-2" />
                                        Return Summary
                                    </h4>
                                    <div className="space-y-2 text-sm mt-2">
                                        <div className="flex justify-between">
                                            <span>Total Items to Return:</span>
                                            <span className="font-medium">
                                                {selectedItems.filter(item => item.return_quantity > 0).length}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Total Return Value:</span>
                                            <span className="font-semibold">৳{formatCurrency(totalReturn)}</span>
                                        </div>
                                        {returnType === 'money_back' && (
                                            <div className="flex justify-between pt-2 border-t border-base-300">
                                                <span>Refund Amount:</span>
                                                <span className="font-semibold text-primary">৳{formatCurrency(totalReturn)}</span>
                                            </div>
                                        )}
                                        {returnType === 'product_replacement' && (
                                            <>
                                                <div className="flex justify-between">
                                                    <span>Replacement Items:</span>
                                                    <span className="font-medium">{replacementProducts.length}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Replacement Value:</span>
                                                    <span className="font-semibold text-warning">৳{formatCurrency(replacementTotal)}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="card card-compact bg-base-100 border border-base-300">
                                <div className="card-body">
                                    <h4 className="card-title text-sm font-semibold">
                                        <RefreshCw size={16} className="inline mr-2" />
                                        Value Difference
                                    </h4>
                                    {returnType === 'product_replacement' ? (
                                        <div className="space-y-2 text-sm mt-2">
                                            <div className="flex justify-between">
                                                <span>Return Value:</span>
                                                <span className="text-gray-600">৳{formatCurrency(totalReturn)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Replacement Value:</span>
                                                <span className="text-gray-600">৳{formatCurrency(replacementTotal)}</span>
                                            </div>
                                            <div className="flex justify-between pt-2 border-t border-base-300 font-semibold">
                                                <span>Net Difference:</span>
                                                <span className={`${netDifference > 0 ? 'text-error' : netDifference < 0 ? 'text-success' : 'text-gray-600'}`}>
                                                    ৳{formatCurrency(Math.abs(netDifference))}
                                                    {netDifference > 0 ? ' (Customer Pays More)' :
                                                        netDifference < 0 ? ' (We Refund Difference)' : ' (Equal)'}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <DollarSign size={32} className="mx-auto text-primary/50 mb-2" />
                                            <p className="text-gray-600">Full refund to customer</p>
                                            <p className="text-sm font-semibold mt-2">৳{formatCurrency(totalReturn)}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className={`btn btn-lg ${returnType === 'product_replacement' ? 'btn-warning' : 'bg-[#1e4d2b] text-white'}`}
                                disabled={form.processing}
                            >
                                {form.processing ? (
                                    <span className="flex items-center gap-2">
                                        <div className="loading loading-spinner loading-sm"></div>
                                        Creating Return...
                                    </span>
                                ) : (
                                    <>
                                        <RefreshCw size={18} className="mr-2" />
                                        Create Sales Return
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => router.visit(route("salesReturn.list"))}
                                className="btn btn-lg btn-ghost"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
}