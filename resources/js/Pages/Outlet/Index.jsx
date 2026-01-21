import React, { useState, useEffect } from "react";
import PageHeader from "../../components/PageHeader";
import {
    Plus, Trash2, Search, Edit, X, User,
    Mail, Phone, MapPin, CheckCircle, AlertCircle,
    Building, ChevronRight, MapPin as MapIcon, Shield,
    Hash, Store, Clock,LogIn  // Added Hash and Store here
} from "lucide-react";
import { router, useForm, usePage } from "@inertiajs/react";
import { useTranslation } from "../../hooks/useTranslation";

export default function Index({ outlets, filters = {} }) {
    const { auth, errors, flash } = usePage().props;
    const { t, locale } = useTranslation();
    const [model, setModel] = useState(false);
    const [editProcessing, setEditProcessing] = useState(false);
    const [notification, setNotification] = useState({
        show: false,
        type: 'success',
        message: ''
    });

    // Show flash messages
    useEffect(() => {
        if (flash.success) {
            setNotification({ show: true, type: 'success', message: flash.success });
            setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000);
        }
    }, [flash]);

    const [localFilters, setLocalFilters] = useState({
        search: filters?.search || "",
        status: filters?.status || "",
    });

    const modelClose = () => {
        outletForm.reset();
        setModel(false);
    };

    const handleFilter = (field, value) => {
        const newFilters = { ...localFilters, [field]: value };
        setLocalFilters(newFilters);
        router.get(route("outlets.index"),
            { search: newFilters.search, status: newFilters.status },
            { preserveScroll: true, preserveState: true, replace: true }
        );
    };

    const outletForm = useForm({
        id: "", name: "", phone: "", email: "", address: "", is_active: true,
    });

    const handleOutletEdit = (id) => {
        setEditProcessing(true);
        axios.get(route("outlets.show", { outlet: id })).then((res) => {
            const data = res.data.outlet;
            outletForm.setData({
                id: data.id, name: data.name, phone: data.phone || "",
                email: data.email || "", address: data.address || "", is_active: Boolean(data.is_active),
            });
            setModel(true);
        }).finally(() => setEditProcessing(false));
    };

    const handleDelete = (id) => {
        if (confirm(t('outlet.delete_confirmation', 'Delete this shop record?'))) {
            router.delete(route("outlets.destroy", { outlet: id }), { preserveScroll: true });
        }
    };

    const handleOutletCreateForm = (e) => {
        e.preventDefault();
        const action = outletForm.data.id ? "put" : "post";
        const url = outletForm.data.id ? route("outlets.update", { outlet: outletForm.data.id }) : route("outlets.store");

        outletForm[action](url, {
            onSuccess: () => { outletForm.reset(); setModel(false); }
        });
    };

    return (
        <div className={`bg-[#f4f1ea] min-h-screen p-6 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            {/* Notification */}
            {notification.show && (
                <div className="fixed top-6 right-6 z-[100] bg-white border-2 border-[#1e4d2b] p-4 shadow-[8px_8px_0px_rgba(30,77,43,0.2)]">
                    <div className="flex items-center gap-3">
                        <CheckCircle size={20} className="text-[#1e4d2b]" />
                        <span className="font-black uppercase text-xs">{notification.message}</span>
                    </div>
                </div>
            )}

            <PageHeader title={t('outlet.title', 'Dokan Registry')} subtitle={t('outlet.subtitle', 'Official register of shop locations.')}>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="search"
                            value={localFilters.search}
                            onChange={(e) => handleFilter('search', e.target.value)}
                            placeholder="Find a Shop..."
                            className="h-10 pl-9 pr-4 text-xs font-bold border-2 border-[#dcd4c3] bg-white focus:border-[#1e4d2b] focus:outline-none w-64 shadow-sm"
                        />
                    </div>
                    <button
                        onClick={() => setModel(true)}
                        className="h-10 px-6 bg-[#1e4d2b] text-white font-black uppercase text-[10px] tracking-widest shadow-[4px_4px_0px_#000] active:translate-y-1 active:shadow-none transition-all"
                    >
                        + Register Dokan
                    </button>
                </div>
            </PageHeader>

            {/* Shop Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
                {outlets?.length > 0 ? outlets.map((outlet) => (
                    <div key={outlet.id} className="relative bg-white border-2 border-[#dcd4c3] p-0 shadow-sm hover:shadow-xl transition-all group">
                        {/* Status Stamp - Physical Look */}
                        <div className={`absolute -top-2 -right-2 border-2 px-3 py-1 font-black text-[10px] uppercase tracking-tighter transform rotate-12 z-10 shadow-sm
                            ${outlet.is_active ? 'border-green-600 text-green-600 bg-white' : 'border-red-600 text-red-600 bg-white'}`}>
                            {outlet.is_active ? '● Verified Open' : '○ Closed'}
                        </div>

                        {/* Top Signboard Color bar */}
                        <div className="h-2 bg-[#1e4d2b] w-full"></div>

                        <div className="p-6">
                            {/* Shop Title */}
                            <div className="mb-6">
                                <h3 className="text-2xl font-black text-gray-900 uppercase italic leading-none tracking-tighter group-hover:text-[#1e4d2b] transition-colors">
                                    {outlet.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="px-1.5 py-0.5 bg-gray-100 text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest">
                                        ID: {outlet.id}
                                    </div>
                                </div>
                            </div>

                            {/* Info Rows */}
                            <div className="space-y-4 border-t-2 border-dashed border-gray-100 pt-4">
                                <div className="flex items-start gap-3">
                                    <Phone size={14} className="mt-1 text-[#1e4d2b] flex-shrink-0" />
                                    <div className="flex flex-col">
                                        <span className="text-[9px] uppercase font-black text-gray-400">Merchant Contact</span>
                                        <span className="text-sm font-bold text-gray-700">{outlet.phone}</span>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <MapPin size={14} className="mt-1 text-[#1e4d2b] flex-shrink-0" />
                                    <div className="flex flex-col">
                                        <span className="text-[9px] uppercase font-black text-gray-400">Shop Address</span>
                                        <span className="text-sm font-bold text-gray-700 leading-snug">{outlet.address}</span>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Clock size={14} className="mt-1 text-[#1e4d2b] flex-shrink-0" />
                                    <div className="flex flex-col">
                                        <span className="text-[9px] uppercase font-black text-gray-400">Registered On</span>
                                        <span className="text-sm font-bold text-gray-700">{new Date(outlet.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="mt-8 flex items-center justify-between border-t-2 border-[#f4f1ea] pt-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 bg-[#1e4d2b] text-white flex items-center justify-center font-black text-[10px]">
                                        {outlet.user?.name?.charAt(0) || 'M'}
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-tighter truncate w-20">
                                        {outlet.user?.name || 'Owner'}
                                    </span>
                                </div>

                                <div className="flex gap-1">
                                    {/* Outlet Login Button */}
                                    <button
                                        onClick={() => router.post(route('outlets.login', { outlet: outlet.id }))}
                                        className="w-9 h-9 flex items-center justify-center border-2 border-gray-100 hover:border-green-600 hover:text-green-600 transition-all active:scale-90"
                                        title="Login to this outlet"
                                    >
                                        <LogIn size={14} strokeWidth={3} />
                                    </button>

                                    <button
                                        onClick={() => handleOutletEdit(outlet.id)}
                                        className="w-9 h-9 flex items-center justify-center border-2 border-gray-100 hover:border-blue-600 hover:text-blue-600 transition-all active:scale-90"
                                    >
                                        <Edit size={14} strokeWidth={3} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(outlet.id)}
                                        className="w-9 h-9 flex items-center justify-center border-2 border-gray-100 hover:border-red-600 hover:text-red-600 transition-all active:scale-90"
                                    >
                                        <Trash2 size={14} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full py-32 text-center bg-white border-4 border-dashed border-[#dcd4c3]">
                        <Store size={64} className="mx-auto text-gray-200 mb-4" strokeWidth={1} />
                        <p className="text-xl font-black uppercase text-gray-300 tracking-[0.3em]">No Shops Registered Yet</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            <dialog className={`modal ${model ? 'modal-open' : ''}`}>
                <div className="modal-box max-w-lg bg-[#fdfbf7] p-0 rounded-none border-t-[12px] border-[#1e4d2b] shadow-2xl">
                    <div className="p-8">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Registration Form</h3>
                                <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">Entry to Dokan Ledger</p>
                            </div>
                            <button onClick={modelClose} className="p-2 hover:bg-gray-100"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleOutletCreateForm} className="space-y-6">
                            <div className="form-control">
                                <label className="text-[10px] font-black uppercase text-gray-500 mb-1">Dokan Name (Signboard Title)</label>
                                <input
                                    type="text"
                                    value={outletForm.data.name}
                                    onChange={(e) => outletForm.setData("name", e.target.value)}
                                    className="w-full border-b-2 border-[#dcd4c3] bg-transparent py-2 focus:border-[#1e4d2b] outline-none font-bold text-xl placeholder:text-gray-200"
                                    placeholder="e.g. Dhaka General Store" required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="form-control">
                                    <label className="text-[10px] font-black uppercase text-gray-500 mb-1">Mobile No.</label>
                                    <input
                                        type="tel"
                                        value={outletForm.data.phone}
                                        onChange={(e) => outletForm.setData("phone", e.target.value)}
                                        className="w-full border-b-2 border-[#dcd4c3] bg-transparent py-2 focus:border-[#1e4d2b] outline-none font-bold"
                                        placeholder="017..." required
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="text-[10px] font-black uppercase text-gray-500 mb-1">Official Email</label>
                                    <input
                                        type="email"
                                        value={outletForm.data.email}
                                        onChange={(e) => outletForm.setData("email", e.target.value)}
                                        className="w-full border-b-2 border-[#dcd4c3] bg-transparent py-2 focus:border-[#1e4d2b] outline-none font-bold"
                                        placeholder="shop@mail.com" required
                                    />
                                </div>
                            </div>

                            <div className="form-control">
                                <label className="text-[10px] font-black uppercase text-gray-500 mb-1">Physical Location</label>
                                <textarea
                                    value={outletForm.data.address}
                                    onChange={(e) => outletForm.setData("address", e.target.value)}
                                    className="w-full border-2 border-[#dcd4c3] bg-white p-4 focus:border-[#1e4d2b] outline-none font-bold h-24 shadow-inner"
                                    placeholder="Building, Road, Area..." required
                                />
                            </div>

                            <div className="flex items-center gap-4 py-5 border-y-2 border-dashed border-[#dcd4c3]">
                                <input
                                    type="checkbox"
                                    checked={outletForm.data.is_active}
                                    onChange={(e) => outletForm.setData("is_active", e.target.checked)}
                                    className="w-6 h-6 accent-[#1e4d2b] cursor-pointer"
                                />
                                <div className="flex flex-col">
                                    <span className="font-black uppercase text-xs italic leading-none">Verified & Open</span>
                                    <span className="text-[9px] font-bold text-gray-400 mt-1 uppercase">Ticking this will make shop visible in reports</span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-6 pt-6">
                                <button type="button" onClick={modelClose} className="font-black uppercase text-[10px] tracking-widest text-gray-400 hover:text-black transition-colors">Discard Entry</button>
                                <button
                                    type="submit"
                                    disabled={outletForm.processing}
                                    className="bg-[#1e4d2b] text-white px-10 py-4 font-black uppercase text-[10px] tracking-widest shadow-[6px_6px_0px_#000] active:shadow-none active:translate-y-1 transition-all"
                                >
                                    {outletForm.data.id ? 'Update Record' : 'Save To Ledger'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </dialog>
        </div>
    );
}