import { Head, useForm } from '@inertiajs/react';

export default function TestCreate({ users }) {
    const { data, setData, post, processing } = useForm({
        employee_id: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        present_days: 22,
        late_days: 2,
        overtime_minutes: 300,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('salary.test-create'));
    };

    return (
        <>
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">Create Test Salary (For Testing)</h1>
                
                <div className="bg-white p-6 rounded-lg shadow">
                    <form onSubmit={submit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Employee *</label>
                                <select
                                    value={data.employee_id}
                                    onChange={e => setData('employee_id', e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                    required
                                >
                                    <option value="">Select Employee</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.name} - {user.employee_id}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Month</label>
                                <select
                                    value={data.month}
                                    onChange={e => setData('month', e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                >
                                    {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                                        <option key={m} value={m}>
                                            {new Date(2000, m-1).toLocaleString('default', { month: 'long' })}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Year</label>
                                <input
                                    type="number"
                                    value={data.year}
                                    onChange={e => setData('year', e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Present Days (max 31)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={data.present_days}
                                    onChange={e => setData('present_days', e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Late Days</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="31"
                                    value={data.late_days}
                                    onChange={e => setData('late_days', e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Overtime (Minutes)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={data.overtime_minutes}
                                    onChange={e => setData('overtime_minutes', e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                            </div>
                        </div>

                        {/* Preview */}
                        {data.employee_id && (
                            <div className="bg-blue-50 p-4 rounded mb-4">
                                <h3 className="font-semibold mb-2">Salary Preview:</h3>
                                <p>Basic Salary: ৳{users.find(u => u.id == data.employee_id)?.basic_salary}</p>
                                <p>Total Allowances: ৳{users.find(u => u.id == data.employee_id)?.get_total_allowances}</p>
                                <p>PF Deduction: ৳{(users.find(u => u.id == data.employee_id)?.basic_salary * users.find(u => u.id == data.employee_id)?.provident_fund_percentage / 100) || 0}</p>
                                <p className="text-sm text-gray-600 mt-2">
                                    This will create {data.present_days} days of attendance with {data.late_days} late days and {data.overtime_minutes} minutes overtime.
                                </p>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={processing}
                                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                            >
                                {processing ? 'Creating Test Data...' : 'Create Test Salary'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}