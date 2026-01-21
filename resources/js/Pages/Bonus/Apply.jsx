import { Head, useForm, Link } from '@inertiajs/react';
import { useState } from 'react';
import { 
    ArrowLeft, 
    Calendar, 
    Users, 
    Gift, 
    CheckCircle2, 
    ChevronRight, 
    Circle,
    BadgeCheck,
    Info,
    UserCheck,
    ShieldAlert
} from 'lucide-react';

export default function ApplyBonus({ bonusSetting, employees, locale }) {
    const { data, setData, post, processing, errors } = useForm({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        employee_ids: []
    });

    const [selectedEmployees, setSelectedEmployees] = useState([]);

    const submit = (e) => {
        e.preventDefault();
        post(route('bonus.apply', { bonus: bonusSetting.id }), {
            onSuccess: () => {
                // Success handling
            },
        });
    };

    const toggleEmployee = (employeeId) => {
        const newSelected = selectedEmployees.includes(employeeId)
            ? selectedEmployees.filter(id => id !== employeeId)
            : [...selectedEmployees, employeeId];
        
        setSelectedEmployees(newSelected);
        setData('employee_ids', newSelected);
    };

    const selectAll = () => {
        const allIds = employees.map(emp => emp.id);
        setSelectedEmployees(allIds);
        setData('employee_ids', allIds);
    };

    const clearAll = () => {
        setSelectedEmployees([]);
        setData('employee_ids', []);
    };

    return (
        <div className={`p-6 bg-[#fcfcfc] min-h-screen ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <Head title={`Apply ${bonusSetting.bonus_name}`} />

            <div className="max-w-5xl mx-auto">
                {/* Header Section */}
                <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <Link 
                            href={route('bonus.index')} 
                            className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-red-600 tracking-widest hover:translate-x-[-4px] transition-transform mb-4"
                        >
                            <ArrowLeft size={14} /> Back to Registry
                        </Link>
                        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                            Execute <span className="text-red-600">{bonusSetting.bonus_name}</span>
                        </h1>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">
                            Personnel Incentive Disbursement Protocol
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Sidebar: Details & Info */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-gray-900 rounded-3xl border-2 border-gray-900 p-6 text-white shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Gift size={100} />
                            </div>
                            <h2 className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-6 flex items-center gap-2 relative z-10">
                                <Info size={14}/> Parameters
                            </h2>
                            <div className="space-y-4 relative z-10">
                                <div className="border-b border-gray-800 pb-3">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Incentive Type</p>
                                    <p className="text-sm font-bold uppercase">{bonusSetting.bonus_type}</p>
                                </div>
                                <div className="border-b border-gray-800 pb-3">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Valuation Mode</p>
                                    <p className="text-sm font-bold uppercase">{bonusSetting.is_percentage ? 'Relative %' : 'Static Fixed'}</p>
                                </div>
                                <div className="border-b border-gray-800 pb-3">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Standard Value</p>
                                    <p className="text-xl font-black font-mono text-red-500">
                                        {bonusSetting.is_percentage ? `${bonusSetting.percentage}%` : `৳${bonusSetting.fixed_amount.toLocaleString()}`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl border-2 border-gray-900 p-6 shadow-sm">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Calculation Audit</h3>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-500 uppercase leading-relaxed">
                                    Reference Employee Basic: <span className="text-gray-900 font-black">৳30,000</span>
                                    <br />
                                    Expected Yield: 
                                    <span className="block text-lg font-black text-gray-900 font-mono mt-1">
                                        ৳{bonusSetting.is_percentage 
                                            ? (30000 * bonusSetting.percentage / 100).toLocaleString()
                                            : bonusSetting.fixed_amount.toLocaleString()
                                        }
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Main Content: Execution Form */}
                    <div className="lg:col-span-8">
                        <form onSubmit={submit} className="space-y-6">
                            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="bg-gray-50 px-8 py-5 border-b border-gray-200 flex flex-wrap justify-between items-center gap-4">
                                    <h2 className="text-xs font-black uppercase tracking-widest text-gray-900 flex items-center gap-2">
                                        <Calendar size={16} className="text-red-600"/> Deployment Schedule
                                    </h2>
                                    <div className="flex gap-4">
                                        <div className="form-control">
                                            <select
                                                value={data.month}
                                                onChange={e => setData('month', e.target.value)}
                                                className="select select-sm select-bordered rounded-lg font-bold border-gray-300 focus:border-red-600 h-9 min-h-0 text-xs"
                                                required
                                            >
                                                {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                                                    <option key={m} value={m}>
                                                        {new Date(2000, m-1).toLocaleString('default', { month: 'long' })}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-control">
                                            <input
                                                type="number"
                                                value={data.year}
                                                onChange={e => setData('year', e.target.value)}
                                                className="input input-sm input-bordered rounded-lg font-bold border-gray-300 focus:border-red-600 h-9 min-h-0 w-24 text-xs"
                                                required
                                                min="2020"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                        <div>
                                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 flex items-center gap-2">
                                                <Users size={16} className="text-red-600"/> Target Roster
                                            </h3>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                                                {selectedEmployees.length === 0 
                                                    ? "Global Application (All Active Personnel)" 
                                                    : `${selectedEmployees.length} personnel targetted`}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={selectAll} className="btn btn-xs bg-gray-900 text-white border-none rounded-lg font-black uppercase text-[9px] tracking-widest px-3">Select All</button>
                                            <button type="button" onClick={clearAll} className="btn btn-xs bg-gray-100 text-gray-500 border-none rounded-lg font-black uppercase text-[9px] tracking-widest px-3">Reset</button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {employees.map(employee => (
                                            <div 
                                                key={employee.id} 
                                                onClick={() => toggleEmployee(employee.id)}
                                                className={`cursor-pointer group flex items-center p-4 rounded-2xl border-2 transition-all ${
                                                    selectedEmployees.includes(employee.id)
                                                        ? 'border-red-600 bg-red-50'
                                                        : 'border-gray-100 bg-white hover:border-gray-300'
                                                }`}
                                            >
                                                <div className="mr-4">
                                                    {selectedEmployees.includes(employee.id) ? (
                                                        <CheckCircle2 size={20} className="text-red-600" />
                                                    ) : (
                                                        <Circle size={20} className="text-gray-200 group-hover:text-gray-300" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className={`text-xs font-black uppercase truncate ${
                                                        selectedEmployees.includes(employee.id) ? 'text-red-700' : 'text-gray-900'
                                                    }`}>
                                                        {employee.name}
                                                    </p>
                                                    <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-tighter">
                                                        {employee.employee_id} • ৳{employee.basic_salary.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {errors.employee_ids && (
                                        <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100 flex items-center gap-2 text-red-600 text-xs font-bold uppercase italic">
                                            <ShieldAlert size={14}/> {errors.employee_ids}
                                        </div>
                                    )}
                                </div>

                                <div className="bg-gray-900 p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white">
                                            <UserCheck size={20}/>
                                        </div>
                                        <div>
                                            <p className="text-white text-[10px] font-black uppercase tracking-widest">Execution Mode</p>
                                            <p className="text-gray-400 text-[10px] uppercase font-bold">
                                                {selectedEmployees.length === 0 ? "Global Disbursement" : "Selective Payout"}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="btn bg-red-600 hover:bg-red-700 text-white border-none rounded-xl px-10 font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 disabled:bg-gray-700"
                                    >
                                        {processing ? 'Processing System...' : 'Commit Disbursement'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>


            
        </div>
    );
}