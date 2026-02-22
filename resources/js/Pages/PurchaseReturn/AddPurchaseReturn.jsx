import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm, router } from "@inertiajs/react";
import PageHeader from "@/Components/PageHeader";
import {
    ArrowLeft,
    ShoppingBag,
    AlertCircle,
    RefreshCw,
    Warehouse,
    User,
    Hash,
    CheckCircle,
    AlertTriangle,
    PackageOpen,
} from "lucide-react";

export default function Create({
    purchase,
    purchaseItems: initialItems,
    recentPurchases,
    accounts,
    isShadowUser,
}) {
    const [selectedPurchase, setSelectedPurchase] = useState(purchase || null);
    const [returnItems, setReturnItems] = useState([]);
    const [returnType, setReturnType] = useState("money_back");
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm({
        purchase_id: purchase?.id || "",
        return_type: "money_back",
        return_date: new Date().toISOString().split("T")[0],
        reason: "",
        notes: "",
        payment_type: "cash",
        account_id: "",
        items: [],
    });

    const formatCurrency = (value) => {
        const num = Number(value) || 0;
        return new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(num);
    };

    // Normalize purchaseItems: can be array OR paginator/resource {data:[]}
    const normalizedItems = useMemo(() => {
        if (Array.isArray(initialItems)) return initialItems;
        if (initialItems && Array.isArray(initialItems.data)) return initialItems.data;
        return [];
    }, [initialItems]);

    // Load initial items + sync selected purchase
    useEffect(() => {
        setSelectedPurchase(purchase || null);

        if (normalizedItems.length > 0) {
            const items = normalizedItems.map((item) => {
                const purchaseItemId = item.purchase_item_id ?? item.id;

                return {
                    purchase_item_id: purchaseItemId,
                    product_id: item.product_id,
                    variant_id: item.variant_id,
                    product_name: item.product_name ?? item.product?.name ?? "Unknown",
                    variant_name: item.variant_name ?? "",
                    purchase_quantity: item.purchase_quantity ?? item.quantity ?? 0,
                    unit_price: item.unit_price ?? 0,
                    shadow_unit_price: item.shadow_unit_price ?? null,
                    stock_quantity: item.stock_quantity ?? 0,
                    already_returned: item.already_returned ?? 0,
                    max_quantity: item.max_quantity ?? 0,
                    return_quantity: 0,
                    reason: "",
                };
            });

            setReturnItems(items);
            form.setData("purchase_id", purchase?.id || "");
        } else {
            setReturnItems([]);
            form.setData("purchase_id", purchase?.id || "");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [purchase, normalizedItems]);

    const handlePurchaseChange = (e) => {
        const purchaseId = e.target.value;
        if (purchaseId) {
            router.visit(route("purchase-returns.create", { purchase_id: purchaseId }));
        } else {
            setSelectedPurchase(null);
            setReturnItems([]);
            form.setData("purchase_id", "");
        }
    };

    const handleReturnItemChange = (index, field, value) => {
        setReturnItems((prev) => {
            const updated = [...prev];

            if (!updated[index]) return prev;

            if (field === "return_quantity") {
                const quantity = parseInt(value, 10) || 0;
                const maxQuantity = Number(updated[index].max_quantity) || 0;

                // Ensure quantity is between 0 and maxQuantity
                updated[index].return_quantity = Math.min(Math.max(0, quantity), maxQuantity);
            } else {
                updated[index][field] = value;
            }

            // Update form items only for return_quantity > 0
            const itemsToSubmit = updated
                .filter((item) => Number(item.return_quantity) > 0)
                .map((item) => ({
                    purchase_item_id: item.purchase_item_id,
                    return_quantity: Number(item.return_quantity) || 0,
                    reason: item.reason?.trim() ? item.reason.trim() : "Return requested",
                }));

            form.setData("items", itemsToSubmit);

            return updated;
        });
    };

    const calculateTotals = useCallback(() => {
        const totalReturn = returnItems.reduce((sum, item) => {
            const quantity = Number(item.return_quantity) || 0;
            const price = Number(item.unit_price) || 0;
            return sum + quantity * price;
        }, 0);

        const shadowTotalReturn = returnItems.reduce((sum, item) => {
            const quantity = Number(item.return_quantity) || 0;
            const shadowPrice = Number(item.shadow_unit_price ?? item.unit_price) || 0;
            return sum + quantity * shadowPrice;
        }, 0);

        return { totalReturn, shadowTotalReturn };
    }, [returnItems]);

    const validateForm = () => {
        const newErrors = {};

        if (!form.data.purchase_id) newErrors.purchase_id = "Please select a purchase";
        if (!form.data.reason.trim()) newErrors.reason = "Please provide a reason for return";
        if (!form.data.return_date) newErrors.return_date = "Please select return date";

        const hasReturnItems = returnItems.some((item) => Number(item.return_quantity) > 0);
        if (!hasReturnItems) newErrors.items = "Please select at least one item to return";

        // Validate return quantities
        returnItems.forEach((item, index) => {
            const rq = Number(item.return_quantity) || 0;
            const max = Number(item.max_quantity) || 0;
            if (rq > 0 && rq > max) {
                newErrors[`item_${index}`] = `Quantity exceeds available stock (Max: ${max})`;
            }
        });

        if (returnType === "money_back" && !form.data.account_id) {
            newErrors.account_id = "Please select an account for refund";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);

        const itemsToSubmit = returnItems
            .filter((item) => Number(item.return_quantity) > 0)
            .map((item) => ({
                purchase_item_id: item.purchase_item_id,
                return_quantity: Number(item.return_quantity) || 0,
                reason: item.reason?.trim() ? item.reason.trim() : "Return requested",
            }));

        const submitData = {
            purchase_id: form.data.purchase_id,
            return_type: returnType,
            return_date: form.data.return_date,
            reason: form.data.reason,
            notes: form.data.notes,
            payment_type: returnType === "money_back" ? form.data.payment_type : null,
            account_id: returnType === "money_back" ? form.data.account_id : null,
            items: itemsToSubmit,
            replacement_products: [],
        };

        form.post(route("purchase-return.store"), {
            data: submitData,
            preserveScroll: true,
            onSuccess: () => router.visit(route("purchase-return.list")),
            onError: (serverErrors) => {
                setErrors(serverErrors || {});
                setIsSubmitting(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const totals = calculateTotals();
    const selectedCount = returnItems.filter((i) => Number(i.return_quantity) > 0).length;

    return (
        <div className="py-6">
            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <PageHeader
                    title="Create Purchase Return"
                    subtitle="Process return for purchased items"
                >
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => router.visit(route("purchase-return.list"))}
                            className="btn btn-sm btn-ghost"
                        >
                            <ArrowLeft size={16} className="mr-2" />
                            Back to List
                        </button>
                    </div>
                </PageHeader>

                <div className="bg-white shadow-sm rounded-lg overflow-hidden mt-6">
                    <form onSubmit={handleSubmit}>
                        <div className="p-6">
                            {/* Error Summary */}
                            {Object.keys(errors).length > 0 && (
                                <div className="alert alert-error mb-6">
                                    <AlertTriangle size={20} />
                                    <div className="flex-1">
                                        <h3 className="font-bold">Please fix the following errors:</h3>
                                        <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
                                            {Object.values(errors).map((error, index) => (
                                                <li key={index}>{String(error)}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {/* Purchase Selection */}
                            <div className="card bg-base-100 border border-base-300 mb-6">
                                <div className="card-body">
                                    <h3 className="card-title text-sm font-semibold flex items-center gap-2">
                                        <ShoppingBag size={16} />
                                        Select Purchase
                                    </h3>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Purchase *</span>
                                        </label>

                                        <select
                                            className={`select select-bordered w-full ${
                                                errors.purchase_id ? "select-error" : ""
                                            }`}
                                            value={selectedPurchase?.id || ""}
                                            onChange={handlePurchaseChange}
                                            required
                                        >
                                            <option value="">Select a purchase...</option>
                                            {(recentPurchases || []).map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.purchase_no} - {p.supplier?.name} - {p.purchase_date} - ৳
                                                    {formatCurrency(p.grand_total)}
                                                </option>
                                            ))}
                                        </select>

                                        {errors.purchase_id && (
                                            <div className="text-error text-sm mt-1">{errors.purchase_id}</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {selectedPurchase && (
                                <>
                                    {/* Purchase Info */}
                                    <div className="card bg-base-100 border border-base-300 mb-6">
                                        <div className="card-body">
                                            <h3 className="card-title text-sm font-semibold flex items-center gap-2">
                                                <ShoppingBag size={16} />
                                                Purchase Information
                                            </h3>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Hash size={14} className="text-gray-400" />
                                                    <div>
                                                        <div className="font-medium">Purchase No:</div>
                                                        <div className="font-mono">
                                                            {selectedPurchase.purchase_no}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <User size={14} className="text-gray-400" />
                                                    <div>
                                                        <div className="font-medium">Supplier:</div>
                                                        <div>{selectedPurchase.supplier?.name}</div>
                                                        {selectedPurchase.supplier?.company && (
                                                            <div className="text-xs text-gray-500">
                                                                {selectedPurchase.supplier.company}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Warehouse size={14} className="text-gray-400" />
                                                    <div>
                                                        <div className="font-medium">Warehouse:</div>
                                                        <div>{selectedPurchase.warehouse?.name}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Return Details */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                                        {/* Left Column */}
                                        <div className="lg:col-span-1 space-y-4">
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text">Return Type *</span>
                                                </label>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <label
                                                        className={`card card-compact cursor-pointer ${
                                                            returnType === "money_back"
                                                                ? "bg-primary text-primary-content"
                                                                : "bg-base-100"
                                                        }`}
                                                    >
                                                        <div className="card-body p-3">
                                                            <div className="flex items-start">
                                                                <input
                                                                    type="radio"
                                                                    className="radio radio-primary mt-1"
                                                                    checked={returnType === "money_back"}
                                                                    onChange={() => {
                                                                        setReturnType("money_back");
                                                                        form.setData("return_type", "money_back");
                                                                    }}
                                                                />
                                                                <div className="ml-3">
                                                                    <div className="font-medium">Money Back</div>
                                                                    <p className="text-xs mt-1">
                                                                        Refund amount to supplier
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </label>

                                                    <label
                                                        className={`card card-compact cursor-pointer ${
                                                            returnType === "product_replacement"
                                                                ? "bg-warning text-warning-content"
                                                                : "bg-base-100"
                                                        }`}
                                                    >
                                                        <div className="card-body p-3">
                                                            <div className="flex items-start">
                                                                <input
                                                                    type="radio"
                                                                    className="radio radio-warning mt-1"
                                                                    checked={returnType === "product_replacement"}
                                                                    onChange={() => {
                                                                        setReturnType("product_replacement");
                                                                        form.setData(
                                                                            "return_type",
                                                                            "product_replacement"
                                                                        );
                                                                    }}
                                                                />
                                                                <div className="ml-3">
                                                                    <div className="font-medium">Product Replacement</div>
                                                                    <p className="text-xs mt-1">
                                                                        Replace with other products
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text">Return Date *</span>
                                                </label>
                                                <input
                                                    type="date"
                                                    className={`input input-bordered w-full ${
                                                        errors.return_date ? "input-error" : ""
                                                    }`}
                                                    value={form.data.return_date}
                                                    onChange={(e) => form.setData("return_date", e.target.value)}
                                                    required
                                                />
                                                {errors.return_date && (
                                                    <div className="text-error text-sm mt-1">
                                                        {errors.return_date}
                                                    </div>
                                                )}
                                            </div>

                                            {returnType === "money_back" && (
                                                <div className="form-control">
                                                    <label className="label">
                                                        <span className="label-text">Payment Account *</span>
                                                    </label>
                                                    <select
                                                        className={`select select-bordered w-full ${
                                                            errors.account_id ? "select-error" : ""
                                                        }`}
                                                        value={form.data.account_id}
                                                        onChange={(e) => form.setData("account_id", e.target.value)}
                                                        required
                                                    >
                                                        <option value="">Select account...</option>
                                                        {(accounts || []).map((account) => (
                                                            <option key={account.id} value={account.id}>
                                                                {account.name} (৳
                                                                {formatCurrency(account.current_balance)})
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {errors.account_id && (
                                                        <div className="text-error text-sm mt-1">
                                                            {errors.account_id}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text">Payment Type</span>
                                                </label>
                                                <select
                                                    className="select select-bordered w-full"
                                                    value={form.data.payment_type}
                                                    onChange={(e) => form.setData("payment_type", e.target.value)}
                                                >
                                                    <option value="cash">Cash</option>
                                                    <option value="bank_transfer">Bank Transfer</option>
                                                    <option value="check">Check</option>
                                                    <option value="mobile_banking">Mobile Banking</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Right Column - Items */}
                                        <div className="lg:col-span-2 space-y-6">
                                            <div className="card bg-base-100 border border-base-300">
                                                <div className="card-body">
                                                    <h3 className="card-title text-sm font-semibold flex items-center gap-2">
                                                        <PackageOpen size={16} />
                                                        Items to Return
                                                    </h3>

                                                    {errors.items && (
                                                        <div className="alert alert-warning mt-2">
                                                            <AlertCircle size={16} />
                                                            <span>{errors.items}</span>
                                                        </div>
                                                    )}

                                                    {returnItems.length > 0 ? (
                                                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2 mt-4">
                                                            {returnItems.map((item, index) => {
                                                                const notReturnable = Number(item.max_quantity) <= 0;

                                                                return (
                                                                    <div
                                                                        key={`${item.purchase_item_id}-${index}`}
                                                                        className="card card-compact bg-base-100 border border-base-300"
                                                                    >
                                                                        <div className="card-body">
                                                                            <div className="flex justify-between items-start mb-3">
                                                                                <div>
                                                                                    <h4 className="font-medium">
                                                                                        {item.product_name}
                                                                                    </h4>
                                                                                    <p className="text-sm text-gray-600">
                                                                                        {item.variant_name}
                                                                                    </p>

                                                                                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                                                                                        <span>
                                                                                            Purchased: {item.purchase_quantity}
                                                                                        </span>
                                                                                        <span>
                                                                                            Stock: {item.stock_quantity}
                                                                                        </span>
                                                                                        <span>
                                                                                            Already Returned: {item.already_returned}
                                                                                        </span>
                                                                                        <span>
                                                                                            Max: {item.max_quantity}
                                                                                        </span>
                                                                                    </div>

                                                                                    {notReturnable && (
                                                                                        <div className="mt-2 inline-flex items-center gap-2 text-xs">
                                                                                            <span className="badge badge-ghost">
                                                                                                Not returnable (stock/limit 0)
                                                                                            </span>
                                                                                        </div>
                                                                                    )}
                                                                                </div>

                                                                                <div className="text-right">
                                                                                    <div className="font-medium">
                                                                                        ৳{formatCurrency(item.unit_price)}
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                                                <div className="form-control">
                                                                                    <label className="label py-1">
                                                                                        <span className="label-text">Quantity *</span>
                                                                                    </label>
                                                                                    <input
                                                                                        type="number"
                                                                                        min="0"
                                                                                        max={item.max_quantity}
                                                                                        step="1"
                                                                                        className="input input-bordered input-sm w-full"
                                                                                        value={item.return_quantity}
                                                                                        disabled={notReturnable}
                                                                                        onChange={(e) =>
                                                                                            handleReturnItemChange(
                                                                                                index,
                                                                                                "return_quantity",
                                                                                                e.target.value
                                                                                            )
                                                                                        }
                                                                                    />
                                                                                    {errors[`item_${index}`] && (
                                                                                        <div className="text-error text-xs mt-1">
                                                                                            {errors[`item_${index}`]}
                                                                                        </div>
                                                                                    )}
                                                                                </div>

                                                                                <div className="form-control">
                                                                                    <label className="label py-1">
                                                                                        <span className="label-text">Item Total</span>
                                                                                    </label>
                                                                                    <div className="font-medium">
                                                                                        ৳
                                                                                        {formatCurrency(
                                                                                            (Number(item.return_quantity) || 0) *
                                                                                                (Number(item.unit_price) || 0)
                                                                                        )}
                                                                                    </div>
                                                                                </div>

                                                                                <div className="form-control">
                                                                                    <label className="label py-1">
                                                                                        <span className="label-text">Reason</span>
                                                                                    </label>
                                                                                    <input
                                                                                        type="text"
                                                                                        className="input input-bordered input-sm w-full"
                                                                                        value={item.reason || ""}
                                                                                        disabled={notReturnable}
                                                                                        onChange={(e) =>
                                                                                            handleReturnItemChange(
                                                                                                index,
                                                                                                "reason",
                                                                                                e.target.value
                                                                                            )
                                                                                        }
                                                                                        placeholder="e.g., Damaged, Wrong item"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-8">
                                                            <PackageOpen
                                                                size={32}
                                                                className="mx-auto text-gray-300 mb-2"
                                                            />
                                                            <p className="text-gray-500">
                                                                No items available for return
                                                            </p>
                                                            <p className="text-xs text-gray-400 mt-1">
                                                                (Controller may be filtering items by max_quantity &gt; 0)
                                                            </p>
                                                        </div>
                                                    )}

                                                    <div className="mt-4 pt-4 border-t border-base-300">
                                                        <div className="flex justify-between items-center">
                                                            <span className="font-medium">Total Return Value:</span>
                                                            <span className="font-semibold text-lg">
                                                                ৳{formatCurrency(totals.totalReturn)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notes + Summary */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                                        <div className="lg:col-span-2">
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text">Reason for Return *</span>
                                                </label>
                                                <textarea
                                                    className={`textarea textarea-bordered w-full h-32 ${
                                                        errors.reason ? "textarea-error" : ""
                                                    }`}
                                                    value={form.data.reason}
                                                    onChange={(e) => form.setData("reason", e.target.value)}
                                                    placeholder="Explain why you are returning these items..."
                                                    required
                                                />
                                                {errors.reason && (
                                                    <div className="text-error text-sm mt-1">{errors.reason}</div>
                                                )}
                                            </div>

                                            <div className="form-control mt-4">
                                                <label className="label">
                                                    <span className="label-text">Additional Notes</span>
                                                </label>
                                                <textarea
                                                    className="textarea textarea-bordered w-full h-24"
                                                    value={form.data.notes}
                                                    onChange={(e) => form.setData("notes", e.target.value)}
                                                    placeholder="Any additional information..."
                                                />
                                            </div>
                                        </div>

                                        <div className="lg:col-span-1">
                                            <div className="card bg-base-100 border border-base-300">
                                                <div className="card-body">
                                                    <h3 className="card-title text-sm font-semibold">Summary</h3>

                                                    <div className="space-y-3 mt-4">
                                                        <div className="flex justify-between">
                                                            <span>Return Value:</span>
                                                            <span className="font-medium">
                                                                ৳{formatCurrency(totals.totalReturn)}
                                                            </span>
                                                        </div>

                                                        {returnType === "product_replacement" && (
                                                            <div className="flex justify-between">
                                                                <span>Replacement Value:</span>
                                                                <span className="font-medium">৳0.00</span>
                                                            </div>
                                                        )}

                                                        <div className="divider"></div>

                                                        <div className="flex justify-between font-semibold">
                                                            <span>Total Items:</span>
                                                            <span>{selectedCount}</span>
                                                        </div>
                                                    </div>

                                                    {isShadowUser && (
                                                        <div className="mt-4 text-xs text-gray-500">
                                                            Shadow user mode enabled
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="bg-base-100 border-t border-base-300 p-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-gray-500">
                                        {selectedCount} items selected • Total: ৳{formatCurrency(totals.totalReturn)}
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => router.visit(route("purchase-return.list"))}
                                        className="btn btn-ghost"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className={`btn ${
                                            returnType === "product_replacement" ? "btn-warning" : "btn-primary"
                                        }`}
                                        disabled={isSubmitting || !selectedPurchase}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <RefreshCw size={16} className="mr-2 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle size={16} className="mr-2" />
                                                Create Purchase Return
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}