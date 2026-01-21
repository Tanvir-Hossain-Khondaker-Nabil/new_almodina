import React from "react";
import PageHeader from "../../components/PageHeader";
import { useForm } from "@inertiajs/react";
import { useTranslation } from "../../hooks/useTranslation";

export default function Security() {
    const { t, locale } = useTranslation();

    // handle form
    const { data, setData, errors, processing, post, reset } = useForm({
        new_password: "",
        new_password_confirmation: "",
    });

    const handleUpdate = (e) => {
        e.preventDefault();
        post(route("security.post"), data);
        reset()
    };

    return (
        <div className={`bg-white rounded-box p-5 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <PageHeader
                title={t('auth.security_title', 'Update Your Security')}
                subtitle={t('auth.security_subtitle', 'Keep your details fresh and make your account truly yours.')}
            />

            {/* form */}
            <form onSubmit={handleUpdate}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">
                            {t('auth.new_password', 'New Password')}*
                        </legend>
                        <input
                            value={data.new_password}
                            onChange={(e) =>
                                setData("new_password", e.target.value)
                            }
                            type="password"
                            className="input"
                            placeholder={t('auth.type_here', 'Type here')}
                        />
                        {errors.new_password && (
                            <div className="text-red-600">
                                {errors.new_password}
                            </div>
                        )}
                    </fieldset>
                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">
                            {t('auth.confirm_password', 'Confirm Password')}
                        </legend>
                        <input
                            value={data.new_password_confirmation}
                            onChange={(e) =>
                                setData(
                                    "new_password_confirmation",
                                    e.target.value
                                )
                            }
                            type="password"
                            className="input"
                            placeholder={t('auth.type_here', 'Type here')}
                        />
                        {errors.new_password_confirmation && (
                            <div className="text-red-600">
                                {errors.new_password_confirmation}
                            </div>
                        )}
                    </fieldset>
                </div>
                <button
                    type="submit"
                    disabled={processing}
                    className="btn bg-[#1e4d2b] text-white mt-3"
                >
                    {processing ? 'Updating...' : t('auth.update_security', 'Update Security')}
                </button>
            </form>
        </div>
    );
}