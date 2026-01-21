import { Link, router, useForm } from "@inertiajs/react";
import { 
    Plus, 
    Trash2, 
    X, 
    Frown,
    Search,
    Filter,
    Edit,
    Eye,
    User,
    Building,
    Calendar,
    DollarSign,
    Clock,
    BadgeCheck,
    Ban,
    Phone,
    Mail,
    MapPin,
    FileText,
    Star,
    CreditCard,
    Shield,
    Check
} from "lucide-react";
import { useEffect, useState } from "react";

export default function Index({ dellerships, filters }) {
    // Search state
    const [search, setSearch] = useState(filters.search || "");
    const [initialized, setInitialized] = useState(false);

    // Handle search changes
    useEffect(() => {
        if (!initialized) {
            setInitialized(true);
            return;
        }

        const timer = setTimeout(() => {
            router.get(route("dealerships.index"), {
                search: search || null,
            }, {
                preserveState: true,
                replace: true
            });
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    // Clear all filters
    const clearFilters = () => {
        setSearch("");
        router.get(route("dealerships.index"));
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-BD', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Get status badge color
    const getStatusBadge = (status) => {
        const statusMap = {
            active: { label: 'Active', class: 'badge-success', icon: BadgeCheck },
            pending: { label: 'Pending', class: 'badge-warning', icon: Clock },
            suspended: { label: 'Suspended', class: 'badge-error', icon: Ban },
            inactive: { label: 'Inactive', class: 'badge-neutral', icon: Shield },
        };
        
        const statusInfo = statusMap[status] || { label: status, class: 'badge-warning', icon: Clock };
        const StatusIcon = statusInfo.icon;
        
        return {
            ...statusInfo,
            icon: <StatusIcon size={12} />
        };
    };

    // Get rating stars
    const getRatingStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating || 0);
        const hasHalfStar = (rating || 0) % 1 >= 0.5;

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(<Star key={i} size={12} className="text-yellow-400 fill-current" />);
            } else if (i === fullStars && hasHalfStar) {
                stars.push(<Star key={i} size={12} className="text-yellow-400 fill-current" />);
            } else {
                stars.push(<Star key={i} size={12} className="text-gray-300" />);
            }
        }
        return stars;
    };

    // Calculate contract days remaining
    const getContractDaysRemaining = (endDate) => {
        if (!endDate) return 0;
        const end = new Date(endDate);
        const today = new Date();
        const diffTime = end - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    return (
        <div className="bg-white rounded-box p-5">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Dealerships Management</h1>
                    <p className="text-gray-600 mt-1">Manage dealership partners and their contracts</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href={route("dealerships.create")}
                        className="btn bg-[#1e4d2b] text-white btn-sm"
                    >
                        <Plus size={15} /> Add New Dealership
                    </Link>
                </div>
            </div>

            {/* Search and Filter Section */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                <div className="flex flex-col lg:flex-row gap-4 items-end">
                    {/* Search Input */}
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search Dealerships
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by dealership name, owner, email, phone..."
                                className="input input-bordered w-full pl-10"
                            />
                        </div>
                    </div>

                    {/* Clear Filters Button */}
                    {search && (
                        <button
                            onClick={clearFilters}
                            className="btn btn-error btn-sm"
                        >
                            <X size={15} /> Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Dealerships Table */}
            <div className="overflow-x-auto">
                {dellerships.data.length > 0 ? (
                    <table className="table table-auto w-full">
                        <thead className="bg-[#1e4d2b] text-white text-white">
                            <tr>
                                <th className="text-center">SL</th>
                                <th>Dealership Info</th>
                                <th>Contact Details</th>
                                <th>Financial Info</th>
                                <th>Contract Period</th>
                                <th>Business Metrics</th>
                                <th>Status</th>
                                <th className="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dellerships.data.map((dealership, index) => (
                                <tr key={dealership.id} className="hover:bg-gray-50">
                                    <td className="text-center">
                                        {dellerships.from + index}
                                    </td>
                                    <td>
                                        <div className="flex items-start gap-3">
                                            <Building size={16} className="text-blue-600 mt-1" />
                                            <div>
                                                <p className="font-semibold text-gray-800">
                                                    {dealership.name || 'N/A'}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Owner: {dealership.owner_name || 'N/A'}
                                                </p>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <span className="text-xs font-medium">Company:</span>
                                                    <span className="text-xs text-gray-600">
                                                        {dealership.company?.name || 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {dealership.trade_license_no && (
                                                        <span className="badge badge-xs badge-outline p-4">
                                                            TL: {dealership.trade_license_no}
                                                        </span>
                                                    )}
                                                    {dealership.tin_no && (
                                                        <span className="badge badge-xs badge-outline p-4">
                                                            TIN: {dealership.tin_no}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="space-y-1 text-sm">
                                            {dealership.email && (
                                                <div className="flex items-center gap-2">
                                                    <Mail size={12} className="text-green-600" />
                                                    <span className="text-gray-700">{dealership.email}</span>
                                                </div>
                                            )}
                                            {dealership.phone && (
                                                <div className="flex items-center gap-2">
                                                    <Phone size={12} className="text-blue-600" />
                                                    <span className="text-gray-700">{dealership.phone}</span>
                                                </div>
                                            )}
                                            {dealership.address && (
                                                <div className="flex items-start gap-2">
                                                    <MapPin size={12} className="text-red-600 mt-0.5" />
                                                    <span className="text-gray-700 text-xs">
                                                        {dealership.address.length > 50 
                                                            ? dealership.address.substring(0, 50) + '...' 
                                                            : dealership.address
                                                        }
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Advance:</span>
                                                <span className="font-semibold text-green-600">
                                                    {formatCurrency(dealership.advance_amount)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Due:</span>
                                                <span className={`font-semibold ${
                                                    (dealership.due_amount || 0) > 0 ? 'text-red-600' : 'text-gray-600'
                                                }`}>
                                                    {formatCurrency(dealership.due_amount)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Credit Limit:</span>
                                                <span className="font-semibold text-blue-600">
                                                    {formatCurrency(dealership.credit_limit)}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1 text-sm">
                                            <div className="flex items-center gap-1">
                                                <Calendar size={12} className="text-purple-600" />
                                                <span>Start: {formatDate(dealership.contract_start)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar size={12} className="text-orange-600" />
                                                <span>End: {formatDate(dealership.contract_end)}</span>
                                            </div>
                                            {/* {dealership.contract_end && (
                                                <div className={`text-xs font-medium ${
                                                    getContractDaysRemaining(dealership.contract_end) < 30 
                                                        ? 'text-red-600' 
                                                        : 'text-primary'
                                                }`}>
                                                    {getContractDaysRemaining(dealership.contract_end)} days remaining
                                                </div>
                                            )} */}
                                            {dealership.payment_terms && (
                                                <div className="text-xs text-gray-500">
                                                    Terms: {dealership.payment_terms}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Total Sales:</span>
                                                <span className="font-semibold">
                                                    {formatCurrency(dealership.total_sales || 0)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Total Orders:</span>
                                                <span className="font-semibold">
                                                    {dealership.total_orders || 0}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-600">Rating:</span>
                                                <div className="flex items-center gap-1">
                                                    {getRatingStars(dealership.rating)}
                                                    <span className="text-xs text-gray-500">
                                                        ({dealership.rating || 0})
                                                    </span>
                                                </div>
                                            </div>
                                            {dealership.last_order_date && (
                                                <div className="text-xs text-gray-500">
                                                    Last order: {formatDate(dealership.last_order_date)}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-2">
                                            <span className={`badge ${getStatusBadge(dealership.status).class} badge-sm flex items-center gap-1`}>
                                                {getStatusBadge(dealership.status).icon}
                                                {getStatusBadge(dealership.status).label}
                                            </span>
                                            {dealership.approved_by && (
                                                <div className="text-xs text-gray-500">
                                                    Approved by: {dealership.approver?.name || 'N/A'}
                                                </div>
                                            )}
                                            {dealership.approved_at && (
                                                <div className="text-xs text-gray-500">
                                                    On: {formatDate(dealership.approved_at)}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2 justify-center">
                                            <Link
                                                href={route("dealerships.show", dealership.id)}
                                                className="btn bg-[#1e4d2b] text-white btn-xs"
                                            >
                                                <Eye size={12} />
                                            </Link>

                                            <Link
                                                href={route("dealerships.edit", dealership.id)}
                                                className="btn btn-warning btn-xs"
                                            >
                                                <Edit size={12} /> 
                                            </Link>
                                                {dealership.status !== 'approved' && (
                                                    <Link
                                                        href={route("dealerships.approved", dealership.id)}
                                                        method="post"
                                                        title="Approve this dealership"
                                                        className="btn btn-green btn-xs flex items-center gap-1"
                                                    >
                                                        <Check size={12} />
                                                    </Link>
                                                )}

                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="border border-gray-200 rounded-box px-5 py-10 flex flex-col justify-center items-center gap-2">
                        <Frown size={40} className="text-gray-400" />
                        <h1 className="text-gray-500 text-lg font-medium">No dealerships found!</h1>
                        <p className="text-gray-400 text-sm mb-4">
                            {search ? "Try adjusting your search" : "Get started by adding your first dealership"}
                        </p>
                        <Link
                            href={route("dealerships.create")}
                            className="btn bg-[#1e4d2b] text-white btn-sm"
                        >
                            <Plus size={15} /> Add New Dealership
                        </Link>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {dellerships.data.length > 0 && (
                <div className="mt-6">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-gray-600">
                            Showing {dellerships.from} to {dellerships.to} of {dellerships.total} entries
                        </div>
                        
                        {/* Custom Pagination Component */}
                        <div className="join">
                            {/* Previous Button */}
                            {dellerships.links.prev && (
                                <Link
                                    href={dellerships.links.prev}
                                    className="join-item btn btn-sm"
                                >
                                    «
                                </Link>
                            )}
                            
                            {dellerships.links && dellerships.links.links && dellerships.links.links.slice(1, -1).map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url}
                                    className={`join-item btn btn-sm ${link.active ? 'bg-[#1e4d2b] text-white' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                            
                            {dellerships.links.next && (
                                <Link
                                    href={dellerships.links.next}
                                    className="join-item btn btn-sm"
                                >
                                    »
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            {dellerships.data.length > 0 && (
                <div className="border-t border-gray-200 p-5 mt-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Dealerships Summary</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <Building className="text-blue-600" size={20} />
                                <div>
                                    <p className="text-sm font-medium text-blue-800">Total Dealerships</p>
                                    <p className="text-xl font-bold text-blue-900">{dellerships.total}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <BadgeCheck className="text-green-600" size={20} />
                                <div>
                                    <p className="text-sm font-medium text-green-800">Active Dealerships</p>
                                    <p className="text-xl font-bold text-green-900">
                                        {dellerships.data.filter(dealership => dealership.status == 'approved').length}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <DollarSign className="text-purple-600" size={20} />
                                <div>
                                    <p className="text-sm font-medium text-purple-800">Total Sales</p>
                                    <p className="text-xl font-bold text-purple-900">
                                        {formatCurrency(
                                            dellerships.data.reduce((sum, dealership) => 
                                                sum + parseFloat(dealership.total_sales || 0), 0
                                            )
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <CreditCard className="text-orange-600" size={20} />
                                <div>
                                    <p className="text-sm font-medium text-orange-800">Total Due Amount</p>
                                    <p className="text-xl font-bold text-orange-900">
                                        {formatCurrency(
                                            dellerships.data.reduce((sum, dealership) => 
                                                sum + parseFloat(dealership.due_amount || 0), 0
                                            )
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Additional Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <FileText className="text-gray-600" size={20} />
                                <div>
                                    <p className="text-sm font-medium text-gray-800">Pending Approval</p>
                                    <p className="text-xl font-bold text-gray-900">
                                        {dellerships.data.filter(dealership => dealership.status === 'pending').length}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <Ban className="text-red-600" size={20} />
                                <div>
                                    <p className="text-sm font-medium text-red-800">Suspended</p>
                                    <p className="text-xl font-bold text-red-900">
                                        {dellerships.data.filter(dealership => dealership.status === 'suspended').length}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <Star className="text-cyan-600" size={20} />
                                <div>
                                    <p className="text-sm font-medium text-cyan-800">Average Rating</p>
                                    <p className="text-xl font-bold text-cyan-900">
                                        {(
                                            dellerships.data.reduce((sum, dealership) => 
                                                sum + parseFloat(dealership.rating || 0), 0
                                            ) / dellerships.data.filter(d => d.rating).length || 0
                                        ).toFixed(1)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}