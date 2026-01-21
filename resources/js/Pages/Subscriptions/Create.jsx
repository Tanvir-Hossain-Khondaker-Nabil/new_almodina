import { useForm, router } from "@inertiajs/react";
import { 
    ArrowLeft,
    Save, 
    User,
    Building,
    Calendar,
    CreditCard,
    CheckCircle,
    Clock,
    Star,
    FileText,
    Tag,
    Grid,
    DollarSign,
    Zap,
    Shield,
    Globe,
    Target,
    BarChart
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "../../hooks/useTranslation";

export default function Create({ plans, users }) {
    const { t, locale } = useTranslation();
    const { data, setData, post, processing, errors } = useForm({
        user_id: "",
        plan_id: "",
        start_date: new Date().toISOString().split('T')[0],
        end_date: "",
        amount: "",
        transaction_id: "",
        notes: "",
        payment_method: "",
        user_email: "",
    });

    const [selectedPlan, setSelectedPlan] = useState(null);

    // Handle plan selection to auto-fill amount and calculate end date
    const handlePlanSelect = (planId) => {
        const plan = plans.find(p => p.id == planId);
        if (plan) {
            setSelectedPlan(plan);
            setData("plan_id", planId);
            setData("amount", plan.price);
            
            // Calculate end date based on plan validity
            if (data.start_date && plan.validity) {
                const startDate = new Date(data.start_date);
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + parseInt(plan.validity));
                setData("end_date", endDate.toISOString().split('T')[0]);
            }
        } else {
            setSelectedPlan(null);
        }
    };

    // Handle start date change to recalculate end date
    const handleStartDateChange = (date) => {
        setData("start_date", date);
        if (selectedPlan && date) {
            const startDate = new Date(date);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + parseInt(selectedPlan.validity));
            setData("end_date", endDate.toISOString().split('T')[0]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("subscriptions.store"));
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2
        }).format(amount);
    };

    // Get plan type badge
    const getPlanTypeBadge = (type) => {
        const typeMap = {
            '1': { label: t('plan.free', 'Free'), class: 'bg-blue-100 text-blue-800 border-blue-200' },
            '2': { label: t('plan.premium', 'Premium'), class: 'bg-purple-100 text-purple-800 border-purple-200' },
        };
        return typeMap[type] || { label: type, class: 'bg-gray-100 text-gray-800 border-gray-200' };
    };

    return (
        <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">
                            {t('subscription.create_subscription', 'Create New Subscription')}
                        </h1>
                        <p className="text-gray-600 mt-2">
                            {t('subscription.assign_subscription_plan', 'Assign a subscription plan to a company user')}
                        </p>
                    </div>
                    <a
                        href={route("subscriptions.index")}
                        className="group flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-blue-300"
                    >
                        <ArrowLeft size={18} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
                        <span className="font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                            {t('subscription.back', 'Back')}
                        </span>
                    </a>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* User & Plan Selection Card */}
                            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <User className="text-white" size={24} />
                                        <h2 className="text-xl font-semibold text-white">
                                            {t('subscription.user_plan_selection', 'User & Plan Selection')}
                                        </h2>
                                    </div>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                            <Building size={16} className="text-blue-600" />
                                            {t('subscription.select_company', 'Select Company')}
                                            <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <select
                                            value={data.user_id}
                                            onChange={(e) => setData("user_id", e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                                        >
                                            <option value="">{t('subscription.select_company', 'Select Company')}</option>
                                            {users.map((user) => (
                                                <option key={user.id} value={user.id}>
                                                    {user.name} - {user.email}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.user_id && (
                                            <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                                {errors.user_id}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                            <Clock size={16} className="text-orange-600" />
                                            {t('subscription.user_email', 'User Email (manual)')}
                                        </label>
                                        <input
                                            type="email"
                                            value={data.user_email}
                                            onChange={(e) => setData("user_email", e.target.value)}
                                            placeholder={t('subscription.email_placeholder', 'Enter user email')}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 duration-200 bg-gray-50 hover:bg-white"
                                        />
                                        {errors.user_email && (
                                            <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                                {errors.user_email}
                                            </p>
                                        )}
                                    </div>

                                    {/* Plan Selection */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                            <Star size={16} className="text-green-600" />
                                            {t('subscription.select_plan', 'Select Plan')}
                                            <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <select
                                            value={data.plan_id}
                                            onChange={(e) => handlePlanSelect(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                                        >
                                            <option value="">{t('subscription.select_plan', 'Select Plan')}</option>
                                            {plans.map((plan) => (
                                                <option key={plan.id} value={plan.id}>
                                                    {plan.name} - {formatCurrency(plan.price)} - {plan.validity} {t('subscription.days', 'days')}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.plan_id && (
                                            <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                                {errors.plan_id}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Subscription Details Card */}
                            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                                <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="text-white" size={24} />
                                        <h2 className="text-xl font-semibold text-white">
                                            {t('subscription.subscription_details', 'Subscription Details')}
                                        </h2>
                                    </div>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                            <Calendar size={16} className="text-purple-600" />
                                            {t('subscription.start_date', 'Start Date')}
                                            <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={data.start_date}
                                            onChange={(e) => handleStartDateChange(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50"
                                        />
                                        {errors.start_date && (
                                            <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                                {errors.start_date}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                            <Clock size={16} className="text-orange-600" />
                                            {t('subscription.end_date', 'End Date')}
                                            <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={data.end_date}
                                            onChange={(e) => setData("end_date", e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50"
                                            readOnly
                                        />
                                        {errors.end_date && (
                                            <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                                {errors.end_date}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                            ৳
                                            {t('subscription.amount', 'Amount')}
                                            <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            value={data.amount}
                                            onChange={(e) => setData("amount", e.target.value)}
                                            className="w-full px-4 py-3 border bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0"
                                            readOnly
                                        />
                                        {errors.amount && (
                                            <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                                {errors.amount}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                            <Building size={16} className="text-blue-600" />
                                            {t('subscription.payment_method', 'Payment Method')}
                                        </label>
                                        <select
                                            value={data.payment_method}
                                            onChange={(e) => setData("payment_method", e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                                        >
                                            <option value="">{t('subscription.select_payment_method', 'Select payment method')}</option>
                                            <option value="cash">{t('subscription.cash', 'Cash')}</option>
                                            <option value="mobile_banking">{t('subscription.mobile', 'Mobile Banking')}</option>
                                            <option value="bank_transfer">{t('subscription.bank', 'Bank Transfer')}</option>
                                        </select>
                                        {errors.payment_method && (
                                            <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                                {errors.payment_method}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                            <CreditCard size={16} className="text-blue-600" />
                                            {t('subscription.transaction_id', 'Transaction ID')}
                                        </label>
                                        <input
                                            type="text"
                                            value={data.transaction_id}
                                            onChange={(e) => setData("transaction_id", e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                                            placeholder={t('subscription.transaction_placeholder', 'Enter transaction ID')}
                                        />
                                        {errors.transaction_id && (
                                            <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                                {errors.transaction_id}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Additional Information Card */}
                            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                                <div className="bg-gradient-to-r from-gray-600 to-slate-700 px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <FileText className="text-white" size={24} />
                                        <h2 className="text-xl font-semibold text-white">
                                            {t('subscription.additional_information', 'Additional Information')}
                                        </h2>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t('subscription.notes', 'Notes & Comments')}
                                        </label>
                                        <textarea
                                            value={data.notes}
                                            onChange={(e) => setData("notes", e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white resize-none"
                                            rows={4}
                                            placeholder={t('subscription.notes_placeholder', 'Any additional notes or comments about this subscription...')}
                                        />
                                        {errors.notes && (
                                            <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                                {errors.notes}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end">
                                <button
                                    disabled={processing}
                                    className={`
                                        group flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-white
                                        transition-all duration-200 transform hover:scale-105 active:scale-95
                                        ${processing 
                                            ? 'bg-gray-400 cursor-not-allowed' 
                                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                                        }
                                    `}
                                >
                                    <Save size={20} className={processing ? 'animate-pulse' : 'group-hover:animate-bounce'} />
                                    {processing 
                                        ? t('subscription.creating_subscription', 'Creating Subscription...')
                                        : t('subscription.create_subscription', 'Create Subscription')
                                    }
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Right Column - Plan Details */}
                    <div className="space-y-6">
                        {/* Selected Plan Details Card */}
                        {selectedPlan ? (
                            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                                <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Tag className="text-white" size={24} />
                                            <h2 className="text-xl font-semibold text-white">
                                                {t('subscription.selected_plan', 'Selected Plan')}
                                            </h2>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPlanTypeBadge(selectedPlan.plan_type).class}`}>
                                            {getPlanTypeBadge(selectedPlan.plan_type).label}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="mb-6">
                                        <h3 className="text-2xl font-bold text-gray-800 mb-2">{selectedPlan.name}</h3>
                                        <p className="text-gray-600">{selectedPlan.description}</p>
                                    </div>

                                    {/* Plan Stats */}
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                            <div className="flex items-center gap-2 mb-2">
                                               ৳
                                                <span className="text-sm font-medium text-gray-700">{t('subscription.price', 'Price')}</span>
                                            </div>
                                            <p className="text-xl font-bold text-blue-800">{selectedPlan.price}</p>
                                        </div>
                                        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Calendar className="text-green-600" size={20} />
                                                <span className="text-sm font-medium text-gray-700">{t('subscription.validity', 'Validity')}</span>
                                            </div>
                                            <p className="text-xl font-bold text-green-800">{selectedPlan.validity} {t('subscription.days', 'days')}</p>
                                        </div>
                                        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Grid className="text-purple-600" size={20} />
                                                <span className="text-sm font-medium text-gray-700">{t('subscription.product_range', 'Product Range')}</span>
                                            </div>
                                            <p className="text-xl font-bold text-purple-800">{selectedPlan.product_range || 0}</p>
                                        </div>
                                        <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Clock className="text-orange-600" size={20} />
                                                <span className="text-sm font-medium text-gray-700">{t('subscription.auto_renewal', 'Auto Renewal')}</span>
                                            </div>
                                            <p className="text-xl font-bold text-orange-800">{t('subscription.yes', 'Yes')}</p>
                                        </div>
                                    </div>

                                    {/* Included Modules */}
                                    <div className="mb-6">
                                        <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                            <Grid size={18} className="text-green-600" />
                                            {t('subscription.included_modules', 'Included Modules')}
                                        </h4>
                                        {selectedPlan.modules && selectedPlan.modules.length > 0 ? (
                                            <div className="space-y-2">
                                                {selectedPlan.modules.map((module) => (
                                                    <div key={module.id} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                                                        <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                                                        <span className="text-sm text-gray-700">{module.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 text-sm">{t('subscription.no_modules', 'No modules included')}</p>
                                        )}
                                    </div>

                                    {/* Plan Features */}
                                    {/* <div>
                                        <h4 className="text-lg font-semibold text-gray-800 mb-3">
                                            {t('subscription.plan_features', 'Plan Features')}
                                        </h4>
                                        <ul className="space-y-2">
                                            <li className="flex items-start gap-2">
                                                <Zap size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-sm text-gray-700">{t('subscription.unlimited_bandwidth', 'Unlimited bandwidth')}</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <Shield size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-sm text-gray-700">{t('subscription.ssl_certificate', 'Free SSL Certificate')}</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <Globe size={16} className="text-purple-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-sm text-gray-700">{t('subscription.multilingual_support', 'Multilingual Support')}</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <Target size={16} className="text-orange-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-sm text-gray-700">{t('subscription.seo_optimized', 'SEO Optimized')}</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <BarChart size={16} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-sm text-gray-700">{t('subscription.analytics_dashboard', 'Analytics Dashboard')}</span>
                                            </li>
                                        </ul>
                                    </div> */}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                                <div className="bg-gradient-to-r from-gray-600 to-gray-800 px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <Tag className="text-white" size={24} />
                                        <h2 className="text-xl font-semibold text-white">
                                            {t('subscription.plan_details', 'Plan Details')}
                                        </h2>
                                    </div>
                                </div>
                                <div className="p-6 text-center py-8">
                                    <Star size={48} className="text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 font-medium">
                                        {t('subscription.no_plan_selected', 'No Plan Selected')}
                                    </p>
                                    <p className="text-sm text-gray-400 mt-2">
                                        {t('subscription.select_plan_prompt', 'Select a plan from the dropdown to view details')}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Subscription Summary */}
                        {selectedPlan && (
                            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                                    <h2 className="text-xl font-semibold text-white">
                                        {t('subscription.subscription_summary', 'Subscription Summary')}
                                    </h2>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">{t('subscription.selected_plan', 'Selected Plan')}</span>
                                            <span className="font-medium text-gray-800">{selectedPlan.name}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">{t('subscription.plan_price', 'Plan Price')}</span>
                                            <span className="font-bold text-green-600">{formatCurrency(selectedPlan.price)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">{t('subscription.validity_period', 'Validity Period')}</span>
                                            <span className="font-medium text-gray-800">{selectedPlan.validity} {t('subscription.days', 'days')}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">{t('subscription.start_date', 'Start Date')}</span>
                                            <span className="font-medium text-gray-800">{data.start_date}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">{t('subscription.end_date', 'End Date')}</span>
                                            <span className="font-medium text-gray-800">{data.end_date}</span>
                                        </div>
                                        <div className="pt-3 border-t border-gray-200">
                                            <div className="flex justify-between items-center">
                                                <span className="text-lg font-bold text-gray-800">{t('subscription.total_amount', 'Total Amount')}</span>
                                                <span className="text-2xl font-bold text-blue-600">{formatCurrency(selectedPlan.price)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}