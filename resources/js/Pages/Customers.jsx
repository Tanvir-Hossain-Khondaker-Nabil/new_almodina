import React, { useState } from "react";
import PageHeader from "../components/PageHeader";
import Pagination from "../components/Pagination";
import { Frown, Plus, Trash2, Eye, Search, Edit, Check, X, Calendar, User, Mail, Phone, MapPin, Globe, DollarSign, CheckCircle, AlertCircle, CreditCard, History, Package, Shield, RefreshCw, Landmark, Wallet, Smartphone, Building, Users, TrendingUp, TrendingDown, FileText, ArrowUpRight, Info, ChevronRight } from "lucide-react";
import { Link, router, useForm, usePage } from "@inertiajs/react";
import axios from "axios";
import { useTranslation } from "../hooks/useTranslation";

export default function Customers({ customers, filters, accounts }) {
    const { auth } = usePage().props;
    const { t, locale } = useTranslation();
    const [model, setModel] = useState(false);
    const [advanceModel, setAdvanceModel] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [editProcessing, setEditProcessing] = useState(false);

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
        customerForm.reset();
        setModel(false);
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
        setSelectedCustomer(null);
        setPaymentErrors({});
        setAdvanceModel(false);
    };

    // Handle search
    const handleFilter = (field, value) => {
        const newFilters = { ...localFilters, [field]: value };
        setLocalFilters(newFilters);
        
        router.get(route("customer.index"), 
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
        router.get(route("customer.index"), {}, { replace: true });
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            router.get(route("customer.index"), 
                { search: localFilters.search, status: localFilters.status },
                { preserveScroll: true, preserveState: true, replace: true }
            );
        }
    };

    // Handle customer form submission
    const customerForm = useForm({
        id: "",
        customer_name: "",
        phone: "",
        address: "",
        email: "",
        advance_amount: 0,
        account_id: "",
        due_amount: 0,
        is_active: true,
    });

    const handleAdvancePayment = (customer) => {
        setSelectedCustomer(customer);
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
        
        if (!selectedCustomer) return;

        // Validation
        const errors = {};
        const amount = parseFloat(paymentData.amount) || 0;
        
        if (amount <= 0) {
            errors.amount = t('customer.advance_amount_error', 'Advance amount must be greater than 0');
        }
        
        if (!paymentData.account_id) {
            errors.account_id = t('customer.select_account_error', 'Please select an account');
        }

        if (Object.keys(errors).length > 0) {
            setPaymentErrors(errors);
            return;
        }

        setProcessingPayment(true);

        router.post(route("advancePayment.store", { id: selectedCustomer.id }), {
            customer_id: selectedCustomer.id,
            amount: paymentData.amount,
            payment_type: paymentData.payment_type,
            type: 'customer',
            account_id: paymentData.account_id,
            notes: paymentData.notes,
            is_advance: true,
            payment_date: paymentData.payment_date
        }, {
            onSuccess: () => {
                advanceModelClose();
                router.reload({ only: ['customers'] });
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

    const handleCustomerCreateForm = (e) => {
        e.preventDefault();

        if (customerForm.data.id) {
            // Update existing customer
            customerForm.put(route("customer.update", customerForm.data.id), {
                onSuccess: () => {
                    customerForm.reset();
                    setModel(false);
                },
                onError: (errors) => {
                    console.log(errors);
                }
            });
        } else {
            // Create new customer
            customerForm.post(route("customer.store"), {
                onSuccess: () => {
                    customerForm.reset();
                    setModel(false);
                },
                onError: (errors) => {
                    console.log(errors);
                }
            });
        }
    };

    // Handle customer edit
    const handleCustomerEdit = (id) => {
        setEditProcessing(true);
        axios.get(route("customer.edit", { id: id })).then((res) => {
            const data = res.data.data;
            customerForm.setData({
                id: data.id,
                customer_name: data.customer_name,
                phone: data.phone,
                address: data.address || "",
                email: data.email || "",
                advance_amount: parseFloat(data.advance_amount) || 0,
                account_id: data.account_id || "",
                due_amount: parseFloat(data.due_amount) || 0,
                is_active: Boolean(data.is_active),
            });
            setModel(true);
        }).catch(error => {
            console.error("Error fetching customer:", error);
        }).finally(() => {
            setEditProcessing(false);
        });
    };

    // Handle customer delete
    const handleDelete = (id) => {
        if (confirm(t('customer.delete_confirmation', 'Are you sure you want to delete this customer?'))) {
            router.delete(route("customer.del", { id }), {
                preserveScroll: true,
                onSuccess: () => {
                    alert(t('customer.deleted_successfully', 'Customer deleted successfully!'));
                },
            });
        }
    };

    // Calculate due amount from sales
    const calculateDueAmount = (sales) => {
        if (!sales || sales.length === 0) return 0;
        return sales.reduce((total, sale) => {
            return total + (parseFloat(sale.due_amount) || 0);
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
        if (!dateString) return t('customer.na', 'N/A');
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

    // Get account icon
    const getAccountIcon = (type) => {
        switch (type) {
            case 'cash': return <Wallet size={14} className="text-green-600" />;
            case 'bank': return <Landmark size={14} className="text-blue-600" />;
            case 'mobile_banking': return <Smartphone size={14} className="text-purple-600" />;
            default: return <CreditCard size={14} className="text-gray-600" />;
        }
    };

    // Set full payment
    const handleFullPayment = () => {
        if (selectedCustomer) {
            const dueAmount = calculateDueAmount(selectedCustomer.sales) || 0;
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

    // Get customer's default account details
    const getCustomerAccount = (accountId) => {
        if (!accountId) return null;
        return accounts.find(account => account.id.toString() === accountId.toString());
    };

    return (
        <div className={`bg-white rounded-box p-5 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            {/* Advance Payment Modal */}
            {advanceModel && selectedCustomer && (
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
                                        <h3 className="text-xl font-black text-gray-900">{t('customer.add_advance_payment', 'Add Advance Payment')}</h3>
                                        <p className="text-sm text-gray-600">{t('customer.advance_payment_desc', 'Record advance payment for customer')}</p>
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
                            {/* Customer Info Card */}
                            <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-lg">{selectedCustomer.customer_name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Phone size={14} className="text-gray-500" />
                                            <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full ${selectedCustomer.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} text-xs font-bold flex items-center gap-1`}>
                                        {selectedCustomer.is_active ? <CheckCircle size={12} /> : <X size={12} />}
                                        {selectedCustomer.is_active ? t('customer.active', 'Active') : t('customer.inactive', 'Inactive')}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                                        <div className="text-xs text-green-700 uppercase font-bold tracking-wider mb-1">{t('customer.current_advance', 'Current Advance')}</div>
                                        <div className="text-xl font-black text-green-800">
                                            ৳{formatCurrency(selectedCustomer.advance_amount || 0)}
                                        </div>
                                    </div>
                                    <div className="text-center p-3 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
                                        <div className="text-xs text-red-700 uppercase font-bold tracking-wider mb-1">{t('customer.total_due', 'Total Due')}</div>
                                        <div className="text-xl font-black text-red-800">
                                            ৳{formatCurrency(calculateDueAmount(selectedCustomer.sales) || 0)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleAdvanceSubmit}>
                                <div className="space-y-6">
                                    {/* Amount Section */}
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <div className="flex justify-between items-center mb-3">
                                            <label className="label-text font-bold text-gray-800 text-sm">{t('customer.amount', 'Amount')} *</label>
                                            <button
                                                type="button"
                                                onClick={handleFullPayment}
                                                className="btn btn-xs bg-[#1e4d2b] text-white bg-[#1e4d2b] text-white border-gray-900 hover:bg-black hover:border-black"
                                                disabled={processingPayment}
                                            >
                                                {t('customer.full', 'Full')}
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
                                                className="input input-bordered w-full pl-4 py-4 text-lg font-mono border-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 bg-white"
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
                                        <label className="label-text font-bold text-gray-800 text-sm mb-3 block">{t('customer.payment_account', 'Payment Account')} *</label>
                                        <div className="relative">
                                            <Landmark size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
                                            <select
                                                name="account_id"
                                                value={paymentData.account_id}
                                                onChange={handlePaymentInputChange}
                                                className="select select-bordered w-full pl-4 border-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 bg-white appearance-none"
                                                disabled={processingPayment}
                                                required
                                            >
                                                <option value="">{t('customer.select_account', 'Select an account')}</option>
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
                                                        <p className="text-xs text-gray-600">{t('customer.account_details', 'Account Details')}</p>
                                                    </div>
                                                </div>
                                                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${selectedAccount.type === 'cash' ? 'bg-green-100 text-green-800' : selectedAccount.type === 'bank' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                                    {selectedAccount.type || 'Bank'}
                                                </span>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4 mt-4">
                                                <div className="bg-white p-3 rounded-lg border border-blue-100">
                                                    <div className="text-xs text-gray-500 mb-1">{t('customer.account_number', 'Account Number')}</div>
                                                    <div className="font-mono text-sm font-bold text-gray-800">
                                                        {selectedAccount.account_number || t('customer.na', 'N/A')}
                                                    </div>
                                                </div>
                                                <div className="bg-white p-3 rounded-lg border border-blue-100">
                                                    <div className="text-xs text-gray-500 mb-1">{t('customer.bank_name', 'Bank Name')}</div>
                                                    <div className="font-bold text-sm text-gray-800">
                                                        {selectedAccount.bank_name
                                                        ?? selectedAccount.mobile_provider
                                                        ?? t('customer.cash', 'Cash')}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="mt-4 pt-4 border-t border-blue-200">
                                                <div className="flex items-center justify-between">
                                                    <div className="text-sm text-gray-700 font-medium">{t('customer.current_balance', 'Current Balance')}:</div>
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
                                            <label className="label-text font-bold text-gray-800 text-sm mb-2 block">{t('customer.payment_date', 'Payment Date')}</label>
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
                                            <label className="label-text font-bold text-gray-800 text-sm mb-2 block">{t('customer.notes', 'Notes')} ({t('customer.optional', 'Optional')})</label>
                                            <input
                                                type="text"
                                                name="notes"
                                                value={paymentData.notes}
                                                onChange={handlePaymentInputChange}
                                                className="input input-bordered w-full py-3.5 border-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 bg-white"
                                                placeholder={t('customer.payment_reference', 'Payment reference')}
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
                                            <h6 className="font-bold text-gray-900">{t('customer.payment_summary', 'Payment Summary')}</h6>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center pb-3 border-b border-amber-200">
                                                <div className="text-sm text-gray-600">{t('customer.amount_to_pay', 'Amount to Pay')}</div>
                                                <div className="font-mono font-bold text-xl text-gray-900">
                                                    ৳{formatCurrency(paymentData.amount || 0)}
                                                </div>
                                            </div>
                                            
                                            <div className="flex justify-between items-center">
                                                <div className="text-sm text-gray-600">{t('customer.payment_account', 'Payment Account')}</div>
                                                <div className="font-bold text-gray-900">
                                                    {selectedAccount ? selectedAccount.name : t('customer.not_selected', 'Not selected')}
                                                </div>
                                            </div>
                                            
                                            <div className="flex justify-between items-center">
                                                <div className="text-sm text-gray-600">{t('customer.payment_date', 'Payment Date')}</div>
                                                <div className="font-medium">
                                                    {paymentData.payment_date}
                                                </div>
                                            </div>
                                            
                                            {selectedAccount && (
                                                <>
                                                    <div className="my-3 border-t border-amber-200 pt-3">
                                                        <div className="flex justify-between items-center">
                                                            <div className="text-sm text-gray-600">{t('customer.current_balance', 'Current Balance')}</div>
                                                            <div className="font-mono font-bold text-green-700">
                                                                ৳{formatCurrency(selectedAccount.current_balance || 0)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="bg-white p-3 rounded-lg border border-amber-200">
                                                        <div className="flex justify-between items-center">
                                                            <div className="text-sm font-bold text-gray-800">{t('customer.balance_after_payment', 'Balance After Payment')}</div>
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
                                                    <div className="font-bold">{t('customer.payment_error', 'Payment Error')}</div>
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
                                        {t('customer.cancel', 'Cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-success flex-1 bg-green-600 border-green-600 hover:bg-green-700 hover:border-green-700 text-white"
                                        disabled={processingPayment || !paymentData.amount || !paymentData.account_id}
                                    >
                                        {processingPayment ? (
                                            <>
                                                <span className="loading loading-spinner loading-sm"></span>
                                                {t('customer.processing', 'Processing...')}
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle size={18} />
                                                {t('customer.submit_payment', 'Submit Payment')}
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
                title={t('customer.title', 'Customer Management')}
                subtitle={t('customer.subtitle', 'Manage your all customers from here.')}
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
                            placeholder={t('customer.search_placeholder', 'Search customers...')}
                            className="h-8 pl-8 pr-3 text-xs font-semibold border border-gray-300 rounded-md focus:outline-none focus:border-gray-500"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={localFilters.status}
                        onChange={(e) => handleFilter('status', e.target.value)}
                        className="h-8 px-3 text-xs font-semibold border border-gray-300 rounded-md focus:outline-none focus:border-gray-500"
                    >
                        <option value="">{t('customer.all_status', 'All Status')}</option>
                        <option value="active">{t('customer.active', 'Active')}</option>
                        <option value="inactive">{t('customer.inactive', 'Inactive')}</option>
                    </select>

                    {/* Clear Filter */}
                    {(localFilters.search || localFilters.status) && (
                        <button
                            onClick={clearFilters}
                            className="h-8 px-3 text-xs font-semibold text-gray-600 hover:text-black"
                        >
                            {t('customer.clear', 'Clear')}
                        </button>
                    )}

                    {/* Add New Button */}
                    <button
                        onClick={() => {
                            customerForm.reset();
                            setModel(true);
                        }}
                        className="h-8 px-3 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-[#1e4d2b] text-white text-white rounded-md hover:bg-black"
                    >
                        <Plus size={14} />
                        {t('customer.add_customer', 'Add Customer')}
                    </button>
                </div>
            </PageHeader>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-[#1e4d2b] text-white text-white rounded-xl p-4">
                    <p className="text-xs uppercase tracking-widest font-bold text-gray-300 mb-2">{t('customer.total_customers', 'Total Customers')}</p>
                    <div className="flex items-center justify-between">
                        <p className="text-2xl font-black">{customers.total}</p>
                        <Users size={20} className="text-gray-400" />
                    </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-xs uppercase tracking-widest font-bold text-green-700 mb-2">{t('customer.active_customers', 'Active Customers')}</p>
                    <div className="flex items-center justify-between">
                        <p className="text-2xl font-black text-green-700">
                            {customers.data.filter(c => c.is_active).length}
                        </p>
                        <CheckCircle size={20} className="text-green-500" />
                    </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-xs uppercase tracking-widest font-bold text-amber-700 mb-2">{t('customer.total_advance', 'Total Advance')}</p>
                    <div className="flex items-center justify-between">
                        <p className="text-2xl font-black text-amber-700">
                            ৳{formatCurrency(customers.data.reduce((sum, c) => sum + parseFloat(c.advance_amount || 0), 0))}
                        </p>
                        <TrendingUp size={20} className="text-amber-500" />
                    </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-xs uppercase tracking-widest font-bold text-red-700 mb-2">{t('customer.total_due', 'Total Due')}</p>
                    <div className="flex items-center justify-between">
                        <p className="text-2xl font-black text-red-700">
                            ৳{formatCurrency(customers.data.reduce((sum, c) => sum + calculateDueAmount(c.sales), 0))}
                        </p>
                        <TrendingDown size={20} className="text-red-500" />
                    </div>
                </div>
            </div>

            {/* Customers Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-100">
                {customers.data.length > 0 ? (
                    <table className="table w-full">
                        <thead className="bg-[#1e4d2b] text-white text-white uppercase text-[10px] tracking-widest">
                            <tr>
                                <th className="py-4">#</th>
                                <th>{t('customer.contact_info', 'Contact Info')}</th>
                                <th>{t('customer.address', 'Address')}</th>
                                <th>{t('customer.financial_status', 'Financial Status')}</th>
                                <th className="text-right">{t('customer.command', 'Command')}</th>
                            </tr>
                        </thead>
                        <tbody className="font-bold text-sm text-gray-700">
                            {customers.data.map((customer, index) => {
                                const dueAmount = calculateDueAmount(customer.sales);
                                const hasDue = dueAmount > 0;
                                const hasAdvance = customer.advance_amount > 0;
                                const customerAccount = getCustomerAccount(customer.account_id);

                                return (
                                    <tr key={customer.id} className="hover:bg-gray-50 border-b border-gray-50 transition-colors">
                                        <td className="text-gray-400 font-mono text-xs">{index + 1}</td>
                                        <td>
                                            <p className="font-black text-gray-900 uppercase tracking-tighter leading-none mb-1">
                                                {customer.customer_name}
                                            </p>
                                            <span className="text-[10px] flex items-center gap-1 text-gray-400 font-black uppercase tracking-widest">
                                                <Phone size={10} /> {customer.phone}
                                            </span>
                                            {customer.email && (
                                                <span className="text-[10px] flex items-center gap-1 text-gray-400 font-black uppercase tracking-widest mt-1">
                                                    <Mail size={10} /> {customer.email}
                                                </span>
                                            )}
                                            {customerAccount && (
                                                <span className="text-[10px] flex items-center gap-1 text-blue-500 font-black uppercase tracking-widest mt-1">
                                                    {getAccountIcon(customerAccount.type)}
                                                    <span>{customerAccount.name}</span>
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="flex flex-col gap-1">
                                                {customer.address ? (
                                                    <div className="flex items-center gap-2 text-gray-900 uppercase text-xs">
                                                        <MapPin size={12} className="text-blue-600" />
                                                        <span className="line-clamp-2">{customer.address.substring(0, 30)}...</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-gray-400 uppercase text-[10px] font-black">
                                                        <span className="text-gray-400"></span>
                                                        {t('customer.no_address', 'No address')}
                                                    </div>
                                                )}
                                                <div className="mt-1">
                                                    <span className={`badge border-none font-black text-[9px] uppercase py-1.5 px-2 ${customer.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                                        {customer.is_active ? t('customer.active', 'Active') : t('customer.inactive', 'Inactive')}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-600">{t('customer.advance', 'Advance')}:</span>
                                                    <span className="font-mono text-xs font-black text-green-600">
                                                        ৳{formatCurrency(customer.advance_amount || 0)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-600">{t('customer.due', 'Due')}:</span>
                                                    <span className={`font-mono text-xs font-black ${hasDue ? 'text-red-600' : 'text-gray-500'}`}>
                                                        ৳{formatCurrency(dueAmount)}
                                                    </span>
                                                </div>
                                                <div className="mt-1">
                                                    <button
                                                        onClick={() => handleAdvancePayment(customer)}
                                                        className="btn btn-xs btn-success w-full flex items-center justify-center gap-1"
                                                    >
                                                        <DollarSign size={12} />
                                                        {t('customer.add_advance', 'Add Advance')}
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Link
                                                    href={route("customer.show", { id: customer.id })}
                                                    className="btn btn-ghost btn-square btn-xs hover:bg-blue-600 hover:text-white text-blue-600"
                                                    title={t('customer.view_details', 'View Details')}
                                                >
                                                    <Eye size={16} />
                                                </Link>

                                                <button
                                                    disabled={editProcessing}
                                                    onClick={() => handleCustomerEdit(customer.id)}
                                                    className="btn btn-ghost btn-square btn-xs hover:bg-amber-600 hover:text-white text-amber-600"
                                                    title={t('customer.edit', 'Edit')}
                                                >
                                                    <Edit size={16} />
                                                </button>

                                                <button
                                                    onClick={() => handleDelete(customer.id)}
                                                    className="btn btn-ghost btn-square btn-xs text-red-400 hover:bg-red-600 hover:text-white"
                                                    title={t('customer.delete', 'Delete')}
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
                                ? t('customer.no_customers_matching', 'No customers matching ":search"', { search: localFilters.search })
                                : t('customer.no_customers_found', 'No customers found')
                            }
                        </span>
                        <button
                            onClick={() => setModel(true)}
                            className="h-8 px-3 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-[#1e4d2b] text-white text-white rounded-md hover:bg-black mt-2"
                        >
                            <Plus size={14} />
                            {t('customer.add_first_customer', 'Add Your First Customer')}
                        </button>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {customers.data.length > 0 && (
                <div className="mt-6">
                    <Pagination data={customers} />
                </div>
            )}

            {/* Add/Edit Customer Modal */}
            <dialog className={`modal ${model ? 'modal-open' : ''}`}>
                <div className="modal-box max-w-2xl p-0 overflow-hidden">
                    {/* Modal Header */}
                    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#1e4d2b] text-white rounded-lg">
                                    <User size={20} className="text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-black text-gray-900">
                                        {customerForm.data.id ? t('customer.edit_customer', 'Edit Customer') : t('customer.new_customer', 'New Customer')}
                                    </h1>
                                    <p className="text-sm text-gray-500">
                                        {customerForm.data.id ? t('customer.update_customer_info', 'Update customer information') : t('customer.add_new_customer', 'Add a new customer to your contacts')}
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
                        <form onSubmit={handleCustomerCreateForm}>
                            {/* Basic Information Section */}
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-1.5 bg-blue-100 rounded">
                                        <User size={14} className="text-blue-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-900">{t('customer.basic_information', 'Basic Information')}</h3>
                                    <div className="flex-1 h-px bg-gray-200"></div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Customer Name */}
                                    <div className="form-control">
                                        <label className="label py-0 mb-2">
                                            <span className="label-text font-bold text-gray-700 text-sm">
                                                {t('customer.customer_name', 'Customer Name')} <span className="text-red-500">*</span>
                                            </span>
                                        </label>
                                        <div className="relative">
                                            <User size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                value={customerForm.data.customer_name}
                                                onChange={(e) => customerForm.setData("customer_name", e.target.value)}
                                                className="input input-bordered w-full pl-4 py-3 border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                                                placeholder={t('customer.enter_customer_name', 'Enter customer name')}
                                                required
                                            />
                                        </div>
                                        {customerForm.errors.customer_name && (
                                            <div className="text-red-600 text-xs mt-2 flex items-center gap-2 bg-red-50 p-2 rounded">
                                                <AlertCircle size={12} />
                                                {customerForm.errors.customer_name}
                                            </div>
                                        )}
                                    </div>

                                    {/* Phone */}
                                    <div className="form-control">
                                        <label className="label py-0 mb-2">
                                            <span className="label-text font-bold text-gray-700 text-sm">
                                                {t('customer.phone', 'Phone')} <span className="text-red-500">*</span>
                                            </span>
                                        </label>
                                        <div className="relative">
                                            <Phone size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="tel"
                                                value={customerForm.data.phone}
                                                onChange={(e) => customerForm.setData("phone", e.target.value)}
                                                className="input input-bordered w-full pl-4 py-3 border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                                                placeholder={t('customer.enter_phone_number', 'Enter phone number')}
                                                required
                                            />
                                        </div>
                                        {customerForm.errors.phone && (
                                            <div className="text-red-600 text-xs mt-2 flex items-center gap-2 bg-red-50 p-2 rounded">
                                                <AlertCircle size={12} />
                                                {customerForm.errors.phone}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Financial Information Section */}
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-1.5 bg-purple-100 rounded">
                                        <DollarSign size={14} className="text-purple-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-900">{t('customer.financial_information', 'Financial Information')}</h3>
                                    <div className="flex-1 h-px bg-gray-200"></div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Advance Amount */}
                                    <div className="form-control">
                                        <label className="label py-0 mb-2">
                                            <span className="label-text font-bold text-gray-700 text-sm">
                                                {t('customer.advance_amount', 'Advance Amount')}
                                            </span>
                                            {customerForm.data.id && (
                                                <span className="text-xs text-gray-500 ml-2">{t('customer.readonly_for_editing', '(Read-only for editing)')}</span>
                                            )}
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">৳</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={customerForm.data.advance_amount}
                                                onChange={(e) => customerForm.setData("advance_amount", parseFloat(e.target.value) || 0)}
                                                className={`input input-bordered w-full pl-4 py-3 ${customerForm.data.id ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900'}`}
                                                placeholder={t('customer.enter_advance_amount', 'Enter advance amount')}
                                                readOnly={!!customerForm.data.id}
                                            />
                                        </div>


                                          <label className="label py-0 mb-2">
                                            <span className="label-text font-bold text-gray-700 text-sm">
                                                {t('customer.due_amount', 'Due Amount')}
                                            </span>
                                            {customerForm.data.id && (
                                                <span className="text-xs text-gray-500 ml-2">{t('customer.readonly_for_editing', '(Read-only for editing)')}</span>
                                            )}
                                        </label>

                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">৳</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={customerForm.data.due_amount}
                                                onChange={(e) => customerForm.setData("due_amount", parseFloat(e.target.value) || 0)}
                                                className={`input input-bordered w-full pl-4 py-3 ${customerForm.data.id ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900'}`}
                                                placeholder={t('customer.enter_due_amount', 'Enter due amount')}
                                                readOnly={!!customerForm.data.id}
                                            />
                                        </div>

                                    </div>

                                    {/* Default Payment Account */}
                                    <div className="form-control">
                                        <label className="label py-0 mb-2">
                                            <span className="label-text font-bold text-gray-700 text-sm">
                                                {t('customer.default_payment_account', 'Default Payment Account')}
                                            </span>
                                        </label>
                                        <div className="relative">
                                            <Landmark size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <select
                                                value={customerForm.data.account_id}
                                                onChange={(e) => customerForm.setData("account_id", e.target.value)}
                                                className="select select-bordered w-full pl-4 py-3 border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                                            >
                                                <option value="">{t('customer.select_default_account', 'Select default account (optional)')}</option>
                                                {accounts.map((account) => (
                                                    <option key={account.id} value={account.id}>
                                                        {account.name} - ৳{formatCurrency(account.current_balance)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        {customerForm.errors.account_id && (
                                            <div className="text-red-600 text-xs mt-2 flex items-center gap-2 bg-red-50 p-2 rounded">
                                                <AlertCircle size={12} />
                                                {customerForm.errors.account_id}
                                            </div>
                                        )}
                                    </div>

                                    {/* Status */}
                                    <div className="form-control">
                                        <label className="label py-0 mb-2">
                                            <span className="label-text font-bold text-gray-700 text-sm">
                                                {t('customer.status', 'Status')}
                                            </span>
                                        </label>
                                        <label className="flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:border-gray-900 cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-1 rounded ${customerForm.data.is_active ? 'bg-green-100' : 'bg-red-100'}`}>
                                                    {customerForm.data.is_active ? (
                                                        <CheckCircle size={14} className="text-green-600" />
                                                    ) : (
                                                        <X size={14} className="text-red-600" />
                                                    )}
                                                </div>
                                                <span className="font-bold">
                                                    {customerForm.data.is_active ? t('customer.active_customer', 'Active Customer') : t('customer.inactive_customer', 'Inactive Customer')}
                                                </span>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={customerForm.data.is_active}
                                                onChange={(e) => customerForm.setData("is_active", e.target.checked)}
                                                className="toggle toggle-primary"
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Address Section */}
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-1.5 bg-amber-100 rounded">
                                        <MapPin size={14} className="text-amber-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-900">{t('customer.address', 'Address')}</h3>
                                    <div className="flex-1 h-px bg-gray-200"></div>
                                </div>
                                
                                <div className="form-control">
                                    <label className="label py-0 mb-2">
                                        <span className="label-text font-bold text-gray-700 text-sm">
                                            {t('customer.address', 'Address')}
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
                                        <textarea
                                            value={customerForm.data.address}
                                            onChange={(e) => customerForm.setData("address", e.target.value)}
                                            className="textarea textarea-bordered w-full pl-4 py-3 border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 min-h-[80px]"
                                            rows="3"
                                            placeholder={t('customer.enter_full_address', 'Enter full address (optional)')}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Selected Account Preview (if any) */}
                            {customerForm.data.account_id && getCustomerAccount(customerForm.data.account_id) && (
                                <div className="mb-8">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="p-1.5 bg-blue-100 rounded">
                                            <Landmark size={14} className="text-blue-600" />
                                        </div>
                                        <h3 className="font-bold text-gray-900">{t('customer.selected_account', 'Selected Account')}</h3>
                                        <div className="flex-1 h-px bg-gray-200"></div>
                                    </div>
                                    
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200 shadow-sm">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white rounded-lg border border-blue-200">
                                                    {getAccountIcon(getCustomerAccount(customerForm.data.account_id).type)}
                                                </div>
                                                <div>
                                                    <h5 className="font-bold text-gray-900">{getCustomerAccount(customerForm.data.account_id).name}</h5>
                                                    <p className="text-xs text-gray-600">{t('customer.default_payment_account', 'Default payment account')}</p>
                                                </div>
                                            </div>
                                            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${getCustomerAccount(customerForm.data.account_id).type === 'cash' ? 'bg-green-100 text-green-800' : getCustomerAccount(customerForm.data.account_id).type === 'bank' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                                {getCustomerAccount(customerForm.data.account_id).type || 'Bank'}
                                            </span>
                                        </div>
                                        
                                        <div className="mt-4 pt-4 border-t border-blue-200">
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-gray-700 font-medium">{t('customer.current_balance', 'Current Balance')}:</div>
                                                <div className="font-mono font-bold text-xl text-green-700">
                                                    ৳{formatCurrency(getCustomerAccount(customerForm.data.account_id).current_balance || 0)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-6 px-6 py-4 mt-8">
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={modelClose}
                                        className="btn btn-ghost flex-1 hover:bg-gray-100"
                                    >
                                        {t('customer.cancel', 'Cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={customerForm.processing}
                                        className="btn bg-[#1e4d2b] text-white flex-1 hover:bg-gray-800"
                                    >
                                        {customerForm.processing ? (
                                            <>
                                                <span className="loading loading-spinner loading-sm"></span>
                                                {t('customer.processing', 'Processing...')}
                                            </>
                                        ) : customerForm.data.id ? (
                                            <>
                                                <CheckCircle size={18} />
                                                {t('customer.update_customer', 'Update Customer')}
                                            </>
                                        ) : (
                                            <>
                                                <Plus size={18} />
                                                {t('customer.create_customer', 'Create Customer')}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </dialog>
        </div>
    );
}