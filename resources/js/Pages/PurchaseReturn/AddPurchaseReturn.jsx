import PageHeader from "../../components/PageHeader";
import { useForm, router } from "@inertiajs/react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  Shield,
  DollarSign,
  Building,
  Info,
  RefreshCw,
  Package,
  AlertCircle,
  ShoppingBag,
  AlertTriangle,
  ArrowRightLeft,
  PackageOpen,
  Warehouse,
  Hash,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "../../hooks/useTranslation";

// ✅ inline Calendar icon (so no lucide import needed)
const Calendar = ({ size = 16, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

export default function AddPurchaseReturn({
  purchase,
  purchaseItems,
  purchases,
  suppliers, // (not used now but kept for props compatibility)
  warehouses, // (not used now but kept for props compatibility)
  products,
  isShadowUser,
}) {
  const { t, locale } = useTranslation();

  // UI states
  const [selectedItems, setSelectedItems] = useState([]);
  const [replacementProducts, setReplacementProducts] = useState([]);
  const [returnType, setReturnType] = useState("money_back");
  const [showReplacementSearch, setShowReplacementSearch] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [paymentType, setPaymentType] = useState("cash");
  const [selectedPurchaseId, setSelectedPurchaseId] = useState(purchase?.id || "");
  const [validationErrors, setValidationErrors] = useState({});
  const [stockCheckResult, setStockCheckResult] = useState(null);

  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  // ✅ useForm (don’t rely on initial purchase_id only)
  const form = useForm({
    purchase_id: purchase?.id || "",
    return_type: "money_back",
    return_date: new Date().toISOString().split("T")[0],
    reason: "",
    notes: "",
    payment_type: "cash",
    refunded_amount: 0,
    shadow_refunded_amount: 0,
    items: [],
    replacement_products: [],
    replacement_total: 0,
    shadow_replacement_total: 0,
  });

  // ✅ ensure purchase_id is set when purchase prop arrives (fixes “first time id not found”)
  useEffect(() => {
    if (purchase?.id) {
      form.setData("purchase_id", purchase.id);
      setSelectedPurchaseId(purchase.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchase?.id]);

  const formatCurrency = useCallback((value) => {
    const numValue = Number(value) || 0;
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numValue);
  }, []);

  const getVariantDisplayName = useCallback((variant) => {
    if (variant?.attribute_values && Object.keys(variant.attribute_values).length > 0) {
      const parts = [];
      for (const [attribute, value] of Object.entries(variant.attribute_values)) {
        parts.push(`${attribute}: ${value}`);
      }
      return parts.join(", ");
    }
    if (variant?.name) return variant.name;

    const parts = [];
    if (variant?.size) parts.push(`Size: ${variant.size}`);
    if (variant?.color) parts.push(`Color: ${variant.color}`);
    if (variant?.material) parts.push(`Material: ${variant.material}`);
    return parts.join(", ") || "Default Variant";
  }, []);

  // ✅ totals
  const totalReturn = useMemo(() => {
    return selectedItems.reduce((total, item) => {
      const qty = Number(item.return_quantity) || 0;
      if (qty > 0) return total + qty * (Number(item.unit_price) || 0);
      return total;
    }, 0);
  }, [selectedItems]);

  const shadowTotalReturn = useMemo(() => {
    return selectedItems.reduce((total, item) => {
      const qty = Number(item.return_quantity) || 0;
      if (qty > 0) return total + qty * (Number(item.shadow_unit_price ?? item.unit_price) || 0);
      return total;
    }, 0);
  }, [selectedItems]);

  const replacementTotal = useMemo(() => {
    return replacementProducts.reduce((total, p) => {
      const q = Number(p.quantity) || 0;
      const u = Number(p.unit_price) || 0;
      return total + q * u;
    }, 0);
  }, [replacementProducts]);

  const shadowReplacementTotal = useMemo(() => {
    return replacementProducts.reduce((total, p) => {
      const q = Number(p.quantity) || 0;
      const u = Number(p.shadow_unit_price) || 0;
      return total + q * u;
    }, 0);
  }, [replacementProducts]);

  const netDifference = useMemo(() => {
    // Positive => Replacement > Return (we pay extra), Negative => Return > Replacement (we receive)
    return replacementTotal - totalReturn;
  }, [replacementTotal, totalReturn]);

  // ✅ stock check
  const checkStockAvailability = useCallback(() => {
    if (!purchase) return null;

    const unavailableItems = [];
    let totalAvailableValue = 0;
    let totalUnavailableValue = 0;

    selectedItems.forEach((item) => {
      const qty = Number(item.return_quantity) || 0;
      const maxQty = Number(item.max_quantity) || 0;

      if (qty > 0) {
        if (qty > maxQty) {
          unavailableItems.push({
            product: item.product_name,
            variant: item.variant_name,
            requested: qty,
            available: maxQty,
            shortfall: qty - maxQty,
          });
          totalUnavailableValue += (qty - maxQty) * (Number(item.unit_price) || 0);
        } else {
          totalAvailableValue += qty * (Number(item.unit_price) || 0);
        }
      }
    });

    return {
      hasIssues: unavailableItems.length > 0,
      unavailableItems,
      totalAvailableValue,
      totalUnavailableValue,
      canProceed: unavailableItems.length === 0,
    };
  }, [purchase, selectedItems]);

  // ✅ init selectedItems from purchaseItems
  useEffect(() => {
    if (purchaseItems && purchaseItems.length > 0) {
      const initialItems = purchaseItems.map((item) => ({
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
        reason: "",
      }));
      setSelectedItems(initialItems);
    } else {
      setSelectedItems([]);
    }
  }, [purchaseItems]);

  // ✅ filter products for replacement search
  useEffect(() => {
    const q = productSearch.trim().toLowerCase();
    if (q && showReplacementSearch) {
      const filtered = (products || []).filter(
        (p) =>
          p?.name?.toLowerCase().includes(q) ||
          (p?.product_no && p.product_no.toLowerCase().includes(q))
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts([]);
    }
  }, [productSearch, products, showReplacementSearch]);

  // ✅ close dropdown when click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowReplacementSearch(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ sync derived data into form (NO full overwrite)
  useEffect(() => {
    // Always ensure purchase_id exists when purchase loaded
    if (purchase?.id) form.setData("purchase_id", purchase.id);

    form.setData("return_type", returnType);
    form.setData("payment_type", returnType === "money_back" ? paymentType : null);

    if (returnType === "money_back") {
      form.setData("refunded_amount", totalReturn);
      form.setData("shadow_refunded_amount", shadowTotalReturn);
    } else {
      form.setData("refunded_amount", 0);
      form.setData("shadow_refunded_amount", 0);
    }

    form.setData(
      "items",
      selectedItems
        .filter((i) => (Number(i.return_quantity) || 0) > 0)
        .map((i) => ({
          purchase_item_id: i.purchase_item_id || i.id,
          return_quantity: Number(i.return_quantity) || 0,
          reason: i.reason || "Return requested",
        }))
    );

    form.setData(
      "replacement_products",
      returnType === "product_replacement"
        ? replacementProducts.map((p) => ({
            product_id: p.product_id,
            variant_id: p.variant_id,
            quantity: Number(p.quantity) || 1,
            unit_price: Number(p.unit_price) || 0,
            shadow_unit_price: Number(p.shadow_unit_price) || 0,
            sale_price: Number(p.sale_price) || 0,
            shadow_sale_price: Number(p.shadow_sale_price) || 0,
          }))
        : []
    );

    form.setData("replacement_total", returnType === "product_replacement" ? replacementTotal : 0);
    form.setData(
      "shadow_replacement_total",
      returnType === "product_replacement" ? shadowReplacementTotal : 0
    );

    setStockCheckResult(checkStockAvailability());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    purchase?.id,
    returnType,
    paymentType,
    selectedItems,
    replacementProducts,
    totalReturn,
    shadowTotalReturn,
    replacementTotal,
    shadowReplacementTotal,
    checkStockAvailability,
  ]);

  // ✅ update return item
  const updateReturnItem = useCallback(
    (index, field, value) => {
      setSelectedItems((prev) => {
        const updated = [...prev];
        if (!updated[index]) return prev;

        if (field === "return_quantity") {
          const quantity = parseInt(value, 10) || 0;
          const maxQuantity = Number(updated[index].max_quantity) || 0;

          if (quantity < 0) updated[index].return_quantity = 0;
          else if (quantity > maxQuantity) updated[index].return_quantity = maxQuantity;
          else updated[index].return_quantity = quantity;
        } else {
          updated[index][field] = value;
        }
        return updated;
      });

      // clear any item-specific errors (soft clear)
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[`item_${index}`];
        return next;
      });
    },
    [setSelectedItems]
  );

  // ✅ add replacement product
  const addReplacementProduct = useCallback(
    (product, variant) => {
      const defaultUnitPrice = parseFloat(variant?.unit_cost || variant?.purchase_price || 0);
      const defaultShadowUnitPrice = parseFloat(
        variant?.shadow_unit_cost || variant?.shadow_purchase_price || defaultUnitPrice
      );
      const defaultSalePrice = parseFloat(
        variant?.selling_price || variant?.sale_price || defaultUnitPrice * 1.2
      );
      const defaultShadowSalePrice = parseFloat(
        variant?.shadow_selling_price || variant?.shadow_sale_price || defaultShadowUnitPrice * 1.2
      );

      setReplacementProducts((prev) => {
        const existing = prev.find((x) => x.product_id === product.id && x.variant_id === variant.id);
        if (existing) {
          return prev.map((x) => {
            if (x.product_id === product.id && x.variant_id === variant.id) {
              const newQty = (Number(x.quantity) || 1) + 1;
              const unitPrice = Number(x.unit_price) || 0;
              const shadowUnitPrice = Number(x.shadow_unit_price) || 0;
              return {
                ...x,
                quantity: newQty,
                total_price: newQty * unitPrice,
                shadow_total_price: newQty * shadowUnitPrice,
              };
            }
            return x;
          });
        }

        return [
          ...prev,
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
            unit_type: product.unit_type || "piece",
            default_unit: product.default_unit || "piece",
          },
        ];
      });

      setProductSearch("");
      setShowReplacementSearch(false);

      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next.replacement;
        return next;
      });
    },
    [getVariantDisplayName]
  );

  const updateReplacementProduct = useCallback((index, field, value) => {
    setReplacementProducts((prev) => {
      const updated = [...prev];
      if (!updated[index]) return prev;

      if (field === "quantity" || field === "unit_price" || field === "shadow_unit_price") {
        const numericValue = parseFloat(value) || 0;
        updated[index][field] = numericValue > 0 ? numericValue : 0;

        const quantity = Number(updated[index].quantity) || 1;
        const unitPrice = Number(updated[index].unit_price) || 0;
        const shadowUnitPrice = Number(updated[index].shadow_unit_price) || 0;

        updated[index].total_price = quantity * unitPrice;
        updated[index].shadow_total_price = quantity * shadowUnitPrice;
      } else {
        updated[index][field] = value;
      }

      return updated;
    });

    // clear validation errors for that row
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[`replacement_quantity_${index}`];
      delete next[`replacement_price_${index}`];
      delete next[`replacement_product_${index}`];
      return next;
    });
  }, []);

  const removeReplacementProduct = useCallback((index) => {
    setReplacementProducts((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  }, []);

  const handleReturnTypeChange = useCallback((type) => {
    setReturnType(type);
    if (type === "money_back") {
      setReplacementProducts([]);
      setPaymentType("cash");
    }
  }, []);

  const handlePurchaseSelect = useCallback(
    (e) => {
      const purchaseId = e.target.value;
      setSelectedPurchaseId(purchaseId);
      if (purchaseId) {
        router.visit(route("purchase-return.create", { purchase_id: purchaseId }), {
          preserveScroll: true,
          preserveState: true,
        });
      }
    },
    [setSelectedPurchaseId]
  );

  // ✅ validate
  const validateForm = useCallback(() => {
    const errors = {};

    const pid = purchase?.id || form.data.purchase_id;
    if (!pid) errors.purchase = "Please select a purchase";

    if (!form.data.reason?.trim()) errors.reason = "Please provide a reason for the return";
    if (!form.data.return_date) errors.return_date = "Please select a return date";

    const hasReturnItems = selectedItems.some((i) => (Number(i.return_quantity) || 0) > 0);
    if (!hasReturnItems) errors.items = "Please select at least one item to return";

    // quantities check
    selectedItems.forEach((item, idx) => {
      const qty = Number(item.return_quantity) || 0;
      const maxQty = Number(item.max_quantity) || 0;
      if (qty > maxQty) errors[`item_${idx}`] = `Cannot return ${qty}. Maximum allowed: ${maxQty}`;
    });

    // stock check
    if (stockCheckResult?.hasIssues) errors.stock = "Some items exceed available stock.";

    if (returnType === "product_replacement") {
      if (replacementProducts.length === 0) errors.replacement = "Please add at least one replacement product";
      replacementProducts.forEach((p, idx) => {
        if ((Number(p.quantity) || 0) <= 0) errors[`replacement_quantity_${idx}`] = "Quantity must be greater than 0";
        if ((Number(p.unit_price) || 0) <= 0) errors[`replacement_price_${idx}`] = "Unit price must be greater than 0";
        if (!p.product_id || !p.variant_id) errors[`replacement_product_${idx}`] = "Product information is incomplete";
      });
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [
    purchase?.id,
    form.data.purchase_id,
    form.data.reason,
    form.data.return_date,
    selectedItems,
    stockCheckResult,
    returnType,
    replacementProducts,
  ]);

  // ✅ submit
  const submit = useCallback(
    (e) => {
      e.preventDefault();

      const pid = purchase?.id || form.data.purchase_id;

      if (!validateForm()) return;

      const submitData = {
        purchase_id: pid,
        return_type: returnType,
        return_date: form.data.return_date,
        reason: form.data.reason,
        notes: form.data.notes,
        payment_type: returnType === "money_back" ? paymentType : null,
        refunded_amount: returnType === "money_back" ? totalReturn : 0,
        shadow_refunded_amount: returnType === "money_back" ? shadowTotalReturn : 0,
        items: selectedItems
          .filter((i) => (Number(i.return_quantity) || 0) > 0)
          .map((i) => ({
            purchase_item_id: i.purchase_item_id || i.id,
            return_quantity: Number(i.return_quantity) || 0,
            reason: i.reason || "Return requested",
          })),
        replacement_products:
          returnType === "product_replacement"
            ? replacementProducts.map((p) => ({
                product_id: p.product_id,
                variant_id: p.variant_id,
                quantity: Number(p.quantity) || 1,
                unit_price: Number(p.unit_price) || 0,
                shadow_unit_price: Number(p.shadow_unit_price) || 0,
                sale_price: Number(p.sale_price) || 0,
                shadow_sale_price: Number(p.shadow_sale_price) || 0,
              }))
            : [],
        replacement_total: returnType === "product_replacement" ? replacementTotal : 0,
        shadow_replacement_total: returnType === "product_replacement" ? shadowReplacementTotal : 0,
      };

      form.post(route("purchase-return.store"), {
        preserveScroll: true,
        data: submitData,
        onSuccess: () => {
          router.visit(route("purchase-return.list"));
        },
        onError: (errors) => {
          setValidationErrors(errors || {});
          let msg = "There was an error creating the purchase return.";
          if (errors?.purchase_id) msg = `Purchase Error: ${errors.purchase_id}`;
          else if (errors?.items) msg = `Items Error: ${errors.items}`;
          else if (errors?.reason) msg = `Reason Error: ${errors.reason}`;
          else if (errors?.message) msg = errors.message;
          alert(msg);
        },
      });
    },
    [
      purchase?.id,
      form,
      validateForm,
      returnType,
      paymentType,
      totalReturn,
      shadowTotalReturn,
      selectedItems,
      replacementProducts,
      replacementTotal,
      shadowReplacementTotal,
      form.data.return_date,
      form.data.reason,
      form.data.notes,
    ]
  );

  return (
    <div className={`bg-white rounded-box p-5 ${locale === "bn" ? "bangla-font" : ""}`}>
      <PageHeader
        title={t("purchase_return.create_title", "Create Purchase Return")}
        subtitle={t("purchase_return.create_subtitle", "Process return for purchased items")}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.visit(route("purchase-return.list"))}
            className="btn btn-sm btn-ghost"
            type="button"
          >
            <ArrowLeft size={15} /> {t("purchase_return.back_to_list", "Back to List")}
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
                <li key={key} className="text-sm">
                  {error}
                </li>
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
              {t("purchase_return.select_purchase", "Select Purchase")}
            </h3>

            <div className="form-control">
              <select
                className="select select-bordered w-full"
                value={selectedPurchaseId}
                onChange={handlePurchaseSelect}
              >
                <option value="">
                  {t("purchase_return.select_purchase_placeholder", "Select a purchase to return")}
                </option>
                {(purchases || []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.purchase_no} - {p.supplier?.name} - {p.purchase_date} - ৳
                    {formatCurrency(p.grand_total || p.total_amount)}
                    {p.available_items > 0 ? ` (${p.available_items} items available)` : ""}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-sm text-gray-500 mt-2">
              {t("purchase_return.select_purchase_help", "Select a purchase to view items available for return")}
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
                {t("purchase_return.purchase_info", "Purchase Information")}
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
                    <div className="font-semibold">
                      ৳{formatCurrency(purchase.grand_total || purchase.total_amount)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="font-medium">Status:</div>
                  <div
                    className={`badge badge-sm ${
                      purchase.payment_status === "paid"
                        ? "badge-success"
                        : purchase.payment_status === "partial"
                        ? "badge-warning"
                        : "badge-error"
                    }`}
                  >
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
                  <span className="label-text">
                    {t("purchase_return.return_type", "Return Type")} *
                  </span>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`card card-compact cursor-pointer ${
                      returnType === "money_back"
                        ? "bg-primary text-primary-content border-2 border-primary"
                        : "bg-base-100 border border-base-300"
                    }`}
                  >
                    <div className="card-body p-3">
                      <div className="flex items-start">
                        <input
                          type="radio"
                          className="radio radio-primary mt-1"
                          checked={returnType === "money_back"}
                          onChange={() => handleReturnTypeChange("money_back")}
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Money Back</span>
                          </div>
                          <p className="text-xs text-gray-300 mt-2">
                            {t("purchase_return.money_back_desc", "Refund amount to supplier")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </label>

                  <label
                    className={`card card-compact cursor-pointer ${
                      returnType === "product_replacement"
                        ? "bg-warning text-warning-content border-2 border-warning"
                        : "bg-base-100 border border-base-300"
                    }`}
                  >
                    <div className="card-body p-3">
                      <div className="flex items-start">
                        <input
                          type="radio"
                          className="radio radio-warning mt-1"
                          checked={returnType === "product_replacement"}
                          onChange={() => handleReturnTypeChange("product_replacement")}
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Product Replacement</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {t("purchase_return.replacement_desc", "Replace with other products")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">
                    {t("purchase_return.return_date", "Return Date")} *
                  </span>
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

              {returnType === "money_back" && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">
                      {t("purchase_return.payment_type", "Payment Type")} *
                    </span>
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
                  <span className="label-text">
                    {t("purchase_return.reason", "Reason for Return")} *
                  </span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  rows="3"
                  value={form.data.reason}
                  onChange={(e) => form.setData("reason", e.target.value)}
                  placeholder={t(
                    "purchase_return.reason_placeholder",
                    "Explain why you are returning these items..."
                  )}
                  required
                />
                {validationErrors.reason && (
                  <span className="text-error text-xs mt-1">{validationErrors.reason}</span>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t("purchase_return.notes", "Additional Notes")}</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  rows="2"
                  value={form.data.notes}
                  onChange={(e) => form.setData("notes", e.target.value)}
                  placeholder={t("purchase_return.notes_placeholder", "Any additional information...")}
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
                    {t("purchase_return.items_to_return", "Items to Return")}
                    <span className="badge badge-primary badge-sm">
                      {selectedItems.filter((i) => (Number(i.return_quantity) || 0) > 0).length}
                    </span>
                  </h3>
                  <div className="text-sm text-gray-500">Select quantity for each item</div>
                </div>

                {selectedItems.length > 0 ? (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {selectedItems.map((item, index) => (
                      <div
                        key={index}
                        className="card card-compact bg-base-100 border border-base-300 hover:border-primary/50"
                      >
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
                                  {(Number(item.max_quantity) || 0) > 0 && (
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
                                onChange={(e) => updateReturnItem(index, "return_quantity", e.target.value)}
                              />
                              {validationErrors[`item_${index}`] && (
                                <span className="text-error text-xs mt-1">
                                  {validationErrors[`item_${index}`]}
                                </span>
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
                                  value={`৳${formatCurrency((Number(item.return_quantity) || 0) * (Number(item.unit_price) || 0))}`}
                                  readOnly
                                />
                                {!isShadowUser && (Number(item.return_quantity) || 0) > 0 && (
                                  <div className="text-xs text-warning">
                                    Shadow: ৳
                                    {formatCurrency(
                                      (Number(item.return_quantity) || 0) *
                                        (Number(item.shadow_unit_price) || 0)
                                    )}
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
                                onChange={(e) => updateReturnItem(index, "reason", e.target.value)}
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
                      <p className="text-gray-500">
                        {t("purchase_return.no_items_available", "No items available for return")}
                      </p>
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

                {stockCheckResult?.hasIssues && (
                  <div className="alert alert-warning mt-4">
                    <AlertTriangle size={20} />
                    <div className="flex-1">
                      <h3 className="font-bold">Stock Availability Issues</h3>
                      <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
                        {stockCheckResult.unavailableItems.map((it, idx) => (
                          <li key={idx}>
                            {it.product} ({it.variant}): Requested {it.requested}, Available {it.available}
                            {it.shortfall > 0 && <span className="text-error"> (Shortfall: {it.shortfall})</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-box">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">
                        {t("purchase_return.total_return_value", "Total Return Value")}:
                      </span>
                      <p className="text-sm text-gray-500 mt-1">
                        Items: {selectedItems.filter((i) => (Number(i.return_quantity) || 0) > 0).length} | Stock
                        Available: {stockCheckResult?.canProceed ? "✓ Yes" : "✗ Issues"}
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

            </div>
          </div>

          {/* Summary and Actions */}
          <div className="border-t border-base-300 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="card card-compact bg-base-100 border border-base-300">
                <div className="card-body">
                  <h4 className="card-title text-sm font-semibold flex items-center gap-2">
                    <PackageOpen size={16} />
                    {t("purchase_return.return_summary", "Return Summary")}
                  </h4>

                  <div className="space-y-2 text-sm mt-2">
                    <div className="flex justify-between items-center py-1">
                      <span>Items to Return:</span>
                      <span className="font-medium badge badge-primary badge-sm">
                        {selectedItems.filter((i) => (Number(i.return_quantity) || 0) > 0).length}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span>Total Return Value:</span>
                      <span className="font-semibold">৳{formatCurrency(totalReturn)}</span>
                    </div>

                    {returnType === "money_back" && (
                      <>
                        <div className="divider my-1"></div>
                        <div className="flex justify-between items-center py-1">
                          <span className="font-medium">Refund Amount:</span>
                          <span className="font-semibold text-primary">৳{formatCurrency(totalReturn)}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          This amount will be{" "}
                          {paymentType === "adjust_to_advance"
                            ? "adjusted to supplier advance"
                            : `refunded via ${paymentType}`}
                        </div>
                      </>
                    )}

                    {returnType === "product_replacement" && (
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
                    {t("purchase_return.value_comparison", "Value Comparison")}
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

                    {returnType === "product_replacement" && (
                      <>
                        <div className="divider my-1">Net Difference</div>
                        <div
                          className={`text-center p-3 rounded-lg ${
                            netDifference > 0
                              ? "bg-error/10 border border-error/20"
                              : netDifference < 0
                              ? "bg-success/10 border border-success/20"
                              : "bg-base-200"
                          }`}
                        >
                          <div className="text-lg font-bold">
                            {netDifference > 0 ? "+" : ""}৳{formatCurrency(Math.abs(netDifference))}
                          </div>
                          <div
                            className={`text-sm font-medium ${
                              netDifference > 0
                                ? "text-error"
                                : netDifference < 0
                                ? "text-success"
                                : "text-gray-500"
                            }`}
                          >
                            {netDifference > 0
                              ? "We pay to supplier"
                              : netDifference < 0
                              ? "We receive from supplier"
                              : "Values are equal"}
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
            </div>

            {/* actions */}
            <div className="flex gap-3">
              <button
                type="submit"
                className={`btn btn-lg ${
                  returnType === "product_replacement" ? "btn-warning" : "bg-[#1e4d2b] text-white"
                }`}
                disabled={form.processing || (stockCheckResult && !stockCheckResult.canProceed)}
              >
                {form.processing ? (
                  <span className="flex items-center gap-2">
                    <div className="loading loading-spinner loading-sm"></div>
                    {t("purchase_return.creating", "Creating Return...")}
                  </span>
                ) : (
                  <>
                    <RefreshCw size={18} className="mr-2" />
                    {t("purchase_return.create_return", "Create Purchase Return")}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => router.visit(route("purchase-return.list"))}
                className="btn btn-lg btn-ghost"
              >
                {t("purchase_return.cancel", "Cancel")}
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
