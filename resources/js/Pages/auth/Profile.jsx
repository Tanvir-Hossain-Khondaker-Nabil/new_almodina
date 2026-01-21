import React from 'react'
import PageHeader from '../../components/PageHeader'
import Image from '../../components/Image'
import { useForm, usePage } from '@inertiajs/react'
import { useTranslation } from "../../hooks/useTranslation";

export default function Profile() {
    const { auth } = usePage().props
    const { t, locale } = useTranslation()

    // handle form
    const { data, setData, errors, processing, post } = useForm({
        profile: '',
        name: auth.name || '',
        phone_no: auth.phone || '',
        address: auth.address || ''
    })

    const handleUpdate = (e) => {
        e.preventDefault()
        post(route('profile.update'), data)
    }

    return (
        <div className={`bg-white rounded-box p-5 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <PageHeader
                title={t('auth.profile_title', 'Update Your Profile')}
                subtitle={t('auth.profile_subtitle', 'Keep your details fresh and make your account truly yours.')}
            />

            {/* form */}
            <form onSubmit={handleUpdate} className='space-y-4'>
                <div>
                    <div className='flex items-center gap-4'>
                        <div className="avatar">
                            <div className="ring-primary ring-offset-base-100 w-15 rounded-full ring-2 ring-offset-2">
                                <Image path={auth.profile} />
                            </div>
                        </div>
                        <input 
                            onChange={(e) => setData('profile', e.target.files[0])} 
                            type="file" 
                            accept='image/*' 
                            className="file-input file-input-ghost" 
                        />
                    </div>
                    {errors.profile && <div className="text-red-600">{errors.profile}</div>}
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">
                            {t('auth.your_name', 'Your Name')}*
                        </legend>
                        <input 
                            value={data.name} 
                            onChange={(e) => setData('name', e.target.value)} 
                            type="text" 
                            className="input" 
                            placeholder={t('auth.type_here', 'Type here')} 
                        />
                        {errors.name && <div className="text-red-600">{errors.name}</div>}
                    </fieldset>
                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">
                            {t('auth.your_phone', 'Your Phone')}
                        </legend>
                        <input 
                            value={data.phone_no} 
                            onChange={(e) => setData('phone_no', e.target.value)} 
                            type="tel" 
                            className="input" 
                            placeholder={t('auth.type_here', 'Type here')} 
                        />
                        {errors.phone_no && <div className="text-red-600">{errors.phone_no}</div>}
                    </fieldset>
                </div>
                <fieldset className="fieldset">
                    <legend className="fieldset-legend">
                        {t('auth.address', 'Address')}
                    </legend>
                    <textarea 
                        value={data.address} 
                        onChange={(e) => setData('address', e.target.value)} 
                        className="textarea h-24" 
                        placeholder={t('auth.address', 'Address')}
                    ></textarea>
                    {errors.address && <div className="text-red-600">{errors.address}</div>}
                </fieldset>

                <button 
                    disabled={processing} 
                    type='submit' 
                    className='btn bg-[#1e4d2b] text-white'
                >
                    {processing ? 'Saving...' : t('auth.save_changes', 'Save Changes')}
                </button>
            </form>
        </div>
    )
}