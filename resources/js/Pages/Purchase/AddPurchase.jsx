import React, { useState, useEffect, useRef, useCallback } from "react";
import PageHeader from "../../components/PageHeader";
import { useForm, router } from "@inertiajs/react";
import {
    ArrowLeft,
    Plus,
    Trash2,
    Search,
    Shield,
    DollarSign,
    User,
    Package,
    Building,
    Phone,
    Mail,
    MapPin,
    Info,
    Edit,
    X,
    Filter,
    Tag,
    CreditCard,
    Wallet,
    Landmark,
    Smartphone,
    Ruler,
} from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";

export default function AddPurchase({
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
    const [selectedItems, setSelectedItems] = useState([]);
    const [productSearch, setProductSearch] = useState("");
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [paymentStatus, setPaymentStatus] = useState("unpaid");
    const [paidAmount, setPaidAmount] = useState(0);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [usePartialPayment, setUsePartialPayment] = useState(false);
    const [adjustFromAdvance, setAdjustFromAdvance] = useState(false);
    const [availableAdvance, setAvailableAdvance] = useState(0);
    const [manualPaymentOverride, setManualPaymentOverride] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [brands, setBrands] = useState([]);

    const searchRef = useRef(null);
    const dropdownRef = useRef(null);

    // ইউনিট স্টেটস
    const [productUnits, setProductUnits] = useState({});
    const [selectedUnits, setSelectedUnits] = useState({});
    const [unitQuantities, setUnitQuantities] = useState({});
    const [availableSaleUnits, setAvailableSaleUnits] = useState({});

    // Extract unique brands from products
    useEffect(() => {
        if (products && products.length > 0) {
            const allBrands = new Set();
            products.forEach((product) => {
                if (product.brand && product.brand.name) {
                    allBrands.add(product.brand.name);
                }
                if (product.variants) {
                    product.variants.forEach((variant) => {
                        if (variant.attribute_values) {
                            Object.keys(variant.attribute_values).forEach(
                                (key) => {
                                    allBrands.add(key);
                                }
                            );
                        }
                    });
                }
            });
            setBrands(Array.from(allBrands).sort());
        }
    }, [products]);

    // Helper function to format variant display name
    const formatVariantName = (variant) => {
        if (
            !variant.attribute_values ||
            Object.keys(variant.attribute_values).length === 0
        ) {
            return "Default";
        }

        // Combine all attributes
        return Object.entries(variant.attribute_values)
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ");
    };

    // Get account icon
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

    // Calculate total amount
    const calculateTotal = useCallback(() => {
        return selectedItems.reduce(
            (total, item) => total + (item.total_price || 0),
            0
        );
    }, [selectedItems]);

    const getDueAmount = useCallback(() => {
        const totalAmount = calculateTotal();
        return Math.max(0, totalAmount - paidAmount);
    }, [calculateTotal, paidAmount]);

    const getRemainingAdvance = useCallback(() => {
        const totalAmount = calculateTotal();
        const advanceUsed = Math.min(availableAdvance, totalAmount);
        return Math.max(0, availableAdvance - advanceUsed);
    }, [availableAdvance, calculateTotal]);

    const getAdvanceUsage = useCallback(() => {
        const totalAmount = calculateTotal();
        return Math.min(availableAdvance, totalAmount);
    }, [availableAdvance, calculateTotal]);

    const formatCurrency = (value) => {
        const numValue = Number(value) || 0;
        return new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(numValue);
    };

    const form = useForm({
        supplier_id: "",
        adjust_from_advance: false,
        warehouse_id: "",
        purchase_date: new Date().toISOString().split("T")[0],
        notes: "",
        paid_amount: 0,
        payment_status: "unpaid",
        items: [],
        use_partial_payment: false,
        manual_payment_override: false,
        account_id: "",
        payment_method: "cash",
        txn_ref: "",
    });

    useEffect(() => {
        const itemsWithUnits = selectedItems.map((item) => ({
            product_id: item.product_id,
            variant_id: item.variant_id,
            unit: item.unit || "piece",
            unit_quantity: item.unit_quantity || item.quantity || 1,
            quantity: item.unit_quantity || item.quantity || 1,
            unit_price: item.unit_price,
            total_price: item.total_price,
            sale_price: item.sale_price,
        }));

        form.setData("items", itemsWithUnits);
    }, [selectedItems]);

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
    }, [
        paidAmount,
        paymentStatus,
        usePartialPayment,
        adjustFromAdvance,
        manualPaymentOverride,
        isShadowUser,
    ]);

    const handleSupplierChange = (e) => {
        const supplierId = e.target.value;
        form.setData("supplier_id", supplierId);
        const supplier = suppliers?.find((s) => s.id == supplierId);
        setSelectedSupplier(supplier);
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
        setPaidAmount(0);
        setPaymentStatus("unpaid");
        form.setData("account_id", "");
    };

    useEffect(() => {
        if (
            adjustFromAdvance &&
            availableAdvance > 0 &&
            !manualPaymentOverride
        ) {
            const totalAmount = calculateTotal();
            const maxAdjustable = Math.min(availableAdvance, totalAmount);
            if (paidAmount === 0 || paidAmount > totalAmount) {
                const autoPaidAmount = Math.min(maxAdjustable, totalAmount);
                setPaidAmount(autoPaidAmount);
                if (autoPaidAmount >= totalAmount) {
                    setPaymentStatus("paid");
                } else if (autoPaidAmount > 0) {
                    setPaymentStatus("partial");
                } else {
                    setPaymentStatus("unpaid");
                    form.setData("account_id", "");
                }
            }
        }
    }, [
        adjustFromAdvance,
        availableAdvance,
        calculateTotal,
        manualPaymentOverride,
        paidAmount,
    ]);

    useEffect(() => {
        if (
            !usePartialPayment &&
            !manualPaymentOverride &&
            !adjustFromAdvance
        ) {
            const totalAmount = calculateTotal();
            if (paymentStatus == "paid" || paymentStatus == "partial") {
                setPaidAmount(totalAmount);
            }
        }
    }, [
        usePartialPayment,
        calculateTotal,
        manualPaymentOverride,
        adjustFromAdvance,
    ]);

    const enableManualPaymentOverride = () => {
        setManualPaymentOverride(true);
        setAdjustFromAdvance(false);
        if (paymentStatus === "unpaid") {
            form.setData("account_id", "");
        }
    };

    const disableManualPaymentOverride = () => {
        setManualPaymentOverride(false);
        const totalAmount = calculateTotal();
        if (!usePartialPayment) {
            setPaidAmount(totalAmount);
        } else {
            setPaidAmount(0);
        }
        setPaymentStatus("unpaid");
        form.setData("account_id", "");
    };

    const handleManualPaymentInput = (e) => {
        const value = parseFloat(e.target.value) || 0;
        const totalAmount = calculateTotal();
        setPaidAmount(value);
        if (value === 0) {
            setPaymentStatus("unpaid");
            form.setData("account_id", "");
        } else if (value >= totalAmount) {
            setPaymentStatus("paid");
        } else {
            setPaymentStatus("partial");
        }
    };

    // Filter products logic
    useEffect(() => {
        if (productSearch.trim()) {
            let filtered = products;

            if (selectedBrand) {
                filtered = filtered.filter((product) => {
                    // Check if product brand matches
                    if (product.brand?.name === selectedBrand) return true;

                    // Check if any variant has the selected brand as an attribute
                    return product.variants?.some(
                        (variant) =>
                            variant.attribute_values &&
                            Object.keys(variant.attribute_values).includes(
                                selectedBrand
                            )
                    );
                });
            }

            filtered = filtered.filter(
                (product) =>
                    product.name
                        .toLowerCase()
                        .includes(productSearch.toLowerCase()) ||
                    product.product_no
                        .toLowerCase()
                        .includes(productSearch.toLowerCase()) ||
                    (product.brand?.name &&
                        product.brand.name
                            .toLowerCase()
                            .includes(productSearch.toLowerCase()))
            );

            setFilteredProducts(filtered);
            setShowDropdown(true);
        } else if (selectedBrand) {
            const filtered = products.filter((product) => {
                // Check if product brand matches
                if (product.brand?.name === selectedBrand) return true;

                // Check if any variant has the selected brand as an attribute
                return product.variants?.some(
                    (variant) =>
                        variant.attribute_values &&
                        Object.keys(variant.attribute_values).includes(
                            selectedBrand
                        )
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
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Get available units for a product
    const getAvailableUnitsForProduct = (product) => {
        if (!product) return ["piece"];

        const unitType = product.unit_type || "piece";
        return Object.keys(unitConversions[unitType] || { piece: 1 });
    };

    // Get available sale units (smaller or equal to purchase unit)
    const getAvailableSaleUnits = (product, purchaseUnit) => {
        if (!product || !purchaseUnit) return [purchaseUnit];

        const unitType = product.unit_type || "piece";
        const conversions = unitConversions[unitType];
        if (!conversions) return [purchaseUnit];

        const purchaseFactor = conversions[purchaseUnit] || 1;
        const available = [];

        for (const [unit, factor] of Object.entries(conversions)) {
            if (factor <= purchaseFactor) {
                available.push(unit);
            }
        }

        return available.sort(
            (a, b) => (conversions[b] || 1) - (conversions[a] || 1)
        );
    };

    const addItem = (product, variant) => {
        const hasAttributes =
            variant.attribute_values &&
            Object.keys(variant.attribute_values).length > 0;

        // Create a unique identifier that includes all attributes
        let variantIdentifier = "";
        if (hasAttributes) {
            // Sort attributes to maintain consistency
            const sortedAttributes = Object.entries(
                variant.attribute_values || {}
            ).sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
            variantIdentifier = sortedAttributes
                .map(([key, value]) => `${key}:${value}`)
                .join("|");
        } else {
            variantIdentifier = "default";
        }

        // Find existing item
        const existingItemIndex = selectedItems.findIndex(
            (item) =>
                item.product_id === product.id &&
                item.variant_id === variant.id &&
                item.variant_identifier === variantIdentifier
        );

        // Get available units
        const units = getAvailableUnitsForProduct(product);
        const defaultUnit = product.default_unit || units[0] || "piece";
        const saleUnits = getAvailableSaleUnits(product, defaultUnit);

        const itemKey = `${product.id}-${variant.id}-${variantIdentifier}`;
        setProductUnits((prev) => ({ ...prev, [itemKey]: units }));
        setSelectedUnits((prev) => ({ ...prev, [itemKey]: defaultUnit }));
        setUnitQuantities((prev) => ({ ...prev, [itemKey]: 1 }));
        setAvailableSaleUnits((prev) => ({ ...prev, [itemKey]: saleUnits }));

        if (existingItemIndex !== -1) {
            const updatedItems = [...selectedItems];
            const item = updatedItems[existingItemIndex];
            const currentQty = unitQuantities[itemKey] || 1;
            item.unit_quantity = (item.unit_quantity || 1) + 1;
            item.quantity = item.unit_quantity;
            item.total_price = item.unit_quantity * item.unit_price;
            setSelectedItems(updatedItems);
            setUnitQuantities((prev) => ({
                ...prev,
                [itemKey]: currentQty + 1,
            }));
        } else {
            const unitCost = variant.unit_cost || 0;
            const salePrice = variant.selling_price || unitCost * 1.2; // Default 20% markup

            // Create display name for variant
            let variantDisplayName = formatVariantName(variant);
            let brandName = product.brand?.name || "Unknown";

            // Determine brand from attributes if specified
            if (
                selectedBrand &&
                variant.attribute_values &&
                variant.attribute_values[selectedBrand]
            ) {
                brandName = selectedBrand;
            }

            setSelectedItems([
                ...selectedItems,
                {
                    uniqueKey: itemKey,
                    product_id: product.id,
                    variant_id: variant.id,
                    product_name: product.name,
                    brand_name: brandName,
                    variant_name: variantDisplayName,
                    variant_identifier: variantIdentifier,
                    selected_brand: selectedBrand,
                    quantity: 1,
                    unit_quantity: 1,
                    unit: defaultUnit,
                    unit_price: unitCost,
                    sale_price: salePrice,
                    total_price: unitCost * 1,
                    // Store all attributes for reference
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
        const itemKey = updated[index].uniqueKey;

        // Clean up unit states
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
        const itemKey = item.uniqueKey;

        if (field === "unit_quantity" || field === "quantity") {
            const numericValue = parseFloat(value) || 0;
            updated[index][field] = numericValue;
            updated[index].quantity = numericValue; // Keep quantity in sync
            setUnitQuantities((prev) => ({ ...prev, [itemKey]: numericValue }));

            if (updated[index].unit_price) {
                updated[index].total_price =
                    numericValue * updated[index].unit_price;
            }
        } else if (field === "unit") {
            updated[index][field] = value;
            setSelectedUnits((prev) => ({ ...prev, [itemKey]: value }));

            // Update available sale units when purchase unit changes
            const product = products.find((p) => p.id === item.product_id);
            if (product) {
                const saleUnits = getAvailableSaleUnits(product, value);
                setAvailableSaleUnits((prev) => ({
                    ...prev,
                    [itemKey]: saleUnits,
                }));

                // Update sale unit if current one is not available
                if (!saleUnits.includes(item.sale_unit || item.unit)) {
                    updated[index].sale_unit = saleUnits[0] || value;
                }
            }
        } else if (field === "sale_unit") {
            updated[index][field] = value;
        } else if (field === "unit_price") {
            const numericValue = parseFloat(value) || 0;
            updated[index][field] = numericValue;
            updated[index].total_price =
                (updated[index].unit_quantity || 1) * numericValue;
        } else if (field === "sale_price") {
            const numericValue = parseFloat(value) || 0;
            updated[index][field] = numericValue;
        } else {
            const numericValue = parseFloat(value) || 0;
            updated[index][field] = numericValue;
        }

        setSelectedItems(updated);
    };

    const handlePaymentStatusChange = (status) => {
        setPaymentStatus(status);
        const totalAmount = calculateTotal();

        if (status == "paid") {
            setPaidAmount(totalAmount);
            setManualPaymentOverride(false);
            setAdjustFromAdvance(false);
        } else if (status == "unpaid") {
            setPaidAmount(0);
            setManualPaymentOverride(false);
            setAdjustFromAdvance(false);
            form.setData("account_id", "");
        } else if (status == "partial") {
            setManualPaymentOverride(true);
            setAdjustFromAdvance(false);
        }
    };

    const clearBrandFilter = () => {
        setSelectedBrand(null);
        setProductSearch("");
        setFilteredProducts([]);
        setShowDropdown(false);
    };

    const submit = (e) => {
        console.log("Submitting purchase:", paidAmount);
        e.preventDefault();

        // Validation
        if (selectedItems.length === 0) {
            alert(
                t("purchase.no_items_selected", "Please add at least one item")
            );
            return;
        }

        if (!form.data.supplier_id) {
            alert(
                t("purchase.no_supplier_selected", "Please select a supplier")
            );
            return;
        }

        if (!form.data.warehouse_id) {
            alert(
                t("purchase.no_warehouse_selected", "Please select a warehouse")
            );
            return;
        }

        if (!isShadowUser) {
            for (const item of selectedItems) {
                if (item.unit_price <= 0) {
                    alert(`Item "${item.product_name}" has invalid unit price`);
                    return;
                }
                if (item.sale_price <= 0) {
                    alert(`Item "${item.product_name}" has invalid sale price`);
                    return;
                }

                // Validate unit quantity
                if (item.unit_quantity <= 0) {
                    alert(`Item "${item.product_name}" has invalid quantity`);
                    return;
                }
            }

            // Account validation for paid purchases
            if (paidAmount > 0 && !selectedAccount) {
                alert("Please select a payment account for the payment");
                return;
            }

            // Check account balance if account is selected and payment is being made
            if (form.data.account_id && paidAmount > 0) {
                const selectedAccount = accounts.find(
                    (acc) => acc.id == form.data.account_id
                );
                if (selectedAccount) {
                    if (selectedAccount.current_balance < paidAmount) {
                        alert(
                            `Insufficient balance in ${
                                selectedAccount.name
                            }. Available: ৳${formatCurrency(
                                selectedAccount.current_balance
                            )} . 
                        Deposit more funds to this account before proceeding.`
                        );
                        return;
                    }
                }
            }
        }

        // Prepare items with proper structure
        const itemsToSubmit = selectedItems.map((item) => ({
            product_id: item.product_id,
            variant_id: item.variant_id,
            unit: item.unit || "piece",
            unit_quantity: item.unit_quantity || item.quantity || 1,
            quantity: item.unit_quantity || item.quantity || 1,
            unit_price: item.unit_price,
            sale_price: item.sale_price,
            total_price: item.total_price,
            attributes: item.attributes || {},
        }));

        const submitData = {
            ...form.data,
            items: itemsToSubmit,
            paid_amount: paidAmount,
            payment_status: paymentStatus,
        };

        form.post(route("purchase.store"), {
            data: submitData,
            preserveScroll: true,
            onSuccess: () => {
                router.visit(route("purchase.list"));
            },
            onError: (errors) => {
                const message =
                    errors.error ||
                    errors.advance_adjustment ||
                    "Form submission failed";

                alert(message);
                console.error("Form submission errors:", errors);
            },
        });
    };

    const totalAmount = calculateTotal();
    const dueAmount = getDueAmount();
    const advanceUsage = getAdvanceUsage();
    const remainingAdvance = getRemainingAdvance();

    // Get selected account
    const selectedAccount = form.data.account_id
        ? accounts.find((acc) => acc.id == form.data.account_id)
        : null;

    return (
        <div
            className={`bg-white rounded-box p-5 ${
                locale === "bn" ? "bangla-font" : ""
            }`}
        >
            <PageHeader
                title={
                    isShadowUser
                        ? t(
                              "purchase.create_shadow_purchase",
                              "Create Purchase (Shadow Mode)"
                          )
                        : t("purchase.create_purchase", "Create New Purchase")
                }
                subtitle={
                    isShadowUser
                        ? t(
                              "purchase.create_shadow_subtitle",
                              "Add products with shadow pricing"
                          )
                        : t(
                              "purchase.create_subtitle",
                              "Add products with real and shadow pricing"
                          )
                }
            >
                <button
                    onClick={() => router.visit(route("purchase.list"))}
                    className="btn btn-sm btn-ghost hover:bg-gray-100 font-bold uppercase tracking-widest text-xs"
                >
                    <ArrowLeft size={15} />{" "}
                    {t("purchase.back_to_list", "Back to List")}
                </button>
            </PageHeader>

            <form onSubmit={submit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Left Column */}
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
                                <option value="">
                                    {t(
                                        "purchase.select_supplier",
                                        "Select Supplier"
                                    )}
                                </option>
                                {suppliers?.map((supplier) => (
                                    <option
                                        key={supplier.id}
                                        value={supplier.id}
                                    >
                                        {supplier.name} - {supplier.company}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedSupplier && (
                            <div className="card card-compact bg-gray-50 border border-gray-200 rounded-2xl">
                                <div className="card-body">
                                    <h3 className="card-title text-sm font-black uppercase text-gray-900 flex items-center gap-2">
                                        <User
                                            size={16}
                                            className="text-red-600"
                                        />
                                        {t(
                                            "purchase.supplier_information",
                                            "Supplier Details"
                                        )}
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <User
                                                size={12}
                                                className="text-gray-400"
                                            />
                                            <span className="font-bold">
                                                {selectedSupplier.name}
                                            </span>
                                        </div>
                                        {selectedSupplier.company && (
                                            <div className="flex items-center gap-2">
                                                <Building
                                                    size={12}
                                                    className="text-gray-400"
                                                />
                                                <span>
                                                    {selectedSupplier.company}
                                                </span>
                                            </div>
                                        )}
                                        {availableAdvance > 0 && (
                                            <div className="flex items-center gap-2 pt-1 border-t border-gray-200">
                                                <DollarSign
                                                    size={12}
                                                    className="text-red-600"
                                                />
                                                <span className="text-xs font-black uppercase text-red-600 tracking-tighter">
                                                    Available Advance: ৳
                                                    {formatCurrency(
                                                        availableAdvance
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    {availableAdvance > 0 && (
                                        <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={adjustFromAdvance}
                                                    onChange={(e) =>
                                                        setAdjustFromAdvance(
                                                            e.target.checked
                                                        )
                                                    }
                                                    className="checkbox checkbox-xs checkbox-error"
                                                />
                                                <span className="text-[10px] font-bold uppercase">
                                                    {t(
                                                        "purchase.adjust_from_advance",
                                                        "Use Advance"
                                                    )}
                                                </span>
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
                                onChange={(e) =>
                                    form.setData("warehouse_id", e.target.value)
                                }
                                required
                            >
                                <option value="">
                                    {t(
                                        "purchase.select_warehouse",
                                        "Select Warehouse"
                                    )}
                                </option>
                                {warehouses?.map((warehouse) => (
                                    <option
                                        key={warehouse.id}
                                        value={warehouse.id}
                                    >
                                        {warehouse.name} ({warehouse.code})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-control">
                            <label className="label py-1">
                                <span className="label-text font-bold text-gray-600">
                                    {t(
                                        "purchase.purchase_date",
                                        "Purchase Date"
                                    )}{" "}
                                    *
                                </span>
                            </label>
                            <input
                                type="date"
                                className="input input-bordered w-full rounded-xl"
                                value={form.data.purchase_date}
                                onChange={(e) =>
                                    form.setData(
                                        "purchase_date",
                                        e.target.value
                                    )
                                }
                                required
                            />
                        </div>

                        {/* Payment Info Card */}
                        {!isShadowUser && (
                            <div className="card card-compact bg-[#1e4d2b] text-white border border-gray-800 rounded-2xl shadow-lg">
                                <div className="card-body">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="card-title text-sm font-black uppercase text-red-500 flex items-center gap-2">
                                            <DollarSign size={16} /> Payment
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={
                                                manualPaymentOverride
                                                    ? disableManualPaymentOverride
                                                    : enableManualPaymentOverride
                                            }
                                            className="btn btn-xs bg-red-600 hover:bg-red-700 border-none text-white font-black text-[10px] uppercase"
                                        >
                                            {manualPaymentOverride ? (
                                                <X size={10} />
                                            ) : (
                                                <Edit size={10} />
                                            )}
                                            {manualPaymentOverride
                                                ? "Cancel"
                                                : "Manual"}
                                        </button>
                                    </div>

                                    {/* Account Selection */}
                                    <div className="form-control mb-3">
                                        <label className="label py-0">
                                            <span className="label-text text-[10px] text-gray-400 uppercase font-black tracking-widest">
                                                Payment Account{" "}
                                                {(paymentStatus === "paid" ||
                                                    paymentStatus ===
                                                        "partial") &&
                                                    "*"}
                                            </span>
                                        </label>
                                        <select
                                            className={`select select-bordered select-sm w-full bg-gray-800 border-gray-700 text-white ${
                                                (paymentStatus === "paid" ||
                                                    paymentStatus ===
                                                        "partial") &&
                                                !form.data.account_id
                                                    ? "border-red-500"
                                                    : ""
                                            }`}
                                            value={form.data.account_id}
                                            onChange={(e) =>
                                                form.setData(
                                                    "account_id",
                                                    e.target.value
                                                )
                                            }
                                            required={
                                                paymentStatus === "paid" ||
                                                paymentStatus === "partial"
                                            }
                                            disabled={
                                                paymentStatus === "unpaid"
                                            }
                                        >
                                            <option value="">
                                                {paymentStatus === "unpaid"
                                                    ? "Not required (unpaid purchase)"
                                                    : "Select Payment Account"}
                                            </option>
                                            {accounts?.map((account) => (
                                                <option
                                                    key={account.id}
                                                    value={account.id}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {getAccountIcon(
                                                            account.type
                                                        )}
                                                        <span>
                                                            {account.name}
                                                        </span>
                                                        <span className="ml-auto text-xs">
                                                            ৳
                                                            {formatCurrency(
                                                                account.current_balance
                                                            )}
                                                        </span>
                                                    </div>
                                                </option>
                                            ))}
                                        </select>

                                        {/* Validation message */}
                                        {(paymentStatus === "paid" ||
                                            paymentStatus === "partial") &&
                                            !form.data.account_id && (
                                                <div className="text-red-400 text-xs mt-1">
                                                    Please select a payment
                                                    account for {paymentStatus}{" "}
                                                    purchases
                                                </div>
                                            )}

                                        {/* Helper message for unpaid status */}
                                        {paymentStatus === "unpaid" && (
                                            <div className="text-gray-400 text-xs mt-1">
                                                Account not required for unpaid
                                                purchases
                                            </div>
                                        )}

                                        {/* Selected Account Info */}
                                        {selectedAccount && (
                                            <div className="mt-2 p-2 bg-gray-800 rounded-lg border border-gray-700">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {getAccountIcon(
                                                            selectedAccount.type
                                                        )}
                                                        <span className="text-xs font-bold">
                                                            {
                                                                selectedAccount.name
                                                            }
                                                        </span>
                                                        <span className="text-xs text-gray-400 capitalize">
                                                            (
                                                            {
                                                                selectedAccount.type
                                                            }
                                                            )
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-[10px] text-gray-400">
                                                            Balance
                                                        </div>
                                                        <div className="text-xs font-mono font-bold">
                                                            ৳
                                                            {formatCurrency(
                                                                selectedAccount.current_balance
                                                            )}
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
                                            onChange={(e) =>
                                                handlePaymentStatusChange(
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option value="unpaid">
                                                Unpaid
                                            </option>
                                            <option value="partial">
                                                Partial
                                            </option>
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
                                            disabled={
                                                !manualPaymentOverride &&
                                                adjustFromAdvance
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1 text-xs pt-2 border-t border-gray-800 mt-2 font-bold uppercase tracking-tighter">
                                        <div className="flex justify-between">
                                            <span>Gross:</span>
                                            <span>
                                                ৳{formatCurrency(totalAmount)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-red-500 font-black">
                                            <span>Due:</span>
                                            <span>
                                                ৳{formatCurrency(dueAmount)}
                                            </span>
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
                                onChange={(e) =>
                                    form.setData("notes", e.target.value)
                                }
                                placeholder={t(
                                    "purchase.notes_placeholder",
                                    "Additional notes or instructions..."
                                )}
                            />
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-2">
                        <div
                            className="form-control mb-4 relative"
                            ref={searchRef}
                        >
                            <label className="label py-1">
                                <span className="label-text font-bold text-gray-600">
                                    {t(
                                        "purchase.add_products",
                                        "Add Components"
                                    )}{" "}
                                    *
                                </span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="input input-bordered w-full pr-10 rounded-xl h-12 border-gray-300 focus:border-red-600"
                                    value={productSearch}
                                    onChange={(e) =>
                                        setProductSearch(e.target.value)
                                    }
                                    placeholder={
                                        selectedBrand
                                            ? `Search ${selectedBrand} parts...`
                                            : "Search part number or name..."
                                    }
                                />
                                <Search
                                    size={18}
                                    className="absolute right-3 top-3.5 text-gray-400"
                                />
                                {selectedBrand && (
                                    <div className="absolute left-3 top-3">
                                        <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-0.5 rounded">
                                            {selectedBrand}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Product Dropdown */}
                            {showDropdown && filteredProducts.length > 0 && (
                                <div
                                    ref={dropdownRef}
                                    className="absolute z-50 w-full mt-14 bg-white border-2 border-gray-900 rounded-xl shadow-2xl overflow-hidden max-h-96 overflow-y-auto"
                                >
                                    {filteredProducts.map((product) => (
                                        <div
                                            key={product.id}
                                            className="border-b border-gray-100 last:border-0"
                                        >
                                            <div className="bg-gray-100 px-4 py-1.5 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                {product.name} (
                                                {product.product_no})
                                                {product.brand?.name && (
                                                    <span className="ml-2 text-red-600">
                                                        Brand:{" "}
                                                        {product.brand.name}
                                                    </span>
                                                )}
                                                {product.unit_type &&
                                                    product.unit_type !==
                                                        "piece" && (
                                                        <span className="ml-2 text-blue-600">
                                                            Unit:{" "}
                                                            {product.default_unit?.toUpperCase() ||
                                                                "PIECE"}
                                                        </span>
                                                    )}
                                            </div>

                                            {product.variants?.map(
                                                (variant) => {
                                                    // Check if this variant matches brand filter
                                                    const variantMatchesBrand =
                                                        () => {
                                                            if (!selectedBrand)
                                                                return true;

                                                            // Check if any attribute key matches the brand
                                                            const attributeKeys =
                                                                Object.keys(
                                                                    variant.attribute_values ||
                                                                        {}
                                                                );
                                                            return (
                                                                attributeKeys.includes(
                                                                    selectedBrand
                                                                ) ||
                                                                product.brand
                                                                    ?.name ===
                                                                    selectedBrand
                                                            );
                                                        };

                                                    if (!variantMatchesBrand())
                                                        return null;

                                                    const variantName =
                                                        formatVariantName(
                                                            variant
                                                        );

                                                    return (
                                                        <div
                                                            key={variant.id}
                                                            className="p-3 hover:bg-red-50 cursor-pointer flex justify-between items-center transition-colors border-b border-dashed border-gray-100 last:border-none"
                                                            onClick={() =>
                                                                addItem(
                                                                    product,
                                                                    variant
                                                                )
                                                            }
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-xs text-gray-800">
                                                                    {
                                                                        variantName
                                                                    }
                                                                </span>
                                                                {variant.sku && (
                                                                    <span className="text-[10px] text-gray-500 mt-1">
                                                                        SKU:{" "}
                                                                        {
                                                                            variant.sku
                                                                        }
                                                                    </span>
                                                                )}
                                                                {product.unit_type &&
                                                                    product.unit_type !==
                                                                        "piece" && (
                                                                        <span className="text-[10px] text-blue-600 mt-1">
                                                                            <Ruler
                                                                                size={
                                                                                    10
                                                                                }
                                                                                className="inline mr-1"
                                                                            />
                                                                            {product.unit_type.toUpperCase()}{" "}
                                                                            product
                                                                        </span>
                                                                    )}
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="font-mono text-xs font-black text-gray-900">
                                                                    ৳
                                                                    {formatCurrency(
                                                                        variant.unit_cost
                                                                    )}
                                                                </div>
                                                                {variant.attribute_values &&
                                                                    Object.keys(
                                                                        variant.attribute_values
                                                                    ).length >
                                                                        0 && (
                                                                        <div className="text-[10px] text-gray-500 mt-1">
                                                                            {
                                                                                Object.keys(
                                                                                    variant.attribute_values
                                                                                )
                                                                                    .length
                                                                            }{" "}
                                                                            attributes
                                                                        </div>
                                                                    )}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {selectedItems.length > 0 ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                                    <h3 className="font-black uppercase tracking-widest text-xs text-gray-900">
                                        {t(
                                            "purchase.selected_items",
                                            "Itemized Registry"
                                        )}
                                    </h3>
                                    <div className="text-xs text-gray-500">
                                        {selectedItems.length} items • Total: ৳
                                        {formatCurrency(totalAmount)}
                                    </div>
                                </div>
                                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                                    {selectedItems.map((item, index) => {
                                        const itemKey = item.uniqueKey;
                                        const availableUnits = productUnits[
                                            itemKey
                                        ] || ["piece"];
                                        const selectedUnit =
                                            selectedUnits[itemKey] ||
                                            availableUnits[0];
                                        const unitQuantity =
                                            unitQuantities[itemKey] ||
                                            item.quantity ||
                                            1;
                                        const saleUnits = availableSaleUnits[
                                            itemKey
                                        ] || [selectedUnit];

                                        return (
                                            <div
                                                key={index}
                                                className="card card-compact bg-white border border-gray-200 rounded-xl shadow-sm hover:border-red-600 transition-colors"
                                            >
                                                <div className="card-body">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <h4 className="font-black text-gray-900 uppercase text-xs">
                                                                {
                                                                    item.product_name
                                                                }
                                                            </h4>
                                                            <p className="text-[10px] text-red-600 font-black uppercase tracking-wider bg-red-50 px-2 py-0.5 rounded w-fit mt-1">
                                                                {
                                                                    item.brand_name
                                                                }
                                                            </p>

                                                            {/* Display variant name */}
                                                            <p className="text-xs text-gray-700 font-medium mt-2">
                                                                {
                                                                    item.variant_name
                                                                }
                                                            </p>

                                                            {/* Display individual attributes as tags */}
                                                            {item.attributes &&
                                                                Object.keys(
                                                                    item.attributes
                                                                ).length >
                                                                    0 && (
                                                                    <div className="mt-2">
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {Object.entries(
                                                                                item.attributes
                                                                            ).map(
                                                                                (
                                                                                    [
                                                                                        key,
                                                                                        value,
                                                                                    ],
                                                                                    idx
                                                                                ) => (
                                                                                    <span
                                                                                        key={
                                                                                            idx
                                                                                        }
                                                                                        className="text-[9px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded"
                                                                                    >
                                                                                        <span className="font-bold">
                                                                                            {
                                                                                                key
                                                                                            }

                                                                                            :
                                                                                        </span>{" "}
                                                                                        {
                                                                                            value
                                                                                        }
                                                                                    </span>
                                                                                )
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeItem(
                                                                    index
                                                                )
                                                            }
                                                            className="btn btn-xs btn-ghost text-red-600 hover:bg-red-50"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>

                                                    {/* ইউনিট সেটিংস */}
                                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Ruler
                                                                size={14}
                                                                className="text-blue-600"
                                                            />
                                                            <span className="text-xs font-bold text-gray-700">
                                                                Unit Settings
                                                            </span>
                                                        </div>

                                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                                                            {/* Purchase Unit */}
                                                            <div className="form-control">
                                                                <label className="label py-0">
                                                                    <span className="label-text text-[9px] uppercase font-black text-gray-400">
                                                                        Purchase
                                                                        Unit
                                                                    </span>
                                                                </label>
                                                                <select
                                                                    className="select select-bordered select-sm w-full"
                                                                    value={
                                                                        selectedUnit
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        updateItem(
                                                                            index,
                                                                            "unit",
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                >
                                                                    {availableUnits.map(
                                                                        (
                                                                            unit
                                                                        ) => (
                                                                            <option
                                                                                key={
                                                                                    unit
                                                                                }
                                                                                value={
                                                                                    unit
                                                                                }
                                                                            >
                                                                                {unit.toUpperCase()}
                                                                            </option>
                                                                        )
                                                                    )}
                                                                </select>
                                                            </div>

                                                            {/* Purchase Quantity */}
                                                            <div className="form-control">
                                                                <label className="label py-0">
                                                                    <span className="label-text text-[9px] uppercase font-black text-gray-400">
                                                                        Qty
                                                                    </span>
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    step="0.001"
                                                                    min="0.001"
                                                                    className="input input-bordered input-sm w-full font-black rounded-lg"
                                                                    value={
                                                                        unitQuantity
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        updateItem(
                                                                            index,
                                                                            "unit_quantity",
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                />
                                                                <div className="text-[8px] text-gray-500 mt-1">
                                                                    In{" "}
                                                                    {selectedUnit.toUpperCase()}
                                                                </div>
                                                            </div>

                                                            {/* Sale Unit */}
                                                            <div className="form-control">
                                                                <label className="label py-0">
                                                                    <span className="label-text text-[9px] uppercase font-black text-gray-400">
                                                                        Sale
                                                                        Unit
                                                                    </span>
                                                                </label>
                                                                <select
                                                                    className="select select-bordered select-sm w-full"
                                                                    value={
                                                                        item.sale_unit ||
                                                                        selectedUnit
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        updateItem(
                                                                            index,
                                                                            "sale_unit",
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                >
                                                                    {saleUnits.map(
                                                                        (
                                                                            unit
                                                                        ) => (
                                                                            <option
                                                                                key={
                                                                                    unit
                                                                                }
                                                                                value={
                                                                                    unit
                                                                                }
                                                                            >
                                                                                {unit.toUpperCase()}
                                                                            </option>
                                                                        )
                                                                    )}
                                                                </select>
                                                                <div className="text-[8px] text-gray-500 mt-1">
                                                                    For selling
                                                                </div>
                                                            </div>

                                                            {/* Unit Cost */}
                                                            <div className="form-control">
                                                                <label className="label py-0">
                                                                    <span className="label-text text-[9px] uppercase font-black text-gray-400">
                                                                        Unit
                                                                        Cost
                                                                    </span>
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    className="input input-bordered input-sm w-full font-mono text-xs rounded-lg"
                                                                    value={
                                                                        item.unit_price ||
                                                                        0
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        updateItem(
                                                                            index,
                                                                            "unit_price",
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                />
                                                                <div className="text-[8px] text-gray-500 mt-1">
                                                                    Per{" "}
                                                                    {selectedUnit.toUpperCase()}
                                                                </div>
                                                            </div>

                                                            {/* Sale Price */}
                                                            <div className="form-control">
                                                                <label className="label py-0">
                                                                    <span className="label-text text-[9px] uppercase font-black text-gray-400">
                                                                        Sale
                                                                        Price
                                                                    </span>
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    className="input input-bordered input-sm w-full font-mono text-xs rounded-lg"
                                                                    value={
                                                                        item.sale_price ||
                                                                        0
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        updateItem(
                                                                            index,
                                                                            "sale_price",
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                />
                                                                <div className="text-[8px] text-gray-500 mt-1">
                                                                    Per{" "}
                                                                    {item.sale_unit ||
                                                                        selectedUnit}
                                                                </div>
                                                            </div>

                                                            {/* Total Price Display */}
                                                            <div className="md:col-span-5 text-right pt-2 border-t border-gray-200">
                                                                <span className="text-[9px] uppercase font-black text-gray-400 block mb-1">
                                                                    Total Cost
                                                                </span>
                                                                <span className="font-mono text-sm font-black text-red-600">
                                                                    ৳
                                                                    {formatCurrency(
                                                                        item.total_price ||
                                                                            0
                                                                    )}
                                                                </span>
                                                                <div className="text-[8px] text-gray-500 mt-1">
                                                                    {
                                                                        unitQuantity
                                                                    }{" "}
                                                                    {selectedUnit.toUpperCase()}{" "}
                                                                    × ৳
                                                                    {formatCurrency(
                                                                        item.unit_price ||
                                                                            0
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* ইউনিট কনভার্সন ইনফো */}
                                                        {selectedUnit !==
                                                            (item.sale_unit ||
                                                                selectedUnit) && (
                                                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                                                                <div className="text-xs text-blue-800">
                                                                    <strong>
                                                                        Note:
                                                                    </strong>{" "}
                                                                    Purchase in{" "}
                                                                    {selectedUnit.toUpperCase()}
                                                                    , sell in{" "}
                                                                    {(
                                                                        item.sale_unit ||
                                                                        selectedUnit
                                                                    ).toUpperCase()}
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
                                <Package
                                    size={40}
                                    className="mx-auto text-gray-300 mb-3"
                                />
                                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">
                                    {selectedBrand
                                        ? `No ${selectedBrand} items added`
                                        : t(
                                              "purchase.no_items_added",
                                              "Registry Empty"
                                          )}
                                </p>
                                <p className="text-gray-300 text-xs mt-2">
                                    {selectedBrand
                                        ? `Search for ${selectedBrand} parts above`
                                        : "Search for products above to add them"}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Summary Section */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">
                                    {t("purchase.gross_total", "Gross Total")}
                                </div>
                                <div className="text-2xl font-black text-gray-900">
                                    ৳{formatCurrency(totalAmount)}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">
                                    {t("purchase.paid_amount", "Paid Amount")}
                                </div>
                                <div
                                    className={`text-2xl font-black ${
                                        paidAmount > 0
                                            ? "text-green-600"
                                            : "text-gray-400"
                                    }`}
                                >
                                    ৳{formatCurrency(paidAmount)}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">
                                    {t("purchase.due_amount", "Due Amount")}
                                </div>
                                <div
                                    className={`text-2xl font-black ${
                                        dueAmount > 0
                                            ? "text-red-600"
                                            : "text-gray-400"
                                    }`}
                                >
                                    ৳{formatCurrency(dueAmount)}
                                </div>
                            </div>
                        </div>

                        {/* Account Info Summary */}
                        {selectedAccount && (
                            <div className="mt-4 p-4 bg-white rounded-xl border border-gray-300">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {getAccountIcon(selectedAccount.type)}
                                        <div>
                                            <div className="text-sm font-bold text-gray-900">
                                                {selectedAccount.name}
                                            </div>
                                            <div className="text-xs text-gray-500 capitalize">
                                                {selectedAccount.type} Account
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-500">
                                            Current Balance
                                        </div>
                                        <div className="text-sm font-mono font-bold">
                                            ৳
                                            {formatCurrency(
                                                selectedAccount.current_balance
                                            )}
                                        </div>
                                        <div className="text-xs text-red-500 mt-1">
                                            After payment: ৳
                                            {formatCurrency(
                                                selectedAccount.current_balance -
                                                    paidAmount
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
                    <div className="flex-1">
                        <div className="flex items-center gap-4">
                            <div>
                                <h4 className="font-bold text-gray-900 uppercase text-sm">
                                    {isShadowUser
                                        ? "Shadow Purchase Summary"
                                        : "Purchase Summary"}
                                </h4>
                                <p className="text-xs text-gray-500">
                                    {selectedItems.length} items selected •
                                    {selectedBrand &&
                                        ` Filtered by: ${selectedBrand}`}
                                </p>
                            </div>
                            {selectedBrand && (
                                <button
                                    type="button"
                                    onClick={clearBrandFilter}
                                    className="btn btn-xs btn-ghost text-gray-500 hover:text-gray-700"
                                >
                                    Clear Brand Filter
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-2xl font-black text-gray-900">
                                ৳{formatCurrency(totalAmount)}
                            </div>
                            <div className="text-xs text-gray-500">
                                Total Amount
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={`btn rounded-xl px-10 font-black uppercase text-xs tracking-[0.2em] shadow-lg ${
                                isShadowUser
                                    ? "bg-amber-500 hover:bg-amber-600 text-black border-none"
                                    : "bg-red-600 hover:bg-red-700 text-white border-none"
                            }`}
                            disabled={
                                form.processing || selectedItems.length === 0
                            }
                        >
                            {form.processing ? (
                                <div className="loading loading-spinner loading-sm"></div>
                            ) : isShadowUser ? (
                                "Execute Shadow Purchase"
                            ) : (
                                "Finalize Purchase"
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
