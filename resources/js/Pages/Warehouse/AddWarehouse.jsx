import PageHeader from "../../components/PageHeader";
import { useForm, router } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";

export default function AddWarehouse({ warehouse }) {
    const { t, locale } = useTranslation();
    const isEdit = !!warehouse;

    const form = useForm({
        name: warehouse?.name || "",
        code: warehouse?.code || "",
        address: warehouse?.address || "",
        phone: warehouse?.phone || "",
        email: warehouse?.email || "",
        is_active: warehouse?.is_active ?? true,
    });

    const submit = (e) => {
        e.preventDefault();
        
        if (isEdit) {
            form.put(route("warehouse.update", warehouse.id), {
                onSuccess: () => {
                    router.visit(route("warehouse.list"));
                },
            });
        } else {
            form.post(route("warehouse.store"), {
                onSuccess: () => {
                    router.visit(route("warehouse.list"));
                },
            });
        }
    };

    return (
        <div className={`bg-white rounded-box p-5 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <PageHeader
                title={isEdit ? t('warehouse.edit_warehouse', 'Edit Warehouse') : t('warehouse.add_warehouse', 'Add New Warehouse')}
                subtitle={isEdit ? t('warehouse.update_warehouse_info', 'Update warehouse information') : t('warehouse.warehouse_information', 'Warehouse Information')}
            >
                <button
                    onClick={() => router.visit(route("warehouse.list"))}
                    className="btn btn-sm btn-ghost"
                >
                    <ArrowLeft size={15} /> {t('warehouse.back_to_list', 'Back to List')}
                </button>
            </PageHeader>

            <form onSubmit={submit} className="max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">
                                {t('warehouse.warehouse_name', 'Warehouse Name')} 
                                <span className="text-red-500 ml-1">
                                    {t('warehouse.required_field', '*')}
                                </span>
                            </span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered"
                            value={form.data.name}
                            onChange={(e) => form.setData("name", e.target.value)}
                            required
                        />
                        {form.errors.name && (
                            <div className="text-error text-sm mt-1">{form.errors.name}</div>
                        )}
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">
                                {t('warehouse.warehouse_code', 'Warehouse Code')} 
                                <span className="text-red-500 ml-1">
                                    {t('warehouse.required_field', '*')}
                                </span>
                            </span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered"
                            value={form.data.code}
                            onChange={(e) => form.setData("code", e.target.value)}
                            required
                        />
                        {form.errors.code && (
                            <div className="text-error text-sm mt-1">{form.errors.code}</div>
                        )}
                    </div>

                    <div className="form-control md:col-span-2">
                        <label className="label">
                            <span className="label-text">{t('warehouse.address', 'Address')}</span>
                        </label>
                        <textarea
                            className="textarea textarea-bordered"
                            rows="3"
                            value={form.data.address}
                            onChange={(e) => form.setData("address", e.target.value)}
                        />
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">{t('warehouse.phone', 'Phone')}</span>
                        </label>
                        <input
                            type="tel"
                            className="input input-bordered"
                            value={form.data.phone}
                            onChange={(e) => form.setData("phone", e.target.value)}
                        />
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">{t('warehouse.email', 'Email')}</span>
                        </label>
                        <input
                            type="email"
                            className="input input-bordered"
                            value={form.data.email}
                            onChange={(e) => form.setData("email", e.target.value)}
                        />
                    </div>

                    <div className="form-control">
                        <label className="cursor-pointer label justify-start gap-2">
                            <input
                                type="checkbox"
                                className="checkbox checkbox-primary"
                                checked={form.data.is_active}
                                onChange={(e) => form.setData("is_active", e.target.checked)}
                            />
                            <span className="label-text">{t('warehouse.active_warehouse', 'Active Warehouse')}</span>
                        </label>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        type="submit"
                        className="btn bg-[#1e4d2b] text-white"
                        disabled={form.processing}
                    >
                        {form.processing 
                            ? t('warehouse.saving', 'Saving...') 
                            : isEdit 
                                ? t('warehouse.update_warehouse', 'Update Warehouse')
                                : t('warehouse.create_warehouse', 'Create Warehouse')
                        }
                    </button>
                    <button
                        type="button"
                        onClick={() => router.visit(route("warehouse.list"))}
                        className="btn btn-ghost"
                    >
                        {t('warehouse.cancel', 'Cancel')}
                    </button>
                </div>
            </form>
        </div>
    );
}