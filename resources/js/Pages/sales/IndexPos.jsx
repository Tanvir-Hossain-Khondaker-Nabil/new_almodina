import React, { useState, useEffect } from "react";
import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import {
    Frown,
    Plus,
    Printer,
    Trash2,
    Eye,
    Search,
    Check,
    X,
    DollarSign,
    AlertCircle,
    Wallet,
    Landmark,
    Smartphone,
    CreditCard,
    History,
} from "lucide-react";
import { Link, router, useForm, usePage } from "@inertiajs/react";

export default function SalesIndex({ sales, filters, isShadowUser, accounts }) {
    const { auth } = usePage().props;

    // Payment modal states
    const [selectedSale, setSelectedSale] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [paymentErrors, setPaymentErrors] = useState({});
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [paymentData, setPaymentData] = useState({
        paid_amount: 0,
        payment_date: new Date().toISOString().split("T")[0],
        payment_method: "cash",
        notes: "",
        account_id: "",
    });

    // Handle search and filters
    const filterForm = useForm({
        search: filters.search || "",
        status: filters.status || "",
        date_from: filters.date_from || "",
        date_to: filters.date_to || "",
    });

    // Update selected account when account_id changes
    useEffect(() => {
        if (paymentData.account_id && accounts && accounts.length > 0) {
            const account = accounts.find(
                (acc) => acc.id == paymentData.account_id
            );
            setSelectedAccount(account || null);
        } else {
            setSelectedAccount(null);
        }
    }, [paymentData.account_id, accounts]);

    const handleFilter = () => {
        const queryParams = {};

        // Only add non-empty values to query params
        if (filterForm.data.search.trim())
            queryParams.search = filterForm.data.search.trim();
        if (filterForm.data.status) queryParams.status = filterForm.data.status;
        if (filterForm.data.date_from)
            queryParams.date_from = filterForm.data.date_from;
        if (filterForm.data.date_to)
            queryParams.date_to = filterForm.data.date_to;

        router.get(route("salesPos.index", "pos"), queryParams, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleFilter();
        }
    };

    const clearFilters = () => {
        filterForm.setData({
            search: "",
            status: "",
            date_from: "",
            date_to: "",
        });
        setTimeout(() => {
            router.get(
                route("salesPos.index", "pos"),
                {},
                {
                    preserveScroll: true,
                    preserveState: true,
                }
            );
        }, 0);
    };

    // Open payment modal
    const openPaymentModal = (sale) => {
        console.log("Opening payment modal for sale:", sale);

        let defaultAccountId = "";
        if (accounts && accounts.length > 0) {
            // Find default account
            const defaultAccount = accounts.find((acc) => acc.is_default);
            if (defaultAccount) {
                defaultAccountId = defaultAccount.id;
            } else {
                defaultAccountId = accounts[0]?.id || "";
            }
        }

        setSelectedSale(sale);
        setPaymentData({
            paid_amount: sale.due_amount > 0 ? sale.due_amount : 0,
            payment_date: new Date().toISOString().split("T")[0],
            payment_method: "cash",
            notes: "",
            account_id: defaultAccountId,
        });
        setShowPaymentModal(true);
        setPaymentErrors({});
    };

    // Close payment modal
    const closePaymentModal = () => {
        setShowPaymentModal(false);
        setSelectedSale(null);
        setSelectedAccount(null);
        setProcessingPayment(false);
        setPaymentErrors({});
    };

    // Handle payment input change
    const handlePaymentInputChange = (e) => {
        const { name, value } = e.target;
        setPaymentData((prev) => ({
            ...prev,
            [name]: name === "paid_amount" ? parseFloat(value) || 0 : value,
        }));
    };

    // Handle payment submission
    const handlePaymentSubmit = (e) => {
        e.preventDefault();

        if (!selectedSale) return;

        setProcessingPayment(true);
        setPaymentErrors({});

        // Validate before submitting
        const errors = {};

        if (paymentData.paid_amount <= 0) {
            errors.amount = "Please enter a payment amount";
        }

        if (paymentData.paid_amount > selectedSale.due_amount) {
            errors.paid_amount = "Payment cannot exceed due amount";
        }

        if (!paymentData.account_id) {
            errors.account_id = "Please select an account";
        }

        if (Object.keys(errors).length > 0) {
            setPaymentErrors(errors);
            setProcessingPayment(false);
            return;
        }

        router.post(
            route("sales.payments.store", { sale: selectedSale.id }),
            {
                sale_id: selectedSale.id,
                amount: paymentData.paid_amount,
                payment_date: paymentData.payment_date,
                payment_method: paymentData.payment_method,
                notes: paymentData.notes,
                account_id: paymentData.account_id,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    closePaymentModal();
                    router.reload({ only: ["sales"] });
                },
                onError: (errors) => {
                    console.error("Payment error:", errors);
                    setPaymentErrors(errors);
                    setProcessingPayment(false);
                },
            }
        );
    };

    // Calculate item counts for each sale
    const getTotalItems = (sale) => {
        return (
            sale.items?.reduce((total, item) => total + item.quantity, 0) || 0
        );
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-BD", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    // Format number
    const formatNumber = (amount) => {
        const num = parseFloat(amount) || 0;
        return new Intl.NumberFormat("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(num);
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

    const calculateTotals = () => {
        const salesData = sales.data || [];

        const totalRevenue = salesData.reduce(
            (sum, sale) => sum + parseFloat(sale.grand_total || 0),
            0
        );
        const totalPaid = salesData.reduce(
            (sum, sale) => sum + parseFloat(sale.paid_amount || 0),
            0
        );
        const totalDue = salesData.reduce(
            (sum, sale) => sum + parseFloat(sale.due_amount || 0),
            0
        );

        return {
            totalRevenue,
            totalPaid,
            totalDue,
            totalSales: salesData.length,
        };
    };

    const totals = calculateTotals();

    const hasActiveFilters =
        filterForm.data.search ||
        filterForm.data.status ||
        filterForm.data.date_from ||
        filterForm.data.date_to;

    // Check if payment button should be disabled
    const isPaymentDisabled = (sale) => {
        return sale.due_amount <= 0;
    };

    return (
        <div className="bg-white rounded-box p-5">
            <PageHeader
                title={
                    isShadowUser ? "Sales History (POS)" : "Sales History (POS)"
                }
                subtitle={
                    isShadowUser
                        ? "View sales data"
                        : "Manage your product sales"
                }
            >
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="join">
                        <input
                            type="search"
                            value={filterForm.data.search}
                            onChange={(e) =>
                                filterForm.setData("search", e.target.value)
                            }
                            onKeyPress={handleKeyPress}
                            placeholder="Search invoice or customer..."
                            className="input input-sm input-bordered join-item"
                        />
                    </div>

                    <select
                        value={filterForm.data.status}
                        onChange={(e) =>
                            filterForm.setData("status", e.target.value)
                        }
                        onKeyPress={handleKeyPress}
                        className="select select-sm select-bordered"
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>

                    <input
                        type="date"
                        value={filterForm.data.date_from}
                        onChange={(e) =>
                            filterForm.setData("date_from", e.target.value)
                        }
                        onKeyPress={handleKeyPress}
                        className="input input-sm input-bordered"
                    />

                    <input
                        type="date"
                        value={filterForm.data.date_to}
                        onChange={(e) =>
                            filterForm.setData("date_to", e.target.value)
                        }
                        onKeyPress={handleKeyPress}
                        className="input input-sm input-bordered"
                    />

                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="btn btn-sm btn-ghost"
                        >
                            Clear Filters
                        </button>
                    )}

                    <button
                        onClick={handleFilter}
                        className="btn btn-sm bg-[#1e4d2b] text-white join-item"
                    >
                        <Search size={16} />
                        Search
                    </button>

                    <Link
                        className="btn bg-[#1e4d2b] text-white btn-sm"
                        href={route("sales.add")}
                    >
                        <Plus size={16} />
                        New Sale
                    </Link>
                </div>
            </PageHeader>

            <div className="print:hidden">
                <div className="overflow-x-auto">
                    {sales.data.length > 0 ? (
                        <table className="table table-auto w-full">
                            <thead
                                className={`${
                                    isShadowUser
                                        ? "bg-warning"
                                        : "bg-[#1e4d2b] text-white"
                                } text-white`}
                            >
                                <tr>
                                    <th>Invoice No</th>
                                    <th>Customer</th>
                                    <th>Items</th>
                                    <th>Sub Total</th>
                                    <th>Grand Total</th>
                                    <th>Paid</th>
                                    <th>Due</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.data.map((sale, index) => (
                                    <tr
                                        key={sale.id}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="font-mono font-semibold">
                                            {sale.invoice_no}
                                        </td>
                                        <td>
                                            <div>
                                                <p className="font-medium">
                                                    {sale.customer
                                                        ?.customer_name ||
                                                        "Walk-in Customer"}
                                                </p>
                                                {sale.customer?.phone && (
                                                    <p className="text-sm text-gray-500">
                                                        {sale.customer.phone}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge badge-outline">
                                                {getTotalItems(sale)}
                                            </span>
                                        </td>
                                        <td className="font-semibold">
                                            {formatCurrency(sale.sub_total)} Tk
                                        </td>
                                        <td className="font-semibold text-primary">
                                            {formatCurrency(sale.grand_total)}{" "}
                                            Tk
                                        </td>
                                        <td className="text-success font-semibold">
                                            {formatCurrency(sale.paid_amount)}{" "}
                                            Tk
                                        </td>
                                        <td
                                            className={`font-semibold ${
                                                sale.due_amount > 0
                                                    ? "text-error"
                                                    : "text-success"
                                            }`}
                                        >
                                            {formatCurrency(sale.due_amount)} Tk
                                        </td>
                                        <td>
                                            <span
                                                className={`badge capitalize ${
                                                    sale.status === "paid"
                                                        ? "badge-success"
                                                        : sale.status ===
                                                          "cancelled"
                                                        ? "badge-error"
                                                        : "badge-warning"
                                                }`}
                                            >
                                                {sale.status}
                                            </span>
                                        </td>
                                        <td>
                                            {new Date(
                                                sale.created_at
                                            ).toLocaleString("en-GB", {
                                                timeZone: "Asia/Dhaka",
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1 flex-wrap">
                                                <Link
                                                    href={route(
                                                        "salesPrint.show",
                                                        {
                                                            sale: sale.id,
                                                            print: "print",
                                                        }
                                                    )}
                                                    className="btn btn-xs btn-info"
                                                >
                                                    <Eye size={13} />
                                                    View
                                                </Link>

                                                {/* Payment Button - Only show for sales with due amount */}
                                                {sale.due_amount > 0 && (
                                                    <button
                                                        onClick={() =>
                                                            openPaymentModal(
                                                                sale
                                                            )
                                                        }
                                                        className="btn btn-xs btn-warning btn-outline"
                                                        disabled={isPaymentDisabled(
                                                            sale
                                                        )}
                                                    >
                                                        <DollarSign size={12} />{" "}
                                                        Payment
                                                    </button>
                                                )}

                                                {sale.shadow_type == "shadow" &&
                                                    !isShadowUser && (
                                                        <>
                                                            <Link
                                                                href={route(
                                                                    "sales.edit",
                                                                    {
                                                                        sale: sale.id,
                                                                    }
                                                                )}
                                                                className="btn btn-xs btn-success flex items-center gap-1"
                                                            >
                                                                <Check
                                                                    size={13}
                                                                />{" "}
                                                                Accepted
                                                            </Link>

                                                            <Link
                                                                href={route(
                                                                    "sales.rejected",
                                                                    {
                                                                        sale: sale.id,
                                                                    }
                                                                )}
                                                                method="delete"
                                                                as="button"
                                                                onClick={(
                                                                    e
                                                                ) => {
                                                                    if (
                                                                        !confirm(
                                                                            "Are you sure you want to reject this order?"
                                                                        )
                                                                    ) {
                                                                        e.preventDefault();
                                                                    }
                                                                }}
                                                                className="btn btn-xs btn-error"
                                                            >
                                                                <X size={13} />
                                                                Rejected
                                                            </Link>
                                                        </>
                                                    )}

                                                {/* <Link
                                                    href={route('print.request',{ id: sale.id })}
                                                    method= "post"
                                                    className="btn btn-ghost btn-square btn-xs hover:bg-blue-600 hover:text-white text-blue-600"
                                                    title="Print"
                                                >
                                                    <Printer size={16} />
                                                </Link> */}

                                                {sale.shadow_type ==
                                                    "general" && (
                                                    <Link
                                                        href={route(
                                                            "sales.destroy",
                                                            { sale: sale.id }
                                                        )}
                                                        method="delete"
                                                        as="button"
                                                        onClick={(e) => {
                                                            if (
                                                                !confirm(
                                                                    "Are you sure you want to delete this sale?"
                                                                )
                                                            ) {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                        className="btn btn-xs btn-error"
                                                    >
                                                        <Trash2 size={13} />
                                                        Delete
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="border border-gray-200 rounded-box px-5 py-16 flex flex-col justify-center items-center gap-3">
                            <Frown size={32} className="text-gray-400" />
                            <h1 className="text-gray-500 text-lg font-medium">
                                No sales found!
                            </h1>
                            <p className="text-gray-400 text-sm text-center max-w-md">
                                {hasActiveFilters
                                    ? "Try adjusting your search filters to find what you're looking for."
                                    : "Get started by creating your first sale record."}
                            </p>
                            {!hasActiveFilters && (
                                <Link
                                    className="btn bg-[#1e4d2b] text-white btn-sm mt-2"
                                    href={route("sales.create")}
                                >
                                    <Plus size={16} />
                                    Create First Sale
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                {/* Summary Stats */}
                {sales.data.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 p-4 bg-gray-50 rounded-box">
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Total Sales</p>
                            <p className="text-xl font-bold text-primary">
                                {totals.totalSales}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                Total Revenue
                            </p>
                            <p className="text-xl font-bold text-success">
                                {formatCurrency(totals.totalRevenue)} Tk
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Total Paid</p>
                            <p className="text-xl font-bold text-info">
                                {formatCurrency(totals.totalPaid)} Tk
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Total Due</p>
                            <p className="text-xl font-bold text-error">
                                {formatCurrency(totals.totalDue)} Tk
                            </p>
                        </div>
                    </div>
                )}

                {sales.data.length > 0 && <Pagination data={sales} />}
            </div>

            {/* Payment Modal */}
            {showPaymentModal && selectedSale && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-4xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <DollarSign size={20} />
                                Payment Clearance - {selectedSale.invoice_no}
                            </h3>
                            <button
                                onClick={closePaymentModal}
                                className="btn btn-sm btn-circle btn-ghost"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Column: Payment Summary */}
                            <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <History size={16} />
                                    Sale Summary
                                </h4>

                                <div className="bg-gray-50 rounded-box p-4 mb-4">
                                    <div className="space-y-3 text-sm">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <span className="text-gray-600">
                                                    Grand Total:
                                                </span>
                                                <p className="font-semibold">
                                                    {formatCurrency(
                                                        selectedSale.grand_total
                                                    )}{" "}
                                                    Tk
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">
                                                    Total Paid:
                                                </span>
                                                <p className="font-semibold text-success">
                                                    {formatCurrency(
                                                        selectedSale.paid_amount
                                                    )}{" "}
                                                    Tk
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">
                                                    Due Amount:
                                                </span>
                                                <p
                                                    className={`font-semibold ${
                                                        selectedSale.due_amount >
                                                        0
                                                            ? "text-error"
                                                            : "text-success"
                                                    }`}
                                                >
                                                    {formatCurrency(
                                                        selectedSale.due_amount
                                                    )}{" "}
                                                    Tk
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">
                                                    Status:
                                                </span>
                                                <p className="font-semibold capitalize">
                                                    {selectedSale.status}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="border-t pt-2">
                                            <p className="text-gray-600 mb-1">
                                                Customer:
                                            </p>
                                            <p className="font-semibold">
                                                {selectedSale.customer
                                                    ?.customer_name ||
                                                    "Walk-in Customer"}
                                            </p>
                                            {selectedSale.customer?.phone && (
                                                <p className="text-sm text-gray-500">
                                                    {
                                                        selectedSale.customer
                                                            .phone
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Payment History if available */}
                                {selectedSale.payments &&
                                    selectedSale.payments.length > 0 && (
                                        <div>
                                            <h5 className="font-semibold mb-2">
                                                Previous Payments
                                            </h5>
                                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                                {selectedSale.payments.map(
                                                    (payment, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="bg-gray-100 p-2 rounded text-sm"
                                                        >
                                                            <div className="flex justify-between">
                                                                <span>
                                                                    {new Date(
                                                                        payment.payment_date
                                                                    ).toLocaleDateString()}
                                                                </span>
                                                                <span className="font-semibold text-success">
                                                                    {formatCurrency(
                                                                        payment.amount
                                                                    )}{" "}
                                                                    Tk
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                Method:{" "}
                                                                {
                                                                    payment.payment_method
                                                                }{" "}
                                                                |
                                                                {payment.notes &&
                                                                    ` Notes: ${payment.notes}`}
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}
                            </div>

                            {/* Right Column: Payment Form */}
                            <div>
                                <h4 className="font-semibold mb-3">
                                    Receive Payment
                                </h4>

                                <form onSubmit={handlePaymentSubmit}>
                                    <div className="space-y-4">
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">
                                                    Amount to Pay *
                                                </span>
                                                <span className="label-text-alt">
                                                    Due:{" "}
                                                    {formatCurrency(
                                                        selectedSale.due_amount
                                                    )}{" "}
                                                    Tk
                                                </span>
                                            </label>
                                            <input
                                                type="number"
                                                name="paid_amount"
                                                value={paymentData.paid_amount}
                                                onChange={
                                                    handlePaymentInputChange
                                                }
                                                min="0.01"
                                                max={selectedSale.due_amount}
                                                step="0.01"
                                                className="input input-bordered"
                                                required
                                            />
                                            {paymentErrors.paid_amount && (
                                                <div className="text-red-600 text-xs mt-1 flex items-center gap-1">
                                                    <AlertCircle size={12} />
                                                    {paymentErrors.paid_amount}
                                                </div>
                                            )}
                                        </div>

                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">
                                                    Payment Date *
                                                </span>
                                            </label>
                                            <input
                                                type="date"
                                                name="payment_date"
                                                value={paymentData.payment_date}
                                                onChange={
                                                    handlePaymentInputChange
                                                }
                                                className="input input-bordered"
                                                required
                                            />
                                        </div>

                                        {/* Payment Method */}
                                        {/* <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">Payment Method *</span>
                                            </label>
                                            <select
                                                name="payment_method"
                                                value={paymentData.payment_method}
                                                onChange={handlePaymentInputChange}
                                                className="select select-bordered"
                                                required
                                            >
                                                <option value="cash">Cash</option>
                                                <option value="bank">Bank Transfer</option>
                                                <option value="card">Credit/Debit Card</option>
                                                <option value="mobile_banking">Mobile Banking</option>
                                                <option value="check">Check</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div> */}

                                        {/* Account Selection */}
                                        {accounts && accounts.length > 0 && (
                                            <div className="form-control">
                                                <label className="label py-0">
                                                    <span className="label-text font-bold text-gray-700">
                                                        Payment Account *
                                                    </span>
                                                </label>
                                                <select
                                                    name="account_id"
                                                    value={
                                                        paymentData.account_id ||
                                                        ""
                                                    }
                                                    onChange={
                                                        handlePaymentInputChange
                                                    }
                                                    className="select select-bordered w-full"
                                                    disabled={processingPayment}
                                                    required
                                                >
                                                    <option value="">
                                                        Select Account
                                                    </option>
                                                    {accounts
                                                        .filter(
                                                            (acc) =>
                                                                acc.is_active
                                                        )
                                                        .map((account) => (
                                                            <option
                                                                key={account.id}
                                                                value={
                                                                    account.id
                                                                }
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        {getAccountIcon(
                                                                            account.type
                                                                        )}
                                                                        <span>
                                                                            {
                                                                                account.name
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-xs text-gray-500">
                                                                        ৳
                                                                        {formatNumber(
                                                                            account.current_balance
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </option>
                                                        ))}
                                                </select>
                                                {paymentErrors.account_id && (
                                                    <div className="text-red-600 text-xs mt-1 flex items-center gap-1">
                                                        <AlertCircle
                                                            size={12}
                                                        />
                                                        {
                                                            paymentErrors.account_id
                                                        }
                                                    </div>
                                                )}

                                                {/* Selected Account Info */}
                                                {selectedAccount && (
                                                    <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                {getAccountIcon(
                                                                    selectedAccount.type
                                                                )}
                                                                <span className="text-sm font-bold">
                                                                    {
                                                                        selectedAccount.name
                                                                    }
                                                                </span>
                                                                <span className="text-xs text-gray-500 capitalize">
                                                                    (
                                                                    {
                                                                        selectedAccount.type
                                                                    }
                                                                    )
                                                                </span>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-xs text-gray-500">
                                                                    Current
                                                                    Balance
                                                                </div>
                                                                <div className="text-sm font-mono font-bold">
                                                                    ৳
                                                                    {formatNumber(
                                                                        selectedAccount.current_balance
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">
                                                    Notes (Optional)
                                                </span>
                                            </label>
                                            <textarea
                                                name="notes"
                                                value={paymentData.notes}
                                                onChange={
                                                    handlePaymentInputChange
                                                }
                                                className="textarea textarea-bordered"
                                                rows="2"
                                                placeholder="Add any payment notes..."
                                            />
                                        </div>

                                        {/* Payment Summary */}
                                        <div className="bg-warning/10 border border-warning/20 rounded-box p-4">
                                            <h5 className="font-semibold mb-2">
                                                Payment Summary
                                            </h5>
                                            <div className="space-y-1 text-sm">
                                                <div className="flex justify-between">
                                                    <span>Current Due:</span>
                                                    <span>
                                                        {formatCurrency(
                                                            selectedSale.due_amount
                                                        )}{" "}
                                                        Tk
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Paying Now:</span>
                                                    <span className="text-success">
                                                        {formatCurrency(
                                                            paymentData.paid_amount
                                                        )}{" "}
                                                        Tk
                                                    </span>
                                                </div>
                                                <div className="flex justify-between font-semibold border-t pt-1">
                                                    <span>Remaining Due:</span>
                                                    <span
                                                        className={
                                                            selectedSale.due_amount -
                                                                paymentData.paid_amount >
                                                            0
                                                                ? "text-error"
                                                                : "text-success"
                                                        }
                                                    >
                                                        {formatCurrency(
                                                            selectedSale.due_amount -
                                                                paymentData.paid_amount
                                                        )}{" "}
                                                        Tk
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="modal-action">
                                            <button
                                                type="button"
                                                onClick={closePaymentModal}
                                                className="btn btn-ghost"
                                                disabled={processingPayment}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="btn bg-[#1e4d2b] text-white"
                                                disabled={
                                                    processingPayment ||
                                                    paymentData.paid_amount <=
                                                        0 ||
                                                    paymentData.paid_amount >
                                                        selectedSale.due_amount ||
                                                    !paymentData.account_id
                                                }
                                            >
                                                {processingPayment ? (
                                                    <span className="loading loading-spinner"></span>
                                                ) : (
                                                    <>
                                                        <DollarSign
                                                            size={16}
                                                            className="mr-1"
                                                        />
                                                        Process Payment
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
