import { Link } from "@inertiajs/react";
import {
    ArrowLeft,
    Tag,
    DollarSign,
    Calendar,
    FileText,
    CheckCircle,
    Star,
    Grid,
    Users,
    TrendingUp,
    Clock,
    Shield,
    Globe,
    CreditCard,
    Award,
    BadgeCheck,
    Zap,
    Target,
    BarChart,
    Download,
    Share2,
    Edit,
    Trash2
} from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";

export default function Show({ plans }) {
    const { t, locale } = useTranslation();

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat(locale === 'bn' ? 'bn-BD' : 'en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2
        }).format(amount);
    };

    // Get status badge
    const getStatusBadge = (status) => {
        const statusMap = {
            '1': { label: t('plan.active', 'Active'), class: 'bg-green-100 text-green-800 border-green-200' },
            '2': { label: t('plan.inactive', 'Inactive'), class: 'bg-red-100 text-red-800 border-red-200' },
        };
        return statusMap[status] || { label: status, class: 'bg-gray-100 text-gray-800 border-gray-200' };
    };

    // Get plan type badge
    const getPlanTypeBadge = (type) => {
        const typeMap = {
            '1': { label: t('plan.free', 'Free'), class: 'bg-blue-100 text-blue-800 border-blue-200' },
            '2': { label: t('plan.premium', 'Premium'), class: 'bg-purple-100 text-purple-800 border-purple-200' },
        };
        return typeMap[type] || { label: type, class: 'bg-gray-100 text-gray-800 border-gray-200' };
    };

    // Get plan type icon
    const getPlanTypeIcon = (type) => {
        const iconMap = {
            '1': <Award className="text-blue-600" size={20} />,
            '2': <Shield className="text-purple-600" size={20} />,
        };
        return iconMap[type] || <Star className="text-gray-600" size={20} />;
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            {getPlanTypeIcon(plans.plan_type)}
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPlanTypeBadge(plans.plan_type).class}`}>
                                {getPlanTypeBadge(plans.plan_type).label}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(plans.status).class}`}>
                                {getStatusBadge(plans.status).label}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">{plans.name}</h1>
                        <p className="text-gray-600 text-lg">{plans.description}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-4 md:mt-0">
                        <Link
                            href={route("plans.index")}
                            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-blue-300"
                        >
                            <ArrowLeft size={18} className="text-gray-600" />
                            <span className="font-medium text-gray-700">{t('plan.back_to_plans', 'Back to Plans')}</span>
                        </Link>
                        <Link
                            href={route("plans.edit", plans.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-all duration-200"
                        >
                            <Edit size={18} />
                            <span className="font-medium">{t('plan.edit', 'Edit')}</span>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Plan Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Plan Overview Card */}
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                                <h2 className="text-xl font-semibold text-white">
                                    {t('plan.plan_overview', 'Plan Overview')}
                                </h2>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                                <DollarSign className="text-blue-600" size={24} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">{t('plan.price', 'Price')}</p>
                                                <p className="text-2xl font-bold text-gray-800">{formatCurrency(plans.price)}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            {plans.plan_type === '1' 
                                                ? t('plan.free_plan', 'Free subscription plan')
                                                : t('plan.premium_plan', 'Premium subscription plan')
                                            }
                                        </p>
                                    </div>

                                    <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                                                <Calendar className="text-green-600" size={24} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">{t('plan.validity', 'Validity')}</p>
                                                <p className="text-2xl font-bold text-gray-800">{plans.validity}</p>
                                                <p className="text-sm text-gray-500">{t('plan.validity_days', 'days')}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            {t('plan.auto_renewal', 'Auto-renewal subscription')}
                                        </p>
                                    </div>

                                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                                                <Grid className="text-purple-600" size={24} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">{t('plan.product_range', 'Product Range')}</p>
                                                <p className="text-2xl font-bold text-gray-800">{plans.product_range || 0}</p>
                                                <p className="text-sm text-gray-500">{t('plan.max_products', 'maximum products')}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            {t('plan.product_limit', 'Product listing limit')}
                                        </p>
                                    </div>
                                </div>

                                {/* Sales Performance */}
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                        {t('plan.sales_performance', 'Sales Performance')}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                                                    <Star className="text-yellow-600" size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">{t('plan.total_sales', 'Total Sales')}</p>
                                                    <p className="text-xl font-bold text-gray-800">{plans.total_sell || 0}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                                    <TrendingUp className="text-indigo-600" size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">{t('plan.created_on', 'Created On')}</p>
                                                    <p className="text-sm font-medium text-gray-800">{formatDate(plans.created_at)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modules Card */}
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Grid className="text-white" size={24} />
                                        <h2 className="text-xl font-semibold text-white">
                                            {t('plan.included_modules', 'Included Modules')}
                                        </h2>
                                    </div>
                                    <div className="text-white font-medium">
                                        {plans.modules?.length || 0} {t('plan.modules', 'modules')}
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                {plans.modules && plans.modules.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {plans.modules.map((module) => (
                                            <div 
                                                key={module.id}
                                                className="p-4 rounded-xl border-2 border-green-200 bg-green-50 hover:bg-green-100 transition-all duration-200"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                                                        <Grid size={20} className="text-green-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-gray-800 mb-1">{module.name}</h3>
                                                        {module.description && (
                                                            <p className="text-sm text-gray-600">{module.description}</p>
                                                        )}
                                                    </div>
                                                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                                        <CheckCircle size={12} className="text-white" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Grid size={48} className="text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">{t('plan.no_modules_assigned', 'No modules assigned to this plan')}</p>
                                        <p className="text-sm text-gray-400 mt-1">
                                            {t('plan.edit_to_add_modules', 'Edit the plan to add modules')}
                                        </p>
                                    </div>
                                )}
                                
                                {plans.modules && plans.modules.length > 0 && (
                                    <div className="mt-6 pt-6 border-t border-gray-100">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <CheckCircle size={16} className="text-green-500" />
                                            <span>{t('plan.all_modules_included', 'All selected modules are included in this plan')}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Actions Card */}
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                                <h2 className="text-xl font-semibold text-white">
                                    {t('plan.quick_actions', 'Quick Actions')}
                                </h2>
                            </div>
                            <div className="p-6 space-y-3">
                                <Link
                                    href={route("plans.edit", plans.id)}
                                    className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-all duration-200 group"
                                >
                                    <Edit size={18} className="text-blue-600" />
                                    <span className="font-medium text-gray-800">{t('plan.edit_plan', 'Edit Plan')}</span>
                                </Link>
                                <button
                                    onClick={() => {
                                        if (confirm(t('plan.delete_confirmation', 'Are you sure you want to delete this plan?'))) {
                                            router.delete(route("plans.destroy", plans.id));
                                        }
                                    }}
                                    className="w-full flex items-center gap-3 p-3 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 transition-all duration-200 group"
                                >
                                    <Trash2 size={18} className="text-red-600" />
                                    <span className="font-medium text-gray-800">{t('plan.delete_plan', 'Delete Plan')}</span>
                                </button>
                            </div>
                        </div>

                        {/* Plan Features Card */}
                        {/* <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                            <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-6 py-4">
                                <h2 className="text-xl font-semibold text-white">
                                    {t('plan.key_features', 'Key Features')}
                                </h2>
                            </div>
                            <div className="p-6">
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <Zap size={18} className="text-orange-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-700">{t('plan.unlimited_bandwidth', 'Unlimited bandwidth')}</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Shield size={18} className="text-orange-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-700">{t('plan.ssl_certificate', 'Free SSL Certificate')}</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Globe size={18} className="text-orange-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-700">{t('plan.multilingual_support', 'Multilingual Support')}</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CreditCard size={18} className="text-orange-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-700">{t('plan.multiple_payment', 'Multiple Payment Options')}</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Target size={18} className="text-orange-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-700">{t('plan.seo_optimized', 'SEO Optimized')}</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <BarChart size={18} className="text-orange-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-700">{t('plan.analytics_dashboard', 'Analytics Dashboard')}</span>
                                    </li>
                                </ul>
                            </div>
                        </div> */}

                        {/* Plan Details Card */}
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                            <div className="bg-gradient-to-r from-gray-700 to-gray-900 px-6 py-4">
                                <h2 className="text-xl font-semibold text-white">
                                    {t('plan.plan_details', 'Plan Details')}
                                </h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <p className="text-sm text-gray-600">{t('plan.plan_id', 'Plan ID')}</p>
                                    <p className="font-medium text-gray-800">{plans.id}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">{t('plan.created_at', 'Created At')}</p>
                                    <p className="font-medium text-gray-800">{formatDate(plans.created_at)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">{t('plan.updated_at', 'Last Updated')}</p>
                                    <p className="font-medium text-gray-800">{formatDate(plans.updated_at)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">{t('plan.plan_type', 'Plan Type')}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {getPlanTypeIcon(plans.plan_type)}
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPlanTypeBadge(plans.plan_type).class}`}>
                                            {getPlanTypeBadge(plans.plan_type).label}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-gray-600">
                            {t('plan.plan_last_updated', 'Plan last updated')}: {formatDate(plans.updated_at)}
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href={route("plans.edit", plans.id)}
                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-all duration-200"
                            >
                                <Edit size={16} />
                                <span className="font-medium">{t('plan.edit_plan', 'Edit Plan')}</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}