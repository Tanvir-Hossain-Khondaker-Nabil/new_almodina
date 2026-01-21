import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, X, User, Briefcase, DollarSign, ShieldCheck, Search, Filter, Trash2, Mail, MapPin } from 'lucide-react';

export default function Users({ employees, ranks, filters }) {
    const [showForm, setShowForm] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '', email: '', employee_id: '', rank_id: '', joining_date: '',
        basic_salary: '', house_rent: 0, medical_allowance: 0, transport_allowance: 0,
        other_allowance: 0, provident_fund_percentage: 5,
    });

    const { data: searchData, setData: setSearchData, get } = useForm({
        search: filters.search || '',
        rank_id: filters.rank_id || '',
        status: filters.status !== undefined ? filters.status : '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('employees.store'), { onSuccess: () => { reset(); setShowForm(false); } });
    };

    const handleSearch = () => {
        get(route('employees.index'), { preserveState: true, replace: true });
    };

    const clearFilters = () => {
        setSearchData({ search: '', rank_id: '', status: '' });
        get(route('employees.index'), { preserveState: true, replace: true });
    };

    const calculateTotalAllowances = (user) => {
        return (
            (parseFloat(user.house_rent) || 0) +
            (parseFloat(user.medical_allowance) || 0) +
            (parseFloat(user.transport_allowance) || 0) +
            (parseFloat(user.other_allowance) || 0)
        ).toFixed(2);
    };
    const Pagination = ({ data }) => {
        const { links } = data;

        if (links.length <= 3) {
            return null;
        }

        return (
            <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 p-4">
                <div className="text-sm text-gray-500 font-bold">
                    Showing <span className="text-gray-900">{data.from}</span> to <span className="text-gray-900">{data.to}</span> of{' '}
                    <span className="text-gray-900">{data.total}</span> records
                </div>
                <div className="flex space-x-1">
                    {links.map((link, index) => (
                        <Link
                            key={index}
                            href={link.url || '#'}
                            className={`
                            min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg
                            font-bold text-sm transition-all duration-200
                            ${link.active
                                    ? 'bg-red-600 text-white border border-red-600 shadow-sm'
                                    : link.url
                                        ? 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                }
                        `}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                            preserveScroll
                            only={['employees']}
                        />
                    ))}
                </div>
            </div>
        );
    };
    return (
        <div className="p-6 bg-[#fcfcfc] min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-gray-200 pb-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Active <span className="text-red-600">Personnel</span></h1>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Employee Registry & Compensation Control</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="btn bg-red-600 hover:bg-red-700 text-white border-none rounded-xl px-8 font-black uppercase text-xs tracking-widest shadow-lg"
                >
                    <Plus size={18} className="mr-2" /> Add Employee
                </button>
            </div>

            {/* Filter Console */}
            <div className="bg-white p-6 rounded-2xl border-2 border-gray-900 shadow-lg mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="form-control">
                        <label className="text-[10px] font-black uppercase text-gray-400 mb-2">Search Personnel</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input type="text" value={searchData.search} onChange={e => setSearchData('search', e.target.value)} className="input input-bordered w-full pl-10 rounded-xl font-bold border-gray-200 h-10" placeholder="Name, Email or ID..." />
                        </div>
                    </div>
                    <div className="form-control">
                        <label className="text-[10px] font-black uppercase text-gray-400 mb-2">Rank Class</label>
                        <select value={searchData.rank_id} onChange={e => setSearchData('rank_id', e.target.value)} className="select select-bordered rounded-xl font-bold border-gray-200 h-10 min-h-0">
                            <option value="">All Ranks</option>
                            {ranks.map(rank => <option key={rank.id} value={rank.id}>{rank.name}</option>)}
                        </select>
                    </div>
                    <div className="form-control">
                        <label className="text-[10px] font-black uppercase text-gray-400 mb-2">Status</label>
                        <select value={searchData.status} onChange={e => setSearchData('status', e.target.value)} className="select select-bordered rounded-xl font-bold border-gray-200 h-10 min-h-0">
                            <option value="">All Status</option>
                            <option value="1">Active</option>
                            <option value="0">Inactive</option>
                        </select>
                    </div>
                    <div className="flex items-end gap-2">
                        <button onClick={handleSearch} className="btn bg-gray-900 text-white rounded-xl flex-1 uppercase font-black text-xs tracking-widest h-10 min-h-0">Filter</button>
                        <button onClick={clearFilters} className="btn btn-ghost rounded-xl uppercase font-black text-xs tracking-widest h-10 min-h-0">Reset</button>
                    </div>
                </div>
            </div>

            {/* Employee Table */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden mb-10">
                <table className="table w-full border-separate border-spacing-0">
                    <thead className="bg-gray-900 text-white uppercase text-[10px] tracking-widest">
                        <tr>
                            <th className="py-4 pl-8">Employee Identity</th>
                            <th>Rank</th>
                            <th>Compensation</th>
                            <th>Allowances</th>
                            <th>Status</th>
                            <th className="pr-8 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="font-bold text-sm text-gray-700 italic-last-child">
                        {employees.data.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 border-b border-gray-50 transition-colors">
                                <td className="pl-8 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-black text-gray-900 uppercase tracking-tight">{user.name}</span>
                                        <span className="text-[10px] font-mono text-red-600 font-black">ID: {user.employee_id}</span>
                                    </div>
                                </td>
                                <td><span className="badge bg-gray-100 border-none font-black text-[9px] uppercase py-2 px-3">{user.rank?.name || 'N/A'}</span></td>
                                <td>
                                    <div className="flex flex-col">
                                        <span className="font-mono text-gray-900 tracking-tighter">৳{parseFloat(user.current_salary).toLocaleString()}</span>
                                        <span className="text-[9px] text-gray-400 uppercase font-black">Basic: ৳{parseFloat(user.basic_salary).toLocaleString()}</span>
                                    </div>
                                </td>
                                <td><span className="text-gray-900 font-mono">৳{calculateTotalAllowances(user)}</span></td>
                                <td>
                                    <span className={`badge border-none font-black text-[9px] uppercase py-2 px-3 tracking-widest ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {user.is_active ? 'Active' : 'Offline'}
                                    </span>
                                </td>
                                <td className="pr-8 text-right">
                                    <Link href={route('employees.edit', user.id)} className="btn btn-ghost btn-xs font-black uppercase text-red-600 hover:bg-red-50">Edit Dossier</Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination data={employees} />

            {/* Add Employee Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl border-4 border-gray-900 w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="bg-gray-900 p-4 flex justify-between items-center text-white">
                            <h2 className="font-black uppercase text-xs tracking-widest flex items-center gap-2"><User size={18} className="text-red-500" /> New Staff Registry</h2>
                            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
                        </div>
                        <form onSubmit={submit} className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="form-control">
                                    <label className="label text-[10px] font-black uppercase text-gray-400 tracking-widest">Full Name</label>
                                    <input type="text" value={data.name} onChange={e => setData('name', e.target.value)} className="input input-bordered rounded-xl font-bold border-gray-300" required />
                                </div>
                                <div className="form-control">
                                    <label className="label text-[10px] font-black uppercase text-gray-400 tracking-widest">Email Address</label>
                                    <input type="email" value={data.email} onChange={e => setData('email', e.target.value)} className="input input-bordered rounded-xl font-bold border-gray-300" required />
                                </div>
                                <div className="form-control">
                                    <label className="label text-[10px] font-black uppercase text-gray-400 tracking-widest">Employee System ID</label>
                                    <input type="text" value={data.employee_id} onChange={e => setData('employee_id', e.target.value)} className="input input-bordered rounded-xl font-mono font-bold border-gray-300 uppercase" placeholder="EMP-001" required />
                                </div>
                                <div className="form-control">
                                    <label className="label text-[10px] font-black uppercase text-gray-400 tracking-widest">Rank Selection</label>
                                    <select value={data.rank_id} onChange={e => setData('rank_id', e.target.value)} className="select select-bordered rounded-xl font-bold border-gray-300" required>
                                        <option value="">Choose Rank...</option>
                                        {ranks.map(rank => <option key={rank.id} value={rank.id}>{rank.name} (Lvl {rank.level})</option>)}
                                    </select>
                                </div>
                                <div className="form-control">
                                    <label className="label text-[10px] font-black uppercase text-gray-400 tracking-widest">Basic Monthly Wage</label>
                                    <input type="number" value={data.basic_salary} onChange={e => setData('basic_salary', e.target.value)} className="input input-bordered rounded-xl font-mono font-bold border-gray-300" required />
                                </div>
                                <div className="form-control">
                                    <label className="label text-[10px] font-black uppercase text-gray-400 tracking-widest">Onboarding Date</label>
                                    <input type="date" value={data.joining_date} onChange={e => setData('joining_date', e.target.value)} className="input input-bordered rounded-xl font-bold border-gray-300" required />
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end gap-3 border-t pt-6">
                                <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost font-black uppercase text-xs">Cancel</button>
                                <button type="submit" disabled={processing} className="btn bg-red-600 hover:bg-red-700 text-white border-none rounded-xl px-12 font-black uppercase text-xs tracking-widest transition-all shadow-lg">
                                    {processing ? 'Processing...' : 'Register Employee'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}