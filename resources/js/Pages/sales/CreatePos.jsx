import PageHeader from "../../components/PageHeader";
import { router, useForm } from "@inertiajs/react";
import {
    ArrowLeft,
    Plus,
    Minus,
    Trash2,
    Search,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Wallet,
    CreditCard,
    X,
    ShoppingBag,
    Landmark,
    Smartphone,
    Edit,
    User,
    Phone,
    Package,
    Ruler,
    ChevronDown,
    Check,
    Info,
    Calculator,
    FileText,
    Calendar,
    MessageSquare,
    AlertCircle,
    Percent,
    Truck,
} from "lucide-react";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";

export default function AddSale({
    customers = [],
    productstocks = [],
    suppliers = [],
    accounts = [],
    unitConversions = {
        weight: { ton: 1000, kg: 1, gram: 0.001, pound: 0.453592 },
        volume: { liter: 1, ml: 0.001 },
        piece: { piece: 1, dozen: 12, box: 1 },
        length: { meter: 1, cm: 0.01, mm: 0.001 },
    },
}) {
    const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
    const formatCurrency = (v) => n(v).toFixed(2);
    const money = (v) => `৳${formatCurrency(v)}`;

    // ---------------- State ----------------
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All Categories");
    const [brandFilter, setBrandFilter] = useState("All Brands");
    const [page, setPage] = useState(1);
    const pageSize = 8;

    // Customer state
    const [customerId, setCustomerId] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [showManualCustomerFields, setShowManualCustomerFields] =
        useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    // Payment state
    const [selectedAccount, setSelectedAccount] = useState("");
    const [paymentStatus, setPaymentStatus] = useState("unpaid");
    const [partialPayment, setPartialPayment] = useState(false);
    const [paidAmount, setPaidAmount] = useState(0);
    const [manualPaymentOverride, setManualPaymentOverride] = useState(false);

    // Cart state
    const [cart, setCart] = useState([]);
    const cartCount = cart.reduce((a, i) => a + n(i.qty), 0);

    // Tax/Discount state
    const [taxRate, setTaxRate] = useState(0);
    const [discountValue, setDiscountValue] = useState(0);
    const [shippingValue, setShippingValue] = useState(0);

    // Pickup state
    const [pickupItems, setPickupItems] = useState([]);
    const [showPickupModal, setShowPickupModal] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);

    // Pickup item form
    const [pickupProductName, setPickupProductName] = useState("");
    const [pickupBrand, setPickupBrand] = useState("");
    const [pickupVariant, setPickupVariant] = useState("");
    const [pickupQuantity, setPickupQuantity] = useState(1);
    const [pickupUnitPrice, setPickupUnitPrice] = useState(0);
    const [pickupSalePrice, setPickupSalePrice] = useState(0);

    // Form state
    const [saleDate, setSaleDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [notes, setNotes] = useState("");

    // Unit conversion state
    const [unitDropdownOpen, setUnitDropdownOpen] = useState({});
    const [selectedUnits, setSelectedUnits] = useState({});
    const [unitQuantities, setUnitQuantities] = useState({});
    const [availableUnits, setAvailableUnits] = useState({});
    const [unitPrices, setUnitPrices] = useState({});
    const [basePrices, setBasePrices] = useState({});

    // Refs for dropdown close handling
    const dropdownRefs = useRef({});

    // ---------------- Unit Conversion Helper Functions ----------------
    const getAvailableUnitsForStock = useCallback(
        (product, stock) => {
            if (!product) return ["piece"];

            const unitType = product.unit_type || "piece";
            const conversions = unitConversions[unitType];

            if (!conversions) return [product.default_unit || "piece"];

            // Get the purchase unit from stock
            const purchaseUnit = stock?.unit || product.default_unit || "piece";
            const purchaseFactor = conversions[purchaseUnit] || 1;

            // All units that are smaller or equal to purchase unit
            const available = [];

            for (const [unit, factor] of Object.entries(conversions)) {
                if (factor <= purchaseFactor) {
                    available.push(unit);
                }
            }

            // Sort from smallest to largest (gram < kg < ton)
            return available.sort(
                (a, b) => (conversions[a] || 1) - (conversions[b] || 1)
            );
        },
        [unitConversions]
    );

    const convertToBase = useCallback(
        (quantity, fromUnit, unitType) => {
            const conversions = unitConversions[unitType];
            if (!conversions || !conversions[fromUnit]) return quantity;

            return quantity * conversions[fromUnit];
        },
        [unitConversions]
    );

    const convertFromBase = useCallback(
        (quantity, toUnit, unitType) => {
            const conversions = unitConversions[unitType];
            if (!conversions || !conversions[toUnit]) return quantity;

            const conversion = conversions[toUnit];
            return conversion !== 0 ? quantity / conversion : quantity;
        },
        [unitConversions]
    );

    const convertUnitQuantity = useCallback(
        (quantity, fromUnit, toUnit, unitType) => {
            if (fromUnit === toUnit) return quantity;

            const conversions = unitConversions[unitType];
            if (!conversions || !conversions[fromUnit] || !conversions[toUnit])
                return quantity;

            const baseQuantity = quantity * conversions[fromUnit];
            return baseQuantity / conversions[toUnit];
        },
        [unitConversions]
    );

    const calculatePriceInUnit = useCallback(
        (priceInPurchaseUnit, fromUnit, toUnit, unitType) => {
            if (fromUnit === toUnit) return priceInPurchaseUnit;

            const conversions = unitConversions[unitType];
            if (!conversions || !conversions[fromUnit] || !conversions[toUnit])
                return priceInPurchaseUnit;

            const pricePerBaseUnit =
                priceInPurchaseUnit / conversions[fromUnit];
            return pricePerBaseUnit * conversions[toUnit];
        },
        [unitConversions]
    );

    const calculateBasePricePerBaseUnit = useCallback(
        (price, unit, unitType) => {
            const conversions = unitConversions[unitType];
            if (!conversions || !conversions[unit]) return price;

            return price / conversions[unit];
        },
        [unitConversions]
    );

    // ---------------- Calculations ----------------
    const catalog = useMemo(() => {
        const map = new Map();

        for (const s of productstocks || []) {
            if (!s?.product || n(s?.quantity) <= 0) continue;

            const p = s.product;
            const pid = p.id;

            if (!map.has(pid)) {
                const img = p.photo ? `/storage/${p.photo}` : null;

                map.set(pid, {
                    id: pid,
                    name: p.name || "Unnamed Product",
                    product_no: p.product_no || "",
                    category_name: p.category?.name || "Uncategorized",
                    brand_name: p.brand?.name || "No Brand",
                    image: img,
                    unit_type: p.unit_type || "piece",
                    default_unit: p.default_unit || "piece",
                    min_sale_unit: p.min_sale_unit || null,
                    is_fraction_allowed: p.is_fraction_allowed || false,
                    totalStock: 0,
                    minPrice: null,
                    variants: [],
                });
            }

            const item = map.get(pid);
            item.totalStock += n(s.quantity);

            const sp = n(s.sale_price);
            item.minPrice =
                item.minPrice === null ? sp : Math.min(item.minPrice, sp);

            const variantLabel = (() => {
                const v = s?.variant;
                if (!v) return "Default";

                const attrs = v.attribute_values;

                if (
                    attrs &&
                    typeof attrs === "object" &&
                    !Array.isArray(attrs)
                ) {
                    const pairs = Object.entries(attrs)
                        .filter(([key, value]) => key && value)
                        .map(([key, value]) => `${key}: ${value}`);

                    if (pairs.length) {
                        return pairs.join(", ");
                    }
                }

                return v.sku || "Default";
            })();

            // Get available sale units for this stock
            const availableUnitsForStock = getAvailableUnitsForStock(
                map.get(pid),
                s
            );

            item.variants.push({
                stock_id: s.id,
                batch_no: s.batch_no || null,
                quantity: n(s.quantity),
                sale_price: n(s.sale_price),
                shadow_sale_price: n(s.shadow_sale_price),
                variant_id: s.variant?.id || null,
                variant_label: variantLabel,
                purchase_unit: s.unit || item.default_unit || "piece",
                base_quantity: n(s.base_quantity) || n(s.quantity),
                available_units: availableUnitsForStock,
                warehouse_id: s.warehouse_id,
                product_unit_type: item.unit_type || "piece",
                is_fraction_allowed: item.is_fraction_allowed || false,
            });
        }

        return Array.from(map.values())
            .map((p) => ({
                ...p,
                variants: p.variants.sort((a, b) => {
                    if (b.quantity !== a.quantity)
                        return b.quantity - a.quantity;
                    return (a.batch_no || "").localeCompare(b.batch_no || "");
                }),
            }))
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }, [productstocks, getAvailableUnitsForStock]);

    const categories = useMemo(() => {
        const set = new Set();
        for (const p of catalog) set.add(p.category_name || "Uncategorized");
        return ["All Categories", ...Array.from(set).sort()];
    }, [catalog]);

    const brands = useMemo(() => {
        const set = new Set();
        for (const p of catalog) set.add(p.brand_name || "No Brand");
        return ["All Brands", ...Array.from(set).sort()];
    }, [catalog]);

    const filteredCatalog = useMemo(() => {
        const q = search.trim().toLowerCase();
        return catalog.filter((p) => {
            const okCategory =
                categoryFilter === "All Categories"
                    ? true
                    : p.category_name === categoryFilter;
            const okBrand =
                brandFilter === "All Brands"
                    ? true
                    : p.brand_name === brandFilter;
            const okSearch = !q
                ? true
                : (p.name || "").toLowerCase().includes(q) ||
                  (p.product_no || "").toLowerCase().includes(q);
            return okCategory && okBrand && okSearch;
        });
    }, [catalog, search, categoryFilter, brandFilter]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredCatalog.length / pageSize)
    );
    useEffect(
        () => setPage((p) => Math.min(Math.max(1, p), totalPages)),
        [totalPages]
    );

    const pagedCatalog = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredCatalog.slice(start, start + pageSize);
    }, [filteredCatalog, page, pageSize]);

    // Update selected customer when customerId changes
    useEffect(() => {
        if (customerId && customerId !== "01") {
            const customer = customers.find(
                (c) => String(c.id) === String(customerId)
            );
            setSelectedCustomer(customer || null);
            if (customer) {
                setCustomerName(customer.customer_name || "");
                setCustomerPhone(customer.phone || "");
            }
        } else {
            setSelectedCustomer(null);
        }
    }, [customerId, customers]);

    // ---------------- Cart Operations ----------------
    const subTotal = useMemo(
        () => cart.reduce((sum, i) => sum + n(i.total_price), 0),
        [cart]
    );
    const pickupSubTotal = useMemo(
        () => pickupItems.reduce((sum, i) => sum + n(i.total_price), 0),
        [pickupItems]
    );
    const totalSubTotal = useMemo(
        () => subTotal + pickupSubTotal,
        [subTotal, pickupSubTotal]
    );
    const taxAmount = useMemo(
        () => (totalSubTotal * n(taxRate)) / 100,
        [totalSubTotal, taxRate]
    );
    const grandTotal = useMemo(
        () => totalSubTotal + taxAmount - n(discountValue) + n(shippingValue),
        [totalSubTotal, taxAmount, discountValue, shippingValue]
    );

    // Effect to handle payment status and account enable/disable logic
    useEffect(() => {
        if (!manualPaymentOverride) {
            if (paymentStatus === "paid") {
                setPaidAmount(grandTotal);
                setPartialPayment(false);
            } else if (paymentStatus === "unpaid") {
                setPaidAmount(0);
                setPartialPayment(false);
                setSelectedAccount(""); // Clear account selection for unpaid
            } else if (paymentStatus === "partial") {
                setPartialPayment(true);
                if (paidAmount === 0 || paidAmount >= grandTotal) {
                    setPaidAmount(grandTotal * 0.5);
                }
            }
        }
    }, [grandTotal, paymentStatus, manualPaymentOverride]);

    // Effect to sync payment status with paid amount when manual override is active
    useEffect(() => {
        if (manualPaymentOverride) {
            if (paidAmount === 0) {
                setPaymentStatus("unpaid");
                setPartialPayment(false);
            } else if (paidAmount >= grandTotal) {
                setPaymentStatus("paid");
                setPartialPayment(false);
            } else {
                setPaymentStatus("partial");
                setPartialPayment(true);
            }
        }
    }, [paidAmount, grandTotal, manualPaymentOverride]);

    const dueAmount = useMemo(
        () => Math.max(0, grandTotal - n(paidAmount)),
        [grandTotal, paidAmount]
    );

    const addToCart = useCallback(
        (product, variant) => {
            if (!product || !variant) return;

            const key = `${product.id}-${variant.variant_id || "0"}-${
                variant.stock_id
            }`;

            // Check if already in cart
            const existingItem = cart.find((x) => x.key === key);
            if (existingItem) {
                changeQty(key, n(existingItem.qty) + 1);
                return;
            }

            // Get available units for this variant
            const availableUnitsForStock =
                variant.available_units ||
                getAvailableUnitsForStock(product, variant);

            // Determine default sale unit
            let defaultUnit =
                product.min_sale_unit ||
                product.default_unit ||
                availableUnitsForStock[0] ||
                "piece";
            if (!availableUnitsForStock.includes(defaultUnit)) {
                defaultUnit = availableUnitsForStock[0] || "piece";
            }

            // Calculate base price per base unit (for auto-calculation)
            let basePricePerBaseUnit = variant.sale_price;
            if (product.unit_type && product.unit_type !== "piece") {
                basePricePerBaseUnit = calculateBasePricePerBaseUnit(
                    variant.sale_price,
                    variant.purchase_unit,
                    product.unit_type
                );
            }

            // Calculate price in default sale unit (auto-calculated, read-only)
            let unitPrice = variant.sale_price;
            if (
                variant.purchase_unit !== defaultUnit &&
                product.unit_type &&
                product.unit_type !== "piece"
            ) {
                unitPrice = calculatePriceInUnit(
                    variant.sale_price,
                    variant.purchase_unit,
                    defaultUnit,
                    product.unit_type
                );
            }

            const newItem = {
                key,
                product_id: product.id,
                variant_id: variant.variant_id,
                stock_id: variant.stock_id,
                name: product.name,
                code: product.product_no,
                variant_label: variant.variant_label,
                batch_no: variant.batch_no,
                qty: 1,
                unit: defaultUnit,
                unit_price: unitPrice, // Auto-calculated, read-only
                shadow_unit_price: n(variant.shadow_sale_price) || unitPrice,
                maxQty: n(variant.quantity),
                total_price: unitPrice,
                product_unit_type: product.unit_type || "piece",
                is_fraction_allowed: product.is_fraction_allowed || false,
                original_purchase_unit: variant.purchase_unit,
                original_sale_price: variant.sale_price,
                base_quantity: variant.base_quantity || variant.quantity,
                available_units: availableUnitsForStock,
                // Store base price for auto-calculation
                base_price_per_base_unit: basePricePerBaseUnit,
            };

            setCart((prev) => [...prev, newItem]);

            // Set initial selected unit, quantity and unit price
            setSelectedUnits((prev) => ({ ...prev, [key]: defaultUnit }));
            setUnitQuantities((prev) => ({ ...prev, [key]: 1 }));
            setAvailableUnits((prev) => ({
                ...prev,
                [key]: availableUnitsForStock,
            }));
            setUnitPrices((prev) => ({ ...prev, [key]: unitPrice }));
            setBasePrices((prev) => ({ ...prev, [key]: basePricePerBaseUnit }));
        },
        [
            cart,
            getAvailableUnitsForStock,
            calculateBasePricePerBaseUnit,
            calculatePriceInUnit,
        ]
    );

    const removeCartItem = (key) => {
        setCart((prev) => prev.filter((x) => x.key !== key));
        // Clean up unit states
        setSelectedUnits((prev) => {
            const newState = { ...prev };
            delete newState[key];
            return newState;
        });
        setUnitQuantities((prev) => {
            const newState = { ...prev };
            delete newState[key];
            return newState;
        });
        setAvailableUnits((prev) => {
            const newState = { ...prev };
            delete newState[key];
            return newState;
        });
        setUnitPrices((prev) => {
            const newState = { ...prev };
            delete newState[key];
            return newState;
        });
        setBasePrices((prev) => {
            const newState = { ...prev };
            delete newState[key];
            return newState;
        });
        setUnitDropdownOpen((prev) => {
            const newState = { ...prev };
            delete newState[key];
            return newState;
        });
    };

    const changeQty = (key, nextQty) => {
        const item = cart.find((x) => x.key === key);
        if (!item) return;

        const selectedUnit = selectedUnits[key] || item.unit;
        let q = n(nextQty);

        // Validate for fractions
        if (!item.is_fraction_allowed && q % 1 !== 0) {
            alert("Fractions are not allowed for this product");
            return;
        }

        // Validate stock in base units if it's not a piece product
        if (item.product_unit_type && item.product_unit_type !== "piece") {
            const requestedBaseQty = convertToBase(
                q,
                selectedUnit,
                item.product_unit_type
            );
            if (requestedBaseQty > item.base_quantity) {
                const availableInUnit = convertFromBase(
                    item.base_quantity,
                    selectedUnit,
                    item.product_unit_type
                );
                alert(
                    `Exceeds available stock! Available: ${availableInUnit.toFixed(
                        3
                    )} ${selectedUnit.toUpperCase()}`
                );
                return;
            }
        } else if (q > item.maxQty) {
            alert(`Exceeds available stock! Available: ${item.maxQty}`);
            return;
        }

        if (q < 0.001) q = 0.001;

        // Get the unit price for selected unit
        const unitPrice = unitPrices[key] || item.unit_price;

        setCart((prev) =>
            prev.map((x) => {
                if (x.key !== key) return x;
                return {
                    ...x,
                    qty: q,
                    unit_price: unitPrice, // Keep the calculated unit price
                    total_price: q * n(unitPrice),
                };
            })
        );
        setUnitQuantities((prev) => ({ ...prev, [key]: q }));
    };

    const handleUnitChange = (key, newUnit) => {
        const item = cart.find((x) => x.key === key);
        if (!item) return;

        const oldUnit = selectedUnits[key] || item.unit;
        const oldQty = unitQuantities[key] || item.qty;

        // Check if new unit is available
        const availableUnitsList = availableUnits[key] || [item.unit];
        if (!availableUnitsList.includes(newUnit)) {
            alert(
                `Cannot sell in ${newUnit.toUpperCase()} unit for this product`
            );
            return;
        }

        // Calculate price in new unit using base price per base unit
        let newPrice = item.unit_price;
        if (item.product_unit_type && item.product_unit_type !== "piece") {
            const basePricePerBaseUnit =
                basePrices[key] ||
                item.base_price_per_base_unit ||
                item.original_sale_price;
            const conversions = unitConversions[item.product_unit_type];
            if (conversions && conversions[newUnit]) {
                newPrice = basePricePerBaseUnit * conversions[newUnit];
            }
        }

        // Convert quantity to new unit
        let newQty = oldQty;
        if (item.product_unit_type && item.product_unit_type !== "piece") {
            newQty = convertUnitQuantity(
                oldQty,
                oldUnit,
                newUnit,
                item.product_unit_type
            );

            // Validate stock in new unit
            const requestedBaseQty = convertToBase(
                newQty,
                newUnit,
                item.product_unit_type
            );
            if (requestedBaseQty > item.base_quantity) {
                const availableInUnit = convertFromBase(
                    item.base_quantity,
                    newUnit,
                    item.product_unit_type
                );
                alert(
                    `Cannot change unit. Exceeds available stock! Available: ${availableInUnit.toFixed(
                        3
                    )} ${newUnit.toUpperCase()}`
                );
                return;
            }
        }

        // Update cart item with new unit and auto-calculated price
        setCart((prev) =>
            prev.map((x) => {
                if (x.key !== key) return x;
                return {
                    ...x,
                    unit: newUnit,
                    qty: newQty,
                    unit_price: newPrice, // Auto-calculated, read-only
                    total_price: newQty * n(newPrice),
                };
            })
        );

        // Update unit states
        setSelectedUnits((prev) => ({ ...prev, [key]: newUnit }));
        setUnitQuantities((prev) => ({ ...prev, [key]: newQty }));
        setUnitPrices((prev) => ({ ...prev, [key]: newPrice }));
        setUnitDropdownOpen((prev) => ({ ...prev, [key]: false }));
    };

    // Handle click outside dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            Object.keys(dropdownRefs.current).forEach((key) => {
                if (
                    dropdownRefs.current[key] &&
                    !dropdownRefs.current[key].contains(event.target)
                ) {
                    setUnitDropdownOpen((prev) => ({ ...prev, [key]: false }));
                }
            });
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ---------------- Pickup Functions ----------------
    const addPickupItem = () => {
        if (!pickupProductName || pickupQuantity <= 0 || pickupSalePrice <= 0) {
            alert("Please fill all required fields for pickup item");
            return;
        }

        const newItem = {
            id: Date.now(),
            product_name: pickupProductName,
            brand: pickupBrand,
            variant: pickupVariant,
            quantity: Number(pickupQuantity),
            unit: "piece",
            unit_price: Number(pickupUnitPrice),
            sale_price: Number(pickupSalePrice),
            total_price: Number(pickupQuantity) * Number(pickupSalePrice),
        };

        setPickupItems([...pickupItems, newItem]);

        // Reset form
        setPickupProductName("");
        setPickupBrand("");
        setPickupVariant("");
        setPickupQuantity(1);
        setPickupUnitPrice(0);
        setPickupSalePrice(0);
        setShowPickupModal(false);
    };

    const removePickupItem = (index) => {
        const updated = [...pickupItems];
        updated.splice(index, 1);
        setPickupItems(updated);
    };

    // ---------------- Payment Functions ----------------
    const handlePaymentStatusChange = (status) => {
        setPaymentStatus(status);
        setManualPaymentOverride(false);

        if (status === "paid") {
            setPaidAmount(grandTotal);
            setPartialPayment(false);
        } else if (status === "unpaid") {
            setPaidAmount(0);
            setPartialPayment(false);
            setSelectedAccount(""); // Clear account selection for unpaid
        } else if (status === "partial") {
            setPartialPayment(true);
            if (paidAmount === 0 || paidAmount >= grandTotal) {
                setPaidAmount(grandTotal * 0.5);
            }
        }
    };

    const handlePaidAmountChange = (value) => {
        setPaidAmount(n(value));
        setManualPaymentOverride(true);

        if (value === 0) {
            setPaymentStatus("unpaid");
            setPartialPayment(false);
        } else if (value >= grandTotal) {
            setPaymentStatus("paid");
            setPartialPayment(false);
        } else {
            setPaymentStatus("partial");
            setPartialPayment(true);
        }
    };

    const enableManualPaymentOverride = () => {
        setManualPaymentOverride(true);
    };

    const disableManualPaymentOverride = () => {
        setManualPaymentOverride(false);
        // Reset to the logic based on payment status
        if (paymentStatus === "paid") {
            setPaidAmount(grandTotal);
        } else if (paymentStatus === "unpaid") {
            setPaidAmount(0);
            setSelectedAccount(""); // Clear account for unpaid
        } else if (paymentStatus === "partial") {
            // Keep current paid amount but ensure it's not 0 or >= grandTotal
            if (paidAmount === 0 || paidAmount >= grandTotal) {
                setPaidAmount(grandTotal * 0.5);
            }
        }
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

    // Check if account selection should be disabled
    const isAccountDisabled = paymentStatus === "unpaid";

    // ---------------- Form Handling ----------------
    const form = useForm({
        customer_id: null,
        customer_name: null,
        phone: null,
        sale_date: saleDate,
        notes: notes,
        items: [],
        vat_rate: 0,
        discount_rate: 0,
        paid_amount: 0,
        grand_amount: 0,
        due_amount: 0,
        sub_amount: 0,
        type: "pos",
        pickup_items: [],
        supplier_id: null,
        account_id: "",
        adjust_from_advance: false,
        advance_adjustment: 0,
        payment_status: "unpaid",
    });

    useEffect(() => {
        const formattedItems = cart.map((i) => ({
            product_id: i.product_id,
            variant_id: i.variant_id,
            stock_id: i.stock_id,
            batch_no: i.batch_no,
            quantity: n(i.qty),
            unit_quantity: n(i.qty),
            unit: i.unit || "piece",
            unit_price: n(i.unit_price), // Auto-calculated price
            total_price: n(i.total_price),
            shadow_sell_price: n(i.shadow_unit_price),
        }));

        const formattedPickupItems = pickupItems.map((i) => ({
            product_name: i.product_name,
            brand: i.brand,
            variant: i.variant,
            quantity: i.quantity,
            unit_quantity: i.quantity,
            unit: i.unit || "piece",
            unit_price: i.unit_price,
            sale_price: i.sale_price,
            total_price: i.total_price,
            supplier_id: selectedSupplier?.id || null,
        }));

        const walkIn =
            !customerId && !customerName.trim() && !customerPhone.trim();

        form.setData({
            ...form.data,
            customer_id: customerId && customerId !== "01" ? customerId : null,
            customer_name: walkIn
                ? null
                : customerId && customerId !== "01"
                ? null
                : customerName.trim() || null,
            phone: walkIn
                ? null
                : customerId && customerId !== "01"
                ? null
                : customerPhone.trim() || null,
            items: formattedItems,
            pickup_items: formattedPickupItems,
            vat_rate: n(taxRate),
            discount_rate: 0,
            paid_amount: n(paidAmount),
            grand_amount: n(grandTotal),
            due_amount: n(dueAmount),
            sub_amount: n(totalSubTotal),
            type: "pos",
            account_id: selectedAccount || "",
            payment_status: paymentStatus,
            supplier_id: selectedSupplier?.id || null,
            sale_date: saleDate,
            notes: notes,
        });
    }, [
        cart,
        pickupItems,
        customerId,
        customerName,
        customerPhone,
        taxRate,
        totalSubTotal,
        grandTotal,
        paidAmount,
        dueAmount,
        selectedAccount,
        paymentStatus,
        selectedSupplier,
        saleDate,
        notes,
    ]);

    const submit = (e) => {
        e.preventDefault();

        if (!cart.length && !pickupItems.length)
            return alert("Add at least 1 product");
        if (paymentStatus !== "unpaid" && !selectedAccount)
            return alert("Select a payment account for payment");

        // If they typed one of name/phone, require both (not for walk-in)
        const hasOne =
            (!!customerName.trim() && !customerPhone.trim()) ||
            (!customerName.trim() && !!customerPhone.trim());
        if (!customerId && hasOne)
            return alert(
                "If you type customer info, provide both Name and Phone. Otherwise keep walk-in empty."
            );

        // Validate stock in base units
        const outOfStockItems = cart.filter((item) => {
            const selectedUnit = selectedUnits[item.key] || item.unit;

            if (item.product_unit_type && item.product_unit_type !== "piece") {
                const requestedBaseQty = convertToBase(
                    item.qty,
                    selectedUnit,
                    item.product_unit_type
                );
                return requestedBaseQty > item.base_quantity;
            } else {
                return item.qty > item.maxQty;
            }
        });

        if (outOfStockItems.length > 0) {
            const itemNames = outOfStockItems
                .map((item) => {
                    const selectedUnit = selectedUnits[item.key] || item.unit;
                    return `${item.name} (Requested: ${
                        item.qty
                    } ${selectedUnit.toUpperCase()})`;
                })
                .join(", ");
            alert(`Some items exceed available stock: ${itemNames}`);
            return;
        }

        form.post(route("sales.store"), {
            onSuccess: () => router.visit(route("sales.index")),
            onError: (errors) => {
                console.error(errors);
                alert(errors?.error || "Sale create failed. Check fields.");
            },
        });
    };

    const selectedAccountObj = selectedAccount
        ? accounts.find((acc) => String(acc.id) === String(selectedAccount))
        : null;

    return (
        <div className="bg-white rounded-box p-5">
            <PageHeader
                title="POS Checkout"
                subtitle="Create sale with modern POS layout"
            >
                <button
                    onClick={() => router.visit(route("sales.index"))}
                    className="btn btn-sm btn-ghost"
                >
                    <ArrowLeft size={15} /> Back
                </button>
            </PageHeader>

            <form onSubmit={submit} className="mt-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEFT COLUMN - Product Catalog (8 columns) */}
                    <div className="lg:col-span-8">
                        <div className="card border border-gray-200 rounded-2xl shadow-sm">
                            <div className="card-body p-4">
                                <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">
                                            Product Catalog
                                        </h2>
                                        <p className="text-sm text-gray-600">
                                            Browse and add products to cart
                                        </p>
                                    </div>

                                    <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                                        <div className="join">
                                            <select
                                                className="select select-bordered join-item select-sm"
                                                value={categoryFilter}
                                                onChange={(e) => {
                                                    setCategoryFilter(
                                                        e.target.value
                                                    );
                                                    setPage(1);
                                                }}
                                            >
                                                {categories.map((c) => (
                                                    <option key={c} value={c}>
                                                        {c}
                                                    </option>
                                                ))}
                                            </select>

                                            <select
                                                className="select select-bordered join-item select-sm"
                                                value={brandFilter}
                                                onChange={(e) => {
                                                    setBrandFilter(
                                                        e.target.value
                                                    );
                                                    setPage(1);
                                                }}
                                            >
                                                {brands.map((b) => (
                                                    <option key={b} value={b}>
                                                        {b}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="relative">
                                            <Search
                                                size={18}
                                                className="absolute left-3 top-2.5 text-gray-400"
                                            />
                                            <input
                                                className="input input-bordered input-sm w-full md:w-64 pl-10"
                                                placeholder="Search products..."
                                                value={search}
                                                onChange={(e) => {
                                                    setSearch(e.target.value);
                                                    setPage(1);
                                                }}
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline"
                                            onClick={() => {
                                                setSearch("");
                                                setCategoryFilter(
                                                    "All Categories"
                                                );
                                                setBrandFilter("All Brands");
                                                setPage(1);
                                            }}
                                            title="Reset"
                                        >
                                            <RefreshCw size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {pagedCatalog.map((p) => (
                                        <div
                                            key={p.id}
                                            className="card card-compact border border-gray-200 rounded-xl hover:shadow-md transition-shadow hover:border-primary/50"
                                        >
                                            <figure className="h-36 bg-gray-50 flex items-center justify-center overflow-hidden rounded-t-xl">
                                                {p.image ? (
                                                    <img
                                                        src={p.image}
                                                        alt={p.name}
                                                        className="h-full w-full object-contain p-4"
                                                        onError={(e) => {
                                                            e.currentTarget.onerror =
                                                                null;
                                                            e.currentTarget.src =
                                                                "/media/uploads/logo.png";
                                                        }}
                                                    />
                                                ) : (
                                                    <img
                                                        src="/media/uploads/logo.png"
                                                        alt={p.name}
                                                        className="h-full w-full object-contain p-4 opacity-50"
                                                        onError={(e) => {
                                                            e.currentTarget.onerror =
                                                                null;
                                                            e.currentTarget.src =
                                                                "/media/uploads/logo.png";
                                                        }}
                                                    />
                                                )}
                                            </figure>
                                            <div className="card-body p-4">
                                                <h3 className="card-title text-sm font-semibold text-gray-800 line-clamp-2 h-10">
                                                    {p.name}
                                                </h3>
                                                <div className="text-xs text-gray-500 mb-2">
                                                    <div className="truncate">
                                                        {p.product_no ||
                                                            "No code"}
                                                    </div>
                                                    <div className="flex justify-between mt-1">
                                                        <span>
                                                            {
                                                                p.variants?.[0]
                                                                    ?.variant_label
                                                            }
                                                        </span>

                                                        {p.unit_type &&
                                                            p.unit_type !==
                                                                "piece" && (
                                                                <span className="text-blue-600 font-medium">
                                                                    {p.default_unit?.toUpperCase() ||
                                                                        "PIECE"}
                                                                </span>
                                                            )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mt-2">
                                                    <div>
                                                        <div className="text-lg font-bold text-primary">
                                                            {money(
                                                                p.minPrice ?? 0
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-success font-medium flex items-center gap-1">
                                                            <Package
                                                                size={10}
                                                            />
                                                            <span>
                                                                Stock:{" "}
                                                                {formatCurrency(
                                                                    p.totalStock
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="dropdown dropdown-end">
                                                        <button
                                                            type="button"
                                                            className="btn btn-circle btn-primary btn-sm"
                                                            onClick={() => {
                                                                if (
                                                                    p.variants
                                                                        .length ===
                                                                    1
                                                                ) {
                                                                    addToCart(
                                                                        p,
                                                                        p
                                                                            .variants[0]
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            <Plus size={18} />
                                                        </button>

                                                        {p.variants.length >
                                                            1 && (
                                                            <ul className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-64  overflow-y-auto">
                                                                <li className="menu-title text-xs font-bold p-2">
                                                                    Select
                                                                    Variant
                                                                </li>
                                                                {p.variants.map(
                                                                    (
                                                                        variant,
                                                                        idx
                                                                    ) => (
                                                                        <li
                                                                            key={
                                                                                idx
                                                                            }
                                                                        >
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    addToCart(
                                                                                        p,
                                                                                        variant
                                                                                    )
                                                                                }
                                                                                className="flex justify-between items-center py-2 px-3 hover:bg-gray-50"
                                                                            >
                                                                                <div className="text-left">
                                                                                    <div className="font-medium text-sm">
                                                                                        {
                                                                                            variant.variant_label
                                                                                        }
                                                                                    </div>
                                                                                    <div className="text-xs text-gray-500">
                                                                                        Batch:{" "}
                                                                                        {variant.batch_no ||
                                                                                            "N/A"}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="text-right">
                                                                                    <div className="font-bold text-primary text-sm">
                                                                                        {money(
                                                                                            variant.sale_price
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="text-xs text-gray-500">
                                                                                        {formatCurrency(
                                                                                            variant.quantity
                                                                                        )}{" "}
                                                                                        {variant.purchase_unit?.toUpperCase()}
                                                                                    </div>
                                                                                </div>
                                                                            </button>
                                                                        </li>
                                                                    )
                                                                )}
                                                            </ul>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                <div className="mt-8 flex items-center justify-between border-t pt-4">
                                    <div className="text-sm text-gray-500">
                                        Showing {(page - 1) * pageSize + 1} to{" "}
                                        {Math.min(
                                            page * pageSize,
                                            filteredCatalog.length
                                        )}{" "}
                                        of {filteredCatalog.length} products
                                    </div>
                                    <div className="join">
                                        <button
                                            type="button"
                                            className="join-item btn btn-sm"
                                            disabled={page <= 1}
                                            onClick={() =>
                                                setPage((p) =>
                                                    Math.max(1, p - 1)
                                                )
                                            }
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <button className="join-item btn btn-sm btn-active pointer-events-none">
                                            Page {page}
                                        </button>
                                        <button
                                            type="button"
                                            className="join-item btn btn-sm"
                                            disabled={page >= totalPages}
                                            onClick={() =>
                                                setPage((p) =>
                                                    Math.min(totalPages, p + 1)
                                                )
                                            }
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN - Checkout Sections (4 columns) */}
                    <div className="lg:col-span-4">
                        <div className="space-y-6">
                            {/* Order Information Card */}
                            <div className="card border border-gray-200 rounded-2xl shadow-sm">
                                <div className="card-body p-4">
                                    <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-gray-800">
                                        <FileText size={20} /> Order Information
                                    </h2>

                                    <div className="space-y-4">
                                        {/* Sale Date */}
                                        <div className="form-control">
                                            <label className="label py-1">
                                                <span className="label-text flex items-center gap-2">
                                                    <Calendar size={14} /> Sale
                                                    Date
                                                </span>
                                            </label>
                                            <input
                                                type="date"
                                                className="input input-bordered"
                                                value={saleDate}
                                                onChange={(e) =>
                                                    setSaleDate(e.target.value)
                                                }
                                            />
                                        </div>

                                        {/* Customer Selection */}
                                        <div className="form-control">
                                            <label className="label py-1">
                                                <span className="label-text flex items-center gap-2">
                                                    <User size={14} /> Customer
                                                </span>
                                            </label>
                                            <select
                                                className="select select-bordered"
                                                value={customerId}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setCustomerId(val);
                                                    setShowManualCustomerFields(
                                                        val === "01"
                                                    );
                                                }}
                                            >
                                                <option value="">
                                                    Walk In Customer
                                                </option>
                                                <option value="01">
                                                    + Add New Customer
                                                </option>
                                                {customers.map((c) => (
                                                    <option
                                                        key={c.id}
                                                        value={c.id}
                                                    >
                                                        {c.customer_name} (
                                                        {c.phone})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Manual Customer Fields */}
                                        {showManualCustomerFields && (
                                            <div className="space-y-3 bg-gray-50 p-3 rounded-lg border">
                                                <div className="form-control">
                                                    <label className="label py-1">
                                                        <span className="label-text">
                                                            Customer Name *
                                                        </span>
                                                    </label>
                                                    <input
                                                        className="input input-bordered"
                                                        placeholder="Enter customer name"
                                                        value={customerName}
                                                        onChange={(e) =>
                                                            setCustomerName(
                                                                e.target.value
                                                            )
                                                        }
                                                        required
                                                    />
                                                </div>

                                                <div className="form-control">
                                                    <label className="label py-1">
                                                        <span className="label-text">
                                                            Phone Number *
                                                        </span>
                                                    </label>
                                                    <input
                                                        className="input input-bordered"
                                                        placeholder="Enter phone number"
                                                        value={customerPhone}
                                                        onChange={(e) =>
                                                            setCustomerPhone(
                                                                e.target.value
                                                            )
                                                        }
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Selected Customer Info */}
                                        {selectedCustomer && (
                                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-medium text-blue-800">
                                                            {
                                                                selectedCustomer.customer_name
                                                            }
                                                        </div>
                                                        <div className="text-sm text-blue-600">
                                                            {
                                                                selectedCustomer.phone
                                                            }
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setCustomerId("");
                                                            setSelectedCustomer(
                                                                null
                                                            );
                                                            setCustomerName("");
                                                            setCustomerPhone(
                                                                ""
                                                            );
                                                        }}
                                                        className="btn btn-xs btn-ghost text-blue-600"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Notes */}
                                        <div className="form-control">
                                            <label className="label py-1">
                                                <span className="label-text flex items-center gap-2">
                                                    <MessageSquare size={14} />{" "}
                                                    Notes
                                                </span>
                                            </label>
                                            <textarea
                                                className="textarea textarea-bordered"
                                                rows="2"
                                                value={notes}
                                                onChange={(e) =>
                                                    setNotes(e.target.value)
                                                }
                                                placeholder="Additional notes..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Cart Summary Card - FIXED DESIGN */}
                            <div className="card border border-gray-200 rounded-2xl shadow-sm">
                                <div className="card-body p-0">
                                    {/* Card Header */}
                                    <div className="px-4 py-3 border-b bg-gray-50 rounded-t-2xl">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-lg font-bold text-gray-800">
                                                Checkout Summary
                                            </h2>
                                            <div className="flex items-center gap-2">
                                                <span className="badge badge-primary">
                                                    {cartCount +
                                                        pickupItems.length}{" "}
                                                    items
                                                </span>
                                                {pickupItems.length > 0 && (
                                                    <span className="badge badge-warning">
                                                        {pickupItems.length}{" "}
                                                        pickup
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cart Items - Fixed Height with Vertical Scroll */}
                                    <div className="p-4">
                                        {!cart.length && !pickupItems.length ? (
                                            <div className="py-12 text-center bg-white">
                                                <Package
                                                    size={48}
                                                    className="mx-auto text-gray-300 mb-3"
                                                />
                                                <div className="font-medium text-gray-500">
                                                    No items added
                                                </div>
                                                <div className="text-sm text-gray-400 mt-1">
                                                    Select products from the
                                                    catalog
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                                {/* Stock Items */}
                                                {cart.map((i) => {
                                                    const availableUnitsList =
                                                        availableUnits[
                                                            i.key
                                                        ] || [
                                                            i.unit || "piece",
                                                        ];
                                                    const selectedUnit =
                                                        selectedUnits[i.key] ||
                                                        i.unit ||
                                                        "piece";
                                                    const unitQuantity =
                                                        unitQuantities[i.key] ||
                                                        i.qty ||
                                                        1;
                                                    const unitPrice =
                                                        unitPrices[i.key] ||
                                                        i.unit_price;
                                                    const basePricePerBaseUnit =
                                                        basePrices[i.key] ||
                                                        i.base_price_per_base_unit;

                                                    return (
                                                        <div
                                                            key={i.key}
                                                            className="p-3 border border-gray-200 rounded-lg hover:border-primary/50 hover:bg-gray-50 transition-colors"
                                                        >
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-semibold text-gray-900 truncate">
                                                                        {i.name}
                                                                    </div>
                                                                    <div className="text-xs text-gray-600 truncate mt-1">
                                                                        {
                                                                            i.variant_label
                                                                        }
                                                                        {i.batch_no &&
                                                                            ` • ${i.batch_no}`}
                                                                    </div>

                                                                    {/* Unit Selector */}
                                                                    {availableUnitsList.length >
                                                                        1 && (
                                                                        <div
                                                                            className="mt-2 relative"
                                                                            ref={(
                                                                                el
                                                                            ) =>
                                                                                (dropdownRefs.current[
                                                                                    i.key
                                                                                ] =
                                                                                    el)
                                                                            }
                                                                        >
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-xs btn-outline border-gray-300 hover:bg-gray-100 flex items-center gap-1"
                                                                                onClick={() =>
                                                                                    setUnitDropdownOpen(
                                                                                        (
                                                                                            prev
                                                                                        ) => ({
                                                                                            ...prev,
                                                                                            [i.key]:
                                                                                                !prev[
                                                                                                    i
                                                                                                        .key
                                                                                                ],
                                                                                        })
                                                                                    )
                                                                                }
                                                                            >
                                                                                <Ruler
                                                                                    size={
                                                                                        10
                                                                                    }
                                                                                />
                                                                                <span>
                                                                                    {selectedUnit.toUpperCase()}
                                                                                </span>
                                                                                <ChevronDown
                                                                                    size={
                                                                                        10
                                                                                    }
                                                                                />
                                                                            </button>

                                                                            {unitDropdownOpen[
                                                                                i
                                                                                    .key
                                                                            ] && (
                                                                                <div className="absolute left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-[120px]">
                                                                                    {availableUnitsList.map(
                                                                                        (
                                                                                            unit
                                                                                        ) => (
                                                                                            <button
                                                                                                key={
                                                                                                    unit
                                                                                                }
                                                                                                type="button"
                                                                                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center justify-between ${
                                                                                                    selectedUnit ===
                                                                                                    unit
                                                                                                        ? "bg-blue-50 text-blue-600"
                                                                                                        : ""
                                                                                                }`}
                                                                                                onClick={() =>
                                                                                                    handleUnitChange(
                                                                                                        i.key,
                                                                                                        unit
                                                                                                    )
                                                                                                }
                                                                                            >
                                                                                                <span>
                                                                                                    {unit.toUpperCase()}
                                                                                                </span>
                                                                                                {selectedUnit ===
                                                                                                    unit && (
                                                                                                    <Check
                                                                                                        size={
                                                                                                            12
                                                                                                        }
                                                                                                    />
                                                                                                )}
                                                                                            </button>
                                                                                        )
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                    {/* Quantity Controls */}
                                                                    <div className="mt-2 flex items-center gap-2">
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-xs btn-square btn-outline border-gray-300 hover:bg-gray-100"
                                                                            onClick={() =>
                                                                                changeQty(
                                                                                    i.key,
                                                                                    n(
                                                                                        i.qty
                                                                                    ) -
                                                                                        1
                                                                                )
                                                                            }
                                                                        >
                                                                            <Minus
                                                                                size={
                                                                                    12
                                                                                }
                                                                                className="text-gray-700"
                                                                            />
                                                                        </button>

                                                                        <input
                                                                            className="input input-bordered input-xs text-center font-medium w-20"
                                                                            type="number"
                                                                            value={
                                                                                unitQuantity
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                changeQty(
                                                                                    i.key,
                                                                                    Number(
                                                                                        e
                                                                                            .target
                                                                                            .value
                                                                                    )
                                                                                )
                                                                            }
                                                                        />

                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-xs btn-square btn-outline border-gray-300 hover:bg-gray-100"
                                                                            onClick={() =>
                                                                                changeQty(
                                                                                    i.key,
                                                                                    n(
                                                                                        i.qty
                                                                                    ) +
                                                                                        1
                                                                                )
                                                                            }
                                                                        >
                                                                            <Plus
                                                                                size={
                                                                                    12
                                                                                }
                                                                                className="text-gray-700"
                                                                            />
                                                                        </button>
                                                                    </div>

                                                                    {/* Stock Info */}
                                                                    <div className="text-xs text-gray-500 mt-1">
                                                                        Available:{" "}
                                                                        {formatCurrency(
                                                                            i.maxQty
                                                                        )}{" "}
                                                                        {i.original_purchase_unit?.toUpperCase()}
                                                                    </div>

                                                                    {/* Unit Conversion Info */}
                                                                    {i.product_unit_type &&
                                                                        i.product_unit_type !==
                                                                            "piece" && (
                                                                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs min-w-[200px]">
                                                                                <div className="text-blue-800">
                                                                                    <div className="flex items-center gap-1 mb-1">
                                                                                        <Calculator
                                                                                            size={
                                                                                                10
                                                                                            }
                                                                                        />
                                                                                        <strong>
                                                                                            Unit
                                                                                            Information
                                                                                        </strong>
                                                                                    </div>
                                                                                    <div className="grid grid-cols-2 gap-1">
                                                                                        <div>
                                                                                            Base
                                                                                            Price:
                                                                                        </div>
                                                                                        <div className="font-medium">
                                                                                            {money(
                                                                                                basePricePerBaseUnit ||
                                                                                                    i.original_sale_price
                                                                                            )}
                                                                                            /base
                                                                                        </div>

                                                                                        <div>
                                                                                            Sale
                                                                                            Price:
                                                                                        </div>
                                                                                        <div className="font-medium">
                                                                                            {money(
                                                                                                unitPrice
                                                                                            )}

                                                                                            /
                                                                                            {selectedUnit.toUpperCase()}
                                                                                        </div>

                                                                                        <div>
                                                                                            Available:
                                                                                        </div>
                                                                                        <div>
                                                                                            {formatCurrency(
                                                                                                convertFromBase(
                                                                                                    i.base_quantity,
                                                                                                    selectedUnit,
                                                                                                    i.product_unit_type
                                                                                                )
                                                                                            )}{" "}
                                                                                            {selectedUnit.toUpperCase()}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                </div>

                                                                <div className="text-right">
                                                                    <div className="font-bold text-gray-900 text-lg">
                                                                        {money(
                                                                            i.total_price
                                                                        )}
                                                                    </div>
                                                                    <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded mt-1">
                                                                        {money(
                                                                            unitPrice
                                                                        )}
                                                                        /
                                                                        {selectedUnit.toUpperCase()}
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-ghost btn-xs text-red-600 hover:text-red-700 hover:bg-red-50 mt-2"
                                                                        onClick={() =>
                                                                            removeCartItem(
                                                                                i.key
                                                                            )
                                                                        }
                                                                    >
                                                                        <Trash2
                                                                            size={
                                                                                12
                                                                            }
                                                                        />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {/* Pickup Items */}
                                                {pickupItems.map(
                                                    (item, index) => (
                                                        <div
                                                            key={item.id}
                                                            className="p-3 border border-yellow-200 rounded-lg bg-yellow-50 hover:bg-yellow-100"
                                                        >
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="flex-1">
                                                                    <div className="font-semibold text-gray-900 flex items-center gap-1">
                                                                        <ShoppingBag
                                                                            size={
                                                                                12
                                                                            }
                                                                            className="text-orange-500"
                                                                        />
                                                                        {
                                                                            item.product_name
                                                                        }
                                                                    </div>
                                                                    <div className="text-xs text-gray-600 mt-1">
                                                                        {item.brand &&
                                                                            `Brand: ${item.brand}`}
                                                                        {item.variant &&
                                                                            ` • ${item.variant}`}
                                                                    </div>
                                                                    <div className="text-xs text-gray-600 mt-1">
                                                                        Qty:{" "}
                                                                        <span className="font-medium">
                                                                            {
                                                                                item.quantity
                                                                            }
                                                                        </span>{" "}
                                                                        ×{" "}
                                                                        <span className="font-medium">
                                                                            {money(
                                                                                item.sale_price
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div className="text-right">
                                                                    <div className="font-bold text-gray-900 text-lg">
                                                                        {money(
                                                                            item.total_price
                                                                        )}
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-ghost btn-xs text-red-600 hover:text-red-700 hover:bg-red-50 mt-2"
                                                                        onClick={() =>
                                                                            removePickupItem(
                                                                                index
                                                                            )
                                                                        }
                                                                    >
                                                                        <Trash2
                                                                            size={
                                                                                12
                                                                            }
                                                                        />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )}

                                        {/* Add Pickup Item Button */}
                                        {cart.length > 0 && (
                                            <div className="mt-4">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowPickupModal(true)
                                                    }
                                                    className="btn btn-outline w-full btn-sm"
                                                >
                                                    <Plus
                                                        size={14}
                                                        className="mr-2"
                                                    />{" "}
                                                    Add Pickup Item
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Totals Section - NO HORIZONTAL SCROLL */}
                                    <div className="px-4 py-3 border-t bg-gray-50">
                                        {/* Subtotals */}
                                        <div className="space-y-2 mb-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">
                                                    Stock Items:
                                                </span>
                                                <span className="font-medium">
                                                    {money(subTotal)}
                                                </span>
                                            </div>
                                            {pickupItems.length > 0 && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-600">
                                                        Pickup Items:
                                                    </span>
                                                    <span className="font-medium">
                                                        {money(pickupSubTotal)}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="border-t pt-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-700 font-medium">
                                                        Subtotal:
                                                    </span>
                                                    <span className="font-semibold">
                                                        {money(totalSubTotal)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tax, Discount, Shipping - Compact Layout */}
                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                            <div className="form-control">
                                                <label className="label py-1">
                                                    <span className="label-text text-xs flex items-center gap-1">
                                                        <Percent size={10} />{" "}
                                                        Tax %
                                                    </span>
                                                </label>
                                                <input
                                                    type="number"
                                                    className="input input-bordered input-sm"
                                                    value={taxRate}
                                                    onChange={(e) =>
                                                        setTaxRate(
                                                            n(e.target.value)
                                                        )
                                                    }
                                                    placeholder="0"
                                                    min="0"
                                                    step="0.1"
                                                />
                                            </div>
                                            <div className="form-control">
                                                <label className="label py-1">
                                                    <span className="label-text text-xs flex items-center gap-1">
                                                        <CreditCard size={10} />{" "}
                                                        Discount
                                                    </span>
                                                </label>
                                                <input
                                                    type="number"
                                                    className="input input-bordered input-sm"
                                                    value={discountValue}
                                                    onChange={(e) =>
                                                        setDiscountValue(
                                                            n(e.target.value)
                                                        )
                                                    }
                                                    placeholder="0"
                                                    min="0"
                                                    step="0.01"
                                                />
                                            </div>
                                        </div>

                                        <div className="form-control">
                                            <label className="label py-1">
                                                <span className="label-text text-xs flex items-center gap-1">
                                                    <Truck size={10} /> Shipping
                                                </span>
                                            </label>
                                            <input
                                                type="number"
                                                className="input input-bordered input-sm"
                                                value={shippingValue}
                                                onChange={(e) =>
                                                    setShippingValue(
                                                        n(e.target.value)
                                                    )
                                                }
                                                placeholder="0"
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>

                                        {/* Grand Total */}
                                        <div className="mt-3 pt-3 border-t">
                                            <div className="flex justify-between items-center text-lg font-bold">
                                                <span>GRAND TOTAL:</span>
                                                <span className="text-primary">
                                                    {money(grandTotal)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Card */}
                            <div className="card border border-gray-800 bg-[#1e4d2b] text-white rounded-2xl shadow-lg">
                                <div className="card-body p-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold flex items-center gap-2">
                                            <CreditCard size={20} /> Payment
                                            Details
                                        </h3>

                                        <button
                                            type="button"
                                            onClick={
                                                manualPaymentOverride
                                                    ? disableManualPaymentOverride
                                                    : enableManualPaymentOverride
                                            }
                                            className="btn btn-xs bg-red-600 hover:bg-red-700 border-none text-white font-bold"
                                        >
                                            {manualPaymentOverride ? (
                                                <X size={12} />
                                            ) : (
                                                <Edit size={12} />
                                            )}
                                            {manualPaymentOverride
                                                ? "Cancel"
                                                : "Manual"}
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Payment Status */}
                                        <div className="form-control">
                                            <label className="label py-1">
                                                <span className="label-text text-sm text-gray-300">
                                                    Payment Status *
                                                </span>
                                            </label>
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
                                                <option value="paid">
                                                    Paid
                                                </option>
                                            </select>
                                        </div>

                                        {/* Account Selection */}
                                        <div className="form-control">
                                            <label className="label py-1">
                                                <span className="label-text text-sm text-gray-300">
                                                    Payment Account *
                                                </span>
                                            </label>
                                            <select
                                                className="select select-bordered select-sm w-full bg-gray-800 border-gray-700 text-white"
                                                value={selectedAccount}
                                                onChange={(e) =>
                                                    setSelectedAccount(
                                                        e.target.value
                                                    )
                                                }
                                                required={
                                                    paymentStatus !== "unpaid"
                                                }
                                                disabled={isAccountDisabled}
                                            >
                                                <option value="">
                                                    Select Account
                                                </option>
                                                {accounts.map((account) => (
                                                    <option
                                                        key={account.id}
                                                        value={account.id}
                                                    >
                                                        {account.name} — ৳
                                                        {formatCurrency(
                                                            account.current_balance
                                                        )}
                                                    </option>
                                                ))}
                                            </select>
                                            {isAccountDisabled && (
                                                <div className="text-xs text-gray-400 mt-1">
                                                    Account selection is
                                                    disabled for unpaid status
                                                </div>
                                            )}
                                        </div>

                                        {/* Selected Account Info */}
                                        {selectedAccountObj &&
                                            !isAccountDisabled && (
                                                <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            {getAccountIcon(
                                                                selectedAccountObj.type
                                                            )}
                                                            <span className="font-medium">
                                                                {
                                                                    selectedAccountObj.name
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xs text-gray-400">
                                                                Balance
                                                            </div>
                                                            <div className="text-sm font-bold">
                                                                ৳
                                                                {formatCurrency(
                                                                    selectedAccountObj.current_balance
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                        {/* Paid Amount Input */}
                                        <div className="form-control">
                                            <label className="label py-1">
                                                <span className="label-text text-sm text-gray-300">
                                                    Paid Amount
                                                </span>
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="input input-bordered input-sm w-full bg-gray-800 border-gray-700"
                                                value={paidAmount}
                                                onChange={(e) =>
                                                    handlePaidAmountChange(
                                                        e.target.value
                                                    )
                                                }
                                                disabled={
                                                    !manualPaymentOverride &&
                                                    paymentStatus === "unpaid"
                                                }
                                                min={0}
                                                max={grandTotal}
                                            />
                                        </div>

                                        {/* Payment Summary */}
                                        <div className="space-y-2 pt-3 border-t border-gray-700">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-300">
                                                    Grand Total:
                                                </span>
                                                <span className="font-bold">
                                                    {money(grandTotal)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-300">
                                                    Paid Amount:
                                                </span>
                                                <span className="font-bold text-green-400">
                                                    {money(paidAmount)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-300">
                                                    Due Amount:
                                                </span>
                                                <span
                                                    className={`font-bold ${
                                                        dueAmount > 0
                                                            ? "text-red-400"
                                                            : "text-green-400"
                                                    }`}
                                                >
                                                    {money(dueAmount)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <button
                                    type="submit"
                                    className="btn text-white w-full btn-lg"
                                    style={{ backgroundColor: "#1e4d2b" }}
                                    disabled={
                                        form.processing ||
                                        (!cart.length && !pickupItems.length)
                                    }
                                >
                                    {form.processing ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm"></span>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            Complete Sale
                                            <span className="ml-2 font-bold">
                                                {money(grandTotal)}
                                            </span>
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-outline w-full"
                                    onClick={() =>
                                        router.visit(route("sales.index"))
                                    }
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {Object.keys(form.errors || {}).length > 0 && (
                    <div className="mt-4 alert alert-error">
                        <div className="flex items-center gap-2">
                            <AlertCircle size={16} />
                            <div>
                                <div className="font-bold">
                                    Validation error
                                </div>
                                <div className="text-sm opacity-90">
                                    {Object.values(form.errors)
                                        .slice(0, 3)
                                        .join(" | ")}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </form>

            {/* Pickup Modal */}
            {showPickupModal && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-md">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <ShoppingBag size={20} /> Add Pickup Item
                            </h3>
                            <button
                                onClick={() => setShowPickupModal(false)}
                                className="btn btn-sm btn-circle btn-ghost"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">
                                        Product Name *
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered"
                                    value={pickupProductName}
                                    onChange={(e) =>
                                        setPickupProductName(e.target.value)
                                    }
                                    placeholder="Enter product name"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">
                                            Brand
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input input-bordered"
                                        value={pickupBrand}
                                        onChange={(e) =>
                                            setPickupBrand(e.target.value)
                                        }
                                        placeholder="Enter brand"
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">
                                            Variant
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input input-bordered"
                                        value={pickupVariant}
                                        onChange={(e) =>
                                            setPickupVariant(e.target.value)
                                        }
                                        placeholder="Enter variant"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">
                                            Quantity *
                                        </span>
                                    </label>
                                    <input
                                        type="number"
                                        className="input input-bordered"
                                        value={pickupQuantity}
                                        onChange={(e) =>
                                            setPickupQuantity(e.target.value)
                                        }
                                        min="1"
                                        required
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">
                                            Sale Price (৳) *
                                        </span>
                                    </label>
                                    <input
                                        type="number"
                                        className="input input-bordered"
                                        value={pickupSalePrice}
                                        onChange={(e) =>
                                            setPickupSalePrice(e.target.value)
                                        }
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">
                                        Total Amount
                                    </span>
                                </label>
                                <div className="input input-bordered bg-gray-100 font-bold text-center">
                                    ৳
                                    {formatCurrency(
                                        pickupQuantity * pickupSalePrice
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="modal-action">
                            <button
                                onClick={() => setShowPickupModal(false)}
                                className="btn btn-ghost"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={addPickupItem}
                                className="btn btn-primary"
                            >
                                Add Item
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
