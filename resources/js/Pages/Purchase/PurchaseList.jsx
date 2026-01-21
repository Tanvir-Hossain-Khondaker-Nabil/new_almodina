import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import { Link, router, usePage, useForm } from "@inertiajs/react";
import { Eye, Plus, Trash2, Frown, Calendar, User, Warehouse, Edit, DollarSign, Package, Shield, Search, X, RefreshCw, CreditCard, CheckCircle, AlertCircle, Receipt } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "../../hooks/useTranslation";

export default function PurchaseList({ purchases, filters, isShadowUser, accounts }) {
  const { auth } = usePage().props;
  const { t, locale } = useTranslation();

  const [localFilters, setLocalFilters] = useState({
    search: filters?.search || "",
    status: filters?.status || "",
    date: filters?.date || "",
  });

  const [paymentForm, setPaymentForm] = useState({
    payment_amount: "",
    account_id: "",
    notes: "",
  });

  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentErrors, setPaymentErrors] = useState({});

  const handleFilter = (field, value) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);
    const queryString = {};
    if (newFilters.search) queryString.search = newFilters.search;
    if (newFilters.status) queryString.status = newFilters.status;
    if (newFilters.date) queryString.date = newFilters.date;
    router.get(route("purchase.list"), queryString, { preserveScroll: true, preserveState: true, replace: true });
  };

  const clearFilters = () => {
    setLocalFilters({ search: "", status: "", date: "" });
    router.get(route("purchase.list"), {}, { replace: true });
  };

  const handleDelete = (id) => {
    if (confirm("Permanently wipe record and reverse stock?")) {
      router.delete(route("purchase.destroy", id));
    }
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

  // Get display amounts for a purchase
  const getDisplayAmounts = (purchase) => {
    if (!purchase) return { total: 0, paid: 0, due: 0, payment_status: 'unpaid' };

    // Get real amounts from database
    const total = parseFloat(purchase.grand_total) || 0;
    const paid = parseFloat(purchase.paid_amount) || 0;
    const due = parseFloat(purchase.due_amount) || 0;
    const paymentStatus = purchase.payment_status || 'unpaid';

    // For shadow users, use shadow amounts if available
    if (isShadowUser && purchase.shadow_total_amount !== undefined) {
      const shadowTotal = parseFloat(purchase.shadow_total_amount) || total;
      const shadowPaid = parseFloat(purchase.shadow_paid_amount) || paid;
      const shadowDue = parseFloat(purchase.shadow_due_amount) || due;
      const shadowPaymentStatus = purchase.shadow_payment_status || paymentStatus;

      return {
        total: shadowTotal,
        paid: shadowPaid,
        due: shadowDue,
        payment_status: shadowPaymentStatus
      };
    }

    // For real users, calculate due if it seems wrong
    const calculatedDue = Math.max(0, total - paid);

    return {
      total: total,
      paid: paid,
      due: due > 0 ? due : calculatedDue, // Use stored due or calculate
      payment_status: paymentStatus
    };
  };

  // Calculate payment status based on amounts
  const calculatePaymentStatus = (total, paid) => {
    if (total <= 0) return 'unpaid';
    if (paid <= 0) return 'unpaid';
    if (paid >= total) return 'paid';
    return 'partial';
  };

  // Open payment modal
  const openPaymentModal = (purchase) => {
    const amounts = getDisplayAmounts(purchase);
    setSelectedPurchase(purchase);
    setPaymentForm({
      payment_amount: Math.max(0, amounts.due).toFixed(2),
      account_id: "",
      notes: "",
    });
    setPaymentErrors({});
    setShowPaymentModal(true);
  };

  // Close payment modal
  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedPurchase(null);
    setPaymentForm({
      payment_amount: "",
      account_id: "",
      notes: "",
    });
    setProcessingPayment(false);
    setPaymentErrors({});
  };

  // Validate payment form
  const validatePaymentForm = () => {
    const errors = {};
    const amounts = getDisplayAmounts(selectedPurchase);
    const maxAmount = amounts.due;

    if (!paymentForm.account_id) {
      errors.account_id = "Please select a payment method";
    }

    if (!paymentForm.payment_amount || parseFloat(paymentForm.payment_amount) <= 0) {
      errors.payment_amount = "Please enter a valid payment amount";
    } else if (parseFloat(paymentForm.payment_amount) > maxAmount) {
      errors.payment_amount = `Payment amount cannot exceed due amount of ${formatCurrency(maxAmount)}`;
    }

    return errors;
  };

  // Handle payment form changes
  const handlePaymentFormChange = (field, value) => {
    setPaymentForm(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (paymentErrors[field]) {
      setPaymentErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Handle payment submission
  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedPurchase) {
      console.error("No purchase selected");
      return;
    }

    const errors = validatePaymentForm();
    if (Object.keys(errors).length > 0) {
      setPaymentErrors(errors);
      return;
    }

    setProcessingPayment(true);
    
    router.post(
      route("purchase.updatePayment", selectedPurchase.id),
      {
        payment_amount: parseFloat(paymentForm.payment_amount),
        account_id: paymentForm.account_id,
        notes: paymentForm.notes,
        // _method: "PATCH" // Use PATCH method for update
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          closePaymentModal();
          // Refresh the purchases data
          router.reload({ 
            only: ['purchases'],
            preserveScroll: true 
          });
        },
        onError: (errors) => {
          console.error("Payment errors:", errors);
          // Convert Inertia errors object to our format
          const formattedErrors = {};
          Object.keys(errors).forEach(key => {
            formattedErrors[key] = Array.isArray(errors[key]) ? errors[key][0] : errors[key];
          });
          setPaymentErrors(formattedErrors);
        },
        onFinish: () => {
          setProcessingPayment(false);
        },
      }
    );
  };

  // Set payment to full amount
  const setFullPayment = () => {
    if (selectedPurchase) {
      const amounts = getDisplayAmounts(selectedPurchase);
      handlePaymentFormChange('payment_amount', Math.max(0, amounts.due).toFixed(2));
    }
  };

  // Set payment to partial amount (50% of due)
  const setHalfPayment = () => {
    if (selectedPurchase) {
      const amounts = getDisplayAmounts(selectedPurchase);
      const halfAmount = Math.max(0, amounts.due * 0.5);
      handlePaymentFormChange('payment_amount', halfAmount.toFixed(2));
    }
  };

  // Format date properly
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Format account balance for display
  const formatAccountBalance = (balance) => {
    const num = parseFloat(balance) || 0;
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const safePurchases = purchases?.data || [];

  return (
    <div className={`bg-white rounded-box p-5 ${locale === 'bn' ? 'bangla-font' : ''}`}>
      {/* Payment Modal - Positioned at the top */}
      {showPaymentModal && selectedPurchase && (
        <div className="fixed inset-0 bg-[#3333333d] bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mt-20">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <Receipt className="text-red-600" size={20} />
                  Clear Payment
                </h3>
                <button
                  onClick={closePaymentModal}
                  className="btn btn-ghost btn-circle btn-sm"
                  disabled={processingPayment}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Total</div>
                    <div className="text-lg font-black text-gray-900">
                      {formatCurrency(getDisplayAmounts(selectedPurchase).total)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Due</div>
                    <div className="text-lg font-black text-red-600">
                      {formatCurrency(getDisplayAmounts(selectedPurchase).due)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Purchase #:</span>
                    <span className="font-bold">{selectedPurchase.purchase_no}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Supplier:</span>
                    <span className="font-bold">{selectedPurchase.supplier?.name || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handlePaymentSubmit}>
                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label py-0">
                      <span className="label-text font-bold text-gray-700">Select Payment Method *</span>
                    </label>
                    <select
                      name="account_id"
                      value={paymentForm.account_id}
                      onChange={(e) => handlePaymentFormChange('account_id', e.target.value)}
                      className="select select-bordered w-full"
                      disabled={processingPayment}
                      required
                    >
                      <option value="">Select Payment Method</option>
                      {accounts && accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} ({formatAccountBalance(account.current_balance)} tk)
                        </option>
                      ))}
                    </select>
                    {paymentErrors.account_id && (
                      <div className="text-red-600 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {paymentErrors.account_id}
                      </div>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label py-0">
                      <span className="label-text font-bold text-gray-700">Payment Amount *</span>
                    </label>
                    <div className="flex gap-2 mb-2">
                      <button
                        type="button"
                        onClick={setHalfPayment}
                        className="btn btn-sm btn-outline flex-1"
                        disabled={processingPayment || getDisplayAmounts(selectedPurchase).due <= 0}
                      >
                        50%
                      </button>
                      <button
                        type="button"
                        onClick={setFullPayment}
                        className="btn btn-sm btn-outline btn-primary flex-1"
                        disabled={processingPayment || getDisplayAmounts(selectedPurchase).due <= 0}
                      >
                        Full
                      </button>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">৳</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={getDisplayAmounts(selectedPurchase).due}
                        value={paymentForm.payment_amount}
                        onChange={(e) => handlePaymentFormChange('payment_amount', e.target.value)}
                        className="input input-bordered w-full pl-8 font-mono"
                        disabled={processingPayment || getDisplayAmounts(selectedPurchase).due <= 0}
                        required
                      />
                    </div>
                    {paymentErrors.payment_amount && (
                      <div className="text-red-600 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {paymentErrors.payment_amount}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      Maximum: {formatCurrency(getDisplayAmounts(selectedPurchase).due)}
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label py-0">
                      <span className="label-text font-bold text-gray-700">Notes (Optional)</span>
                    </label>
                    <textarea
                      name="notes"
                      value={paymentForm.notes}
                      onChange={(e) => handlePaymentFormChange('notes', e.target.value)}
                      className="textarea textarea-bordered w-full"
                      rows="2"
                      placeholder="Payment reference or notes..."
                      disabled={processingPayment}
                    />
                  </div>

                  {paymentErrors.general && (
                    <div className="alert alert-error text-sm p-3">
                      <AlertCircle size={16} />
                      <span>{paymentErrors.general}</span>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={closePaymentModal}
                      className="btn btn-ghost flex-1"
                      disabled={processingPayment}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary flex-1"
                      disabled={processingPayment || getDisplayAmounts(selectedPurchase).due <= 0}
                    >
                      {processingPayment ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={18} />
                          Complete Payment
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <PageHeader
        title={t('purchase.purchase_management', 'Purchase Archive')}
        subtitle={t('purchase.manage_purchases', 'Inbound inventory tracking index')}
      >
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              onChange={(e) => handleFilter('search', e.target.value)}
              value={localFilters.search}
              placeholder="ID or Number..."
              className="input input-sm input-bordered rounded-lg pl-8 font-bold"
            />
          </div>
          <select
            onChange={(e) => handleFilter('status', e.target.value)}
            value={localFilters.status}
            className="select select-sm select-bordered rounded-lg font-bold"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <Link
            href={route("purchase.create")}
            className={`btn btn-sm border-none font-black uppercase tracking-widest text-[10px] ${isShadowUser ? 'bg-amber-500 text-black hover:bg-amber-600' : 'bg-primary text-white hover:bg-primary'}`}
          >
            <Plus size={15} /> {t('purchase.new_purchase', 'New Entry')}
          </Link>
        </div>
      </PageHeader>

      <div className="overflow-x-auto rounded-xl border border-gray-100">
        {safePurchases.length > 0 ? (
          <table className="table w-full">
            <thead className={`text-white uppercase text-[10px] tracking-widest ${isShadowUser ? 'bg-amber-500' : 'bg-primary'}`}>
              <tr>
                <th className="py-4">#</th>
                <th>Details</th>
                <th>Supplier & Warehouse</th>
                <th>Financial Status</th>
                <th className="text-right">Command</th>
              </tr>
            </thead>
            <tbody className="font-bold text-sm text-gray-700 italic-last-child">
              {safePurchases.map((purchase, index) => {
                const amounts = getDisplayAmounts(purchase);

                // Recalculate for display to ensure consistency
                const displayTotal = amounts.total;
                const displayPaid = amounts.paid;
                const displayDue = amounts.due;
                const displayPaymentStatus = amounts.payment_status;

                const hasDueAmount = displayDue > 0;
                const isPaid = displayPaymentStatus === 'paid';
                const isPartial = displayPaymentStatus === 'partial';

                return (
                  <tr key={purchase.id} className="hover:bg-gray-50 border-b border-gray-50 transition-colors">
                    <td className="text-gray-400 font-mono text-xs">{index + 1}</td>
                    <td>
                      <p className="font-black text-gray-900 font-mono uppercase tracking-tighter leading-none mb-1">
                        #{purchase.purchase_no}
                      </p>
                      <span className="text-[10px] flex items-center gap-1 text-gray-400 font-black uppercase tracking-widest">
                        <Calendar size={10} /> {formatDate(purchase.purchase_date)}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-gray-900 uppercase text-xs">
                          <User size={12} className="text-red-600" />
                          {purchase.supplier?.name || 'N/A'}
                        </div>
                        <div className="flex items-center gap-2 text-gray-400 uppercase text-[10px] font-black">
                          <Warehouse size={12} className="text-gray-400" />
                          {purchase.warehouse?.name || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Total:</span>
                          <span className="font-mono text-xs font-black text-gray-900">
                            {formatCurrency(displayTotal)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Paid:</span>
                          <span className={`font-mono text-xs font-black ${displayPaid > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                            {formatCurrency(displayPaid)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Due:</span>
                          <span className={`font-mono text-xs font-black ${displayDue > 0 ? 'text-red-600' : 'text-primary'}`}>
                            {formatCurrency(displayDue)}
                          </span>
                        </div>
                        <div className="flex gap-1 items-center mt-1">
                          <span className={`badge border-none font-black text-[9px] uppercase py-1.5 px-2 ${isPaid ? 'bg-green-100 text-green-700' : isPartial ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'}`}>
                            {displayPaymentStatus}
                          </span>
                          <span className={`badge border-none font-black text-[9px] uppercase py-1.5 px-2 ${purchase.status === 'completed' ? 'bg-blue-100 text-blue-700' : purchase.status === 'pending' ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-400'}`}>
                            {purchase.status}
                          </span>
                        </div>

                        {hasDueAmount && purchase.status === 'completed' && (
                          <div className="mt-2">
                            <button
                              onClick={() => openPaymentModal(purchase)}
                              className="btn btn-xs btn-primary w-full flex items-center justify-center gap-1"
                            >
                              <CreditCard size={12} />
                              Pay Now
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={route("purchase.show", purchase.id)}
                          className="btn btn-ghost btn-square btn-xs hover:bg-gray-900 hover:text-white"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </Link>

                        {purchase.status === 'completed' && (
                          <button
                            onClick={() => router.visit(route('purchase-return.create', { purchase_id: purchase.id }))}
                            className="btn btn-ghost btn-square btn-xs text-red-600 hover:bg-red-600 hover:text-white"
                            title="Create Return"
                          >
                            <RefreshCw size={14} />
                          </button>
                        )}

                        <Link
                          href={route("purchase.edit", purchase.id)}
                          className="btn btn-ghost btn-square btn-xs hover:bg-blue-600 hover:text-white text-blue-600"
                          title="Edit Purchase"
                        >
                          <Edit size={16} />
                        </Link>

                        {auth?.role === "admin" && (
                          <button
                            onClick={() => handleDelete(purchase.id)}
                            className="btn btn-ghost btn-square btn-xs text-red-400 hover:bg-red-600 hover:text-white"
                            title="Delete Purchase"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="py-20 text-center text-gray-400 flex flex-col items-center gap-3">
            <Frown size={40} className="text-gray-200" />
            <span className="font-black uppercase tracking-widest text-xs">No records found</span>
          </div>
        )}
      </div>
      <Pagination data={purchases} />
    </div>
  );
}