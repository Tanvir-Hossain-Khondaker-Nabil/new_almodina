import React, { useState, useEffect } from "react";
import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import {
    Frown, Plus, Trash2, Eye, Search, Edit, Check, X, Calendar, User,
    Mail, Phone, MapPin, Globe, DollarSign, CheckCircle, AlertCircle,
    CreditCard, History, Package, Shield, RefreshCw, Landmark, Wallet,
    Smartphone, Building, Users, TrendingUp, TrendingDown, FileText,
    ArrowUpRight, Info, ChevronRight, MessageSquare, Send
} from "lucide-react";
import { router, useForm, usePage } from "@inertiajs/react";
import axios from "axios";
import { useTranslation } from "../../hooks/useTranslation";

export default function Index({ suppliers, filters, accounts ,dealerships}) {
    const { auth,errors } = usePage().props;
    const { t, locale } = useTranslation();
    const [model, setModel] = useState(false);
    const [advanceModel, setAdvanceModel] = useState(false);
    const [smsTestModel, setSmsTestModel] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [editProcessing, setEditProcessing] = useState(false);
    const [smsPreview, setSmsPreview] = useState('');
    const [showSmsPreview, setShowSmsPreview] = useState(false);
    const [smsTestResult, setSmsTestResult] = useState(null);
    const [smsTestLoading, setSmsTestLoading] = useState(false);

    // Handle search and filters
    const [localFilters, setLocalFilters] = useState({
        search: filters.search || "",
        status: filters.status || "",
    });

    const [paymentData, setPaymentData] = useState({
        amount: "",
        payment_type: "cash",
        account_id: "",
        payment_date: new Date().toISOString().split('T')[0],
        notes: "",
    });
    const [processingPayment, setProcessingPayment] = useState(false);
    const [paymentErrors, setPaymentErrors] = useState({});

    // Model close handle
    const modelClose = () => {
        supplyForm.reset();
        setModel(false);
        setShowSmsPreview(false);
        setSmsPreview('');
    };

    // Advance model close handle
    const advanceModelClose = () => {
        setPaymentData({
            amount: "",
            payment_type: "cash",
            account_id: "",
            payment_date: new Date().toISOString().split('T')[0],
            notes: ""
        });
        setSelectedSupplier(null);
        setPaymentErrors({});
        setAdvanceModel(false);
    };

    // SMS Test model close handle
    const smsTestModelClose = () => {
        smsTestForm.reset();
        setSmsTestResult(null);
        setSmsTestModel(false);
    };

    // Handle search
    const handleFilter = (field, value) => {
        const newFilters = { ...localFilters, [field]: value };
        setLocalFilters(newFilters);

        router.get(route("supplier.view"),
            { search: newFilters.search, status: newFilters.status },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            }
        );
    };

    const clearFilters = () => {
        setLocalFilters({ search: "", status: "" });
        router.get(route("supplier.view"), {}, { replace: true });
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            router.get(route("supplier.view"),
                { search: localFilters.search, status: localFilters.status },
                { preserveScroll: true, preserveState: true, replace: true }
            );
        }
    };

    // Handle supplier form submission
    const supplyForm = useForm({
        id: "",
        name: "",
        description: "",
        contact_person: "",
        email: "",
        phone: "",
        company: "",
        address: "",
        website: "",
        advance_amount: 0,
        account_id: "",
        due_amount: 0,
        is_active: true,
        send_welcome_sms: true, // New SMS field
        dealership_id : null,
    });

    const handleAdvancePayment = (supplier) => {
        setSelectedSupplier(supplier);
        setPaymentData({
            amount: "",
            payment_type: "cash",
            account_id: "",
            payment_date: new Date().toISOString().split('T')[0],
            notes: ""
        });
        setPaymentErrors({});
        setAdvanceModel(true);
    };

    const handleAdvanceSubmit = async (e) => {
        e.preventDefault();

        if (!selectedSupplier) return;

        // Validation
        const errors = {};
        const amount = parseFloat(paymentData.amount) || 0;

        if (amount <= 0) {
            errors.amount = "Advance amount must be greater than 0";
        }

        if (!paymentData.account_id) {
            errors.account_id = "Please select an account";
        }

        if (Object.keys(errors).length > 0) {
            setPaymentErrors(errors);
            return;
        }

        setProcessingPayment(true);

        router.post(route("advancePayment.store", { id: selectedSupplier.id }), {
            supplier_id: selectedSupplier.id,
            amount: paymentData.amount,
            payment_type: paymentData.payment_type,
            type: 'supplier',
            account_id: paymentData.account_id,
            notes: paymentData.notes,
            is_advance: true,
            payment_date: paymentData.payment_date,
        }, {
            onSuccess: () => {
                advanceModelClose();
                router.reload({ only: ['suppliers'] });
            },
            onError: (errors) => {
                console.error('Advance payment error:', errors);
                setPaymentErrors(errors);
                setProcessingPayment(false);
            }
        });
    };

    const handlePaymentInputChange = (e) => {
        const { name, value } = e.target;
        setPaymentData(prev => ({
            ...prev,
            [name]: name === 'amount' ? parseFloat(value) || 0 : value
        }));

        // Clear error when user starts typing
        if (paymentErrors[name]) {
            setPaymentErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleSupplyCreateForm = (e) => {
        e.preventDefault();

        if (supplyForm.data.id) {
            // Update existing supplier
            supplyForm.put(route("supplier.update", { id: supplyForm.data.id }), {
                onSuccess: () => {
                    supplyForm.reset();
                    setModel(false);
                },
            });
        } else {
            // Create new supplier
            supplyForm.post(route("supplier.store"), {
                onSuccess: () => {
                    supplyForm.reset();
                    setModel(false);
                },
            });
        }
    };

    // Handle supplier edit
    const handleSupplyEdit = (id) => {
        setEditProcessing(true);
        axios.get(route("supplier.edit", { id: id })).then((res) => {
            const data = res.data.data;
            supplyForm.setData({
                id: data.id,
                name: data.name,
                description: data.description || "",
                contact_person: data.contact_person,
                email: data.email,
                phone: data.phone,
                company: data.company || "",
                address: data.address || "",
                website: data.website || "",
                advance_amount: parseFloat(data.advance_amount) || 0,
                account_id: data.account_id || "",
                dealership_id: data.dealership_id || "",
                due_amount: parseFloat(data.due_amount) || 0,
                is_active: Boolean(data.is_active),
                send_welcome_sms: true, // Default to true for new suppliers
            });
            setModel(true);
        }).finally(() => {
            setEditProcessing(false);
        });
    };

    // Handle supplier delete
    const handleDelete = (id) => {
        if (confirm(t('supplier.delete_confirmation', 'Are you sure you want to delete this supplier contact?'))) {
            router.delete(route("supplier.del", { id }), {
                preserveScroll: true,
                onSuccess: () => {
                    alert(t('supplier.deleted_successfully', 'Supplier contact deleted successfully!'));
                },
            });
        }
    };

    // Calculate due amount from purchases
    const calculateDueAmount = (purchases) => {
        if (!purchases || purchases.length === 0) return 0;
        return purchases.reduce((total, purchase) => {
            const due = (parseFloat(purchase.grand_total) || 0) - (parseFloat(purchase.paid_amount) || 0);
            return total + (due > 0 ? due : 0);
        }, 0);
    };

    // Format currency based on locale
    const formatCurrency = (amount) => {
        const num = parseFloat(amount) || 0;
        if (locale === 'bn') {
            return new Intl.NumberFormat('bn-BD', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(num);
        } else {
            return new Intl.NumberFormat('en-BD', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(num);
        }
    };

    // Format date based on locale
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (locale === 'bn') {
                return date.toLocaleDateString('bn-BD', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                });
            } else {
                return date.toLocaleDateString('en-US', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                });
            }
        } catch (e) {
            return dateString;
        }
    };

    // Get payment method icon
    const getPaymentIcon = (type) => {
        switch (type) {
            case 'cash': return <Wallet size={16} className="text-green-600" />;
            case 'bank': return <Landmark size={16} className="text-blue-600" />;
            case 'mobile': return <Smartphone size={16} className="text-purple-600" />;
            default: return <CreditCard size={16} />;
        }
    };

    // Set full payment
    const handleFullPayment = () => {
        if (selectedSupplier) {
            const dueAmount = calculateDueAmount(selectedSupplier.purchases) || 0;
            setPaymentData(prev => ({
                ...prev,
                amount: Math.max(0, dueAmount)
            }));
        }
    };

    // Get account details
    const getAccountDetails = () => {
        if (!paymentData.account_id) return null;
        return accounts.find(account => account.id.toString() === paymentData.account_id.toString());
    };

    const selectedAccount = getAccountDetails();

    // SMS Test form
    const smsTestForm = useForm({
        phone: "",
        message: "Test SMS from supplier management system",
    });

    // Handle SMS test submission
    const handleSmsTest = (e) => {
        e.preventDefault();

        setSmsTestLoading(true);
        setSmsTestResult(null);

        axios.post(route('supplier.send-test-sms'), smsTestForm.data())
            .then((response) => {
                setSmsTestResult({
                    success: response.data.success,
                    message: response.data.message,
                    sandbox: response.data.sandbox || false,
                });
                if (response.data.success) {
                    smsTestForm.reset();
                }
            })
            .catch((error) => {
                console.error('SMS test error:', error);
                setSmsTestResult({
                    success: false,
                    message: error.response?.data?.message || 'Failed to send test SMS',
                });
            })
            .finally(() => {
                setSmsTestLoading(false);
            });
    };

    return (
        <div className={`bg-white rounded-box p-5 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            {/* Advance Payment Modal */}
            {advanceModel && selectedSupplier && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all overflow-hidden">
                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-500 rounded-lg shadow-sm">
                                        <DollarSign className="text-white" size={22} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900">
                                            {t('supplier.add_advance_payment', 'Add Advance Payment')}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {t('supplier.record_advance_payment', 'Record advance payment for supplier')}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={advanceModelClose}
                                    className="btn btn-ghost btn-circle btn-sm hover:bg-gray-200"
                                    disabled={processingPayment}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="px-6 py-5 max-h-[75vh] overflow-y-auto">
                            {/* Supplier Info Card */}
                            <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-lg">{selectedSupplier.name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <User size={14} className="text-gray-500" />
                                            <p className="text-sm text-gray-600">{selectedSupplier.contact_person}</p>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full ${selectedSupplier.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} text-xs font-bold flex items-center gap-1`}>
                                        {selectedSupplier.is_active ? <CheckCircle size={12} /> : <X size={12} />}
                                        {selectedSupplier.is_active ? t('supplier.active', 'Active') : t('supplier.inactive', 'Inactive')}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                                        <div className="text-xs text-green-700 uppercase font-bold tracking-wider mb-1">
                                            {t('supplier.current_advance', 'Current Advance')}
                                        </div>
                                        <div className="text-xl font-black text-green-800">
                                            ৳{formatCurrency(selectedSupplier.advance_amount || 0)}
                                        </div>
                                    </div>
                                    <div className="text-center p-3 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
                                        <div className="text-xs text-red-700 uppercase font-bold tracking-wider mb-1">
                                            {t('supplier.total_due', 'Total Due')}
                                        </div>
                                        <div className="text-xl font-black text-red-800">
                                            ৳{formatCurrency(calculateDueAmount(selectedSupplier.purchases) || 0)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleAdvanceSubmit}>
                                <div className="space-y-6">
                                    {/* Amount Section */}
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <div className="flex justify-between items-center mb-3">
                                            <label className="label-text font-bold text-gray-800 text-sm">
                                                {t('supplier.amount', 'Amount')} *
                                            </label>
                                            <button
                                                type="button"
                                                onClick={handleFullPayment}
                                                className="btn btn-xs bg-[#1e4d2b] text-white bg-[#1e4d2b] text-white border-gray-900 hover:bg-black hover:border-black"
                                                disabled={processingPayment}
                                            >
                                                {t('supplier.full_payment', 'Full')}
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 font-bold text-lg">৳</span>
                                            <input
                                                type="number"
                                                name="amount"
                                                step="0.01"
                                                min="0.01"
                                                value={paymentData.amount}
                                                onChange={handlePaymentInputChange}
                                                className="input input-bordered w-full pl-3 py-4 text-lg font-mono border-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 bg-white"
                                                disabled={processingPayment}
                                                required
                                                placeholder="0.00"
                                            />
                                        </div>
                                        {paymentErrors.amount && (
                                            <div className="text-red-600 text-xs mt-2 flex items-center gap-2 bg-red-50 p-2 rounded-lg border border-red-200">
                                                <AlertCircle size={12} />
                                                {paymentErrors.amount}
                                            </div>
                                        )}
                                    </div>

                                    {/* Account Selection */}
                                    <div>
                                        <label className="label-text font-bold text-gray-800 text-sm mb-3 block">
                                            {t('supplier.payment_account', 'Payment Account')} *
                                        </label>
                                        <div className="relative">
                                            <Landmark size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
                                            <select
                                                name="account_id"
                                                value={paymentData.account_id}
                                                onChange={handlePaymentInputChange}
                                                className="select select-bordered w-full border-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 bg-white appearance-none"
                                                disabled={processingPayment}
                                                required
                                            >
                                                <option value="">{t('supplier.select_account', 'Select an account')}</option>
                                                {accounts.map((account) => (
                                                    <option key={account.id} value={account.id}>
                                                        {account.name} - ৳{formatCurrency(account.current_balance)}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronRight size={18} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 rotate-90" />
                                        </div>
                                        {paymentErrors.account_id && (
                                            <div className="text-red-600 text-xs mt-2 flex items-center gap-2 bg-red-50 p-2 rounded-lg border border-red-200">
                                                <AlertCircle size={12} />
                                                {paymentErrors.account_id}
                                            </div>
                                        )}
                                    </div>

                                    {/* Selected Account Details */}
                                    {selectedAccount && (
                                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200 shadow-sm">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-white rounded-lg border border-blue-200">
                                                        {getPaymentIcon(selectedAccount.type || 'bank')}
                                                    </div>
                                                    <div>
                                                        <h5 className="font-bold text-gray-900">{selectedAccount.name}</h5>
                                                        <p className="text-xs text-gray-600">
                                                            {t('supplier.account_details', 'Account Details')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${selectedAccount.type === 'cash' ? 'bg-green-100 text-green-800' : selectedAccount.type === 'bank' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                                    {selectedAccount.type || 'Bank'}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mt-4">
                                                <div className="bg-white p-3 rounded-lg border border-blue-100">
                                                    <div className="text-xs text-gray-500 mb-1">
                                                        {t('supplier.account_number', 'Account Number')}
                                                    </div>
                                                    <div className="font-mono text-sm font-bold text-gray-800">
                                                        {selectedAccount.account_number ?? 'N/A'}
                                                    </div>
                                                </div>

                                                <div className="bg-white p-3 rounded-lg border border-blue-100">
                                                    <div className="text-xs text-gray-500 mb-1">
                                                        {t('supplier.bank_name', 'Bank Name')}
                                                    </div>
                                                    <div className="font-bold text-sm text-gray-800">
                                                        {selectedAccount.bank_name
                                                            ?? selectedAccount.mobile_provider
                                                            ?? t('supplier.cash', 'Cash')}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-blue-200">
                                                <div className="flex items-center justify-between">
                                                    <div className="text-sm text-gray-700 font-medium">
                                                        {t('supplier.current_balance', 'Current Balance')}:
                                                    </div>
                                                    <div className="font-mono font-bold text-xl text-green-700">
                                                        ৳{formatCurrency(selectedAccount.current_balance || 0)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Date and Notes */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="label-text font-bold text-gray-800 text-sm mb-2 block">
                                                {t('supplier.payment_date', 'Payment Date')}
                                            </label>
                                            <div className="relative">
                                                <Calendar size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
                                                <input
                                                    type="date"
                                                    name="payment_date"
                                                    value={paymentData.payment_date}
                                                    onChange={handlePaymentInputChange}
                                                    className="input input-bordered w-full pl-12 py-3.5 border-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 bg-white"
                                                    disabled={processingPayment}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="label-text font-bold text-gray-800 text-sm mb-2 block">
                                                {t('supplier.notes', 'Notes')} ({t('supplier.optional', 'Optional')})
                                            </label>
                                            <input
                                                type="text"
                                                name="notes"
                                                value={paymentData.notes}
                                                onChange={handlePaymentInputChange}
                                                className="input input-bordered w-full py-3.5 border-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 bg-white"
                                                placeholder={t('supplier.payment_reference', 'Payment reference')}
                                                disabled={processingPayment}
                                            />
                                        </div>
                                    </div>

                                    {/* Payment Summary Card */}
                                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200 shadow-sm">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="p-1.5 bg-amber-100 rounded-lg">
                                                <Info size={18} className="text-amber-700" />
                                            </div>
                                            <h6 className="font-bold text-gray-900">
                                                {t('supplier.payment_summary', 'Payment Summary')}
                                            </h6>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center pb-3 border-b border-amber-200">
                                                <div className="text-sm text-gray-600">
                                                    {t('supplier.amount_to_pay', 'Amount to Pay')}
                                                </div>
                                                <div className="font-mono font-bold text-xl text-gray-900">
                                                    ৳{formatCurrency(paymentData.amount || 0)}
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <div className="text-sm text-gray-600">
                                                    {t('supplier.payment_account', 'Payment Account')}
                                                </div>
                                                <div className="font-bold text-gray-900">
                                                    {selectedAccount ? selectedAccount.name : t('supplier.not_selected', 'Not selected')}
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <div className="text-sm text-gray-600">
                                                    {t('supplier.payment_date', 'Payment Date')}
                                                </div>
                                                <div className="font-medium">
                                                    {paymentData.payment_date}
                                                </div>
                                            </div>

                                            {selectedAccount && (
                                                <>
                                                    <div className="my-3 border-t border-amber-200 pt-3">
                                                        <div className="flex justify-between items-center">
                                                            <div className="text-sm text-gray-600">
                                                                {t('supplier.current_balance', 'Current Balance')}
                                                            </div>
                                                            <div className="font-mono font-bold text-green-700">
                                                                ৳{formatCurrency(selectedAccount.current_balance || 0)}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-white p-3 rounded-lg border border-amber-200">
                                                        <div className="flex justify-between items-center">
                                                            <div className="text-sm font-bold text-gray-800">
                                                                {t('supplier.balance_after_payment', 'Balance After Payment')}
                                                            </div>
                                                            <div className="font-mono font-bold text-xl text-blue-700">
                                                                ৳{formatCurrency((selectedAccount.current_balance || 0) - (paymentData.amount || 0))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Errors */}
                                    {paymentErrors.submit && (
                                        <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <AlertCircle size={20} className="text-red-600" />
                                                <div>
                                                    <div className="font-bold">
                                                        {t('supplier.payment_error', 'Payment Error')}
                                                    </div>
                                                    <div className="text-sm mt-1">{paymentErrors.submit}</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={advanceModelClose}
                                        className="btn btn-ghost flex-1 hover:bg-gray-100 text-gray-700 border border-gray-300"
                                        disabled={processingPayment}
                                    >
                                        {t('supplier.cancel', 'Cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-success flex-1 bg-green-600 border-green-600 hover:bg-green-700 hover:border-green-700 text-white"
                                        disabled={processingPayment || !paymentData.amount || !paymentData.account_id}
                                    >
                                        {processingPayment ? (
                                            <>
                                                <span className="loading loading-spinner loading-sm"></span>
                                                {t('supplier.processing', 'Processing...')}
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle size={18} />
                                                {t('supplier.submit_payment', 'Submit Payment')}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <PageHeader
                title={t('supplier.title', 'Supplier Contacts')}
                subtitle={t('supplier.subtitle', 'Manage your all supplier contacts from here.')}
            >
                <div className="flex flex-wrap items-center gap-2">
                    {/* Search */}
                    <div className="relative">
                        <Search
                            size={14}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                            type="search"
                            value={localFilters.search}
                            onChange={(e) => handleFilter('search', e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={t('supplier.search_placeholder', 'Search suppliers...')}
                            className="h-8 pl-8 pr-3 text-xs font-semibold border border-gray-300 rounded-md focus:outline-none focus:border-gray-500"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={localFilters.status}
                        onChange={(e) => handleFilter('status', e.target.value)}
                        className="h-8 px-3 text-xs font-semibold border border-gray-300 rounded-md focus:outline-none focus:border-gray-500"
                    >
                        <option value="">{t('supplier.all_status', 'All Status')}</option>
                        <option value="active">{t('supplier.active', 'Active')}</option>
                        <option value="inactive">{t('supplier.inactive', 'Inactive')}</option>
                    </select>

                    {/* Clear Filter */}
                    {(localFilters.search || localFilters.status) && (
                        <button
                            onClick={clearFilters}
                            className="h-8 px-3 text-xs font-semibold text-gray-600 hover:text-black"
                        >
                            {t('supplier.clear', 'Clear')}
                        </button>
                    )}

                    {/* Add New Button */}
                    <button
                        onClick={() => setModel(true)}
                        className="h-8 px-3 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-[#1e4d2b] text-white text-white rounded-md hover:bg-black"
                    >
                        <Plus size={14} />
                        {t('supplier.add_supplier', 'Add Supplier')}
                    </button>
                    <button
                        onClick={() => setSmsTestModel(true)}
                        className="btn btn-info btn-sm"
                        title={t('supplier.test_sms', 'Test SMS')}
                    >
                        <MessageSquare size={15} /> SMS Test
                    </button>
                </div>
            </PageHeader>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-[#1e4d2b] text-white text-white rounded-xl p-4">
                    <p className="text-xs uppercase tracking-widest font-bold text-gray-300 mb-2">
                        {t('supplier.total_suppliers', 'Total Suppliers')}
                    </p>
                    <div className="flex items-center justify-between">
                        <p className="text-2xl font-black">{suppliers.total}</p>
                        <Users size={20} className="text-gray-400" />
                    </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-xs uppercase tracking-widest font-bold text-green-700 mb-2">
                        {t('supplier.active_suppliers', 'Active Suppliers')}
                    </p>
                    <div className="flex items-center justify-between">
                        <p className="text-2xl font-black text-green-700">
                            {suppliers.data.filter(s => s.is_active).length}
                        </p>
                        <CheckCircle size={20} className="text-green-500" />
                    </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-xs uppercase tracking-widest font-bold text-amber-700 mb-2">
                        {t('supplier.total_advance', 'Total Advance')}
                    </p>
                    <div className="flex items-center justify-between">
                        <p className="text-2xl font-black text-amber-700">
                            ৳{formatCurrency(suppliers.data.reduce((sum, s) => sum + parseFloat(s.advance_amount || 0), 0))}
                        </p>
                        <TrendingUp size={20} className="text-amber-500" />
                    </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-xs uppercase tracking-widest font-bold text-red-700 mb-2">
                        {t('supplier.total_due', 'Total Due')}
                    </p>
                    <div className="flex items-center justify-between">
                        <p className="text-2xl font-black text-red-700">
                            ৳{formatCurrency(suppliers.data.reduce((sum, s) => sum + calculateDueAmount(s.purchases), 0))}
                        </p>
                        <TrendingDown size={20} className="text-red-500" />
                    </div>
                </div>
            </div>

            {/* Suppliers Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-100">
                {suppliers.data.length > 0 ? (
                    <table className="table w-full">
                        <thead className="bg-[#1e4d2b] text-white text-white uppercase text-[10px] tracking-widest">
                            <tr>
                                <th className="py-4">#</th>
                                <th>{t('supplier.contact_info', 'Contact Info')}</th>
                                <th>{t('supplier.company_details', 'Company Details')}</th>
                                <th>{t('supplier.financial_status', 'Financial Status')}</th>
                                <th className="text-right">{t('supplier.command', 'Command')}</th>
                            </tr>
                        </thead>
                        <tbody className="font-bold text-sm text-gray-700">
                            {suppliers.data.map((supplier, index) => {
                                const dueAmount = calculateDueAmount(supplier.purchases);
                                const hasDue = dueAmount > 0;
                                const hasAdvance = supplier.advance_amount > 0;

                                return (
                                    <tr key={supplier.id} className="hover:bg-gray-50 border-b border-gray-50 transition-colors">
                                        <td className="text-gray-400 font-mono text-xs">{index + 1}</td>
                                        <td>
                                            <p className="font-black text-gray-900 uppercase tracking-tighter leading-none mb-1">
                                                {supplier.contact_person}
                                            </p>
                                            <span className="text-[10px] flex items-center gap-1 text-gray-400 font-black uppercase tracking-widest">
                                                <Mail size={10} /> {supplier.email}
                                            </span>
                                            <span className="text-[10px] flex items-center gap-1 text-gray-400 font-black uppercase tracking-widest mt-1">
                                                <Phone size={10} /> {supplier.phone}
                                            </span>
                                            {supplier.address && (
                                                <span className="text-[10px] flex items-center gap-1 text-gray-400 font-black uppercase tracking-widest mt-1">
                                                    <MapPin size={10} /> {supplier.address.substring(0, 30)}...
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-gray-900 uppercase text-xs">
                                                    <Building size={12} className="text-blue-600" />
                                                    {supplier.name}
                                                </div>
                                                {supplier.company && (
                                                    <div className="flex items-center gap-2 text-gray-400 uppercase text-[10px] font-black">
                                                        <span className="text-gray-400">🏢</span>
                                                        {supplier.company}
                                                    </div>
                                                )}
                                                {supplier.website && (
                                                    <div className="flex items-center gap-2 text-blue-500 uppercase text-[10px] font-black">
                                                        <Globe size={10} />
                                                        <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                            {t('supplier.website', 'Website')}
                                                        </a>
                                                    </div>
                                                )}
                                                <div className="mt-1">
                                                    <span className={`badge border-none font-black text-[9px] uppercase py-1.5 px-2 ${supplier.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                                        {supplier.is_active ? t('supplier.active', 'Active') : t('supplier.inactive', 'Inactive')}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-600">{t('supplier.advance', 'Advance')}:</span>
                                                    <span className="font-mono text-xs font-black text-green-600">
                                                        ৳{formatCurrency(supplier.advance_amount || 0)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-600">{t('supplier.due', 'Due')}:</span>
                                                    <span className={`font-mono text-xs font-black ${hasDue ? 'text-red-600' : 'text-gray-500'}`}>
                                                        ৳{formatCurrency(dueAmount)}
                                                    </span>
                                                </div>
                                                <div className="mt-1">
                                                    <button
                                                        onClick={() => handleAdvancePayment(supplier)}
                                                        className="btn btn-xs btn-success w-full flex items-center justify-center gap-1"
                                                    >
                                                        <DollarSign size={12} />
                                                        {t('supplier.add_advance', 'Add Advance')}
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    disabled={editProcessing}
                                                    onClick={() => handleSupplyEdit(supplier.id)}
                                                    className="btn btn-ghost btn-square btn-xs hover:bg-blue-600 hover:text-white text-blue-600"
                                                    title={t('supplier.edit', 'Edit')}
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(supplier.id)}
                                                    className="btn btn-ghost btn-square btn-xs text-red-400 hover:bg-red-600 hover:text-white"
                                                    title={t('supplier.delete', 'Delete')}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
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
                        <span className="font-black uppercase tracking-widest text-xs">
                            {localFilters.search
                                ? t('supplier.no_matching_suppliers', 'No suppliers matching ":search"', { search: localFilters.search })
                                : t('supplier.no_contacts_found', 'No supplier contacts found')
                            }
                        </span>
                        <button
                            onClick={() => setModel(true)}
                            className="h-8 px-3 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-[#1e4d2b] text-white text-white rounded-md hover:bg-black mt-2"
                        >
                            <Plus size={14} />
                            {t('supplier.add_first_supplier', 'Add Your First Supplier')}
                        </button>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {suppliers.data.length > 0 && (
                <div className="mt-6">
                    <Pagination data={suppliers} />
                </div>
            )}

            {/* Add/Edit Supplier Modal */}
            <dialog className={`modal ${model ? 'modal-open' : ''}`}>
                <div className="modal-box max-w-3xl p-0 overflow-hidden">
                    {/* Modal Header */}
                    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#1e4d2b] text-white rounded-lg">
                                    <Building size={20} className="text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-black text-gray-900">
                                        {supplyForm.data.id ? t('supplier.edit_supplier', 'Edit Supplier') : t('supplier.new_supplier', 'New Supplier')}
                                    </h1>
                                    <p className="text-sm text-gray-500">
                                        {supplyForm.data.id ? t('supplier.update_supplier_info', 'Update supplier information') : t('supplier.add_new_supplier', 'Add a new supplier to your contacts')}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={modelClose}
                                className="btn btn-ghost btn-circle btn-sm hover:bg-gray-100"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Modal Body */}
                    <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                        <form onSubmit={handleSupplyCreateForm}>
                            {/* Basic Information Section */}
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-1.5 bg-blue-100 rounded">
                                        <User size={14} className="text-blue-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-900">{t('supplier.basic_information', 'Basic Information')}</h3>
                                    <div className="flex-1 h-px bg-gray-200"></div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Supplier Name */}
                                    <div className="form-control">
                                        <label className="label py-0 mb-2">
                                            <span className="label-text font-bold text-gray-700 text-sm">
                                                {t('supplier.supplier_name', 'Supplier Name')} <span className="text-red-500">*</span>
                                            </span>
                                        </label>
                                        <div className="relative">
                                            <Building size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                value={supplyForm.data.name}
                                                onChange={(e) => supplyForm.setData("name", e.target.value)}
                                                className="input input-bordered w-full pl-10 py-3 border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                                                placeholder={t('supplier.supply_name_placeholder', 'Enter supplier name')}
                                                required
                                            />
                                        </div>
                                        {supplyForm.errors.name && (
                                            <div className="text-red-600 text-xs mt-2 flex items-center gap-2 bg-red-50 p-2 rounded">
                                                <AlertCircle size={12} />
                                                {supplyForm.errors.name}
                                            </div>
                                        )}
                                    </div>

                                    {/* Contact Person */}
                                    <div className="form-control">
                                        <label className="label py-0 mb-2">
                                            <span className="label-text font-bold text-gray-700 text-sm">
                                                {t('supplier.contact_person', 'Contact Person')} <span className="text-red-500">*</span>
                                            </span>
                                        </label>
                                        <div className="relative">
                                            <User size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                value={supplyForm.data.contact_person}
                                                onChange={(e) => supplyForm.setData("contact_person", e.target.value)}
                                                className="input input-bordered w-full pl-10 py-3 border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                                                placeholder={t('supplier.contact_person_placeholder', 'Enter contact person name')}
                                                required
                                            />
                                        </div>
                                        {supplyForm.errors.contact_person && (
                                            <div className="text-red-600 text-xs mt-2 flex items-center gap-2 bg-red-50 p-2 rounded">
                                                <AlertCircle size={12} />
                                                {supplyForm.errors.contact_person}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Contact Information Section */}
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-1.5 bg-green-100 rounded">
                                        <Phone size={14} className="text-green-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-900">{t('supplier.contact_information', 'Contact Information')}</h3>
                                    <div className="flex-1 h-px bg-gray-200"></div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Email */}
                                    <div className="form-control">
                                        <label className="label py-0 mb-2">
                                            <span className="label-text font-bold text-gray-700 text-sm">
                                                {t('supplier.email', 'Email')} <span className="text-red-500">*</span>
                                            </span>
                                        </label>
                                        <div className="relative">
                                            <Mail size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="email"
                                                value={supplyForm.data.email}
                                                onChange={(e) => supplyForm.setData("email", e.target.value)}
                                                className="input input-bordered w-full pl-10 py-3 border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                                                placeholder="email@example.com"
                                                required
                                            />
                                        </div>
                                        {supplyForm.errors.email && (
                                            <div className="text-red-600 text-xs mt-2 flex items-center gap-2 bg-red-50 p-2 rounded">
                                                <AlertCircle size={12} />
                                                {supplyForm.errors.email}
                                            </div>
                                        )}
                                    </div>

                                    {/* Phone */}
                                    <div className="form-control">
                                        <label className="label py-0 mb-2">
                                            <span className="label-text font-bold text-gray-700 text-sm">
                                                {t('supplier.phone', 'Phone')} <span className="text-red-500">*</span>
                                            </span>
                                        </label>
                                        <div className="relative">
                                            <Phone size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="tel"
                                                value={supplyForm.data.phone}
                                                onChange={(e) => supplyForm.setData("phone", e.target.value)}
                                                className="input input-bordered w-full pl-10 py-3 border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                                                placeholder="+880 1234 567890"
                                                required
                                            />
                                        </div>
                                        {supplyForm.errors.phone && (
                                            <div className="text-red-600 text-xs mt-2 flex items-center gap-2 bg-red-50 p-2 rounded">
                                                <AlertCircle size={12} />
                                                {supplyForm.errors.phone}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Company Details Section */}
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-1.5 bg-amber-100 rounded">
                                        <FileText size={14} className="text-amber-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-900">{t('supplier.company_details', 'Company Details')}</h3>
                                    <div className="flex-1 h-px bg-gray-200"></div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Company Name */}
                                    <div className="form-control">
                                        <label className="label py-0 mb-2">
                                            <span className="label-text font-bold text-gray-700 text-sm">
                                                {t('supplier.company_name', 'Company Name')}
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            value={supplyForm.data.company}
                                            onChange={(e) => supplyForm.setData("company", e.target.value)}
                                            className="input input-bordered w-full py-3 border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                                            placeholder={t('supplier.company_placeholder', 'Enter company name (optional)')}
                                        />
                                    </div>

                                    {/* Website */}
                                    <div className="form-control">
                                        <label className="label py-0 mb-2">
                                            <span className="label-text font-bold text-gray-700 text-sm">
                                                {t('supplier.website_url', 'Website')}
                                            </span>
                                        </label>
                                        <div className="relative">
                                            <Globe size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="url"
                                                value={supplyForm.data.website}
                                                onChange={(e) => supplyForm.setData("website", e.target.value)}
                                                className="input input-bordered w-full pl-10 py-3 border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                                                placeholder="https://example.com"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Financial Information Section */}
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-1.5 bg-purple-100 rounded">
                                        <DollarSign size={14} className="text-purple-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-900">{t('supplier.financial_information', 'Financial Information')}</h3>
                                    <div className="flex-1 h-px bg-gray-200"></div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Advance Amount */}
                                    <div className="form-control">
                                        <label className="label py-0 mb-2">
                                            <span className="label-text font-bold text-gray-700 text-sm">
                                                {t('supplier.advance_amount', 'Advance Amount')}
                                            </span>
                                            {supplyForm.data.id && (
                                                <span className="text-xs text-gray-500 ml-2">({t('supplier.read_only_edit', 'Read-only for editing')})</span>
                                            )}
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">৳</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={supplyForm.data.advance_amount}
                                                onChange={(e) => supplyForm.setData("advance_amount", parseFloat(e.target.value) || 0)}
                                                className={`input input-bordered w-full pl-3 py-3 ${supplyForm.data.id ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900'}`}
                                                placeholder={t('supplier.advance_amount_placeholder', 'Enter advance amount')}
                                                readOnly={!!supplyForm.data.id}
                                            />
                                        </div>
                                    </div>

                                    {/* Default Account */}
                                    <div className="form-control">
                                        <label className="label py-0 mb-2">
                                            <span className="label-text font-bold text-gray-700 text-sm">
                                                {t('supplier.default_account', 'Default Payment Account')}
                                            </span>
                                        </label>
                                        <div className="relative">
                                            <Landmark size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <select
                                                value={supplyForm.data.account_id}
                                                onChange={(e) => supplyForm.setData("account_id", e.target.value)}
                                                className="select select-bordered w-full pl-3 py-3 border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                                            >
                                                <option value="">{t('supplier.select_account_optional', 'Select default account (optional)')}</option>
                                                {accounts.map((account) => (
                                                    <option key={account.id} value={account.id}>
                                                        {account.name} - ৳{formatCurrency(account.current_balance)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        {errors.account_id && (
                                            <span className="text-red-500 text-sm">{errors.account_id}</span>
                                        )}
                                    </div>

                                    {/* Default Dealership */}
                                    <div className="form-control">
                                        <label className="label py-0 mb-2">
                                            <span className="label-text font-bold text-gray-700 text-sm">
                                                {t('supplier.default_dealership', 'Default Dealership')}
                                            </span>
                                        </label>
                                        <div className="relative">
                                            <Landmark size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <select
                                                value={supplyForm.data.dealership_id}
                                                onChange={(e) => supplyForm.setData("dealership_id", e.target.value)}
                                                className="select select-bordered w-full pl-3 py-3 border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                                            >
                                                <option value="">{t('supplier.select_dealership_optional', 'Select default dealership (optional)')}</option>
                                                {dealerships.map((dealership) => (
                                                    <option key={dealership.id} value={dealership.id}>
                                                        {dealership.name} - {dealership.email}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="form-control">
                                        <label className="label py-0 mb-2">
                                            <span className="label-text font-bold text-gray-700 text-sm">
                                                {t('supplier.status_field', 'Status')}
                                            </span>
                                        </label>
                                        <label className="flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:border-gray-900 cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-1 rounded ${supplyForm.data.is_active ? 'bg-green-100' : 'bg-red-100'}`}>
                                                    {supplyForm.data.is_active ? (
                                                        <CheckCircle size={14} className="text-green-600" />
                                                    ) : (
                                                        <X size={14} className="text-red-600" />
                                                    )}
                                                </div>
                                                <span className="font-bold">
                                                    {supplyForm.data.is_active ? t('supplier.active_supplier', 'Active Supplier') : t('supplier.inactive_supplier', 'Inactive Supplier')}
                                                </span>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={supplyForm.data.is_active}
                                                onChange={(e) => supplyForm.setData("is_active", e.target.checked)}
                                                className="toggle toggle-primary"
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Information Section */}
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-1.5 bg-gray-100 rounded">
                                        <Info size={14} className="text-gray-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-900">{t('supplier.additional_information', 'Additional Information')}</h3>
                                    <div className="flex-1 h-px bg-gray-200"></div>
                                </div>

                                <div className="space-y-5">
                                    {/* Address */}
                                    <div className="form-control">
                                        <label className="label py-0 mb-2">
                                            <span className="label-text font-bold text-gray-700 text-sm">
                                                {t('supplier.address', 'Address')}
                                            </span>
                                        </label>
                                        <div className="relative">
                                            <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
                                            <textarea
                                                value={supplyForm.data.address}
                                                onChange={(e) => supplyForm.setData("address", e.target.value)}
                                                className="textarea textarea-bordered w-full pl-10 py-3 border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 min-h-[80px]"
                                                rows="3"
                                                placeholder={t('supplier.address_placeholder', 'Enter full address (optional)')}
                                            />
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="form-control">
                                        <label className="label py-0 mb-2">
                                            <span className="label-text font-bold text-gray-700 text-sm">
                                                {t('supplier.description_field', 'Description')}
                                            </span>
                                        </label>
                                        <textarea
                                            value={supplyForm.data.description}
                                            onChange={(e) => supplyForm.setData("description", e.target.value)}
                                            className="textarea textarea-bordered w-full py-3 border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 min-h-[100px]"
                                            rows="4"
                                            placeholder={t('supplier.description_placeholder', 'Enter any additional notes or description about this supplier (optional)')}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-6 px-6 py-4 mt-8">
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={modelClose}
                                        className="btn btn-ghost flex-1 hover:bg-gray-100"
                                    >
                                        {t('supplier.cancel', 'Cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={supplyForm.processing}
                                        className="btn bg-[#1e4d2b] text-white flex-1 hover:bg-gray-800"
                                    >
                                        {supplyForm.processing ? (
                                            <>
                                                <span className="loading loading-spinner loading-sm"></span>
                                                {t('supplier.processing', 'Processing...')}
                                            </>
                                        ) : supplyForm.data.id ? (
                                            <>
                                                <CheckCircle size={18} />
                                                {t('supplier.update_supplier', 'Update Supplier')}
                                            </>
                                        ) : (
                                            <>
                                                <Plus size={18} />
                                                {t('supplier.create_supplier', 'Create Supplier')}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </dialog>

            {/* SMS Test Modal */}
            <dialog className={`modal ${smsTestModel ? 'modal-open' : ''}`}>
                <div className="modal-box max-w-lg">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-6">
                        <h1 className="text-lg font-semibold text-gray-900">
                            {t('supplier.sms_test_panel', 'SMS Test Panel')}
                        </h1>
                        <button
                            onClick={smsTestModelClose}
                            className="btn btn-circle btn-xs btn-ghost"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="mb-6">
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <p className="text-sm text-yellow-700">
                                        <strong>টেস্ট করার পদ্ধতি:</strong>
                                        <ol className="list-decimal pl-5 mt-2 space-y-1">
                                            <li>নতুন Supplier যোগ করুন</li>
                                            <li>"Send Welcome SMS" চেকবক্স টিক দিন</li>
                                            <li>Supplier সেভ করুন</li>
                                            <li>Laravel Log চেক করুন: <code>tail -f storage/logs/laravel.log</code></li>
                                            <li>Log এ SMS ডিটেইলস দেখতে পাবেন</li>
                                        </ol>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSmsTest} className="space-y-4">
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">
                                <Smartphone size={16} className="inline mr-2" />
                                {t('supplier.phone_number', 'Phone Number')}
                                <span className="text-red-500 ml-1">*</span>
                            </legend>
                            <input
                                type="tel"
                                value={smsTestForm.data.phone}
                                onChange={(e) => smsTestForm.setData("phone", e.target.value)}
                                className="input input-bordered w-full"
                                placeholder="+8801XXXXXXXXX"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Bangladeshi format: +8801XXXXXXXXX
                            </p>
                        </fieldset>

                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">
                                <MessageSquare size={16} className="inline mr-2" />
                                {t('supplier.message', 'Message')}
                                <span className="text-red-500 ml-1">*</span>
                            </legend>
                            <textarea
                                value={smsTestForm.data.message}
                                onChange={(e) => smsTestForm.setData("message", e.target.value)}
                                className="textarea textarea-bordered w-full"
                                rows="4"
                                placeholder={t('supplier.message_placeholder', 'Enter your message here...')}
                                required
                            />
                            <div className="text-xs text-gray-500 mt-1 flex justify-between">
                                <span>
                                    {t('supplier.character_count', 'Characters')}: {smsTestForm.data.message.length}
                                </span>
                                <span>
                                    {t('supplier.sms_count', 'SMS Count')}: {Math.ceil(smsTestForm.data.message.length / 160)}
                                </span>
                            </div>
                        </fieldset>

                        <div className="flex items-center justify-between pt-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className={`badge ${true ? 'badge-warning' : 'badge-success'}`}>
                                        {true ? t('supplier.sandbox_mode', 'Sandbox') : t('supplier.live_mode', 'Live')}
                                    </div>
                                    <span className="text-sm text-gray-600">
                                        {true
                                            ? t('supplier.sms_will_be_logged', 'SMS will be logged')
                                            : t('supplier.real_sms_will_sent', 'Real SMS will be sent')
                                        }
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={smsTestLoading}
                                    className="btn btn-info"
                                >
                                    {smsTestLoading ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm"></span>
                                            {t('supplier.sending', 'Sending...')}
                                        </>
                                    ) : (
                                        <>
                                            <Send size={15} className="mr-2" />
                                            {t('supplier.send_test_sms', 'Send Test SMS')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>

                    {/* Test Result Display */}
                    {smsTestResult && (
                        <div className={`mt-6 p-4 rounded-lg ${smsTestResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                            <div className="flex items-start">
                                {smsTestResult.success ? (
                                    <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                                ) : (
                                    <XCircle className="h-6 w-6 text-red-500 mr-3" />
                                )}
                                <div>
                                    <h4 className={`font-medium ${smsTestResult.success ? 'text-green-800' : 'text-red-800'}`}>
                                        {smsTestResult.success
                                            ? t('supplier.sms_sent_successfully', 'SMS Sent Successfully!')
                                            : t('supplier.sms_failed', 'SMS Failed!')
                                        }
                                    </h4>
                                    <p className={`mt-1 text-sm ${smsTestResult.success ? 'text-green-700' : 'text-red-700'}`}>
                                        {smsTestResult.message}
                                    </p>
                                    {smsTestResult.sandbox && (
                                        <div className="mt-2 p-2 bg-yellow-100 rounded">
                                            <p className="text-sm text-yellow-800">
                                                <strong>{t('supplier.sandbox_mode', 'Sandbox Mode')}:</strong>
                                                {t('supplier.sms_logged_instead', 'SMS was logged instead of actually sent. Check Laravel log file.')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Laravel Log Example */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-2 text-sm">
                            {t('supplier.expected_log_output', 'Expected Log Output')}:
                        </h4>
                        <div className="bg-[#1e4d2b] text-white text-gray-100 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                            <div className="text-green-400">[2024-01-01 12:00:00] local.INFO: SMS Sandbox Mode:</div>
                            <div className="ml-4">
                                <div className="text-blue-400">"to": "+8801XXXXXXXXX",</div>
                                <div className="text-blue-400">"message": "Test message...",</div>
                                <div className="text-blue-400">"provider": "mimsms",</div>
                                <div className="text-blue-400">"sandbox": true</div>
                            </div>
                        </div>
                    </div>
                </div>
            </dialog>
        </div>
    );
}