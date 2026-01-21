// resources/js/Pages/Awards/Statistics.jsx
import Layout from '@/Layouts/Layout';
import { Head, Link } from '@inertiajs/react';

export default function AwardStatistics({ statistics, topRecipients }) {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    const StatCard = ({ title, value, subtitle, color = 'blue' }) => (
        <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">
                    {title}
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {value}
                </dd>
                {subtitle && (
                    <dd className="text-sm text-gray-500 mt-1">
                        {subtitle}
                    </dd>
                )}
            </div>
        </div>
    );

    return (
        <Layout>
            <Head title="Award Statistics" />

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Award Statistics</h1>
                <div className="flex space-x-3">
                    <Link
                        href={route('awards.index')}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                    >
                        Back to Awards
                    </Link>
                    <Link
                        href={route('awards.employee-awards')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        View Employee Awards
                    </Link>
                </div>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard
                    title="Total Awards Created"
                    value={statistics.totalAwards}
                    subtitle="Different award types"
                    color="blue"
                />
                <StatCard
                    title="Awards Given"
                    value={statistics.totalGivenAwards}
                    subtitle="Total awards assigned to employees"
                    color="green"
                />
                <StatCard
                    title="Awards Paid"
                    value={statistics.totalPaidAwards}
                    subtitle={`${((statistics.totalPaidAwards / statistics.totalGivenAwards) * 100 || 0).toFixed(1)}% of total`}
                    color="purple"
                />
                <StatCard
                    title="Total Cash Rewards"
                    value={formatCurrency(statistics.totalCashRewards)}
                    subtitle="All awarded amounts"
                    color="yellow"
                />
                <StatCard
                    title="Total Paid Cash"
                    value={formatCurrency(statistics.totalPaidCash)}
                    subtitle="Amount already disbursed"
                    color="green"
                />
                <StatCard
                    title="Pending Cash"
                    value={formatCurrency(statistics.pendingCash)}
                    subtitle="Awaiting payment"
                    color="red"
                />
            </div>

            {/* Top Recipients */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Top Award Recipients</h2>
                    <p className="text-sm text-gray-600 mt-1">Employees with most awards</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Rank
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Employee
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Awards
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Cash
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Average per Award
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {topRecipients.map((recipient, index) => (
                                <tr key={recipient.employee_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className={`w-8 h-8 flex items-center justify-center rounded-full ${
                                                index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                                index === 1 ? 'bg-gray-100 text-gray-800' :
                                                index === 2 ? 'bg-orange-100 text-orange-800' :
                                                'bg-blue-100 text-blue-800'
                                            } font-bold text-sm`}>
                                                #{index + 1}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {recipient.employee?.name || 'N/A'}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {recipient.employee?.employee_id || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {recipient.award_count} awards
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {formatCurrency(recipient.total_cash)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatCurrency(recipient.total_cash / recipient.award_count)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {topRecipients.length === 0 && (
                    <div className="text-center py-8">
                        <div className="text-gray-400 text-6xl mb-4">📊</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No award data yet</h3>
                        <p className="text-gray-500">Award statistics will appear here once awards are given to employees.</p>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                    href={route('awards.assign-monthly')}
                    className="bg-orange-500 text-white p-4 rounded-lg hover:bg-orange-600 transition-colors text-center"
                >
                    <div className="text-2xl mb-2">🏆</div>
                    <div className="font-medium">Assign Monthly Awards</div>
                    <div className="text-sm opacity-90 mt-1">Auto-assign based on performance</div>
                </Link>

                <Link
                    href={route('awards.employee-awards')}
                    className="bg-green-500 text-white p-4 rounded-lg hover:bg-green-600 transition-colors text-center"
                >
                    <div className="text-2xl mb-2">🎖️</div>
                    <div className="font-medium">Manage Employee Awards</div>
                    <div className="text-sm opacity-90 mt-1">View and update awards</div>
                </Link>

                <Link
                    href={route('awards.create')}
                    className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 transition-colors text-center"
                >
                    <div className="text-2xl mb-2">⭐</div>
                    <div className="font-medium">Create New Award</div>
                    <div className="text-sm opacity-90 mt-1">Design custom awards</div>
                </Link>
            </div>
        </Layout>
    );
}