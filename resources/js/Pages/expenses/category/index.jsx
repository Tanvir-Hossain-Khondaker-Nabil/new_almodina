import { Link, router, useForm, usePage } from "@inertiajs/react";
import PageHeader from "../../../components/PageHeader";
import Pagination from "../../../components/Pagination";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "../../../hooks/useTranslation";

// Safe icon component with fallback
const SafeIcon = ({ icon: Icon, fallback, size = 20, className = "", ...props }) => {
  if (!Icon || typeof Icon === 'undefined') {
    const FallbackComponent = fallback || (() => <span>□</span>);
    return <FallbackComponent size={size} className={className} {...props} />;
  }
  return <Icon size={size} className={className} {...props} />;
};

// Simple fallback icons
const FallbackPlus = ({ size, className }) => <span className={className}>+</span>;
const FallbackX = ({ size, className }) => <span className={className}>×</span>;
const FallbackTrash = ({ size, className }) => <span className={className}>🗑</span>;
const FallbackFrown = ({ size, className }) => <span className={className}>☹</span>;
const FallbackSearch = ({ size, className }) => <span className={className}>🔍</span>;
const FallbackEdit = ({ size, className }) => <span className={className}>✏️</span>;
const FallbackSave = ({ size, className }) => <span className={className}>💾</span>;
const FallbackFilter = ({ size, className }) => <span className={className}>⚙️</span>;
const FallbackEye = ({ size, className }) => <span className={className}>👁</span>;

export default function Index({
  todaysCategoriesCount,
  query: initialQuery,
}) {
  const { t, locale } = useTranslation();
  
  // State for icons
  const [icons, setIcons] = useState({});
  const [iconsLoaded, setIconsLoaded] = useState(false);

  const categories = usePage().props.categories.data;

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    name: "",
    description: ""
  });

  // Dynamically load icons
  useEffect(() => {
    const loadIcons = async () => {
      try {
        const lucideIcons = await import("lucide-react");
        setIcons(lucideIcons);
        setIconsLoaded(true);
      } catch (error) {
        console.error("Failed to load icons:", error);
        setIconsLoaded(true); 
      }
    };

    loadIcons();
  }, []);

  // Modal state
  const [model, setModel] = useState(false);

  // Search states
  const [search, setSearch] = useState(initialQuery?.search || "");
  const [startdate, setStartDate] = useState(initialQuery?.startdate || "");
  const [initialized, setInitialized] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  // Search effect
  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      return;
    }
    
    const searchParams = {};
    if (search) searchParams.search = search;
    if (startdate) searchParams.startdate = startdate;
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      if (Object.keys(searchParams).length > 0) {
        router.get(route("expenses.category"), searchParams, {
          preserveState: true,
          replace: true,
        });
      } else {
        // Clear all filters
        router.visit(route("expenses.category"));
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search, startdate]);

  // Category form for create
  const { setData: setCreateData, data: createData, errors: createErrors, processing: createProcessing, reset: resetCreate, post: createPost } = useForm({
    name: "",
    description: "",
  });

  const formSubmit = (e) => {
    e.preventDefault();
    createPost(route("expenses.category.store"), {
      onSuccess: () => {
        resetCreate();
        modelClose();
        toast.success(t('expenses.category_add_success', "Expense category added successfully!"));
      },
      onError: (errors) => {
        if (errors.name) {
          toast.error(errors.name);
        } else {
          toast.error(t('expenses.category_add_error', "Failed to add expense category!"));
        }
      },
    });
  };

  // Edit form handling
  const startEdit = (category) => {
    setEditingId(category.id);
    setEditData({
      name: category.name,
      description: category.description || ""
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({ name: "", description: "" });
  };

  const handleEditChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const submitEdit = (id) => {
    if (!editData.name.trim()) {
      toast.error(t('expenses.category_name_required', 'Category name is required'));
      return;
    }

    router.put(route("expenses.category.update", id), editData, {
      onSuccess: () => {
        toast.success(t('expenses.category_update_success', "Expense category updated successfully!"));
        setEditingId(null);
        setEditData({ name: "", description: "" });
      },
      onError: (errors) => {
        if (errors.name) {
          toast.error(errors.name);
        } else {
          toast.error(t('expenses.category_update_error', "Failed to update expense category!"));
        }
      },
    });
  };

  // Delete category
  const handleDelete = (category) => {
    if (category.expenses_count > 0) {
      toast.error(
        t('expenses.cannot_delete_with_expenses', 
          'Cannot delete category with existing expenses')
      );
      return;
    }

    if (!confirm(
      t('expenses.confirm_delete_category', 
        "Are you sure you want to delete this expense category?")
    )) {
      return;
    }

    router.delete(route("expenses.category.destroy", category.id), {
      onSuccess: () => {
        toast.success(t('expenses.category_delete_success', "Expense category deleted successfully!"));
      },
      onError: () => {
        toast.error(t('expenses.category_delete_error', "Failed to delete expense category!"));
      },
    });
  };

  // Close add modal
  const modelClose = () => {
    resetCreate();
    setModel(false);
  };

  // Clear all filters
  const clearFilters = () => {
    setStartDate("");
    setSearch("");
    setShowFilter(false);
    router.visit(route("expenses.category"));
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className={`bg-[#f8f9fa] min-h-screen p-6 ${locale === 'bn' ? 'bangla-font' : ''}`}>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">
            {t('expenses.categories_title', 'EXPENSE CATEGORIES')}
          </h1>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
            {t('expenses.manage_categories_subtitle', 'Manage all expense categories')}
          </p>
        </div>
        <button 
          onClick={() => setModel(true)}
          className="btn bg-[#1e4d2b] text-white hover:bg-red-600 text-white border-none rounded-xl px-8 font-black uppercase text-xs tracking-widest shadow-xl"
        >
          <SafeIcon 
            icon={icons.Plus} 
            fallback={FallbackPlus}
            size={16}
          /> {t('expenses.add_new_category', 'Add Category')}
        </button>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl border-4 border-gray-900 shadow-2xl overflow-hidden mb-10">
        {/* Card Header */}
        <div className="bg-[#1e4d2b] text-white p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2">
            <SafeIcon 
              icon={icons.Tag} 
              fallback={() => <span>🏷</span>}
              size={18} 
              className="text-red-500"
            />
            <h2 className="text-white text-xs font-black uppercase tracking-[0.2em]">
              {t('expenses.category_list', 'Category List')}
            </h2>
            <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-lg">
              {categories.length}
            </span>
          </div>

          {/* Filter Section */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="btn btn-outline border-gray-300 text-white hover:text-gray-900 rounded-lg font-black text-[10px] uppercase tracking-tighter flex items-center gap-2"
            >
              <SafeIcon 
                icon={icons.Filter} 
                fallback={FallbackFilter}
                size={14}
              />
              {showFilter ? t('expenses.hide_filter', 'Hide Filter') : t('expenses.filter', 'Filter')}
            </button>
          </div>
        </div>

        {/* Filter Options */}
        {showFilter && (
          <div className="bg-gray-50 p-6 border-b border-gray-200 animate-in fade-in">
            <h4 className="text-[10px] font-black uppercase text-gray-600 tracking-widest mb-4 flex items-center gap-2">
              <SafeIcon 
                icon={icons.Search} 
                fallback={FallbackSearch}
                size={14}
              /> {t('expenses.filter_options', 'FILTER OPTIONS')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-control">
                <label className="label text-[10px] font-black uppercase text-gray-400 tracking-widest">
                  {t('expenses.created_date', 'Created Date')}
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={startdate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input input-bordered border-gray-300 rounded-xl w-full pl-10"
                  />
                  <SafeIcon 
                    icon={icons.Calendar} 
                    fallback={() => <span>📅</span>}
                    size={16}
                    className="absolute left-3 top-3 text-gray-400"
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label text-[10px] font-black uppercase text-gray-400 tracking-widest">
                  {t('expenses.search_categories', 'Search Categories')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input input-bordered border-gray-300 rounded-xl w-full pl-10"
                    placeholder={t('expenses.search_categories_placeholder', 'Search by name...')}
                  />
                  <SafeIcon 
                    icon={icons.Search} 
                    fallback={FallbackSearch}
                    size={16}
                    className="absolute left-3 top-3 text-gray-400"
                  />
                </div>
              </div>

              <div className="form-control flex justify-end items-end">
                {(startdate || search) && (
                  <button
                    onClick={clearFilters}
                    className="btn bg-red-600 hover:bg-red-700 text-white border-none rounded-xl font-black uppercase text-[10px] px-6"
                  >
                    <SafeIcon 
                      icon={icons.X} 
                      fallback={FallbackX}
                      size={14}
                    /> {t('expenses.clear', 'Clear')}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Table Section */}
        <div className="p-6">
          {categories.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-gray-200">
              <table className="table w-full">
                <thead className="bg-[#1e4d2b] text-white text-white">
                  <tr>
                    <th className="font-black uppercase text-xs tracking-widest px-6 py-4">#</th>
                    <th className="font-black uppercase text-xs tracking-widest px-6 py-4">
                      {t('expenses.name', 'Name')}
                    </th>
                    <th className="font-black uppercase text-xs tracking-widest px-6 py-4">
                      {t('expenses.slug', 'Slug')}
                    </th>
                    <th className="font-black uppercase text-xs tracking-widest px-6 py-4">
                      {t('expenses.description', 'Description')}
                    </th>
                    <th className="font-black uppercase text-xs tracking-widest px-6 py-4">
                      {t('expenses.total_expenses', 'Total Expenses')}
                    </th>
                    <th className="font-black uppercase text-xs tracking-widest px-6 py-4">
                      {t('expenses.created_at', 'Created At')}
                    </th>
                    <th className="font-black uppercase text-xs tracking-widest px-6 py-4">
                      {t('expenses.actions', 'Actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category, index) => (
                    <tr key={category.id} className="hover:bg-gray-50 border-b border-gray-100">
                      <td className="px-6 py-4 font-bold text-gray-900">{index + 1}</td>
                      <td className="px-6 py-4">
                        {editingId == category.id ? (
                          <input
                            type="text"
                            value={editData.name}
                            onChange={(e) => handleEditChange('name', e.target.value)}
                            className="input input-sm input-bordered border-gray-300 rounded-xl w-full"
                            placeholder={t('expenses.category_name', 'Name')}
                            autoFocus
                          />
                        ) : (
                          <div>
                            <p className="font-bold text-gray-900">{category.name}</p>
                            {category.expenses_count > 0 && (
                              <p className="text-xs text-gray-500 mt-1">
                                {category.expenses_count} {t('expenses.expenses', 'expenses')}
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded-lg font-mono">
                          {category.slug}
                        </code>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        {editingId === category.id ? (
                          <textarea
                            value={editData.description}
                            onChange={(e) => handleEditChange('description', e.target.value)}
                            className="textarea textarea-sm textarea-bordered border-gray-300 rounded-xl w-full h-20"
                            placeholder={t('expenses.description', 'Description')}
                            rows="2"
                          />
                        ) : (
                          <div className="truncate max-w-xs" title={category.description}>
                            {category.description || '-'}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="badge bg-red-600 text-white border-none text-xs font-black uppercase py-2 px-4">
                          {category.expenses_count || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="badge bg-[#1e4d2b] text-white rounded text-white  text-xs  uppercase px-2 py-5">
                          {formatDate(category.created_at)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {editingId === category.id ? (
                            <>
                              <button
                                onClick={() => submitEdit(category.id)}
                                className="btn bg-green-600 hover:bg-green-700 text-white border-none btn-sm rounded-lg font-bold uppercase text-[10px]"
                                disabled={!editData.name.trim()}
                              >
                                <SafeIcon 
                                  icon={icons.Check} 
                                  fallback={FallbackSave}
                                  size={12}
                                /> {t('expenses.save', 'Save')}
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="btn btn-outline btn-error btn-sm rounded-lg font-bold uppercase text-[10px]"
                              >
                                <SafeIcon 
                                  icon={icons.X} 
                                  fallback={FallbackX}
                                  size={12}
                                /> {t('expenses.cancel', 'Cancel')}
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(category)}
                                className="btn btn-outline btn-info btn-sm rounded-lg font-bold uppercase text-[10px]"
                              >
                                <SafeIcon 
                                  icon={icons.Edit} 
                                  fallback={FallbackEdit}
                                  size={12}
                                /> {t('expenses.edit', 'Edit')}
                              </button>
                              <button
                                onClick={() => handleDelete(category)}
                                className="btn btn-outline btn-error btn-sm rounded-lg font-bold uppercase text-[10px]"
                                disabled={category.expenses_count > 0}
                                title={category.expenses_count > 0 ? t('expenses.cannot_delete_with_expenses', 'Cannot delete with expenses') : ''}
                              >
                                <SafeIcon 
                                  icon={icons.Trash2} 
                                  fallback={FallbackTrash}
                                  size={12}
                                /> {t('expenses.delete', 'Delete')}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border-4 border-dashed border-gray-300 rounded-2xl px-8 py-16 flex flex-col justify-center items-center gap-4 text-center">
              <SafeIcon 
                icon={icons.Frown} 
                fallback={FallbackFrown}
                size={48}
                className="text-gray-400"
              />
              <h1 className="text-xl font-black text-gray-500">
                {t('expenses.no_categories_found', 'No Categories Found')}
              </h1>
              <p className="text-sm font-medium text-gray-400 max-w-md">
                {t('expenses.no_categories_message', 'No expense categories found. Start by adding your first category to organize expenses.')}
              </p>
              <button
                onClick={() => setModel(true)}
                className="btn bg-[#1e4d2b] text-white hover:bg-red-600 text-white border-none rounded-xl px-8 font-black uppercase text-xs tracking-widest shadow-xl mt-4"
              >
                <SafeIcon 
                  icon={icons.Plus} 
                  fallback={FallbackPlus}
                  size={16}
                /> {t('expenses.add_first_category', 'Add First Category')}
              </button>
            </div>
          )}

          {/* Pagination */}
          {categories.length > 0 && (
            <div className="mt-8">
              <Pagination data={usePage().props.categories} />
            </div>
          )}

          {/* Bottom Summary */}
          <div className="mt-10 pt-8 border-t border-gray-300">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Total Categories */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-600 rounded-xl">
                    <SafeIcon 
                      icon={icons.Tags} 
                      fallback={() => <span>🏷</span>}
                      size={20}
                      className="text-white"
                    />
                  </div>
                  <div>
                    <h5 className="font-black uppercase text-sm tracking-tight text-gray-900">
                      {t('expenses.total_categories', 'TOTAL CATEGORIES')}
                    </h5>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      {t('expenses.all_categories', 'All expense categories')}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-600">{t('expenses.total', 'Total')}:</span>
                    <span className="font-bold text-3xl text-blue-600">
                      {todaysCategoriesCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Categories */}
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-green-600 rounded-xl">
                    <SafeIcon 
                      icon={icons.CheckCircle} 
                      fallback={() => <span>✓</span>}
                      size={20}
                      className="text-white"
                    />
                  </div>
                  <div>
                    <h5 className="font-black uppercase text-sm tracking-tight text-gray-900">
                      {t('expenses.active_categories', 'ACTIVE CATEGORIES')}
                    </h5>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      {t('expenses.with_expenses', 'With expenses')}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-600">{t('expenses.active', 'Active')}:</span>
                    <span className="font-bold text-3xl text-green-600">
                      {categories.filter(c => c.expenses_count > 0).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Inactive Categories */}
              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-2xl p-6 border border-yellow-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-yellow-600 rounded-xl">
                    <SafeIcon 
                      icon={icons.Clock} 
                      fallback={() => <span>⏰</span>}
                      size={20}
                      className="text-white"
                    />
                  </div>
                  <div>
                    <h5 className="font-black uppercase text-sm tracking-tight text-gray-900">
                      {t('expenses.inactive_categories', 'INACTIVE CATEGORIES')}
                    </h5>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      {t('expenses.no_expenses', 'No expenses')}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-600">{t('expenses.inactive', 'Inactive')}:</span>
                    <span className="font-bold text-3xl text-yellow-600">
                      {categories.filter(c => c.expenses_count == 0).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* This Month */}
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-purple-600 rounded-xl">
                    <SafeIcon 
                      icon={icons.TrendingUp} 
                      fallback={() => <span>📈</span>}
                      size={20}
                      className="text-white"
                    />
                  </div>
                  <div>
                    <h5 className="font-black uppercase text-sm tracking-tight text-gray-900">
                      {t('expenses.this_month', 'THIS MONTH')}
                    </h5>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      {t('expenses.new_categories', 'New categories')}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-600">{t('expenses.new', 'New')}:</span>
                    <span className="font-bold text-3xl text-purple-600">
                      {categories.filter(c => {
                        const createdDate = new Date(c.created_at);
                        const now = new Date();
                        return createdDate.getMonth() === now.getMonth() && 
                               createdDate.getFullYear() === now.getFullYear();
                      }).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Category Modal */}
      <dialog className="modal" open={model}>
        <div className="modal-box max-w-2xl rounded-2xl border-4 border-gray-900 p-0 overflow-auto shadow-2xl">
          <div className="bg-[#1e4d2b] text-white p-6 flex justify-between items-center">
            <h2 className="text-white text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
              <SafeIcon 
                icon={icons.Plus} 
                fallback={FallbackPlus}
                size={18}
                className="text-red-500"
              />
              {t('expenses.add_new_category_modal', 'ADD NEW CATEGORY')}
            </h2>
            <button
              onClick={modelClose}
              className="btn btn-circle btn-xs btn-ghost text-white hover:bg-red-600"
            >
              <SafeIcon 
                icon={icons.X} 
                fallback={FallbackX}
                size={16}
              />
            </button>
          </div>

          <form onSubmit={formSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              <div className="form-control">
                <label className="label text-[10px] font-black uppercase text-gray-400 tracking-widest">
                  {t('expenses.category_name', 'Name')} *
                </label>
                <input
                  type="text"
                  value={createData.name}
                  onChange={(e) => setCreateData("name", e.target.value)}
                  className={`input input-bordered border-gray-300 rounded-xl w-full ${createErrors.name ? 'border-red-600' : ''}`}
                  placeholder={t('expenses.category_name_placeholder', 'e.g., Office Supplies, Travel Expenses')}
                  required
                />
                {createErrors.name && (
                  <p className="text-xs text-red-600 font-bold mt-2">{createErrors.name}</p>
                )}
                <div className="mt-1 text-xs text-gray-500">
                  {t('expenses.slug_auto_generate', 'Slug will be auto-generated from the name')}
                </div>
              </div>

              <div className="form-control">
                <label className="label text-[10px] font-black uppercase text-gray-400 tracking-widest">
                  {t('expenses.description', 'Description')}
                </label>
                <textarea
                  className={`textarea textarea-bordered border-gray-300 rounded-xl h-32 ${createErrors.description ? 'border-red-600' : ''}`}
                  placeholder={t('expenses.category_description_placeholder', 'Brief description of this category (optional)')}
                  value={createData.description}
                  onChange={(e) => setCreateData("description", e.target.value)}
                  rows="4"
                />
                {createErrors.description && (
                  <p className="text-xs text-red-600 font-bold mt-2">{createErrors.description}</p>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={modelClose}
                className="btn btn-outline border-gray-300 rounded-xl font-black uppercase text-[10px] tracking-widest"
                disabled={createProcessing}
              >
                {t('expenses.cancel', 'Cancel')}
              </button>
              <button
                disabled={createProcessing}
                className="btn bg-[#1e4d2b] text-white hover:bg-red-600 text-white border-none rounded-xl font-black uppercase text-[10px] tracking-widest px-8 shadow-xl"
                type="submit"
              >
                {createProcessing ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    {t('expenses.processing', 'Processing...')}
                  </>
                ) : (
                  <>
                    <SafeIcon 
                      icon={icons.Save} 
                      fallback={FallbackSave}
                      size={14}
                      className="mr-2"
                    />
                    {t('expenses.add_category', 'ADD CATEGORY')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
}