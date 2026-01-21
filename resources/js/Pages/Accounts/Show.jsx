import React from 'react';
import { Link, router } from '@inertiajs/react';
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, CreditCard, User, FileText, Printer, Download } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { useTranslation } from '../../hooks/useTranslation';

export default function AccountShow({ account }) {
    const { t, locale } = useTranslation();

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BD', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-GB');
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'cash': return t('account.type.cash', 'Cash');
            case 'bank': return t('account.type.bank', 'Bank Account');
            case 'mobile_banking': return t('account.type.mobile_banking', 'Mobile Banking');
            default: return type;
        }
    };

    const handleDeposit = () => {
        const amount = prompt(t('account.enter_deposit_amount', 'Enter deposit amount:'));
        if (amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0) {
            router.post(route('accounts.deposit', account.id), { amount }, {
                preserveScroll: true,
                onSuccess: () => {
                    alert(t('account.deposit_success', 'Deposit successful!'));
                    router.reload();
                },
            });
        }
    };

    const handleWithdraw = () => {
        const amount = prompt(t('account.enter_withdraw_amount', 'Enter withdrawal amount:'));
        if (amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0) {
            if (parseFloat(amount) > account.current_balance) {
                alert(t('account.insufficient_balance', 'Insufficient balance!'));
                return;
            }
            router.post(route('accounts.withdraw', account.id), { amount }, {
                preserveScroll: true,
                onSuccess: () => {
                    alert(t('account.withdraw_success', 'Withdrawal successful!'));
                    router.reload();
                },
            });
        }
    };

    return (
        <div className="bg-white rounded-box p-5">
            <PageHeader
                title={account.name}
                subtitle={getTypeLabel(account.type)}
            >
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDeposit}
                        className="btn btn-sm bg-green-600 hover:bg-green-700 text-white"
                    >
                        <TrendingUp size={16} />
                        {t('account.deposit', 'Deposit')}
                    </button>
                    <button
                        onClick={handleWithdraw}
                        className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <TrendingDown size={16} />
                        {t('account.withdraw', 'Withdraw')}
                    </button>
                    <Link
                        href={route('accounts.edit', account.id)}
                        className="btn btn-sm btn-warning text-white"
                    >
                        {t('account.edit', 'Edit')}
                    </Link>
                    <Link
                        href={route('accounts.index')}
                        className="btn btn-sm btn-ghost"
                    >
                        <ArrowLeft size={16} />
                        {t('account.back', 'Back')}
                    </Link>
                </div>
            </PageHeader>

            {/* Account Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
                    <p className="text-sm opacity-80 mb-2">
                        {t('account.current_balance', 'Current Balance')}
                    </p>
                    <p className="text-3xl font-black">৳{formatCurrency(account.current_balance)}</p>
                </div>
                <div className="bg-white border rounded-2xl p-6">
                    <p className="text-sm text-gray-500 mb-2">
                        {t('account.opening_balance', 'Opening Balance')}
                    </p>
                    <p className="text-2xl font-black text-gray-900">
                        ৳{formatCurrency(account.opening_balance)}
                    </p>
                </div>
                <div className="bg-white border rounded-2xl p-6">
                    <p className="text-sm text-gray-500 mb-2">
                        {t('account.account_status', 'Account Status')}
                    </p>
                    <div className="flex items-center justify-between">
                        <span className={`badge ${account.is_active ? 'badge-success' : 'badge-error'} text-lg py-3 px-4`}>
                            {account.is_active ? t('account.active', 'Active') : t('account.inactive', 'Inactive')}
                        </span>
                        {account.is_default && (
                            <span className="badge badge-outline badge-success">
                                {t('account.default', 'Default')}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Account Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="border rounded-xl p-6">
                    <h3 className="font-bold text-lg mb-4">
                        {t('account.account_details', 'Account Details')}
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-500">{t('account.account_type', 'Account Type')}</span>
                            <span className="font-bold">{getTypeLabel(account.type)}</span>
                        </div>
                        {account.account_number && (
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">{t('account.account_number', 'Account Number')}</span>
                                <span className="font-bold">{account.account_number}</span>
                            </div>
                        )}
                        {account.bank_name && (
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">{t('account.bank_name', 'Bank Name')}</span>
                                <span className="font-bold">{account.bank_name}</span>
                            </div>
                        )}
                        {account.mobile_provider && (
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">{t('account.mobile_provider', 'Mobile Provider')}</span>
                                <span className="font-bold capitalize">{account.mobile_provider}</span>
                            </div>
                        )}
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-500">{t('account.created_at', 'Created At')}</span>
                            <span className="font-bold">{formatDate(account.created_at)}</span>
                        </div>
                    </div>
                </div>

                <div className="border rounded-xl p-6">
                    <h3 className="font-bold text-lg mb-4">
                        {t('account.transaction_summary', 'Transaction Summary')}
                    </h3>
                    {account.payments && account.payments.length > 0 ? (
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-gray-500">{t('account.total_transactions', 'Total Transactions')}</span>
                                <span className="font-bold">{account.payments.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">{t('account.last_transaction', 'Last Transaction')}</span>
                                <span className="font-bold">
                                    {formatDate(account.payments[0]?.created_at)}
                                </span>
                            </div>
                            <div className="pt-4">
                                <Link
                                    href={route('payments.index', { account: account.id })}
                                    className="btn btn-sm btn-outline w-full"
                                >
                                    {t('account.view_transactions', 'View All Transactions')}
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400">
                            <p>{t('account.no_transactions', 'No transactions found')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Transactions */}
            {account.payments && account.payments.length > 0 && (
                <div className="border rounded-xl">
                    <div className="border-b p-4">
                        <h3 className="font-bold text-lg">
                            {t('account.recent_transactions', 'Recent Transactions')}
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="table w-full">
                            <thead>
                                <tr>
                                    <th>{t('account.date', 'Date')}</th>
                                    <th>{t('account.description', 'Description')}</th>
                                    <th>{t('account.type', 'Type')}</th>
                                    <th className="text-right">{t('account.amount', 'Amount')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {account.payments.slice(0, 10).map((payment) => (
                                    <tr key={payment.id} className="hover:bg-gray-50">
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-gray-400" />
                                                {formatDate(payment.created_at)}
                                            </div>
                                        </td>
                                        <td>
                                            {payment.note || payment.txn_ref || 'N/A'}
                                        </td>
                                        <td>
                                            <span className="badge badge-outline">
                                                {payment.payment_method}
                                            </span>
                                        </td>
                                        <td className="text-right font-mono">
                                            <span className={
                                                payment.payment_type === 'income' 
                                                    ? 'text-green-600' 
                                                    : 'text-red-600'
                                            }>
                                                {payment.payment_type === 'income' ? '+' : '-'}
                                                ৳{formatCurrency(payment.amount)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Notes Section */}
            {account.note && (
                <div className="mt-8 border rounded-xl p-6">
                    <h3 className="font-bold text-lg mb-4">
                        {t('account.notes', 'Notes')}
                    </h3>
                    <p className="text-gray-600 whitespace-pre-line">{account.note}</p>
                </div>
            )}
        </div>
    );
}