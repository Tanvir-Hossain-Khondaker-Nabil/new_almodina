import PageHeader from "../../components/PageHeader";
import { useForm, router } from "@inertiajs/react";
import { 
    ArrowLeft, Plus, Trash2, Search, Shield, DollarSign, User, 
    Building, Phone, Mail, MapPin, Info, Edit, X, RefreshCw,
    Package, AlertCircle, CheckCircle, Clock, ShoppingBag,
    Calculator, AlertTriangle, ArrowRightLeft, Percent, 
    PackageOpen, Warehouse, Hash
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "../../hooks/useTranslation";

export default function AddPurchaseReturn({ 
    purchase, 
    purchaseItems, 
    purchases,
    suppliers, 
    warehouses, 
    products, 
    isShadowUser 
}) {
    const { t, locale } = useTranslation();
    const [selectedItems, setSelectedItems] = useState([]);
    const [replacementProducts, setReplacementProducts] = useState([]);
    const [returnType, setReturnType] = useState('money_back');
    const [showReplacementSearch, setShowReplacementSearch] = useState(false);
    const [productSearch, setProductSearch] = useState("");
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [paymentType, setPaymentType] = useState('cash');
    const [selectedPurchaseId, setSelectedPurchaseId] = useState(purchase?.id || '');
    const [validationErrors, setValidationErrors] = useState({});
    const [stockCheckResult, setStockCheckResult] = useState(null);
    
    const searchRef = useRef(null);
    const dropdownRef = useRef(null);

    const form = useForm({
        purchase_id: purchase?.id || "",
        return_type: 'money_back',
        return_date: new Date().toISOString().split('T')[0],
        reason: "",
        notes: "",
        payment_type: 'cash',
        refunded_amount: 0,
        shadow_refunded_amount: 0,
        items: [],
        replacement_products: [],
        replacement_total: 0,
        shadow_replacement_total: 0
    });

    // Calculate total return amount
    const calculateTotalReturn = useCallback(() => {
        return selectedItems.reduce((total, item) => {
            if (item.return_quantity > 0) {
                const itemTotal = item.return_quantity * (item.unit_price || 0);
                return total + itemTotal;
            }
            return total;
        }, 0);
    }, [selectedItems]);

    // Calculate shadow total return amount
    const calculateShadowTotalReturn = useCallback(() => {
        return selectedItems.reduce((total, item) => {
            if (item.return_quantity > 0) {
                const itemTotal = item.return_quantity * (item.shadow_unit_price || item.unit_price || 0);
                return total + itemTotal;
            }
            return total;
        }, 0);
    }, [selectedItems]);

    // Calculate total replacement value
    const calculateReplacementTotal = useCallback(() => {
        return replacementProducts.reduce((total, product) => {
            const quantity = parseFloat(product.quantity) || 1;
            const unitPrice = parseFloat(product.unit_price) || 0;
            return total + (quantity * unitPrice);
        }, 0);
    }, [replacementProducts]);

    // Calculate shadow replacement value
    const calculateShadowReplacementTotal = useCallback(() => {
        return replacementProducts.reduce((total, product) => {
            const quantity = parseFloat(product.quantity) || 1;
            const unitPrice = parseFloat(product.shadow_unit_price) || 0;
            return total + (quantity * unitPrice);
        }, 0);
    }, [replacementProducts]);

    // Calculate net difference
    const calculateNetDifference = useCallback(() => {
        const totalReturn = calculateTotalReturn();
        const replacementTotal = calculateReplacementTotal();
        return replacementTotal - totalReturn; // Positive = we pay extra, Negative = we get refund
    }, [calculateTotalReturn, calculateReplacementTotal]);

    const formatCurrency = (value) => {
        const numValue = Number(value) || 0;
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(numValue);
    };

    const getVariantDisplayName = (variant) => {
        if (variant.attribute_values && Object.keys(variant.attribute_values).length > 0) {
            const parts = [];
            for (const [attribute, value] of Object.entries(variant.attribute_values)) {
                parts.push(`${attribute}: ${value}`);
            }
            return parts.join(', ');
        }
        
        if (variant.name) return variant.name;
        
        const parts = [];
        if (variant.size) parts.push(`Size: ${variant.size}`);
        if (variant.color) parts.push(`Color: ${variant.color}`);
        if (variant.material) parts.push(`Material: ${variant.material}`);
        return parts.join(', ') || 'Default Variant';
    };

    // Check stock availability
    const checkStockAvailability = () => {
        if (!purchase) return null;
        
        const unavailableItems = [];
        let totalAvailableValue = 0;
        let totalUnavailableValue = 0;
        
        selectedItems.forEach(item => {
            if (item.return_quantity > 0) {
                if (item.return_quantity > item.max_quantity) {
                    unavailableItems.push({
                        product: item.product_name,
                        variant: item.variant_name,
                        requested: item.return_quantity,
                        available: item.max_quantity,
                        shortfall: item.return_quantity - item.max_quantity
                    });
                    totalUnavailableValue += (item.return_quantity - item.max_quantity) * item.unit_price;
                } else {
                    totalAvailableValue += item.return_quantity * item.unit_price;
                }
            }
        });
        
        return {
            hasIssues: unavailableItems.length > 0,
            unavailableItems,
            totalAvailableValue,
            totalUnavailableValue,
            canProceed: unavailableItems.length === 0
        };
    };

    // Sync form data
    useEffect(() => {
        const totalReturn = calculateTotalReturn();
        const shadowTotalReturn = calculateShadowTotalReturn();
        const replacementTotal = calculateReplacementTotal();
        const shadowReplacementTotal = calculateShadowReplacementTotal();
        
        // For money back returns, auto-set refund amount to total return
        if (returnType === 'money_back') {
            form.setData('refunded_amount', totalReturn);
            form.setData('shadow_refunded_amount', shadowTotalReturn);
        } else {
            form.setData('refunded_amount', 0);
            form.setData('shadow_refunded_amount', 0);
        }

        // Update form data
        const formData = {
            ...form.data,
            return_type: returnType,
            payment_type: returnType === 'money_back' ? paymentType : null,
            items: selectedItems
                .filter(item => item.return_quantity > 0)
                .map(item => ({
                    purchase_item_id: item.purchase_item_id || item.id,
                    return_quantity: item.return_quantity,
                    reason: item.reason || 'Return requested'
                })),
            replacement_products: returnType === 'product_replacement' ? 
                replacementProducts.map(product => ({
                    product_id: product.product_id,
                    variant_id: product.variant_id,
                    quantity: parseFloat(product.quantity) || 1,
                    unit_price: parseFloat(product.unit_price) || 0,
                    shadow_unit_price: parseFloat(product.shadow_unit_price) || 0,
                    sale_price: parseFloat(product.sale_price) || 0,
                    shadow_sale_price: parseFloat(product.shadow_sale_price) || 0,
                    total_price: parseFloat(product.total_price) || 0,
                    shadow_total_price: parseFloat(product.shadow_total_price) || 0
                })) : [],
            replacement_total: returnType === 'product_replacement' ? replacementTotal : 0,
            shadow_replacement_total: returnType === 'product_replacement' ? shadowReplacementTotal : 0
        };

        form.setData(formData);
        
        // Check stock
        const stockCheck = checkStockAvailability();
        setStockCheckResult(stockCheck);
    }, [returnType, paymentType, selectedItems, replacementProducts]);

    // Initialize selected items from purchase items
    useEffect(() => {
        if (purchaseItems && purchaseItems.length > 0) {
            const initialItems = purchaseItems.map(item => ({
                purchase_item_id: item.id,
                product_id: item.product_id,
                product_name: item.product_name,
                variant_id: item.variant_id,
                variant_name: item.variant_name,
                return_quantity: 0,
                max_quantity: item.max_quantity,
                available_quantity: item.max_quantity,
                unit_price: parseFloat(item.unit_price) || 0,
                shadow_unit_price: parseFloat(item.shadow_unit_price) || 0,
                sale_price: parseFloat(item.sale_price) || 0,
                shadow_sale_price: parseFloat(item.shadow_sale_price) || 0,
                purchase_quantity: item.purchase_quantity,
                already_returned: item.already_returned || 0,
                stock_quantity: item.stock_quantity || 0,
                reason: ""
            }));
            setSelectedItems(initialItems);
        }
    }, [purchaseItems]);

    // Filter products for replacement search
    useEffect(() => {
        if (productSearch.trim() && showReplacementSearch) {
            const filtered = products.filter(product =>
                product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                (product.product_no && product.product_no.toLowerCase().includes(productSearch.toLowerCase()))
            );
            setFilteredProducts(filtered);
        } else {
            setFilteredProducts([]);
        }
    }, [productSearch, products, showReplacementSearch]);

    // Add return item
    const updateReturnItem = (index, field, value) => {
        const updated = [...selectedItems];
        
        if (field === 'return_quantity') {
            const quantity = parseInt(value) || 0;
            const maxQuantity = updated[index].max_quantity;
            
            if (quantity < 0) {
                updated[index].return_quantity = 0;
            } else if (quantity > maxQuantity) {
                setValidationErrors(prev => ({
                    ...prev,
                    quantity: `Cannot return more than ${maxQuantity} items. Available: ${maxQuantity}`
                }));
                updated[index].return_quantity = maxQuantity;
            } else {
                updated[index].return_quantity = quantity;
                
                // Clear quantity error if fixed
                if (validationErrors.quantity) {
                    setValidationErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.quantity;
                        return newErrors;
                    });
                }
            }
        } else {
            updated[index][field] = value;
        }
        
        setSelectedItems(updated);
    };

    // Add replacement product
    const addReplacementProduct = (product, variant) => {
        // Calculate default prices
        const defaultUnitPrice = parseFloat(variant.unit_cost || variant.purchase_price || 0);
        const defaultShadowUnitPrice = parseFloat(variant.shadow_unit_cost || variant.shadow_purchase_price || defaultUnitPrice);
        const defaultSalePrice = parseFloat(variant.selling_price || variant.sale_price || defaultUnitPrice * 1.2);
        const defaultShadowSalePrice = parseFloat(variant.shadow_selling_price || variant.shadow_sale_price || defaultShadowUnitPrice * 1.2);

        const existingProduct = replacementProducts.find(
            item => item.product_id === product.id && item.variant_id === variant.id
        );

        if (existingProduct) {
            // Update existing product quantity
            setReplacementProducts(replacementProducts.map(item =>
                item.product_id === product.id && item.variant_id === variant.id
                    ? { 
                        ...item, 
                        quantity: (parseFloat(item.quantity) || 1) + 1,
                        total_price: ((parseFloat(item.quantity) || 1) + 1) * item.unit_price,
                        shadow_total_price: ((parseFloat(item.quantity) || 1) + 1) * item.shadow_unit_price
                    }
                    : item
            ));
        } else {
            // Add new product
            setReplacementProducts([
                ...replacementProducts,
                {
                    product_id: product.id,
                    variant_id: variant.id,
                    product_name: product.name,
                    variant_name: getVariantDisplayName(variant),
                    quantity: 1,
                    unit_price: defaultUnitPrice,
                    shadow_unit_price: defaultShadowUnitPrice,
                    sale_price: defaultSalePrice,
                    shadow_sale_price: defaultShadowSalePrice,
                    total_price: defaultUnitPrice,
                    shadow_total_price: defaultShadowUnitPrice,
                    product_code: product.product_no,
                    unit_type: product.unit_type || 'piece',
                    default_unit: product.default_unit || 'piece'
                }
            ]);
        }
        
        setProductSearch("");
        setShowReplacementSearch(false);
    };

    const updateReplacementProduct = (index, field, value) => {
        const updated = [...replacementProducts];
        
        if (field === 'quantity' || field === 'unit_price' || field === 'shadow_unit_price') {
            const numericValue = parseFloat(value) || 0;
            updated[index][field] = numericValue > 0 ? numericValue : 0;
            
            // Recalculate totals
            const quantity = parseFloat(updated[index].quantity) || 1;
            const unitPrice = parseFloat(updated[index].unit_price) || 0;
            const shadowUnitPrice = parseFloat(updated[index].shadow_unit_price) || 0;
            
            updated[index].total_price = quantity * unitPrice;
            updated[index].shadow_total_price = quantity * shadowUnitPrice;
        } else {
            updated[index][field] = value;
        }
        
        setReplacementProducts(updated);
    };

    const removeReplacementProduct = (index) => {
        const updated = [...replacementProducts];
        updated.splice(index, 1);
        setReplacementProducts(updated);
    };

    // Handle return type change
    const handleReturnTypeChange = (type) => {
        setReturnType(type);
        if (type === 'money_back') {
            setReplacementProducts([]);
            setPaymentType('cash');
        }
    };

    // Handle purchase selection
    const handlePurchaseSelect = (e) => {
        const purchaseId = e.target.value;
        setSelectedPurchaseId(purchaseId);
        if (purchaseId) {
            router.visit(route('purchase-return.create', { purchase_id: purchaseId }), {
                preserveScroll: true,
                preserveState: true
            });
        }
    };

    // Validate form
    const validateForm = () => {
        const errors = {};
        
        if (!form.data.purchase_id) {
            errors.purchase = 'Please select a purchase';
        }

        if (!form.data.reason.trim()) {
            errors.reason = 'Please provide a reason for the return';
        }

        if (!form.data.return_date) {
            errors.return_date = 'Please select a return date';
        }

        const hasReturnItems = selectedItems.some(item => item.return_quantity > 0);
        if (!hasReturnItems) {
            errors.items = 'Please select at least one item to return';
        }

        // Check stock availability
        if (stockCheckResult && stockCheckResult.hasIssues) {
            errors.stock = `Some items exceed available stock. Check the stock availability section.`;
        }

        // Check if any return quantity exceeds max allowed
        selectedItems.forEach((item, index) => {
            if (item.return_quantity > item.max_quantity) {
                errors[`item_${index}`] = `Cannot return ${item.return_quantity} items. Maximum allowed: ${item.max_quantity}`;
            }
        });

        if (returnType === 'product_replacement') {
            if (replacementProducts.length === 0) {
                errors.replacement = 'Please add at least one replacement product';
            }
            
            // Validate replacement products
            replacementProducts.forEach((product, index) => {
                if (parseFloat(product.quantity) <= 0) {
                    errors[`replacement_quantity_${index}`] = 'Quantity must be greater than 0';
                }
                if (parseFloat(product.unit_price) <= 0) {
                    errors[`replacement_price_${index}`] = 'Unit price must be greater than 0';
                }
                if (!product.product_id || !product.variant_id) {
                    errors[`replacement_product_${index}`] = 'Product information is incomplete';
                }
            });
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Submit form
    const submit = (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            console.log('Validation errors:', validationErrors);
            return;
        }

        // Calculate final amounts
        const totalReturn = calculateTotalReturn();
        const shadowTotalReturn = calculateShadowTotalReturn();
        const replacementTotal = calculateReplacementTotal();
        const shadowReplacementTotal = calculateShadowReplacementTotal();

        // Prepare final submission data
        const submitData = {
            purchase_id: form.data.purchase_id,
            return_type: returnType,
            return_date: form.data.return_date,
            reason: form.data.reason,
            notes: form.data.notes,
            payment_type: returnType === 'money_back' ? paymentType : null,
            refunded_amount: returnType === 'money_back' ? totalReturn : 0,
            shadow_refunded_amount: returnType === 'money_back' ? shadowTotalReturn : 0,
            items: selectedItems
                .filter(item => item.return_quantity > 0)
                .map(item => ({
                    purchase_item_id: item.purchase_item_id || item.id,
                    return_quantity: item.return_quantity,
                    reason: item.reason || 'Return requested'
                })),
            replacement_products: returnType === 'product_replacement' ? 
                replacementProducts.map(product => ({
                    product_id: product.product_id,
                    variant_id: product.variant_id,
                    quantity: parseFloat(product.quantity) || 1,
                    unit_price: parseFloat(product.unit_price) || 0,
                    shadow_unit_price: parseFloat(product.shadow_unit_price) || 0,
                    sale_price: parseFloat(product.sale_price) || 0,
                    shadow_sale_price: parseFloat(product.shadow_sale_price) || 0
                })) : [],
            replacement_total: returnType === 'product_replacement' ? replacementTotal : 0,
            shadow_replacement_total: returnType === 'product_replacement' ? shadowReplacementTotal : 0
        };

        console.log('Submitting purchase return:', submitData);

        form.post(route("purchase-return.store"), {
            preserveScroll: true,
            data: submitData,
            onSuccess: () => {
                router.visit(route("purchase-return.list"));
            },
            onError: (errors) => {
                console.error("Form errors:", errors);
                
                let errorMessage = "There was an error creating the purchase return.";
                
                if (errors.purchase_id) {
                    errorMessage = `Purchase Error: ${errors.purchase_id}`;
                } else if (errors.return_type) {
                    errorMessage = `Return Type Error: ${errors.return_type}`;
                } else if (errors.items) {
                    errorMessage = `Items Error: ${errors.items}`;
                } else if (errors.replacement_products) {
                    errorMessage = `Replacement Products Error: ${errors.replacement_products}`;
                } else if (errors.reason) {
                    errorMessage = `Reason Error: ${errors.reason}`;
                } else if (errors.message) {
                    errorMessage = errors.message;
                }
                
                alert(errorMessage);
                setValidationErrors(errors);
            }
        });
    };

    // Calculate all totals
    const totalReturn = calculateTotalReturn();
    const shadowTotalReturn = calculateShadowTotalReturn();
    const replacementTotal = calculateReplacementTotal();
    const shadowReplacementTotal = calculateShadowReplacementTotal();
    const netDifference = calculateNetDifference();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowReplacementSearch(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className={`bg-white rounded-box p-5 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <PageHeader
                title={t('purchase_return.create_title', 'Create Purchase Return')}
                subtitle={t('purchase_return.create_subtitle', 'Process return for purchased items')}
            >
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.visit(route("purchase-return.list"))}
                        className="btn btn-sm btn-ghost"
                    >
                        <ArrowLeft size={15} /> {t('purchase_return.back_to_list', 'Back to List')}
                    </button>
                </div>
            </PageHeader>

            {/* Validation Errors */}
            {Object.keys(validationErrors).length > 0 && (
                <div className="alert alert-error mb-6">
                    <AlertTriangle size={20} />
                    <div className="flex-1">
                        <h3 className="font-bold">Please fix the following errors:</h3>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                            {Object.entries(validationErrors).map(([key, error]) => (
                                <li key={key} className="text-sm">{error}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Purchase Selection */}
            {!purchase && (
                <div className="card card-compact bg-base-100 border border-base-300 mb-6">
                    <div className="card-body">
                        <h3 className="card-title text-sm font-semibold flex items-center gap-2">
                            <ShoppingBag size={16} />
                            {t('purchase_return.select_purchase', 'Select Purchase')}
                        </h3>
                        <div className="form-control">
                            <select
                                className="select select-bordered w-full"
                                value={selectedPurchaseId}
                                onChange={handlePurchaseSelect}
                            >
                                <option value="">{t('purchase_return.select_purchase_placeholder', 'Select a purchase to return')}</option>
                                {purchases?.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.purchase_no} - {p.supplier?.name} - {p.purchase_date} - ৳{formatCurrency(p.grand_total || p.total_amount)}
                                        {p.available_items > 0 ? ` (${p.available_items} items available)` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                            {t('purchase_return.select_purchase_help', 'Select a purchase to view items available for return')}
                        </p>
                    </div>
                </div>
            )}

            {purchase && (
                <form onSubmit={submit}>
                    {/* Purchase Information */}
                    <div className="card card-compact bg-base-100 border border-base-300 mb-6">
                        <div className="card-body">
                            <h3 className="card-title text-sm font-semibold flex items-center gap-2">
                                <Info size={16} />
                                {t('purchase_return.purchase_info', 'Purchase Information')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <Hash size={14} className="text-gray-400" />
                                    <div>
                                        <div className="font-medium">Purchase No:</div>
                                        <div className="font-mono">{purchase.purchase_no}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Building size={14} className="text-gray-400" />
                                    <div>
                                        <div className="font-medium">Supplier:</div>
                                        <div>{purchase.supplier?.name}</div>
                                        {purchase.supplier?.company && (
                                            <div className="text-xs text-gray-500">{purchase.supplier.company}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Warehouse size={14} className="text-gray-400" />
                                    <div>
                                        <div className="font-medium">Warehouse:</div>
                                        <div>{purchase.warehouse?.name}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-gray-400" />
                                    <div>
                                        <div className="font-medium">Date:</div>
                                        <div>{purchase.purchase_date}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <DollarSign size={14} className="text-gray-400" />
                                    <div>
                                        <div className="font-medium">Total:</div>
                                        <div className="font-semibold">৳{formatCurrency(purchase.grand_total || purchase.total_amount)}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="font-medium">Status:</div>
                                    <div className={`badge badge-sm ${
                                        purchase.payment_status === 'paid' ? 'badge-success' :
                                        purchase.payment_status === 'partial' ? 'badge-warning' : 'badge-error'
                                    }`}>
                                        {purchase.payment_status}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        {/* Left Column - Return Details */}
                        <div className="lg:col-span-1 space-y-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">{t('purchase_return.return_type', 'Return Type')} *</span>
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <label className={`card card-compact cursor-pointer ${
                                        returnType === 'money_back' 
                                            ? 'bg-primary text-primary-content border-2 border-primary' 
                                            : 'bg-base-100 border border-base-300'
                                    }`}>
                                        <div className="card-body p-3">
                                            <div className="flex items-start">
                                                <input
                                                    type="radio"
                                                    className="radio radio-primary mt-1"
                                                    checked={returnType === 'money_back'}
                                                    onChange={() => handleReturnTypeChange('money_back')}
                                                />
                                                <div className="ml-3 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">Money Back</span>
                                                    </div>
                                                    <p className="text-xs text-gray-300 mt-2">
                                                        {t('purchase_return.money_back_desc', 'Refund amount to supplier')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </label>
                                    <label className={`card card-compact cursor-pointer ${
                                        returnType === 'product_replacement' 
                                            ? 'bg-warning text-warning-content border-2 border-warning' 
                                            : 'bg-base-100 border border-base-300'
                                    }`}>
                                        <div className="card-body p-3">
                                            <div className="flex items-start">
                                                <input
                                                    type="radio"
                                                    className="radio radio-warning mt-1"
                                                    checked={returnType === 'product_replacement'}
                                                    onChange={() => handleReturnTypeChange('product_replacement')}
                                                />
                                                <div className="ml-3 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">Product Replacement</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-2">
                                                        {t('purchase_return.replacement_desc', 'Replace with other products')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">{t('purchase_return.return_date', 'Return Date')} *</span>
                                </label>
                                <input
                                    type="date"
                                    className="input input-bordered w-full"
                                    value={form.data.return_date}
                                    onChange={(e) => form.setData("return_date", e.target.value)}
                                    required
                                />
                                {validationErrors.return_date && (
                                    <span className="text-error text-xs mt-1">{validationErrors.return_date}</span>
                                )}
                            </div>

                            {returnType === 'money_back' && (
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">{t('purchase_return.payment_type', 'Payment Type')} *</span>
                                    </label>
                                    <select
                                        className="select select-bordered w-full"
                                        value={paymentType}
                                        onChange={(e) => setPaymentType(e.target.value)}
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="card">Card</option>
                                        <option value="mobile_banking">Mobile Banking</option>
                                        <option value="adjust_to_advance">Adjust to Supplier Advance</option>
                                    </select>
                                </div>
                            )}

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">{t('purchase_return.reason', 'Reason for Return')} *</span>
                                </label>
                                <textarea
                                    className="textarea textarea-bordered w-full"
                                    rows="3"
                                    value={form.data.reason}
                                    onChange={(e) => form.setData("reason", e.target.value)}
                                    placeholder={t('purchase_return.reason_placeholder', 'Explain why you are returning these items...')}
                                    required
                                />
                                {validationErrors.reason && (
                                    <span className="text-error text-xs mt-1">{validationErrors.reason}</span>
                                )}
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">{t('purchase_return.notes', 'Additional Notes')}</span>
                                </label>
                                <textarea
                                    className="textarea textarea-bordered w-full"
                                    rows="2"
                                    value={form.data.notes}
                                    onChange={(e) => form.setData("notes", e.target.value)}
                                    placeholder={t('purchase_return.notes_placeholder', 'Any additional information...')}
                                />
                            </div>
                        </div>

                        {/* Right Column - Items & Replacement */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Items to Return */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        <PackageOpen size={20} />
                                        {t('purchase_return.items_to_return', 'Items to Return')}
                                        <span className="badge badge-primary badge-sm">
                                            {selectedItems.filter(item => item.return_quantity > 0).length}
                                        </span>
                                    </h3>
                                    <div className="text-sm text-gray-500">
                                        Select quantity for each item
                                    </div>
                                </div>

                                {selectedItems.length > 0 ? (
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                        {selectedItems.map((item, index) => (
                                            <div key={index} className="card card-compact bg-base-100 border border-base-300 hover:border-primary/50">
                                                <div className="card-body">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex-1">
                                                            <h4 className="font-medium text-base">{item.product_name}</h4>
                                                            <p className="text-sm text-gray-600">{item.variant_name}</p>
                                                            <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                                                                <span className="flex items-center gap-1">
                                                                    <Package size={12} />
                                                                    Purchased: {item.purchase_quantity}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Warehouse size={12} />
                                                                    In Stock: {item.stock_quantity}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <ArrowRightLeft size={12} />
                                                                    Already Returned: {item.already_returned}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-mono text-sm">৳{formatCurrency(item.unit_price)}</div>
                                                            {!isShadowUser && (
                                                                <div className="text-xs text-warning flex items-center gap-1">
                                                                    <Shield size={10} />
                                                                    ৳{formatCurrency(item.shadow_unit_price)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                        <div className="form-control">
                                                            <label className="label py-1">
                                                                <span className="label-text text-xs flex items-center gap-1">
                                                                    Quantity *
                                                                    {item.max_quantity > 0 && (
                                                                        <span className="badge badge-xs">Max: {item.max_quantity}</span>
                                                                    )}
                                                                </span>
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max={item.max_quantity}
                                                                step="1"
                                                                className="input input-bordered input-sm w-full"
                                                                value={item.return_quantity}
                                                                onChange={(e) => updateReturnItem(index, 'return_quantity', e.target.value)}
                                                            />
                                                            {validationErrors[`item_${index}`] && (
                                                                <span className="text-error text-xs mt-1">{validationErrors[`item_${index}`]}</span>
                                                            )}
                                                        </div>

                                                        <div className="form-control">
                                                            <label className="label py-1">
                                                                <span className="label-text text-xs">Unit Price</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                className="input input-bordered input-sm w-full bg-base-200"
                                                                value={`৳${formatCurrency(item.unit_price)}`}
                                                                readOnly
                                                            />
                                                        </div>

                                                        <div className="form-control">
                                                            <label className="label py-1">
                                                                <span className="label-text text-xs">Item Total</span>
                                                            </label>
                                                            <div className="space-y-1">
                                                                <input
                                                                    type="text"
                                                                    className="input input-bordered input-sm w-full bg-primary/10 font-semibold"
                                                                    value={`৳${formatCurrency(item.return_quantity * item.unit_price)}`}
                                                                    readOnly
                                                                />
                                                                {!isShadowUser && item.return_quantity > 0 && (
                                                                    <div className="text-xs text-warning">
                                                                        Shadow: ৳{formatCurrency(item.return_quantity * item.shadow_unit_price)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="form-control">
                                                            <label className="label py-1">
                                                                <span className="label-text text-xs">Reason</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                className="input input-bordered input-sm w-full"
                                                                value={item.reason}
                                                                onChange={(e) => updateReturnItem(index, 'reason', e.target.value)}
                                                                placeholder="e.g., Damaged, Wrong item"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="card card-compact bg-base-100 border-2 border-dashed border-base-300">
                                        <div className="card-body text-center py-8">
                                            <PackageOpen size={32} className="mx-auto text-base-300 mb-2" />
                                            <p className="text-gray-500">{t('purchase_return.no_items_available', 'No items available for return')}</p>
                                            <p className="text-sm text-gray-400 mt-1">
                                                This purchase has no items that can be returned.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {validationErrors.items && (
                                    <div className="alert alert-error mt-4">
                                        <span>{validationErrors.items}</span>
                                    </div>
                                )}

                                {/* Stock Availability Check */}
                                {stockCheckResult && stockCheckResult.hasIssues && (
                                    <div className="alert alert-warning mt-4">
                                        <AlertTriangle size={20} />
                                        <div className="flex-1">
                                            <h3 className="font-bold">Stock Availability Issues</h3>
                                            <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
                                                {stockCheckResult.unavailableItems.map((item, idx) => (
                                                    <li key={idx}>
                                                        {item.product} ({item.variant}): 
                                                        Requested {item.requested}, Available {item.available}
                                                        {item.shortfall > 0 && (
                                                            <span className="text-error"> (Shortfall: {item.shortfall})</span>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-box">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <span className="font-medium">{t('purchase_return.total_return_value', 'Total Return Value')}:</span>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Items: {selectedItems.filter(item => item.return_quantity > 0).length} | 
                                                Stock Available: {stockCheckResult?.canProceed ? '✓ Yes' : '✗ Issues'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold text-lg text-primary">৳{formatCurrency(totalReturn)}</div>
                                            {!isShadowUser && (
                                                <div className="text-sm text-warning flex items-center gap-1">
                                                    <Shield size={12} />
                                                    Shadow: ৳{formatCurrency(shadowTotalReturn)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Replacement Products (only for product_replacement type) */}
                            {returnType === 'product_replacement' && (
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-semibold text-lg flex items-center gap-2">
                                            <Package size={20} />
                                            {t('purchase_return.replacement_products', 'Replacement Products')}
                                            <span className="badge badge-warning badge-sm">
                                                {replacementProducts.length}
                                            </span>
                                        </h3>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline btn-warning"
                                            onClick={() => setShowReplacementSearch(!showReplacementSearch)}
                                        >
                                            <Plus size={14} />
                                            {t('purchase_return.add_replacement', 'Add Replacement')}
                                        </button>
                                    </div>

                                    {validationErrors.replacement && (
                                        <div className="alert alert-warning mb-4">
                                            <span>{validationErrors.replacement}</span>
                                        </div>
                                    )}

                                    {/* Replacement Product Search */}
                                    {showReplacementSearch && (
                                        <div className="mb-4 relative" ref={searchRef}>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    className="input input-bordered w-full pr-10"
                                                    value={productSearch}
                                                    onChange={(e) => setProductSearch(e.target.value)}
                                                    placeholder={t('purchase_return.search_products', 'Search replacement products...')}
                                                    autoFocus
                                                />
                                                <Search size={16} className="absolute right-3 top-3 text-gray-400" />
                                            </div>

                                            {productSearch.trim() && filteredProducts.length > 0 && (
                                                <div 
                                                    ref={dropdownRef}
                                                    className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto"
                                                >
                                                    {filteredProducts.map(product => (
                                                        <div key={product.id} className="border-b last:border-b-0">
                                                            <div className="p-3 font-medium bg-warning/10">
                                                                <div className="flex justify-between">
                                                                    <span>{product.name}</span>
                                                                    <span className="text-xs text-gray-500">
                                                                        {product.product_no}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            {product.variants && product.variants.map(variant => (
                                                                <div
                                                                    key={variant.id}
                                                                    className="p-3 hover:bg-warning/5 cursor-pointer border-b last:border-b-0"
                                                                    onClick={() => addReplacementProduct(product, variant)}
                                                                >
                                                                    <div className="flex justify-between items-center">
                                                                        <div className="flex-1">
                                                                            <div className="font-medium">
                                                                                {getVariantDisplayName(variant)}
                                                                            </div>
                                                                            <div className="text-xs text-gray-500 mt-1 space-y-1">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="flex items-center gap-1">
                                                                                        Cost: ৳{formatCurrency(variant.unit_cost || variant.purchase_price || 0)}
                                                                                    </span>
                                                                                    {!isShadowUser && (
                                                                                        <span className="flex items-center gap-1">
                                                                                            <Shield size={10} />
                                                                                            Shadow: ৳{formatCurrency(variant.shadow_unit_cost || variant.shadow_purchase_price || 0)}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                {variant.sku && (
                                                                                    <div>SKU: {variant.sku}</div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <Plus size={16} className="text-warning" />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Replacement Products List */}
                                    {replacementProducts.length > 0 ? (
                                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                            {replacementProducts.map((product, index) => (
                                                <div key={index} className="card card-compact bg-warning/5 border border-warning/20 hover:border-warning/50">
                                                    <div className="card-body">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex-1">
                                                                <h4 className="font-medium text-base">{product.product_name}</h4>
                                                                <p className="text-sm text-gray-600">{product.variant_name}</p>
                                                                {product.product_code && (
                                                                    <p className="text-xs text-gray-500 mt-1">Code: {product.product_code}</p>
                                                                )}
                                                            </div>
                                                            <button
                                                                type="button"
                                                                className="btn btn-xs btn-error btn-outline"
                                                                onClick={() => removeReplacementProduct(index)}
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                            <div className="form-control">
                                                                <label className="label py-1">
                                                                    <span className="label-text text-xs">Quantity *</span>
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    step="1"
                                                                    className="input input-bordered input-sm w-full border-warning"
                                                                    value={product.quantity}
                                                                    onChange={(e) => updateReplacementProduct(index, 'quantity', e.target.value)}
                                                                />
                                                                {validationErrors[`replacement_quantity_${index}`] && (
                                                                    <span className="text-error text-xs">{validationErrors[`replacement_quantity_${index}`]}</span>
                                                                )}
                                                            </div>

                                                            <div className="form-control">
                                                                <label className="label py-1">
                                                                    <span className="label-text text-xs">Unit Price (৳) *</span>
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    min="0.01"
                                                                    step="0.01"
                                                                    className="input input-bordered input-sm w-full border-warning"
                                                                    value={product.unit_price}
                                                                    onChange={(e) => updateReplacementProduct(index, 'unit_price', e.target.value)}
                                                                />
                                                                {validationErrors[`replacement_price_${index}`] && (
                                                                    <span className="text-error text-xs">{validationErrors[`replacement_price_${index}`]}</span>
                                                                )}
                                                            </div>

                                                            <div className="form-control">
                                                                <label className="label py-1">
                                                                    <span className="label-text text-xs flex items-center gap-1">
                                                                        <Shield size={12} className="text-warning" />
                                                                        Shadow Price (৳)
                                                                    </span>
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    min="0.01"
                                                                    step="0.01"
                                                                    className="input input-bordered input-sm w-full border-warning"
                                                                    value={product.shadow_unit_price}
                                                                    onChange={(e) => updateReplacementProduct(index, 'shadow_unit_price', e.target.value)}
                                                                />
                                                            </div>

                                                            <div className="form-control">
                                                                <label className="label py-1">
                                                                    <span className="label-text text-xs">
                                                                        Item Total
                                                                    </span>
                                                                </label>
                                                                <div className="space-y-1">
                                                                    <input
                                                                        type="text"
                                                                        className="input input-bordered input-sm w-full bg-warning/10 font-semibold"
                                                                        value={`৳${formatCurrency(product.total_price)}`}
                                                                        readOnly
                                                                    />
                                                                    <div className="text-xs text-warning flex items-center gap-1">
                                                                        <Shield size={10} />
                                                                        Shadow: ৳{formatCurrency(product.shadow_total_price)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="card card-compact bg-warning/5 border-2 border-dashed border-warning/30">
                                            <div className="card-body text-center py-8">
                                                <Package size={32} className="mx-auto text-warning/50 mb-2" />
                                                <p className="text-gray-500">{t('purchase_return.no_replacement_added', 'No replacement products added')}</p>
                                                <p className="text-sm text-gray-400 mt-1">
                                                    {t('purchase_return.click_add_replacement', 'Click "Add Replacement" to add products')}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-4 p-3 bg-warning/5 border border-warning/20 rounded-box">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="font-medium">{t('purchase_return.total_replacement_value', 'Total Replacement Value')}:</span>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Items: {replacementProducts.length}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold text-lg text-warning">৳{formatCurrency(replacementTotal)}</div>
                                                {!isShadowUser && (
                                                    <div className="text-sm text-warning flex items-center gap-1">
                                                        <Shield size={12} />
                                                        Shadow: ৳{formatCurrency(shadowReplacementTotal)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Summary and Actions */}
                    <div className="border-t border-base-300 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            <div className="card card-compact bg-base-100 border border-base-300">
                                <div className="card-body">
                                    <h4 className="card-title text-sm font-semibold flex items-center gap-2">
                                        <PackageOpen size={16} />
                                        {t('purchase_return.return_summary', 'Return Summary')}
                                    </h4>
                                    <div className="space-y-2 text-sm mt-2">
                                        <div className="flex justify-between items-center py-1">
                                            <span>Items to Return:</span>
                                            <span className="font-medium badge badge-primary badge-sm">
                                                {selectedItems.filter(item => item.return_quantity > 0).length}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center py-1">
                                            <span>Total Return Value:</span>
                                            <span className="font-semibold">৳{formatCurrency(totalReturn)}</span>
                                        </div>
                                        {returnType === 'money_back' && (
                                            <>
                                                <div className="divider my-1"></div>
                                                <div className="flex justify-between items-center py-1">
                                                    <span className="font-medium">Refund Amount:</span>
                                                    <span className="font-semibold text-primary">৳{formatCurrency(totalReturn)}</span>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    This amount will be {paymentType === 'adjust_to_advance' ? 'adjusted to supplier advance' : `refunded via ${paymentType}`}
                                                </div>
                                            </>
                                        )}
                                        {returnType === 'product_replacement' && (
                                            <>
                                                <div className="divider my-1"></div>
                                                <div className="flex justify-between items-center py-1">
                                                    <span>Replacement Items:</span>
                                                    <span className="font-medium badge badge-warning badge-sm">
                                                        {replacementProducts.length}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center py-1">
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
                                    <h4 className="card-title text-sm font-semibold flex items-center gap-2">
                                        <ArrowRightLeft size={16} />
                                        {t('purchase_return.value_comparison', 'Value Comparison')}
                                    </h4>
                                    <div className="space-y-3 mt-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="text-center p-2 bg-primary/10 rounded">
                                                <div className="text-xs text-primary font-medium">Return Value</div>
                                                <div className="font-bold text-primary">৳{formatCurrency(totalReturn)}</div>
                                            </div>
                                            <div className="text-center p-2 bg-warning/10 rounded">
                                                <div className="text-xs text-warning font-medium">Replacement Value</div>
                                                <div className="font-bold text-warning">৳{formatCurrency(replacementTotal)}</div>
                                            </div>
                                        </div>
                                        
                                        {returnType === 'product_replacement' && (
                                            <>
                                                <div className="divider my-1">Net Difference</div>
                                                <div className={`text-center p-3 rounded-lg ${
                                                    netDifference > 0 ? 'bg-error/10 border border-error/20' :
                                                    netDifference < 0 ? 'bg-success/10 border border-success/20' :
                                                    'bg-base-200'
                                                }`}>
                                                    <div className="text-lg font-bold">
                                                        {netDifference > 0 ? '+' : ''}৳{formatCurrency(Math.abs(netDifference))}
                                                    </div>
                                                    <div className={`text-sm font-medium ${
                                                        netDifference > 0 ? 'text-error' :
                                                        netDifference < 0 ? 'text-success' : 'text-gray-500'
                                                    }`}>
                                                        {netDifference > 0 ? 'We pay to supplier' :
                                                         netDifference < 0 ? 'We receive from supplier' :
                                                         'Values are equal'}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {netDifference > 0 ? (
                                                            <span>Replacement value exceeds return value</span>
                                                        ) : netDifference < 0 ? (
                                                            <span>Return value exceeds replacement value</span>
                                                        ) : (
                                                            <span>No payment adjustment needed</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="card card-compact bg-base-100 border border-base-300">
                                <div className="card-body">
                                    <h4 className="card-title text-sm font-semibold flex items-center gap-2">
                                        <AlertCircle size={16} />
                                        {t('purchase_return.important_notes', 'Important Notes')}
                                    </h4>
                                    <div className="text-xs space-y-2 mt-2">
                                        <div className="alert alert-info py-2">
                                            <div className="flex-1">
                                                <div className="font-medium">Approval Process:</div>
                                                <ul className="list-disc pl-4 mt-1">
                                                    <li>Returns require approval before processing</li>
                                                    <li>Stock will be decreased upon approval</li>
                                                    <li>Financial adjustments happen after completion</li>
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="alert py-2">
                                            <div className="flex-1">
                                                <div className="font-medium">Stock Impact:</div>
                                                <ul className="list-disc pl-4 mt-1">
                                                    <li>Returned items will be removed from inventory</li>
                                                    <li>Replacement items will be added to inventory</li>
                                                    <li>Net financial difference will be settled</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className={`btn btn-lg ${returnType === 'product_replacement' ? 'btn-warning' : 'bg-[#1e4d2b] text-white'}`}
                                disabled={form.processing || (stockCheckResult && !stockCheckResult.canProceed)}
                            >
                                {form.processing ? (
                                    <span className="flex items-center gap-2">
                                        <div className="loading loading-spinner loading-sm"></div>
                                        {t('purchase_return.creating', 'Creating Return...')}
                                    </span>
                                ) : (
                                    <>
                                        <RefreshCw size={18} className="mr-2" />
                                        {t('purchase_return.create_return', 'Create Purchase Return')}
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => router.visit(route("purchase-return.list"))}
                                className="btn btn-lg btn-ghost"
                            >
                                {t('purchase_return.cancel', 'Cancel')}
                            </button>
                        </div>

                        {stockCheckResult && !stockCheckResult.canProceed && (
                            <div className="alert alert-warning mt-4">
                                <AlertTriangle size={20} />
                                <div className="flex-1">
                                    <div className="font-bold">Cannot create return due to stock issues</div>
                                    <div className="text-sm mt-1">
                                        Some items exceed available stock. Please adjust quantities before submitting.
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </form>
            )}
        </div>
    );
}

// Add missing Calendar icon component
const Calendar = ({ size, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);