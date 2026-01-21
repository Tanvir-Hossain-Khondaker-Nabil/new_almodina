import { Head, useForm, Link } from '@inertiajs/react';
import { useState } from 'react';
import { 
    Gift, 
    Moon, 
    PartyPopper, 
    Plus, 
    Settings2, 
    Trash2, 
    ChevronRight, 
    Calendar,
    BadgePercent,
    Zap
} from 'lucide-react';

// কম্পোনেন্ট ইম্পোর্ট করুন
import BonusFormModal from '@/Components/BonusFormModal';
import EidBonusModal from '@/Components/EidBonusModal';
import FestivalBonusModal from '@/Components/FestivalBonusModal';

export default function Bonus({ bonusSettings }) {
    const [showForm, setShowForm] = useState(false);
    const [showEidForm, setShowEidForm] = useState(false);
    const [showFestivalForm, setShowFestivalForm] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        bonus_name: '',
        bonus_type: 'festival',
        percentage: 0,
        fixed_amount: 0,
        is_percentage: true,
        description: '',
        effective_date: new Date().toISOString().split('T')[0],
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('bonus.store'), {
            onSuccess: () => {
                reset();
                setShowForm(false);
            },
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    return (
        <div className="p-6 bg-[#fcfcfc] min-h-screen">
            <Head title="Bonus Management" />

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-gray-200 pb-6 bg-white p-6 rounded-2xl shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Bonus <span className="text-red-600">Incentives</span></h1>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Configure & Execute Employee Rewards</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setShowEidForm(true)}
                        className="btn bg-gray-900 hover:bg-green-600 text-white border-none rounded-xl px-6 font-black uppercase text-[10px] tracking-widest shadow-lg transition-all"
                    >
                        <Moon size={16} className="mr-2" /> Apply Eid Bonus
                    </button>
                    <button
                        onClick={() => setShowFestivalForm(true)}
                        className="btn bg-gray-900 hover:bg-blue-600 text-white border-none rounded-xl px-6 font-black uppercase text-[10px] tracking-widest shadow-lg transition-all"
                    >
                        <PartyPopper size={16} className="mr-2" /> Festival Bonus
                    </button>
                    <button
                        onClick={() => setShowForm(true)}
                        className="btn bg-red-600 hover:bg-red-700 text-white border-none rounded-xl px-6 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-100 transition-all"
                    >
                        <Plus size={18} className="mr-1" /> New Setting
                    </button>
                </div>
            </div>

            {/* Quick Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="group bg-white rounded-3xl border-2 border-transparent hover:border-green-500 p-6 shadow-sm transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-green-50 p-4 rounded-2xl text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                            <Moon size={24} />
                        </div>
                        <ChevronRight className="text-gray-300 group-hover:text-green-500 transition-colors" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Religious Festivals</h3>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1 mb-6">Standard Eid-ul-Fitr/Adha payouts</p>
                    <button onClick={() => setShowEidForm(true)} className="text-[10px] font-black uppercase text-green-600 hover:text-green-800 tracking-[0.2em]">Initialize Batch →</button>
                </div>

                <div className="group bg-white rounded-3xl border-2 border-transparent hover:border-blue-500 p-6 shadow-sm transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <PartyPopper size={24} />
                        </div>
                        <ChevronRight className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Occasional Events</h3>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1 mb-6">New Year or Seasonal incentives</p>
                    <button onClick={() => setShowFestivalForm(true)} className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 tracking-[0.2em]">Open Console →</button>
                </div>

                <div className="group bg-white rounded-3xl border-2 border-gray-900 p-6 shadow-lg transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><Zap size={80}/></div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-gray-900 p-4 rounded-2xl text-red-500">
                            <Settings2 size={24} />
                        </div>
                    </div>
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Custom logic</h3>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1 mb-6">Define unique rewarding parameters</p>
                    <button onClick={() => setShowForm(true)} className="text-[10px] font-black uppercase text-red-600 hover:text-red-800 tracking-[0.2em]">Add Parameter →</button>
                </div>
            </div>

            {/* Bonus Settings Table */}
            <div className="bg-white rounded-3xl border-2 border-gray-900 overflow-hidden shadow-2xl">
                <div className="bg-gray-900 px-8 py-5 flex justify-between items-center border-b border-gray-800">
                    <h2 className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <Gift size={16} className="text-red-500"/> Reward Registry Configuration
                    </h2>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="table w-full border-separate border-spacing-0">
                        <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                            <tr>
                                <th className="py-4 pl-8 border-b">Bonus Designation</th>
                                <th className="border-b">Category</th>
                                <th className="border-b">Method</th>
                                <th className="border-b">Standard Value</th>
                                <th className="border-b">Effective Date</th>
                                <th className="border-b">Status</th>
                                <th className="border-b text-right pr-8">Command</th>
                            </tr>
                        </thead>
                        <tbody className="font-bold text-sm text-gray-700 italic-last-child">
                            {bonusSettings.length > 0 ? (
                                bonusSettings.map((setting) => (
                                    <tr key={setting.id} className="hover:bg-red-50/30 transition-colors border-b last:border-0">
                                        <td className="pl-8 py-4 uppercase font-black text-gray-900 tracking-tight">{setting.bonus_name}</td>
                                        <td>
                                            <span className="text-[10px] font-black uppercase bg-gray-100 px-2 py-1 rounded text-gray-600 tracking-tighter">
                                                {setting.bonus_type}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                {setting.is_percentage ? <BadgePercent size={14}/> : <DollarSign size={14}/>}
                                                {setting.is_percentage ? 'Relative %' : 'Static Fixed'}
                                            </div>
                                        </td>
                                        <td className="font-mono text-gray-900 font-black">
                                            {setting.is_percentage ? `${setting.percentage}%` : `৳${setting.fixed_amount.toLocaleString()}`}
                                        </td>
                                        <td className="text-gray-400 uppercase text-[10px]">
                                            {new Date(setting.effective_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td>
                                            <span className={`badge border-none font-black text-[9px] uppercase tracking-widest py-2 px-3 ${
                                                setting.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {setting.is_active ? 'Operational' : 'Halted'}
                                            </span>
                                        </td>
                                        <td className="pr-8 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    href={route('bonus.apply', { bonus: setting.id })}
                                                    className="btn btn-ghost btn-xs font-black uppercase text-red-600 hover:bg-red-50"
                                                >
                                                    Execute
                                                </Link>
                                                <button className="btn btn-ghost btn-square btn-xs text-gray-300 hover:text-red-600 transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="py-20 text-center">
                                        <div className="flex flex-col items-center opacity-20 grayscale">
                                            <Gift size={48} />
                                            <p className="text-xs font-black uppercase tracking-[0.3em] mt-4">Registry Null</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals - Components logic preserved */}
            {showForm && (
                <BonusFormModal 
                    data={data}
                    setData={setData}
                    errors={errors}
                    processing={processing}
                    onSubmit={submit}
                    onClose={() => setShowForm(false)}
                />
            )}

            {showEidForm && (
                <EidBonusModal onClose={() => setShowEidForm(false)} />
            )}

            {showFestivalForm && (
                <FestivalBonusModal onClose={() => setShowFestivalForm(false)} />
            )}
            
            
        </div>
    );
}

// Helper convert function logic is preserved in the backend/controller usually, 
// so only JSX design updates are provided here.