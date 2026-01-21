import { Head, useForm, Link, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';

// SVG Icons Component
const SVGIcon = ({ name, className = "w-4 h-4" }) => {
    const icons = {
        filter: (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
        ),
        reset: (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
        ),
        report: (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
        calculate: (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
        ),
        approve: (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
        ),
        pay: (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
        delete: (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        ),
        clear: (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        ),
        calendar: (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),

        user: (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        ),
        status: (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        document: (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
        check: (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
        ),
        money: (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        list: (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
        ),
        close: (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        ),
        spinner: (
            <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        ),
        present: (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
        ),
        clock: (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        plus: (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
        ),
        minus: (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
        ),
        eye: (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
        ),
        edit: (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
        ),
        download: (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
    };

    return icons[name] || null;
};

export default function Salary({ salaries, filters, employees, accounts }) {
    const [processing, setProcessing] = useState(false);
    const [bulkSelection, setBulkSelection] = useState([]);
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [showCalculateModal, setShowCalculateModal] = useState(false);
    const [showPayModal, setShowPayModal] = useState(false);
    const [selectedSalary, setSelectedSalary] = useState(null);
    const [selectedAccount, setSelectedAccount] = useState(null);

    // Use refs to track button click state
    const isCalculating = useRef(false);
    const isProcessingBulkAction = useRef(false);

    const { data, setData, get } = useForm({
        month: filters.month || new Date().getMonth() + 1,
        year: filters.year || new Date().getFullYear(),
        status: filters.status || '',
        employee_id: filters.employee_id || '',
    });

    const { data: calculateData, setData: setCalculateData, post: postCalculate } = useForm({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        employee_id: '',
    });

    const { data: payData, setData: setPayData, post: postPay } = useForm({
        payment_method: 'cash',
        transaction_id: '',
        payment_date: new Date().toISOString().split('T')[0],
        account_id: '',
        notes: '',
    });

    const submit = (e) => {
        e.preventDefault();
        setProcessing(true);
        get(route('salary.index'), {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    };

    const handleCalculateSalary = async (e) => {
        e.preventDefault();

        // Prevent double click
        if (isCalculating.current) return;
        isCalculating.current = true;

        if (!confirm('Are you sure you want to calculate salaries? This may take a few minutes.')) {
            isCalculating.current = false;
            return;
        }

        setProcessing(true);
        try {
            await postCalculate(route('salary.calculate'), {
                preserveScroll: true,
                onSuccess: () => {
                    setShowCalculateModal(false);
                    get(route('salary.index'), {
                        preserveState: true,
                        preserveScroll: true,
                    });
                },
                onError: (errors) => {
                    console.error('Calculate salary error:', errors);
                    alert('Error calculating salary');
                },
                onFinish: () => {
                    setProcessing(false);
                    isCalculating.current = false;
                }
            });
        } catch (error) {
            console.error('Calculate salary error:', error);
            alert('Error calculating salary');
            setProcessing(false);
            isCalculating.current = false;
        }
    };

    const openPayModal = (salary) => {
        setSelectedSalary(salary);
        setSelectedAccount(null);
        setPayData({
            payment_method: 'cash',
            transaction_id: '',
            payment_date: new Date().toISOString().split('T')[0],
            account_id: '',
            notes: `Salary payment for ${getMonthName(salary.month)} ${salary.year}`,
        });
        setShowPayModal(true);
    };

    const handlePaySalary = async (e) => {
        e.preventDefault();

        if (!selectedSalary) return;

        // Validate account selection for bank/mobile banking
        if (['bank', 'mobile_banking'].includes(payData.payment_method) && !payData.account_id) {
            alert('Please select a payment account for bank/mobile banking payment');
            return;
        }

        // Validate account balance
        if (payData.account_id) {
            const account = accounts.find(acc => acc.id == payData.account_id);
            if (account && account.current_balance < selectedSalary.net_salary) {
                alert(`Insufficient balance in ${account.name}. Available: ৳${formatCurrency(account.current_balance)}, Required: ৳${formatCurrency(selectedSalary.net_salary)}`);
                return;
            }
        }

        if (!confirm(`Are you sure you want to pay salary for ${selectedSalary.employee?.name}? Amount: ৳${formatCurrency(selectedSalary.net_salary)}`)) {
            return;
        }

        setProcessing(true);
        try {
            await postPay(route('salary.pay', selectedSalary.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setShowPayModal(false);
                    setSelectedSalary(null);
                    get(route('salary.index'), {
                        preserveState: true,
                        preserveScroll: true,
                    });
                },
                onError: (errors) => {
                    console.error('Pay salary error:', errors);
                    const errorMessage = errors.error || 'Error paying salary';
                    alert(errorMessage);
                },
                onFinish: () => {
                    setProcessing(false);
                }
            });
        } catch (error) {
            console.error('Pay salary error:', error);
            alert('Error paying salary');
            setProcessing(false);
        }
    };

    const handleBulkSelection = (id) => {
        setBulkSelection(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (bulkSelection.length === salaries.data.length) {
            setBulkSelection([]);
        } else {
            setBulkSelection(salaries.data.map(s => s.id));
        }
    };

    const handleBulkAction = async (action) => {
        // Prevent double click
        if (isProcessingBulkAction.current) return;
        isProcessingBulkAction.current = true;

        if (bulkSelection.length === 0) {
            alert('Please select at least one salary record');
            isProcessingBulkAction.current = false;
            return;
        }

        let confirmMessage = '';
        switch (action) {
            case 'approve':
                confirmMessage = `Approve ${bulkSelection.length} salary record(s)?`;
                break;
            case 'pay':
                confirmMessage = `Mark ${bulkSelection.length} salary record(s) as paid? (No account will be deducted for bulk payment)`;
                break;
            case 'delete':
                confirmMessage = `Delete ${bulkSelection.length} salary record(s)? This action cannot be undone.`;
                break;
        }

        if (!confirm(confirmMessage)) {
            isProcessingBulkAction.current = false;
            return;
        }

        setProcessing(true);
        try {
            await router.post(route('salary.bulk-action'), {
                action: action,
                ids: bulkSelection
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    setBulkSelection([]);
                    setShowBulkActions(false);
                    get(route('salary.index'), {
                        preserveState: true,
                        preserveScroll: true,
                    });
                },
                onFinish: () => {
                    setProcessing(false);
                    isProcessingBulkAction.current = false;
                }
            });
        } catch (error) {
            console.error('Bulk action error:', error);
            alert('Error performing bulk action');
            setProcessing(false);
            isProcessingBulkAction.current = false;
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'paid': 'bg-green-100 text-green-800',
            'approved': 'bg-blue-100 text-blue-800',
            'pending': 'bg-yellow-100 text-yellow-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    const getMonthName = (monthNumber) => {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[monthNumber - 1] || '';
    };

    // Get account icon
    const getAccountIcon = (type) => {
        switch (type) {
            case 'cash': return <SVGIcon name="money" className="w-3 h-3 text-green-600" />;
            case 'bank': return <SVGIcon name="document" className="w-3 h-3 text-blue-600" />;
            case 'mobile_banking': return <SVGIcon name="smartphone" className="w-3 h-3 text-purple-600" />;
            default: return <SVGIcon name="creditcard" className="w-3 h-3" />;
        }
    };

    // Add a "Mark as Paid" button to the actions column
    const renderActionButtons = (salary) => {
        return (
            <div className="flex justify-end gap-2">
                <Link
                    href={route('salary.payslip', salary.id)}
                    className="btn btn-ghost btn-square btn-xs hover:bg-gray-900 hover:text-white transition-all shadow-sm"
                >
                    <SVGIcon name="eye" className="w-4 h-4" />
                </Link>

                {salary.status !== 'paid' && salary.status === 'approved' && (
                    <>
                        <button
                            onClick={() => openPayModal(salary)}
                            className="btn btn-ghost btn-square btn-xs text-green-600 hover:bg-green-600 hover:text-white transition-all shadow-sm"
                            title="Pay Salary"
                        >
                            <SVGIcon name="money" className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => {
                                if (confirm('Delete this salary record?')) {
                                    router.delete(route('salary.destroy', salary.id), {
                                        preserveScroll: true,
                                        onSuccess: () => {
                                            get(route('salary.index'), {
                                                preserveState: true,
                                                preserveScroll: true,
                                            });
                                        }
                                    });
                                }
                            }}
                            className="btn btn-ghost btn-square btn-xs text-red-300 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                        >
                            <SVGIcon name="delete" className="w-4 h-4" />
                        </button>
                    </>
                )}

                {salary.status === 'pending' && (
                    <button
                        onClick={() => {
                            if (confirm('Approve this salary?')) {
                                router.post(route('salary.bulk-action'), {
                                    action: 'approve',
                                    ids: [salary.id]
                                }, {
                                    preserveScroll: true,
                                    onSuccess: () => {
                                        get(route('salary.index'), {
                                            preserveState: true,
                                            preserveScroll: true,
                                        });
                                    }
                                });
                            }
                        }}
                        className="btn btn-ghost btn-square btn-xs text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        title="Approve Salary"
                    >
                        <SVGIcon name="check" className="w-4 h-4" />
                    </button>
                )}
            </div>
        );
    };

    // Update selected account when account_id changes
    useEffect(() => {
        if (payData.account_id) {
            const account = accounts.find(acc => acc.id == payData.account_id);
            setSelectedAccount(account);
        } else {
            setSelectedAccount(null);
        }
    }, [payData.account_id, accounts]);

    useEffect(() => {
        setShowBulkActions(bulkSelection.length > 0);
    }, [bulkSelection]);

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <Head title="Payroll Registry" />

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-gray-200 pb-6 bg-white p-6 rounded-2xl shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Payroll <span className="text-red-600">Disbursement</span></h1>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-1">Industrial Compensation Control Center</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowCalculateModal(true)}
                        className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all flex items-center shadow-md shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={processing}
                    >
                        {processing ? <SVGIcon name="spinner" className="mr-2" /> : <SVGIcon name="calculate" className="mr-2" />}
                        Run Calculation
                    </button>
                </div>
            </div>

            {/* Bulk Execution Console */}
            {showBulkActions && (
                <div className="bg-gray-900 p-4 rounded-2xl mb-8 flex justify-between items-center shadow-2xl border-b-4 border-red-600 animate-in slide-in-from-top-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center text-white font-black">{bulkSelection.length}</div>
                        <span className="text-white text-xs font-black uppercase tracking-widest">Records Targetted for Action</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleBulkAction('approve')}
                            className="bg-blue-600 px-4 py-2 rounded-lg text-[10px] font-black uppercase text-white tracking-widest hover:bg-blue-700 shadow-md disabled:opacity-50"
                            disabled={processing}
                        >
                            Authorize
                        </button>
                        <button
                            onClick={() => handleBulkAction('pay')}
                            className="bg-green-600 px-4 py-2 rounded-lg text-[10px] font-black uppercase text-white tracking-widest hover:bg-green-700 shadow-md disabled:opacity-50"
                            disabled={processing}
                        >
                            Mark Paid (Bulk)
                        </button>
                        <button
                            onClick={() => handleBulkAction('delete')}
                            className="bg-red-600 px-4 py-2 rounded-lg text-[10px] font-black uppercase text-white tracking-widest hover:bg-red-800 shadow-md disabled:opacity-50"
                            disabled={processing}
                        >
                            Delete
                        </button>
                        <button
                            onClick={() => setBulkSelection([])}
                            className="text-gray-400 font-black uppercase text-[10px] px-3 hover:text-white"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}

            {/* Global Search & Filters */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-10">
                <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6 items-end">
                    <div>
                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 flex items-center gap-1">
                            <SVGIcon name="calendar" /> Period
                        </label>
                        <select
                            value={data.month}
                            onChange={e => setData('month', e.target.value)}
                            className="w-full border-gray-300 rounded-xl p-2.5 font-bold focus:border-red-600 transition-all text-sm"
                        >
                            <option value="">Month</option>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                <option key={m} value={m}>{getMonthName(m)}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 flex items-center gap-1">
                            <SVGIcon name="calendar" /> Year
                        </label>
                        <input
                            type="number"
                            value={data.year}
                            onChange={e => setData('year', e.target.value)}
                            className="w-full border-gray-300 rounded-xl p-2.5 font-bold focus:border-red-600 transition-all text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 flex items-center gap-1">
                            <SVGIcon name="user" /> Personnel
                        </label>
                        <select
                            value={data.employee_id}
                            onChange={e => setData('employee_id', e.target.value)}
                            className="w-full border-gray-300 rounded-xl p-2.5 font-bold focus:border-red-600 transition-all text-sm"
                        >
                            <option value="">Full Roster</option>
                            {employees.map(employee => (
                                <option key={employee.id} value={employee.id}>{employee.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 flex items-center gap-1">
                            <SVGIcon name="status" /> Ledger Status
                        </label>
                        <select
                            value={data.status}
                            onChange={e => setData('status', e.target.value)}
                            className="w-full border-gray-300 rounded-xl p-2.5 font-bold focus:border-red-600 transition-all text-sm"
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="paid">Paid</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="bg-gray-900 text-white h-[46px] rounded-xl font-black uppercase text-xs tracking-widest hover:bg-red-600 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {processing ? <SVGIcon name="spinner" className="mx-auto" /> : 'Execute Filter'}
                    </button>
                </form>
            </div>

            {/* Master Ledger Table */}
            <div className="bg-white rounded-3xl border-2 border-gray-900 overflow-hidden shadow-2xl">
                <div className="px-8 py-5 border-b border-gray-100 bg-gray-900 flex justify-between items-center">
                    <h2 className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <SVGIcon name="list" className="w-5 h-5 text-red-500" /> Registry Master Table
                    </h2>
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={bulkSelection.length === salaries.data.length && salaries.data.length > 0}
                            onChange={handleSelectAll}
                            className="checkbox checkbox-error checkbox-sm rounded-md border-white"
                            disabled={processing}
                        />
                        <span className="text-[10px] font-black uppercase text-white">Select All</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-0">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="w-12 px-6 py-4 border-b"></th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">Personnel Identity</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">Fiscal Cycle</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">Duty Stats</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-b text-right">Gross Valuation</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-b text-center">Protocol Status</th>
                                <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">Command</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100 text-sm font-bold text-gray-700 italic-last-child">
                            {salaries.data.length > 0 ? (
                                salaries.data.map((salary) => (
                                    <tr key={salary.id} className="hover:bg-red-50/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={bulkSelection.includes(salary.id)}
                                                onChange={() => handleBulkSelection(salary.id)}
                                                className="checkbox checkbox-xs rounded-sm border-gray-300"
                                                disabled={processing}
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 bg-gray-900 rounded-xl flex items-center justify-center text-white font-black text-sm border-b-4 border-red-600 shadow-md">
                                                    {salary.employee?.name?.charAt(0)}
                                                </div>
                                                <div className="ml-4 leading-tight">
                                                    <div className="text-sm font-black text-gray-900 uppercase tracking-tight">{salary.employee?.name}</div>
                                                    <div className="text-[10px] font-mono font-bold text-red-600">#{salary.employee?.employee_id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs font-black text-gray-400 uppercase">
                                            {getMonthName(salary.month).substring(0, 3)} {salary.year}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <SVGIcon name="present" className="w-3 h-3 text-green-500" />
                                                {salary.present_days} / {salary.working_days} d
                                            </div>
                                            {salary.late_hours > 0 && (
                                                <div className="text-[9px] text-red-600 font-bold">LATE: {salary.late_hours}h</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-black text-gray-900">
                                            {formatCurrency(salary.net_salary)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg shadow-sm border-none ${getStatusColor(salary.status)}`}>
                                                {salary.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 whitespace-nowrap text-right">
                                            {renderActionButtons(salary)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center opacity-30 grayscale">
                                            <SVGIcon name="money" className="w-16 h-16" />
                                            <p className="text-xs font-black uppercase tracking-[0.2em] mt-4">Registry Empty</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {salaries?.links && salaries.links.length > 3 && (
                    <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                        <div className="text-[10px] font-black uppercase text-gray-400">
                            Page {salaries.current_page} of {salaries.last_page}
                        </div>
                        <div className="flex gap-1">
                            {salaries.links.map((link, index) => (
                                <button
                                    key={index}
                                    onClick={() => link.url && get(link.url, { preserveState: true, preserveScroll: true })}
                                    disabled={!link.url || link.active}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${link.active
                                        ? 'bg-red-600 text-white shadow-lg scale-105'
                                        : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-900'
                                        } ${!link.url ? 'opacity-30 grayscale' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Calculate Salary Modal */}
            {showCalculateModal && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-[2rem] border-4 border-gray-900 w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-gray-900 p-6 flex justify-between items-center text-white border-b border-gray-800">
                            <h3 className="font-black uppercase text-xs tracking-widest flex items-center gap-2">
                                <SVGIcon name="calculate" /> Batch Execution
                            </h3>
                            <button
                                onClick={() => setShowCalculateModal(false)}
                                className="hover:rotate-90 transition-transform disabled:opacity-50"
                                disabled={processing}
                            >
                                <SVGIcon name="close" className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCalculateSalary} className="p-8 space-y-6">
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Select Target Cycle</label>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <select
                                        value={calculateData.month}
                                        onChange={e => setCalculateData('month', e.target.value)}
                                        className="border-2 border-gray-100 rounded-xl p-3 font-bold focus:border-red-600 text-sm"
                                        required
                                        disabled={processing}
                                    >
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                            <option key={m} value={m}>{getMonthName(m)}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        value={calculateData.year}
                                        onChange={e => setCalculateData('year', e.target.value)}
                                        className="border-2 border-gray-100 rounded-xl p-3 font-bold focus:border-red-600 text-sm"
                                        required
                                        disabled={processing}
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full bg-red-600 text-white font-black uppercase py-4 rounded-2xl shadow-xl hover:bg-red-700 tracking-[0.2em] active:scale-95 transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? (
                                    <>
                                        <SVGIcon name="spinner" className="w-4 h-4 inline mr-2" />
                                        Processing...
                                    </>
                                ) : 'Run Calculator'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Pay Salary Modal */}
            {showPayModal && selectedSalary && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-[2rem] border-4 border-gray-900 w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-gray-900 p-6 flex justify-between items-center text-white border-b border-gray-800">
                            <h3 className="font-black uppercase text-xs tracking-widest flex items-center gap-2">
                                <SVGIcon name="money" /> Pay Salary
                            </h3>
                            <button
                                onClick={() => setShowPayModal(false)}
                                className="hover:rotate-90 transition-transform disabled:opacity-50"
                                disabled={processing}
                            >
                                <SVGIcon name="close" className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handlePaySalary} className="p-8 space-y-6">
                            {/* Employee Info */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="h-10 w-10 bg-gray-900 rounded-xl flex items-center justify-center text-white font-black text-sm">
                                        {selectedSalary.employee?.name?.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-gray-900">{selectedSalary.employee?.name}</div>
                                        <div className="text-[10px] font-mono text-red-600">#{selectedSalary.employee?.employee_id}</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <div className="text-[10px] text-gray-500 uppercase font-bold">Period</div>
                                        <div className="font-bold">{getMonthName(selectedSalary.month)} {selectedSalary.year}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-gray-500 uppercase font-bold">Net Salary</div>
                                        <div className="text-lg font-black text-red-600">{formatCurrency(selectedSalary.net_salary)}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Details */}
                            <div className="space-y-4">
                                <div className="form-control">
                                    <label className="label py-0">
                                        <span className="label-text text-[10px] font-black uppercase text-gray-400">Payment Method</span>
                                    </label>
                                    <select
                                        className="select select-bordered w-full rounded-xl"
                                        value={payData.payment_method}
                                        onChange={(e) => setPayData('payment_method', e.target.value)}
                                        disabled={processing}
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="bank">Bank Transfer</option>
                                        <option value="cheque">Cheque</option>
                                        <option value="mobile_banking">Mobile Banking</option>
                                    </select>
                                </div>

                                <div className="form-control">
                                    <label className="label py-0">
                                        <span className="label-text text-[10px] font-black uppercase text-gray-400">Payment Account *</span>
                                    </label>
                                    <select
                                        className="select select-bordered w-full rounded-xl"
                                        value={payData.account_id}
                                        onChange={(e) => setPayData('account_id', e.target.value)}
                                        required={['bank', 'mobile_banking'].includes(payData.payment_method)}
                                        disabled={processing}
                                    >
                                        <option value="">Select Account</option>
                                        {accounts?.map(account => (
                                            <option key={account.id} value={account.id}>
                                                <div className="flex items-center justify-between">
                                                    <span>{account.name}</span>
                                                    <span className="text-xs font-mono">
                                                        ৳{formatCurrency(account.current_balance)}
                                                    </span>
                                                </div>
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {selectedAccount && (
                                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {getAccountIcon(selectedAccount.type)}
                                                <span className="text-sm font-bold">{selectedAccount.name}</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] text-gray-500">Current Balance</div>
                                                <div className="text-sm font-mono font-bold">
                                                    ৳{formatCurrency(selectedAccount.current_balance)}
                                                </div>
                                                <div className="text-[10px] text-red-500 mt-1">
                                                    After payment: ৳{formatCurrency(selectedAccount.current_balance - selectedSalary.net_salary)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="form-control">
                                    <label className="label py-0">
                                        <span className="label-text text-[10px] font-black uppercase text-gray-400">Transaction ID/Reference</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input input-bordered w-full rounded-xl"
                                        value={payData.transaction_id}
                                        onChange={(e) => setPayData('transaction_id', e.target.value)}
                                        disabled={processing}
                                        placeholder="Enter transaction reference"
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label py-0">
                                        <span className="label-text text-[10px] font-black uppercase text-gray-400">Payment Date</span>
                                    </label>
                                    <input
                                        type="date"
                                        className="input input-bordered w-full rounded-xl"
                                        value={payData.payment_date}
                                        onChange={(e) => setPayData('payment_date', e.target.value)}
                                        disabled={processing}
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label py-0">
                                        <span className="label-text text-[10px] font-black uppercase text-gray-400">Notes</span>
                                    </label>
                                    <textarea
                                        className="textarea textarea-bordered w-full rounded-xl"
                                        rows="2"
                                        value={payData.notes}
                                        onChange={(e) => setPayData('notes', e.target.value)}
                                        disabled={processing}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full bg-green-600 text-white font-black uppercase py-4 rounded-2xl shadow-xl hover:bg-green-700 tracking-[0.2em] active:scale-95 transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? (
                                    <>
                                        <SVGIcon name="spinner" className="w-4 h-4 inline mr-2" />
                                        Processing Payment...
                                    </>
                                ) : `Pay ৳${formatCurrency(selectedSalary.net_salary)}`}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}