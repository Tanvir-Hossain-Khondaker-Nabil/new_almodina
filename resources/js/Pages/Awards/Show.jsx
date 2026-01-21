// resources/js/Pages/Awards/Show.jsx
import Layout from '@/Layouts/Layout';
import { Head, Link } from '@inertiajs/react';

export default function AwardShow({ award, recipients }) {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-BD');
    };

    const getMonthName = (month) => {
        return new Date(2000, month - 1).toLocaleString('default', { month: 'long' });
    };

    const getAwardPeriod = () => {
        if (award.month && award.year) {
            return `${getMonthName(award.month)} ${award.year}`;
        } else if (award.year) {
            return `Year ${award.year}`;
        }
        return 'One-time Award';
    };

    return (
        <Layout>
            <Head title={award.title} />

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{award.title}</h1>
                <div className="flex space-x-3">
                    <Link
                        href={route('awards.index')}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                    >
                        Back to Awards
                    </Link>
                    <Link
                        href={route('awards.employee-awards', { award_id: award.id })}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                        View All Recipients
                    </Link>
                </div>
            </div>

            {/* Award Details */}
            <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Award Details</h2>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                            <p className="text-gray-900">{award.description}</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-500">Cash Reward:</span>
                                <span className="text-lg font-bold text-green-600">
                                    {formatCurrency(award.cash_reward)}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-500">Type:</span>
                                <span className="text-sm font-medium text-gray-900 capitalize">
                                    {award.type} Award
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-500">Period:</span>
                                <span className="text-sm text-gray-900">
                                    {getAwardPeriod()}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-500">Status:</span>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                    award.is_active 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {award.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-500">Total Recipients:</span>
                                <span className="text-sm font-medium text-gray-900">
                                    {recipients.length} employees
                                </span>
                            </div>
                        </div>
                    </div>

                    {award.criteria && Object.keys(award.criteria).length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Award Criteria</h3>
                            <div className="bg-gray-50 rounded-md p-4">
                                <ul className="space-y-1">
                                    {Object.entries(award.criteria).map(([key, value]) => (
                                        <li key={key} className="text-sm text-gray-700">
                                            <span className="font-medium capitalize">
                                                {key.replace(/_/g, ' ')}:
                                            </span>{' '}
                                            {value}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Recipients List */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">Award Recipients</h2>
                    <span className="text-sm text-gray-500">
                        {recipients.length} employees
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Employee
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Award Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Achievement Reason
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Cash Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Payment Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {recipients.map((recipient) => (
                                <tr key={recipient.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {recipient.employee?.name || 'N/A'}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {recipient.employee?.employee_id || 'N/A'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(recipient.award_date)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 max-w-md">
                                            {recipient.achievement_reason}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {formatCurrency(recipient.cash_amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            recipient.is_paid 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {recipient.is_paid ? 'Paid' : 'Unpaid'}
                                        </span>
                                        {recipient.paid_date && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                Paid: {formatDate(recipient.paid_date)}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {recipients.length === 0 && (
                    <div className="text-center py-8">
                        <div className="text-gray-400 text-6xl mb-4">🎖️</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No recipients yet</h3>
                        <p className="text-gray-500 mb-4">
                            This award hasn't been assigned to any employees yet.
                        </p>
                        <Link
                            href={route('awards.employee-awards')}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                            Assign Award to Employees
                        </Link>
                    </div>
                )}
            </div>

            {/* Quick Stats */}
            {recipients.length > 0 && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{recipients.length}</div>
                        <div className="text-sm text-blue-600">Total Recipients</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                            {recipients.filter(r => r.is_paid).length}
                        </div>
                        <div className="text-sm text-green-600">Paid Awards</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                            {recipients.filter(r => !r.is_paid).length}
                        </div>
                        <div className="text-sm text-yellow-600">Unpaid Awards</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                            {formatCurrency(recipients.reduce((sum, r) => sum + parseFloat(r.cash_amount), 0))}
                        </div>
                        <div className="text-sm text-purple-600">Total Awarded</div>
                    </div>
                </div>
            )}
        </Layout>
    );
}