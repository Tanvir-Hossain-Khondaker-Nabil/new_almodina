import { Head, useForm } from '@inertiajs/react';

export default function MonthlyReport({ report, month, year }) {
    const { data, setData, get, processing } = useForm({
        month: month || new Date().getMonth() + 1,
        year: year || new Date().getFullYear(),
    });

    const submit = (e) => {
        e.preventDefault();
        get(route('attendance.monthly-report'), {
            preserveState: true,
        });
    };

    const getAttendancePercentageColor = (percentage) => {
        if (percentage >= 95) return 'text-green-600';
        if (percentage >= 90) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Monthly Attendance Report</h1>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <form onSubmit={submit} className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Month</label>
                        <select
                            value={data.month}
                            onChange={e => setData('month', e.target.value)}
                            className="mt-1 block border border-gray-300 rounded-md px-3 py-2"
                        >
                            {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                                <option key={m} value={m}>{new Date(2000, m-1).toLocaleString('default', { month: 'long' })}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Year</label>
                        <input
                            type="number"
                            value={data.year}
                            onChange={e => setData('year', e.target.value)}
                            className="mt-1 block border border-gray-300 rounded-md px-3 py-2"
                        />
                    </div>
                    <div>
                        <button
                            type="submit"
                            disabled={processing}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            Generate Report
                        </button>
                    </div>
                </form>
            </div>

            {/* Report Table */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">
                        Attendance Report for {new Date(data.year, data.month-1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Present Days</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Late Days</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Absent Days</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overtime (mins)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance %</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {report.map((item, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{item.user.name}</div>
                                        <div className="text-sm text-gray-500">{item.user.employee_id}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {item.present_days}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {item.late_days}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {item.absent_days}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {item.total_overtime}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`text-sm font-medium ${getAttendancePercentageColor(item.attendance_percentage)}`}>
                                            {item.attendance_percentage}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}