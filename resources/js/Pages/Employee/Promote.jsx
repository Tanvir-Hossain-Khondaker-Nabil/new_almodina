import { Head, useForm } from '@inertiajs/react';

export default function Promote({ user, nextRanks }) {
    const { data, setData, post, processing } = useForm({
        new_rank_id: ''
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('ranks.promote-user', user.id));
    };

    return (
        <>            
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">Promote Employee</h1>
                
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold">Current Information</h2>
                        <p><strong>Name:</strong> {user.name}</p>
                        <p><strong>Current Rank:</strong> {user.rank.name}</p>
                        <p><strong>Current Salary:</strong> ৳{user.current_salary}</p>
                    </div>

                    <form onSubmit={submit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">
                                Select New Rank
                            </label>
                            <select
                                value={data.new_rank_id}
                                onChange={e => setData('new_rank_id', e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                required
                            >
                                <option value="">Select Rank</option>
                                {nextRanks.map(rank => (
                                    <option key={rank.id} value={rank.id}>
                                        {rank.name} - Increment: {rank.salary_increment_percentage}%
                                    </option>
                                ))}
                            </select>
                        </div>

                        {data.new_rank_id && (
                            <div className="bg-yellow-50 p-4 rounded mb-4">
                                <h3 className="font-semibold">Promotion Preview:</h3>
                                <p>New Salary: ৳{user.current_salary + (user.current_salary * nextRanks.find(r => r.id == data.new_rank_id).salary_increment_percentage / 100)}</p>
                                <p>Salary Increase: ৳{user.current_salary * nextRanks.find(r => r.id == data.new_rank_id).salary_increment_percentage / 100}</p>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3">
                            <a
                                href={route('employees.index')}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </a>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {processing ? 'Promoting...' : 'Confirm Promotion'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}