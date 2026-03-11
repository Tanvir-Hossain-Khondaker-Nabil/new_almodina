// resources/js/Pages/Purchase/EditPurchase.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import PageHeader from "../../components/PageHeader";
import { useForm, router } from "@inertiajs/react";
import {
    ArrowLeft,
    Trash2,
    Search,
    DollarSign,
    User,
    Package,
    Building,
    Edit,
    X,
    CreditCard,
    Wallet,
    Landmark,
    Smartphone,
    Ruler,
    AlertTriangle,
    Barcode,
} from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";

export default function EditPurchase({
    purchase,
    suppliers,
    warehouses,
    products,
    accounts,
    isShadowUser,
    unitConversions = {
        weight: { ton: 1000, kg: 1, gram: 0.001, pound: 0.453592 },
        volume: { liter: 1, ml: 0.001 },
        piece: { piece: 1, dozen: 12, box: 1 },
        length: { meter: 1, cm: 0.01, mm: 0.001 },
    },
}) {
    const { t, locale } = useTranslation();

    const searchRef = useRef(null);
    const dropdownRef = useRef(null);

    const [selectedItems, setSelectedItems] = useState([]);
    const [productSearch, setProductSearch] = useState("");
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);

    const [paymentStatus, setPaymentStatus] = useState(purchase?.payment_status || "unpaid");
    const [paidAmount, setPaidAmount] = useState(Number(purchase?.paid_amount || 0));
    const [selectedSupplier, setSelectedSupplier] = useState(null);

    const [usePartialPayment, setUsePartialPayment] = useState(false);
    const [adjustFromAdvance, setAdjustFromAdvance] = useState(false);
    const [availableAdvance, setAvailableAdvance] = useState(0);
    const [manualPaymentOverride, setManualPaymentOverride] = useState(false);

    const [selectedBrand, setSelectedBrand] = useState(null);
    const [brands, setBrands] = useState([]);

    // unit states (per item key)
    const [productUnits, setProductUnits] = useState({});
    const [selectedUnits, setSelectedUnits] = useState({});
    const [unitQuantities, setUnitQuantities] = useState({});
    const [availableSaleUnits, setAvailableSaleUnits] = useState({});

    const formatCurrency = (value) => {
        const numValue = Number(value) || 0;
        return new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(numValue);
    };

    const getAccountIcon = (type) => {
        switch (type) {
            case "cash":
                return <Wallet size={14} className="text-green-600" />;
            case "bank":
                return <Landmark size={14} className="text-blue-600" />;
            case "mobile_banking":
                return <Smartphone size={14} className="text-purple-600" />;
            default:
                return <CreditCard size={14} />;
        }
    };

    const formatVariantName = (variant) => {
        const attrs = variant?.attribute_values || {};
        if (!attrs || Object.keys(attrs).length === 0) return "Default";
        return Object.entries(attrs)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ");
    };

    const buildVariantIdentifier = (variant) => {
        const attrs = variant?.attribute_values || {};
        if (!attrs || Object.keys(attrs).length === 0) return "default";
        return Object.entries(attrs)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}:${v}`)
            .join("|");
    };

    const getAvailableUnitsForProduct = (product) => {
        if (!product) return ["piece"];
        const unitType = product.unit_type || "piece";
        return Object.keys(unitConversions[unitType] || { piece: 1 });
    };

    const getAvailableSaleUnits = (product, purchaseUnit) => {
        if (!product || !purchaseUnit) return [purchaseUnit];
        const unitType = product.unit_type || "piece";
        const conversions = unitConversions[unitType];
        if (!conversions) return [purchaseUnit];

        const purchaseFactor = conversions[purchaseUnit] || 1;
        const available = [];
        for (const [unit, factor] of Object.entries(conversions)) {
            if (factor <= purchaseFactor) available.push(unit);
        }
        return available.sort((a, b) => (conversions[b] || 1) - (conversions[a] || 1));
    };

    const calculateTotal = useCallback(() => {
        return selectedItems.reduce((total, item) => total + (Number(item.total_price) || 0), 0);
    }, [selectedItems]);

    const totalAmount = calculateTotal();

    const dueAmount = useMemo(() => {
        return Math.max(0, (Number(totalAmount) || 0) - (Number(paidAmount) || 0));
    }, [totalAmount, paidAmount]);

    // Inertia form (edit)
    const form = useForm({
        supplier_id: purchase?.supplier_id || "",
        adjust_from_advance: purchase?.payment_type === "advance_adjustment" ? true : false,
        warehouse_id: purchase?.warehouse_id || "",
        purchase_date: purchase?.purchase_date || new Date().toISOString().split("T")[0],
        notes: purchase?.notes || "",
        paid_amount: Number(purchase?.paid_amount || 0),
        payment_status: purchase?.payment_status || "unpaid",
        items: [],
        use_partial_payment: false,
        manual_payment_override: false,
        account_id: purchase?.payments?.[0]?.account_id || "",
        payment_method: purchase?.payments?.[0]?.payment_method || purchase?.payment_type || "cash",
        txn_ref: purchase?.payments?.[0]?.txn_ref || "",
    });

    // Extract brands
    useEffect(() => {
        if (products && products.length > 0) {
            const allBrands = new Set();
            products.forEach((product) => {
                if (product.brand && product.brand.name) allBrands.add(product.brand.name);
                if (product.variants) {
                    product.variants.forEach((variant) => {
                        if (variant.attribute_values) {
                            Object.keys(variant.attribute_values).forEach((key) => allBrands.add(key));
                        }
                    });
                }
            });
            setBrands(Array.from(allBrands).sort());
        }
    }, [products]);

    // Load purchase items -> selectedItems + unit states
    useEffect(() => {
        if (!purchase) return;

        const supplier = suppliers?.find((s) => s.id == purchase.supplier_id);
        setSelectedSupplier(supplier || null);

        // compute advance
        if (supplier) {
            let advance = 0;
            if (supplier.advance_amount !== undefined) {
                advance = parseFloat(supplier.advance_amount) || 0;
            } else {
                const supplierAdvance = parseFloat(supplier.advance || 0);
                const supplierDue = parseFloat(supplier.due || 0);
                advance = Math.max(0, supplierAdvance - supplierDue);
            }
            setAvailableAdvance(advance);
        } else {
            setAvailableAdvance(0);
        }

        const items = (purchase.items || []).map((it) => {
            const product = it.product || products?.find((p) => p.id == it.product_id);
            const variant = it.variant || product?.variants?.find((v) => v.id == it.variant_id) || {};

            const variantIdentifier = buildVariantIdentifier(variant);
            const itemKey = `${it.product_id}-${it.variant_id}-${variantIdentifier}`;

            const units = getAvailableUnitsForProduct(product);
            const defaultUnit = it.unit || product?.default_unit || units[0] || "piece";
            const saleUnits = getAvailableSaleUnits(product, defaultUnit);

            // ✅ IMPORTANT: show current stock qty, not purchase qty
            const purchaseQty = Number(it.unit_quantity ?? it.quantity ?? 0);
            const stockQty = Number(it?.stock_details?.quantity ?? 0);

            // ✅ Your requirement: show stock qty in input (if stock exists)
            const shownQty = stockQty > 0 ? stockQty : (purchaseQty || 1);

            // set per-item unit states
            setProductUnits((prev) => ({ ...prev, [itemKey]: units }));
            setSelectedUnits((prev) => ({ ...prev, [itemKey]: defaultUnit }));
            setUnitQuantities((prev) => ({ ...prev, [itemKey]: shownQty }));
            setAvailableSaleUnits((prev) => ({ ...prev, [itemKey]: saleUnits }));

            const brandName = product?.brand?.name || "Unknown";

            return {
                // ✅ MUST send item id to backend
                id: it.id,

                uniqueKey: itemKey,
                product_id: it.product_id,
                variant_id: it.variant_id,
                product_name: product?.name || it.product_name || "Unknown",
                brand_name: brandName,
                variant_name: formatVariantName(variant),
                variant_identifier: variantIdentifier,

                // helpful debug display
                purchase_qty: purchaseQty,
                stock_qty: stockQty,

                // stock meta
                stock_id: it?.stock_details?.id ?? null,
                batch_no: it?.stock_details?.batch_no ?? null,
                barcode: it?.stock_details?.barcode ?? null,

                quantity: shownQty,
                unit_quantity: shownQty,
                unit: defaultUnit,
                sale_unit: it.sale_unit || defaultUnit,
                unit_price: Number(it.unit_price || 0),
                sale_price: Number(it.sale_price || 0),
                total_price: shownQty * Number(it.unit_price || 0),
                attributes: variant?.attribute_values || {},
            };
        });

        setSelectedItems(items);

        setPaymentStatus(purchase.payment_status || "unpaid");
        setPaidAmount(Number(purchase.paid_amount || 0));

        if (isShadowUser) {
            setPaymentStatus("unpaid");
            setPaidAmount(0);
            form.setData("account_id", "");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [purchase, suppliers, products, isShadowUser]);

    // Sync form.items from selectedItems
    useEffect(() => {
        const itemsWithUnits = selectedItems.map((item) => ({
            id: item.id, // ✅ keep purchase_item_id for delta-sync update
            product_id: item.product_id,
            variant_id: item.variant_id,
            unit: item.unit || "piece",
            unit_quantity: item.unit_quantity || item.quantity || 1,
            quantity: item.unit_quantity || item.quantity || 1,
            unit_price: item.unit_price,
            total_price: item.total_price,
            sale_price: item.sale_price,
            sale_unit: item.sale_unit || item.unit || "piece",
            attributes: item.attributes || {},
        }));
        form.setData("items", itemsWithUnits);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedItems]);

    // Sync payment state to form
    useEffect(() => {
        const formData = {
            ...form.data,
            paid_amount: paidAmount,
            payment_status: paymentStatus,
            use_partial_payment: usePartialPayment,
            adjust_from_advance: adjustFromAdvance,
            manual_payment_override: manualPaymentOverride,
        };

        if (isShadowUser) {
            formData.paid_amount = 0;
            formData.payment_status = "unpaid";
            formData.account_id = "";
        }

        form.setData(formData);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paidAmount, paymentStatus, usePartialPayment, adjustFromAdvance, manualPaymentOverride, isShadowUser]);

    const handleSupplierChange = (e) => {
        const supplierId = e.target.value;
        form.setData("supplier_id", supplierId);

        const supplier = suppliers?.find((s) => s.id == supplierId);
        setSelectedSupplier(supplier || null);

        if (supplier) {
            let advance = 0;
            if (supplier.advance_amount !== undefined) {
                advance = parseFloat(supplier.advance_amount) || 0;
            } else {
                const supplierAdvance = parseFloat(supplier.advance || 0);
                const supplierDue = parseFloat(supplier.due || 0);
                advance = Math.max(0, supplierAdvance - supplierDue);
            }
            setAvailableAdvance(advance);
        } else {
            setAvailableAdvance(0);
        }

        setUsePartialPayment(false);
        setAdjustFromAdvance(false);
        setManualPaymentOverride(false);
    };

    // Auto adjust from advance
    useEffect(() => {
        if (adjustFromAdvance && availableAdvance > 0 && !manualPaymentOverride) {
            const total = Number(calculateTotal()) || 0;
            const maxAdjustable = Math.min(availableAdvance, total);

            const autoPaid = Math.min(maxAdjustable, total);
            setPaidAmount(autoPaid);

            if (autoPaid >= total && total > 0) setPaymentStatus("paid");
            else if (autoPaid > 0) setPaymentStatus("partial");
            else setPaymentStatus("unpaid");
        }
    }, [adjustFromAdvance, availableAdvance, manualPaymentOverride, calculateTotal]);

    const enableManualPaymentOverride = () => {
        setManualPaymentOverride(true);
        setAdjustFromAdvance(false);
        if (paymentStatus === "unpaid") form.setData("account_id", "");
    };

    const disableManualPaymentOverride = () => {
        setManualPaymentOverride(false);
        const total = Number(calculateTotal()) || 0;
        setPaidAmount(paymentStatus === "unpaid" ? 0 : total);
        if (paymentStatus === "unpaid") form.setData("account_id", "");
    };

    const handleManualPaymentInput = (e) => {
        const value = parseFloat(e.target.value) || 0;
        const total = Number(calculateTotal()) || 0;

        setPaidAmount(value);

        if (value === 0) {
            setPaymentStatus("unpaid");
            form.setData("account_id", "");
        } else if (value >= total && total > 0) {
            setPaymentStatus("paid");
        } else {
            setPaymentStatus("partial");
        }
    };

    const handlePaymentStatusChange = (status) => {
        setPaymentStatus(status);
        const total = Number(calculateTotal()) || 0;

        if (status === "paid") {
            setPaidAmount(total);
            setManualPaymentOverride(false);
            setAdjustFromAdvance(false);
        } else if (status === "unpaid") {
            setPaidAmount(0);
            setManualPaymentOverride(false);
            setAdjustFromAdvance(false);
            form.setData("account_id", "");
        } else if (status === "partial") {
            setManualPaymentOverride(true);
            setAdjustFromAdvance(false);
        }
    };

    // Product dropdown filter
    useEffect(() => {
        if (productSearch.trim()) {
            let filtered = products || [];

            if (selectedBrand) {
                filtered = filtered.filter((product) => {
                    if (product.brand?.name === selectedBrand) return true;
                    return product.variants?.some(
                        (variant) =>
                            variant.attribute_values &&
                            Object.keys(variant.attribute_values).includes(selectedBrand)
                    );
                });
            }

            filtered = filtered.filter(
                (product) =>
                    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                    product.product_no.toLowerCase().includes(productSearch.toLowerCase()) ||
                    (product.brand?.name &&
                        product.brand.name.toLowerCase().includes(productSearch.toLowerCase()))
            );

            setFilteredProducts(filtered);
            setShowDropdown(true);
        } else if (selectedBrand) {
            const filtered = (products || []).filter((product) => {
                if (product.brand?.name === selectedBrand) return true;
                return product.variants?.some(
                    (variant) =>
                        variant.attribute_values &&
                        Object.keys(variant.attribute_values).includes(selectedBrand)
                );
            });
            setFilteredProducts(filtered);
            setShowDropdown(true);
        } else {
            setFilteredProducts([]);
            setShowDropdown(false);
        }
    }, [productSearch, products, selectedBrand]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const addItem = (product, variant) => {
        const variantIdentifier = buildVariantIdentifier(variant);
        const itemKey = `${product.id}-${variant.id}-${variantIdentifier}`;

        const units = getAvailableUnitsForProduct(product);
        const defaultUnit = product.default_unit || units[0] || "piece";
        const saleUnits = getAvailableSaleUnits(product, defaultUnit);

        setProductUnits((prev) => ({ ...prev, [itemKey]: units }));
        setSelectedUnits((prev) => ({ ...prev, [itemKey]: defaultUnit }));
        setUnitQuantities((prev) => ({ ...prev, [itemKey]: 1 }));
        setAvailableSaleUnits((prev) => ({ ...prev, [itemKey]: saleUnits }));

        const existingIndex = selectedItems.findIndex(
            (it) =>
                it.product_id === product.id &&
                it.variant_id === variant.id &&
                it.variant_identifier === variantIdentifier
        );

        if (existingIndex !== -1) {
            const updated = [...selectedItems];
            const item = updated[existingIndex];
            const newQty = (Number(item.unit_quantity) || 1) + 1;

            item.unit_quantity = newQty;
            item.quantity = newQty;
            item.total_price = newQty * (Number(item.unit_price) || 0);

            setSelectedItems(updated);
            setUnitQuantities((prev) => ({ ...prev, [itemKey]: newQty }));
        } else {
            const unitCost = Number(variant.unit_cost || 0);
            const salePrice = Number(variant.selling_price || unitCost * 1.2);
            const brandName = product.brand?.name || "Unknown";

            setSelectedItems((prev) => [
                ...prev,
                {
                    id: null, // new item
                    uniqueKey: itemKey,
                    product_id: product.id,
                    variant_id: variant.id,
                    product_name: product.name,
                    brand_name: brandName,
                    variant_name: formatVariantName(variant),
                    variant_identifier: variantIdentifier,
                    selected_brand: selectedBrand,

                    purchase_qty: 0,
                    stock_qty: 0,
                    stock_id: null,
                    batch_no: null,
                    barcode: null,

                    quantity: 1,
                    unit_quantity: 1,
                    unit: defaultUnit,
                    sale_unit: saleUnits[0] || defaultUnit,
                    unit_price: unitCost,
                    sale_price: salePrice,
                    total_price: unitCost * 1,
                    attributes: variant.attribute_values || {},
                },
            ]);
        }

        setProductSearch("");
        setShowDropdown(false);
        setSelectedBrand(null);
    };

    const removeItem = (index) => {
        const updated = [...selectedItems];
        const itemKey = updated[index]?.uniqueKey;

        const newProductUnits = { ...productUnits };
        const newSelectedUnits = { ...selectedUnits };
        const newUnitQuantities = { ...unitQuantities };
        const newAvailableSaleUnits = { ...availableSaleUnits };

        delete newProductUnits[itemKey];
        delete newSelectedUnits[itemKey];
        delete newUnitQuantities[itemKey];
        delete newAvailableSaleUnits[itemKey];

        setProductUnits(newProductUnits);
        setSelectedUnits(newSelectedUnits);
        setUnitQuantities(newUnitQuantities);
        setAvailableSaleUnits(newAvailableSaleUnits);

        updated.splice(index, 1);
        setSelectedItems(updated);
    };

    const updateItem = (index, field, value) => {
        const updated = [...selectedItems];
        const item = updated[index];
        if (!item) return;

        const itemKey = item.uniqueKey;

        if (field === "unit_quantity" || field === "quantity") {
            const numericValue = parseFloat(value) || 0;
            item[field] = numericValue;
            item.quantity = numericValue;
            setUnitQuantities((prev) => ({ ...prev, [itemKey]: numericValue }));
            item.total_price = (numericValue || 0) * (Number(item.unit_price) || 0);
        } else if (field === "unit") {
            item[field] = value;
            setSelectedUnits((prev) => ({ ...prev, [itemKey]: value }));

            const product = products.find((p) => p.id === item.product_id);
            if (product) {
                const saleUnits = getAvailableSaleUnits(product, value);
                setAvailableSaleUnits((prev) => ({ ...prev, [itemKey]: saleUnits }));
                if (!saleUnits.includes(item.sale_unit || item.unit)) {
                    item.sale_unit = saleUnits[0] || value;
                }
            }
        } else if (field === "sale_unit") {
            item[field] = value;
        } else if (field === "unit_price") {
            const numericValue = parseFloat(value) || 0;
            item[field] = numericValue;
            item.total_price = (Number(item.unit_quantity) || 1) * numericValue;
        } else if (field === "sale_price") {
            const numericValue = parseFloat(value) || 0;
            item[field] = numericValue;
        } else {
            const numericValue = parseFloat(value) || 0;
            item[field] = numericValue;
        }

        setSelectedItems(updated);
    };

    const clearBrandFilter = () => {
        setSelectedBrand(null);
        setProductSearch("");
        setFilteredProducts([]);
        setShowDropdown(false);
    };

    const selectedAccount = form.data.account_id
        ? accounts.find((acc) => acc.id == form.data.account_id)
        : null;

    const submit = (e) => {
        e.preventDefault();

        if (selectedItems.length === 0) {
            alert(t("purchase.no_items_selected", "Please add at least one item"));
            return;
        }

        if (!form.data.supplier_id) {
            alert(t("purchase.no_supplier_selected", "Please select a supplier"));
            return;
        }

        if (!form.data.warehouse_id) {
            alert(t("purchase.no_warehouse_selected", "Please select a warehouse"));
            return;
        }

        if (!isShadowUser) {
            for (const item of selectedItems) {
                if ((Number(item.unit_price) || 0) <= 0) {
                    alert(`Item "${item.product_name}" has invalid unit price`);
                    return;
                }
                if ((Number(item.sale_price) || 0) <= 0) {
                    alert(`Item "${item.product_name}" has invalid sale price`);
                    return;
                }
                if ((Number(item.unit_quantity) || 0) <= 0) {
                    alert(`Item "${item.product_name}" has invalid quantity`);
                    return;
                }
            }

            if ((Number(paidAmount) || 0) > 0 && !form.data.account_id) {
                alert("Please select a payment account for the payment");
                return;
            }

            if (form.data.account_id && (Number(paidAmount) || 0) > 0) {
                const acc = accounts.find((a) => a.id == form.data.account_id);
                if (acc && Number(acc.current_balance) < Number(paidAmount)) {
                    alert(
                        `Insufficient balance in ${acc.name}. Available: ৳${formatCurrency(
                            acc.current_balance
                        )}. Deposit more funds to this account before proceeding.`
                    );
                    return;
                }
            }
        }

        const itemsToSubmit = selectedItems.map((item) => {
    const remainingQty = Number(item.unit_quantity || item.quantity || 0);

    // ✅ sold qty from original data (purchase - current stock)
    const purchaseQtyOriginal = Number(item.purchase_qty || 0);
    const stockQtyOriginal = Number(item.stock_qty || 0);
    const soldQty = Math.max(0, purchaseQtyOriginal - stockQtyOriginal);

    // ✅ If it's an old item, we submit PURCHASE qty = sold + remaining
    const submitQty = item.id ? (soldQty + remainingQty) : remainingQty;

    const unitPrice = Number(item.unit_price || 0);

    return {
        id: item.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        unit: item.unit || "piece",
        unit_quantity: submitQty,
        quantity: submitQty,
        unit_price: unitPrice,
        sale_price: Number(item.sale_price || 0),
        total_price: submitQty * unitPrice,
        sale_unit: item.sale_unit || item.unit || "piece",
        attributes: item.attributes || {},
    };
});

        const submitData = {
            ...form.data,
            items: itemsToSubmit,
            paid_amount: paidAmount,
            payment_status: paymentStatus,
            adjust_from_advance: adjustFromAdvance,
            manual_payment_override: manualPaymentOverride,
        };

        form.put(route("purchase.update", purchase.id), {
            data: submitData,
            preserveScroll: true,
            onSuccess: () => router.visit(route("purchase.list")),
            onError: (errors) => {
                alert(errors.error || errors.advance_adjustment || "Update failed");
                console.error("Update errors:", errors);
            },
        });
    };

    return (
        <div className={`bg-white rounded-box p-5 ${locale === "bn" ? "bangla-font" : ""}`}>
            <PageHeader
                title={isShadowUser ? "Edit Purchase (Shadow Mode)" : "Edit Purchase"}
                subtitle="Update products, units, pricing, and payment"
            >
                <button
                    onClick={() => router.visit(route("purchase.list"))}
                    className="btn btn-sm btn-ghost hover:bg-gray-100 font-bold uppercase tracking-widest text-xs"
                    type="button"
                >
                    <ArrowLeft size={15} /> {t("purchase.back_to_list", "Back to List")}
                </button>
            </PageHeader>

            <form onSubmit={submit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Left */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="form-control">
                            <label className="label py-1">
                                <span className="label-text font-bold text-gray-600">
                                    {t("purchase.supplier", "Supplier")} *
                                </span>
                            </label>
                            <select
                                className="select select-bordered w-full rounded-xl focus:border-red-600"
                                value={form.data.supplier_id}
                                onChange={handleSupplierChange}
                                required
                            >
                                <option value="">{t("purchase.select_supplier", "Select Supplier")}</option>
                                {suppliers?.map((supplier) => (
                                    <option key={supplier.id} value={supplier.id}>
                                        {supplier.name} - {supplier.company}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedSupplier && (
                            <div className="card card-compact bg-gray-50 border border-gray-200 rounded-2xl">
                                <div className="card-body">
                                    <h3 className="card-title text-sm font-black uppercase text-gray-900 flex items-center gap-2">
                                        <User size={16} className="text-red-600" />
                                        Supplier Details
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <User size={12} className="text-gray-400" />
                                            <span className="font-bold">{selectedSupplier.name}</span>
                                        </div>
                                        {selectedSupplier.company && (
                                            <div className="flex items-center gap-2">
                                                <Building size={12} className="text-gray-400" />
                                                <span>{selectedSupplier.company}</span>
                                            </div>
                                        )}
                                        {availableAdvance > 0 && (
                                            <div className="flex items-center gap-2 pt-1 border-t border-gray-200">
                                                <DollarSign size={12} className="text-red-600" />
                                                <span className="text-xs font-black uppercase text-red-600 tracking-tighter">
                                                    Available Advance: ৳{formatCurrency(availableAdvance)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {availableAdvance > 0 && !isShadowUser && (
                                        <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={adjustFromAdvance}
                                                    onChange={(e) => setAdjustFromAdvance(e.target.checked)}
                                                    className="checkbox checkbox-xs checkbox-error"
                                                />
                                                <span className="text-[10px] font-bold uppercase">Use Advance</span>
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="form-control">
                            <label className="label py-1">
                                <span className="label-text font-bold text-gray-600">
                                    {t("purchase.warehouse", "Warehouse")} *
                                </span>
                            </label>
                            <select
                                className="select select-bordered w-full rounded-xl"
                                value={form.data.warehouse_id}
                                onChange={(e) => form.setData("warehouse_id", e.target.value)}
                                required
                            >
                                <option value="">{t("purchase.select_warehouse", "Select Warehouse")}</option>
                                {warehouses?.map((warehouse) => (
                                    <option key={warehouse.id} value={warehouse.id}>
                                        {warehouse.name} ({warehouse.code})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-control">
                            <label className="label py-1">
                                <span className="label-text font-bold text-gray-600">
                                    {t("purchase.purchase_date", "Purchase Date")} *
                                </span>
                            </label>
                            <input
                                type="date"
                                className="input input-bordered w-full rounded-xl"
                                value={form.data.purchase_date}
                                onChange={(e) => form.setData("purchase_date", e.target.value)}
                                required
                            />
                        </div>

                        {/* Payment */}
                        {!isShadowUser && (
                            <div className="card card-compact bg-[#1e4d2b] text-white border border-gray-800 rounded-2xl shadow-lg">
                                <div className="card-body">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="card-title text-sm font-black uppercase text-red-500 flex items-center gap-2">
                                            <DollarSign size={16} /> Payment
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={manualPaymentOverride ? disableManualPaymentOverride : enableManualPaymentOverride}
                                            className="btn btn-xs bg-red-600 hover:bg-red-700 border-none text-white font-black text-[10px] uppercase"
                                        >
                                            {manualPaymentOverride ? <X size={10} /> : <Edit size={10} />}
                                            {manualPaymentOverride ? "Cancel" : "Manual"}
                                        </button>
                                    </div>

                                    <div className="form-control mb-3">
                                        <label className="label py-0">
                                            <span className="label-text text-[10px] text-gray-400 uppercase font-black tracking-widest">
                                                Payment Account {(paymentStatus === "paid" || paymentStatus === "partial") && "*"}
                                            </span>
                                        </label>
                                        <select
                                            className={`select select-bordered select-sm w-full bg-gray-800 border-gray-700 text-white ${
                                                (paymentStatus === "paid" || paymentStatus === "partial") && !form.data.account_id
                                                    ? "border-red-500"
                                                    : ""
                                            }`}
                                            value={form.data.account_id}
                                            onChange={(e) => form.setData("account_id", e.target.value)}
                                            required={paymentStatus === "paid" || paymentStatus === "partial"}
                                            disabled={paymentStatus === "unpaid"}
                                        >
                                            <option value="">
                                                {paymentStatus === "unpaid"
                                                    ? "Not required (unpaid purchase)"
                                                    : "Select Payment Account"}
                                            </option>
                                            {accounts?.map((account) => (
                                                <option key={account.id} value={account.id}>
                                                    {account.name} (৳{formatCurrency(account.current_balance)})
                                                </option>
                                            ))}
                                        </select>

                                        {(paymentStatus === "paid" || paymentStatus === "partial") && !form.data.account_id && (
                                            <div className="text-red-400 text-xs mt-1">
                                                Please select a payment account for {paymentStatus} purchases
                                            </div>
                                        )}

                                        {selectedAccount && (
                                            <div className="mt-2 p-2 bg-gray-800 rounded-lg border border-gray-700">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {getAccountIcon(selectedAccount.type)}
                                                        <span className="text-xs font-bold">{selectedAccount.name}</span>
                                                        <span className="text-xs text-gray-400 capitalize">({selectedAccount.type})</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-[10px] text-gray-400">Balance</div>
                                                        <div className="text-xs font-mono font-bold">
                                                            ৳{formatCurrency(selectedAccount.current_balance)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="form-control mb-3">
                                        <select
                                            className="select select-bordered select-sm w-full bg-gray-800 border-gray-700 text-white"
                                            value={paymentStatus}
                                            onChange={(e) => handlePaymentStatusChange(e.target.value)}
                                        >
                                            <option value="unpaid">Unpaid</option>
                                            <option value="partial">Partial</option>
                                            <option value="paid">Paid</option>
                                        </select>
                                    </div>

                                    <div className="form-control mb-3">
                                        <label className="label py-1">
                                            <span className="label-text text-[10px] text-gray-400 uppercase font-black tracking-widest">
                                                Paid Amount
                                            </span>
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="input input-bordered input-sm w-full bg-gray-800 border-gray-700 font-mono"
                                            value={paidAmount}
                                            onChange={handleManualPaymentInput}
                                            disabled={!manualPaymentOverride && adjustFromAdvance}
                                        />
                                    </div>

                                    <div className="space-y-1 text-xs pt-2 border-t border-gray-800 mt-2 font-bold uppercase tracking-tighter">
                                        <div className="flex justify-between">
                                            <span>Gross:</span>
                                            <span>৳{formatCurrency(totalAmount)}</span>
                                        </div>
                                        <div className="flex justify-between text-red-500 font-black">
                                            <span>Due:</span>
                                            <span>৳{formatCurrency(dueAmount)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        <div className="form-control">
                            <label className="label py-1">
                                <span className="label-text font-bold text-gray-600">
                                    {t("purchase.notes", "Notes")}
                                </span>
                            </label>
                            <textarea
                                className="textarea textarea-bordered w-full rounded-xl"
                                rows="3"
                                value={form.data.notes}
                                onChange={(e) => form.setData("notes", e.target.value)}
                                placeholder={t("purchase.notes_placeholder", "Additional notes or instructions...")}
                            />
                        </div>
                    </div>

                    {/* Right */}
                    <div className="lg:col-span-2">
                        <div className="form-control mb-4 relative" ref={searchRef}>
                            <label className="label py-1">
                                <span className="label-text font-bold text-gray-600">
                                    {t("purchase.add_products", "Add Components")} *
                                </span>
                            </label>

                            <div className="relative">
                                <input
                                    type="text"
                                    className="input input-bordered w-full pr-10 rounded-xl h-12 border-gray-300 focus:border-red-600"
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    placeholder={selectedBrand ? `Search ${selectedBrand} parts...` : "Search part number or name..."}
                                />
                                <Search size={18} className="absolute right-3 top-3.5 text-gray-400" />
                                {selectedBrand && (
                                    <div className="absolute left-3 top-3">
                                        <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-0.5 rounded">
                                            {selectedBrand}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {showDropdown && filteredProducts.length > 0 && (
                                <div
                                    ref={dropdownRef}
                                    className="absolute z-50 w-full mt-14 bg-white border-2 border-gray-900 rounded-xl shadow-2xl overflow-hidden max-h-96 overflow-y-auto"
                                >
                                    {filteredProducts.map((product) => (
                                        <div key={product.id} className="border-b border-gray-100 last:border-0">
                                            <div className="bg-gray-100 px-4 py-1.5 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                {product.name} ({product.product_no})
                                                {product.brand?.name && (
                                                    <span className="ml-2 text-red-600">Brand: {product.brand.name}</span>
                                                )}
                                                {product.unit_type && product.unit_type !== "piece" && (
                                                    <span className="ml-2 text-blue-600">
                                                        Unit: {product.default_unit?.toUpperCase() || "PIECE"}
                                                    </span>
                                                )}
                                            </div>

                                            {product.variants?.map((variant) => {
                                                const variantMatchesBrand = () => {
                                                    if (!selectedBrand) return true;
                                                    const keys = Object.keys(variant.attribute_values || {});
                                                    return keys.includes(selectedBrand) || product.brand?.name === selectedBrand;
                                                };
                                                if (!variantMatchesBrand()) return null;

                                                const variantName = formatVariantName(variant);

                                                return (
                                                    <div
                                                        key={variant.id}
                                                        className="p-3 hover:bg-red-50 cursor-pointer flex justify-between items-center transition-colors border-b border-dashed border-gray-100 last:border-none"
                                                        onClick={() => addItem(product, variant)}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-xs text-gray-800">{variantName}</span>
                                                            {variant.sku && (
                                                                <span className="text-[10px] text-gray-500 mt-1">SKU: {variant.sku}</span>
                                                            )}
                                                            {product.unit_type && product.unit_type !== "piece" && (
                                                                <span className="text-[10px] text-blue-600 mt-1">
                                                                    <Ruler size={10} className="inline mr-1" />
                                                                    {product.unit_type.toUpperCase()} product
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-mono text-xs font-black text-gray-900">
                                                                ৳{formatCurrency(variant.unit_cost)}
                                                            </div>
                                                            {variant.attribute_values && Object.keys(variant.attribute_values).length > 0 && (
                                                                <div className="text-[10px] text-gray-500 mt-1">
                                                                    {Object.keys(variant.attribute_values).length} attributes
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {selectedItems.length > 0 ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                                    <h3 className="font-black uppercase tracking-widest text-xs text-gray-900">
                                        {t("purchase.selected_items", "Itemized Registry")}
                                    </h3>
                                    <div className="text-xs text-gray-500">
                                        {selectedItems.length} items • Total: ৳{formatCurrency(totalAmount)}
                                    </div>
                                </div>

                                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                                    {selectedItems.map((item, index) => {
                                        const itemKey = item.uniqueKey;
                                        const availableUnits = productUnits[itemKey] || ["piece"];
                                        const selectedUnit = selectedUnits[itemKey] || availableUnits[0];
                                        const unitQuantity = unitQuantities[itemKey] || item.quantity || 1;
                                        const saleUnits = availableSaleUnits[itemKey] || [selectedUnit];

                                        const showStockMismatch =
                                            Number(item.purchase_qty || 0) > 0 &&
                                            Number(item.stock_qty || 0) >= 0 &&
                                            Number(item.stock_qty || 0) !== Number(item.purchase_qty || 0);

                                        return (
                                            <div
                                                key={itemKey}
                                                className="card card-compact bg-white border border-gray-200 rounded-xl shadow-sm hover:border-red-600 transition-colors"
                                            >
                                                <div className="card-body">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <h4 className="font-black text-gray-900 uppercase text-xs">
                                                                {item.product_name}
                                                            </h4>

                                                            <p className="text-xs text-gray-700 font-medium mt-2">
                                                                {item.variant_name}
                                                            </p>

                                                            {/* ✅ show purchased vs current stock + batch */}
                                                            <div className="mt-2 flex flex-wrap gap-2 items-center">
                                                                <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                                                    Purchased: <b>{Number(item.purchase_qty || 0)}</b>
                                                                </span>
                                                                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                                                                    In Stock: <b>{Number(item.stock_qty || 0)}</b>
                                                                </span>

                                                                {item.batch_no && (
                                                                    <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded inline-flex items-center gap-1">
                                                                        <Barcode size={12} /> {item.batch_no}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {showStockMismatch && (
                                                                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded flex items-start gap-2">
                                                                    <AlertTriangle size={16} className="text-amber-600 mt-0.5" />
                                                                    <div className="text-xs text-amber-800">
                                                                        <b>Note:</b> Purchase qty and current stock are different because
                                                                        some quantity was sold/used. Edit qty carefully.
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {item.attributes && Object.keys(item.attributes).length > 0 && (
                                                                <div className="mt-2">
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {Object.entries(item.attributes).map(([k, v], idx) => (
                                                                            <span
                                                                                key={idx}
                                                                                className="text-[9px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded"
                                                                            >
                                                                                <span className="font-bold">{k}:</span> {String(v)}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => removeItem(index)}
                                                            className="btn btn-xs btn-ghost text-red-600 hover:bg-red-50"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>

                                                    {/* Unit Settings */}
                                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Ruler size={14} className="text-blue-600" />
                                                            <span className="text-xs font-bold text-gray-700">
                                                                Unit Settings
                                                            </span>
                                                        </div>

                                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                                                            <div className="form-control">
                                                                <label className="label py-0">
                                                                    <span className="label-text text-[9px] uppercase font-black text-gray-400">
                                                                        Purchase Unit
                                                                    </span>
                                                                </label>
                                                                <select
                                                                    className="select select-bordered select-sm w-full"
                                                                    value={selectedUnit}
                                                                    onChange={(e) => updateItem(index, "unit", e.target.value)}
                                                                >
                                                                    {availableUnits.map((unit) => (
                                                                        <option key={unit} value={unit}>
                                                                            {unit.toUpperCase()}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            <div className="form-control">
                                                                <label className="label py-0">
                                                                    <span className="label-text text-[9px] uppercase font-black text-gray-400">
                                                                        Qty (EDIT)
                                                                    </span>
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    step="0.001"
                                                                    min="0.001"
                                                                    className="input input-bordered input-sm w-full font-black rounded-lg"
                                                                    value={unitQuantity}
                                                                    onChange={(e) => updateItem(index, "unit_quantity", e.target.value)}
                                                                />
                                                                <div className="text-[8px] text-gray-500 mt-1">
                                                                    In {selectedUnit.toUpperCase()}
                                                                </div>
                                                            </div>

                                                            <div className="form-control">
                                                                <label className="label py-0">
                                                                    <span className="label-text text-[9px] uppercase font-black text-gray-400">
                                                                        Sale Unit
                                                                    </span>
                                                                </label>
                                                                <select
                                                                    className="select select-bordered select-sm w-full"
                                                                    value={item.sale_unit || selectedUnit}
                                                                    onChange={(e) => updateItem(index, "sale_unit", e.target.value)}
                                                                >
                                                                    {saleUnits.map((unit) => (
                                                                        <option key={unit} value={unit}>
                                                                            {unit.toUpperCase()}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <div className="text-[8px] text-gray-500 mt-1">For selling</div>
                                                            </div>

                                                            <div className="form-control">
                                                                <label className="label py-0">
                                                                    <span className="label-text text-[9px] uppercase font-black text-gray-400">
                                                                        Unit Cost
                                                                    </span>
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    className="input input-bordered input-sm w-full font-mono text-xs rounded-lg"
                                                                    value={item.unit_price || 0}
                                                                    onChange={(e) => updateItem(index, "unit_price", e.target.value)}
                                                                />
                                                                <div className="text-[8px] text-gray-500 mt-1">
                                                                    Per {selectedUnit.toUpperCase()}
                                                                </div>
                                                            </div>

                                                            <div className="form-control">
                                                                <label className="label py-0">
                                                                    <span className="label-text text-[9px] uppercase font-black text-gray-400">
                                                                        Sale Price
                                                                    </span>
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    className="input input-bordered input-sm w-full font-mono text-xs rounded-lg"
                                                                    value={item.sale_price || 0}
                                                                    onChange={(e) => updateItem(index, "sale_price", e.target.value)}
                                                                />
                                                                <div className="text-[8px] text-gray-500 mt-1">
                                                                    Per {item.sale_unit || selectedUnit}
                                                                </div>
                                                            </div>

                                                            <div className="md:col-span-5 text-right pt-2 border-t border-gray-200">
                                                                <span className="text-[9px] uppercase font-black text-gray-400 block mb-1">
                                                                    Total Cost
                                                                </span>
                                                                <span className="font-mono text-sm font-black text-red-600">
                                                                    ৳{formatCurrency(item.total_price || 0)}
                                                                </span>
                                                                <div className="text-[8px] text-gray-500 mt-1">
                                                                    {unitQuantity} {selectedUnit.toUpperCase()} × ৳{formatCurrency(item.unit_price || 0)}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {selectedUnit !== (item.sale_unit || selectedUnit) && (
                                                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                                                                <div className="text-xs text-blue-800">
                                                                    <strong>Note:</strong> Purchase in{" "}
                                                                    {selectedUnit.toUpperCase()}, sell in{" "}
                                                                    {(item.sale_unit || selectedUnit).toUpperCase()}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-gray-200 rounded-2xl py-16 text-center">
                                <Package size={40} className="mx-auto text-gray-300 mb-3" />
                                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">
                                    {selectedBrand ? `No ${selectedBrand} items added` : "Registry Empty"}
                                </p>
                                <p className="text-gray-300 text-xs mt-2">
                                    {selectedBrand ? `Search for ${selectedBrand} parts above` : "Search for products above to add them"}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Summary */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">
                                    Gross Total
                                </div>
                                <div className="text-2xl font-black text-gray-900">
                                    ৳{formatCurrency(totalAmount)}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">
                                    Paid Amount
                                </div>
                                <div className={`text-2xl font-black ${paidAmount > 0 ? "text-green-600" : "text-gray-400"}`}>
                                    ৳{formatCurrency(paidAmount)}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">
                                    Due Amount
                                </div>
                                <div className={`text-2xl font-black ${dueAmount > 0 ? "text-red-600" : "text-gray-400"}`}>
                                    ৳{formatCurrency(dueAmount)}
                                </div>
                            </div>
                        </div>

                        {selectedAccount && !isShadowUser && (
                            <div className="mt-4 p-4 bg-white rounded-xl border border-gray-300">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {getAccountIcon(selectedAccount.type)}
                                        <div>
                                            <div className="text-sm font-bold text-gray-900">{selectedAccount.name}</div>
                                            <div className="text-xs text-gray-500 capitalize">
                                                {selectedAccount.type} Account
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-500">Current Balance</div>
                                        <div className="text-sm font-mono font-bold">
                                            ৳{formatCurrency(selectedAccount.current_balance)}
                                        </div>
                                        <div className="text-xs text-red-500 mt-1">
                                            After payment: ৳{formatCurrency(Number(selectedAccount.current_balance) - Number(paidAmount || 0))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
                    <div className="flex-1">
                        <h4 className="font-bold text-gray-900 uppercase text-sm">
                            {isShadowUser ? "Shadow Purchase Summary" : "Purchase Summary"}
                        </h4>
                        <p className="text-xs text-gray-500">{selectedItems.length} items selected</p>
                        {selectedBrand && (
                            <button
                                type="button"
                                onClick={clearBrandFilter}
                                className="btn btn-xs btn-ghost text-gray-500 hover:text-gray-700 mt-2"
                            >
                                Clear Brand Filter
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-2xl font-black text-gray-900">৳{formatCurrency(totalAmount)}</div>
                            <div className="text-xs text-gray-500">Total Amount</div>
                        </div>

                        <button
                            type="submit"
                            className={`btn rounded-xl px-10 font-black uppercase text-xs tracking-[0.2em] shadow-lg ${
                                isShadowUser
                                    ? "bg-amber-500 hover:bg-amber-600 text-black border-none"
                                    : "bg-red-600 hover:bg-red-700 text-white border-none"
                            }`}
                            disabled={form.processing || selectedItems.length === 0}
                        >
                            {form.processing ? (
                                <div className="loading loading-spinner loading-sm"></div>
                            ) : (
                                "Update Purchase"
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}