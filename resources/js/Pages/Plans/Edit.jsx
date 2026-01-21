import { useForm, router } from "@inertiajs/react";
import {
    ArrowLeft,
    Save,
    Tag,
    Calendar,
    FileText,
    CheckCircle,
    Plus,
    Trash2,
    Star,
    Grid,
    ChevronDown,
    LayoutGrid,
    List
} from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";
import { useState, useEffect } from "react";

export default function Edit({ plans, modules }) {
    const { t, locale } = useTranslation();
    
    // Get selected module IDs from the plan
    const selectedModuleIds = plans.modules ? plans.modules.map(module => module.id) : [];
    
    const { data, setData, put, processing, errors } = useForm({
        name: plans.name || "",
        price: plans.price || "",
        plan_type: plans.plan_type || "",
        validity: plans.validity || "",
        description: plans.description || "",
        product_range: plans.product_range || "",
        modules: selectedModuleIds,
        status: plans.status || "",
        total_sell: plans.total_sell || "0"
    });

    const [selectedModuleId, setSelectedModuleId] = useState("");
    const [allModules, setAllModules] = useState([]);
    const [activeTab, setActiveTab] = useState("dropdown"); // "dropdown" or "cards"

    // Update all modules with selected status
    useEffect(() => {
        const updatedModules = modules.map(module => ({
            ...module,
            isSelected: data.modules.includes(module.id)
        }));
        setAllModules(updatedModules);
    }, [data.modules, modules]);

    const handleSubmit = (e) => {
        e.preventDefault();

        put(route("plans.update", plans.id), {
            data: data,
            preserveScroll: true,
        });
    };

    // Handle module selection via card click (toggle)
    const handleCardModuleSelect = (moduleId) => {
        const updatedModules = data.modules.includes(moduleId)
            ? data.modules.filter(id => id !== moduleId)
            : [...data.modules, moduleId];

        setData("modules", updatedModules);
    };

    // Handle module selection via dropdown and add button
    const handleAddModule = () => {
        if (selectedModuleId && !data.modules.includes(selectedModuleId)) {
            const updatedModules = [...data.modules, selectedModuleId];
            setData("modules", updatedModules);
            setSelectedModuleId(""); // Reset dropdown after adding
        }
    };

    // Remove module from selected list
    const removeModule = (moduleId) => {
        const updatedModules = data.modules.filter(id => id !== moduleId);
        setData("modules", updatedModules);
    };

    return (
        <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{t('plan.edit_title', 'Edit Plan')}</h1>
                        <p className="text-gray-600 mt-2">{t('plan.edit_subtitle', 'Update the subscription plan information')}</p>
                    </div>
                    <a
                        href={route("plans.index")}
                        className="group flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-blue-300"
                    >
                        <ArrowLeft size={18} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
                        <span className="font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                            {t('plan.back', 'Back')}
                        </span>
                    </a>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information Card */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <Tag className="text-white" size={24} />
                                <h2 className="text-xl font-semibold text-white">
                                    {t('plan.basic_information', 'Basic Information')}
                                </h2>
                            </div>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <Tag size={16} className="text-blue-600" />
                                    {t('plan.plan_name', 'Plan Name')} *
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData("name", e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                                    placeholder={t('plan.enter_plan_name', 'Enter plan name')}
                                />
                                {errors.name && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                        ⚠️ {errors.name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('plan.plan_type', 'Plan Type')} *
                                </label>
                                <select
                                    value={data.plan_type}
                                    onChange={(e) => setData("plan_type", e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                                >
                                    <option value="">{t('plan.select_plan_type', 'Select Plan Type')}</option>
                                    <option value="1">{t('plan.free', 'Free')}</option>
                                    <option value="2">{t('plan.premium', 'Premium')}</option>
                                </select>
                                {errors.plan_type && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                        ⚠️ {errors.plan_type}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* PRICE */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        {t('plan.currency', '৳')}
                                        {t('plan.price', 'Price')} *
                                    </label>
                                    <input
                                        type="number"
                                        value={data.price}
                                        onChange={(e) => setData("price", e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 
                                            focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 
                                            bg-gray-50 hover:bg-white"
                                        placeholder={t('plan.enter_price', '0.00')}
                                        step="0.01"
                                        min="0"
                                    />
                                    {errors.price && (
                                        <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                            ⚠️ {errors.price}
                                        </p>
                                    )}
                                </div>

                                {/* PRODUCT RANGE */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('plan.product_range', 'Product Range')} *
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={data.product_range}
                                        onChange={(e) => setData("product_range", e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 
                                            focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 
                                            bg-gray-50 hover:bg-white"
                                        placeholder={t('plan.enter_product_range', 'Enter product range...')}
                                    />
                                    {errors.product_range && (
                                        <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                            ⚠️ {errors.product_range}
                                        </p>
                                    )}
                                </div>

                                {/* VALIDITY */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <Calendar size={16} className="text-purple-600" />
                                        {t('plan.validity', 'Validity')} ({t('plan.validity_days', 'Days')}) *
                                    </label>
                                    <input
                                        type="number"
                                        value={data.validity}
                                        onChange={(e) => setData("validity", e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 
                                            focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 
                                            bg-gray-50 hover:bg-white"
                                        placeholder={t('plan.enter_validity', '30')}
                                        min="1"
                                    />
                                    {errors.validity && (
                                        <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                            ⚠️ {errors.validity}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* DESCRIPTION */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <FileText size={16} className="text-gray-600" />
                                    {t('plan.description', 'Description')}
                                </label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData("description", e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white resize-none"
                                    rows={3}
                                    placeholder={t('plan.enter_description', 'Describe the plan features and benefits...')}
                                />
                                {errors.description && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                        ⚠️ {errors.description}
                                    </p>
                                )}
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
                                        {t('plan.select_modules', 'Select Modules')}
                                    </h2>
                                </div>
                                <div className="text-white font-medium">
                                    {t('plan.selected_count', 'Selected')}: {data.modules.length} {t('plan.of', 'of')} {modules.length}
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            {/* Selection Method Tabs */}
                            <div className="flex gap-2 mb-8">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("dropdown")}
                                    className={`
                                        flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 flex-1
                                        ${activeTab === "dropdown"
                                            ? 'bg-green-600 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }
                                    `}
                                >
                                    <List size={18} />
                                    {t('plan.dropdown_method', 'Dropdown Method')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("cards")}
                                    className={`
                                        flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 flex-1
                                        ${activeTab === "cards"
                                            ? 'bg-green-600 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }
                                    `}
                                >
                                    <LayoutGrid size={18} />
                                    {t('plan.card_method', 'Card Method')}
                                </button>
                            </div>

                            {/* Dropdown Method (Only shows when dropdown tab is active) */}
                            {activeTab === "dropdown" && (
                                <div className="mb-8">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                        <ChevronDown size={18} className="text-green-600" />
                                        {t('plan.add_with_dropdown', 'Add Modules via Dropdown')}
                                    </h3>
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <div className="flex-1 relative">
                                            <select
                                                value={selectedModuleId}
                                                onChange={(e) => setSelectedModuleId(e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white appearance-none"
                                            >
                                                <option value="">{t('plan.select_module', 'Select a module to add...')}</option>
                                                {allModules.map((module) => (
                                                    <option
                                                        key={module.id}
                                                        value={module.id}
                                                        style={module.isSelected ? {
                                                            backgroundColor: '#f0fdf4',
                                                            color: '#166534',
                                                            fontWeight: '600'
                                                        } : {}}
                                                    >
                                                        {module.name} {module.isSelected ? "✓" : ""}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                                <ChevronDown size={20} />
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAddModule}
                                            disabled={!selectedModuleId || data.modules.includes(selectedModuleId)}
                                            className={`
                                                flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200
                                                ${selectedModuleId && !data.modules.includes(selectedModuleId)
                                                    ? 'bg-green-600 hover:bg-green-700 text-white hover:scale-105'
                                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                }
                                            `}
                                        >
                                            <Plus size={18} />
                                            {t('plan.add_module', 'Add Module')}
                                        </button>
                                    </div>
                                    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle size={16} className="text-green-600" />
                                            <span className="text-sm font-medium text-green-800">
                                                {t('plan.selected_modules_in_dropdown', 'Modules with ✓ are already selected')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-green-700">
                                            {t('plan.dropdown_selected_instruction', 'You can only add modules that are not already selected (no ✓ symbol). To remove a selected module, use the "Selected Modules" section below.')}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Card Method (Only shows when cards tab is active) */}
                            {activeTab === "cards" && (
                                <div className="mb-8">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                        <LayoutGrid size={18} className="text-green-600" />
                                        {t('plan.select_from_cards', 'Select Modules from Cards')}
                                    </h3>

                                    {allModules.length === 0 ? (
                                        <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                                            <Grid size={48} className="text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-500">{t('plan.no_modules_available', 'No modules available')}</p>
                                            <p className="text-sm text-gray-400 mt-1">
                                                {t('plan.contact_admin', 'Contact administrator to add modules')}
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {allModules.map((module) => (
                                                    <div
                                                        key={module.id}
                                                        className={`
                                                            p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer
                                                            ${module.isSelected
                                                                ? 'bg-green-50 border-green-500 shadow-sm'
                                                                : 'bg-gray-50 border-gray-200 hover:border-green-300 hover:bg-green-50'
                                                            }
                                                        `}
                                                        onClick={() => handleCardModuleSelect(module.id)}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`
                                                                w-10 h-10 rounded-lg flex items-center justify-center
                                                                ${module.isSelected
                                                                    ? 'bg-green-500 text-white'
                                                                    : 'bg-gray-200 text-gray-700'
                                                                }
                                                            `}>
                                                                <Grid size={20} />
                                                            </div>
                                                            <div className="flex-1">
                                                                <h3 className="font-semibold text-gray-800">
                                                                    {module.name} {module.isSelected && "✓"}
                                                                </h3>
                                                                {module.description && (
                                                                    <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                                                                )}
                                                            </div>
                                                            <div className={`
                                                                w-5 h-5 rounded-full border-2 flex items-center justify-center
                                                                ${module.isSelected
                                                                    ? 'bg-green-500 border-green-500'
                                                                    : 'border-gray-300'
                                                                }
                                                            `}>
                                                                {module.isSelected ? (
                                                                    <CheckCircle size={14} className="text-white" />
                                                                ) : (
                                                                    <Plus size={12} className="text-gray-500" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                                <p className="text-sm text-blue-700">
                                                    {t('plan.card_selected_instruction', 'Green cards with checkmarks (✓) are already selected. Click on them to deselect.')}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Selected Modules Display (Always visible) */}
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <CheckCircle size={18} className="text-green-600" />
                                    {t('plan.selected_modules', 'Selected Modules')} ({data.modules.length})
                                </h3>

                                {data.modules.length === 0 ? (
                                    <div className="text-center py-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                                        <Grid size={32} className="text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-500">{t('plan.no_modules_selected', 'No modules selected yet')}</p>
                                        <p className="text-sm text-gray-400 mt-1">
                                            {activeTab === "dropdown"
                                                ? t('plan.use_dropdown_to_add', 'Use the dropdown above to add modules')
                                                : t('plan.use_cards_to_add', 'Use the cards above to add modules')
                                            }
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {data.modules.map((moduleId) => {
                                            const module = modules.find(m => m.id === moduleId);
                                            return module ? (
                                                <div key={module.id} className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                                            <Grid size={20} className="text-green-600" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-gray-800">{module.name} ✓</h4>
                                                            {module.description && (
                                                                <p className="text-sm text-gray-600">{module.description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeModule(module.id)}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
                                                        title={t('plan.remove_module', 'Remove module')}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            ) : null;
                                        })}
                                    </div>
                                )}
                            </div>

                            {errors.modules && (
                                <p className="text-red-500 text-sm mt-4 flex items-center gap-1">
                                    ⚠️ {errors.modules}
                                </p>
                            )}

                            {/* Modules Guidelines */}
                            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                                    <CheckCircle size={18} />
                                    {t('plan.modules_guidelines', 'Modules Guidelines')}
                                </h4>
                                <ul className="text-sm text-green-700 space-y-1">
                                    <li>• {t('plan.guideline_tab', 'Switch between tabs to use different selection methods')}</li>
                                    <li>• {t('plan.guideline_dropdown_tab', 'Dropdown Tab: Only unselected modules can be added')}</li>
                                    <li>• {t('plan.guideline_cards_tab', 'Cards Tab: Click to toggle selection (green = selected)')}</li>
                                    <li>• {t('plan.guideline_remove', 'Remove selected modules using trash icon below')}</li>
                                    <li>• {t('plan.guideline_multiple', 'You can select multiple modules for each plan')}</li>
                                </ul>
                            </div>
                        </div>
                    </div>

             

                    {/* Submit Button */}
                    <div className="flex justify-end gap-4">
                        <a
                            href={route("plans.index")}
                            className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200"
                        >
                            {t('plan.cancel', 'Cancel')}
                        </a>
                        <button
                            disabled={processing}
                            className={`
                                group flex items-center gap-3 px-8 py-3 rounded-xl font-semibold text-white
                                transition-all duration-200 transform hover:scale-105 active:scale-95
                                ${processing 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                                }
                            `}
                        >
                            <Save size={20} className={processing ? 'animate-pulse' : 'group-hover:animate-bounce'} />
                            {processing ? t('plan.updating_plan', 'Updating Plan...') : t('plan.update_plan', 'Update Plan')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}