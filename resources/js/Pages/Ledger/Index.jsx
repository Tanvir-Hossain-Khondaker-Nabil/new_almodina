import React, { useState, useEffect } from "react";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import {
  Search,
  Filter,
  Download,
  Eye,
  FileText,
  User,
  TrendingUp,
  DollarSign,
  CreditCard,
  Building,
  Smartphone,
  Globe,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  LineChart,
  RefreshCw,
  Layers,
  Users,
  ShoppingBag,
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserCheck,
  Truck
} from "lucide-react";
import Pagination from "../../components/Pagination";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';

// Register ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

export default function LedgerIndex({ customers = [], suppliers = [], filters = {}, stats = {}, type = 'all' }) {
  const { auth } = usePage().props;
  const [viewMode, setViewMode] = useState('table');
  const [activeEntity, setActiveEntity] = useState(null);
  const [salesChartData, setSalesChartData] = useState(null);
  const [purchasesChartData, setPurchasesChartData] = useState(null);

  // Initialize filters with default values
  const filterForm = useForm({
    search: filters.search || "",
    type: filters.type || "all",
    entity_id: filters.entity_id || "",
    start_date: filters.start_date || "",
    end_date: filters.end_date || "",
  });

  // Prepare data for charts
  useEffect(() => {
    // Prepare sales chart data for customers
    if (type !== 'supplier' && customers && customers.length > 0) {
      const salesData = customers.slice(0, 10).map(customer => ({
        label: customer.customer_name || customer.name || 'Customer',
        value: customer.sales?.reduce((sum, sale) => sum + parseFloat(sale.grand_total || 0), 0) || 0
      }));

      const salesChart = {
        labels: salesData.map(item => item.label),
        datasets: [
          {
            label: 'Sales Amount',
            data: salesData.map(item => item.value),
            backgroundColor: 'rgba(34, 197, 94, 0.2)',
            borderColor: 'rgb(34, 197, 94)',
            borderWidth: 2,
            borderRadius: 6,
          }
        ]
      };

      setSalesChartData(salesChart);
    }

    // Prepare purchases chart data for suppliers
    if (type !== 'customer' && suppliers && suppliers.length > 0) {
      const purchasesData = suppliers.slice(0, 10).map(supplier => ({
        label: supplier.name || 'Supplier',
        value: supplier.purchases?.reduce((sum, purchase) => sum + parseFloat(purchase.grand_total || 0), 0) || 0
      }));

      const purchasesChart = {
        labels: purchasesData.map(item => item.label),
        datasets: [
          {
            label: 'Purchases Amount',
            data: purchasesData.map(item => item.value),
            backgroundColor: 'rgba(249, 115, 22, 0.2)',
            borderColor: 'rgb(249, 115, 22)',
            borderWidth: 2,
            borderRadius: 6,
          }
        ]
      };

      setPurchasesChartData(purchasesChart);
    }
  }, [customers, suppliers, type]);

  const handleFilter = () => {
    const queryParams = {};

    if (filterForm.data.search.trim()) {
      queryParams.search = filterForm.data.search.trim();
    }

    if (filterForm.data.type && filterForm.data.type !== 'all') {
      queryParams.type = filterForm.data.type;
    }

    if (filterForm.data.entity_id) {
      queryParams.entity_id = filterForm.data.entity_id;
    }

    if (filterForm.data.start_date) {
      queryParams.start_date = filterForm.data.start_date;
    }

    if (filterForm.data.end_date) {
      queryParams.end_date = filterForm.data.end_date;
    }

    router.get(route("ledgers.index"), queryParams, {
      preserveScroll: true,
      preserveState: true,
      replace: true,
    });
  };

  const clearFilters = () => {
    filterForm.setData({
      search: "",
      type: "all",
      entity_id: "",
      start_date: "",
      end_date: "",
    });
    setTimeout(() => {
      router.get(route("ledgers.index"), {}, {
        preserveScroll: true,
        preserveState: true,
      });
    }, 0);
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0';
    return new Intl.NumberFormat('en-BD', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getEntityTypeConfig = (entity) => {
    const isCustomer = 'customer_name' in entity;
    const entityType = isCustomer ? 'customer' : 'supplier';

    const configs = {
      customer: {
        label: 'Customer',
        icon: Users,
        color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
        iconColor: 'text-emerald-600',
        bg: 'bg-emerald-50'
      },
      supplier: {
        label: 'Supplier',
        icon: Building2,
        color: 'bg-orange-500/10 text-orange-700 border-orange-200',
        iconColor: 'text-orange-600',
        bg: 'bg-orange-50'
      }
    };

    return configs[entityType] || {
      label: 'Unknown',
      icon: Users,
      color: 'bg-gray-500/10 text-gray-700 border-gray-200',
      iconColor: 'text-gray-600',
      bg: 'bg-gray-50'
    };
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color, percentage }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {percentage !== undefined && (
            <div className="flex items-center gap-2 mt-3">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700">{percentage}%</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );

  const hasActiveFilters = filterForm.data.search || filterForm.data.type !== 'all' ||
    filterForm.data.entity_id || filterForm.data.start_date ||
    filterForm.data.end_date;

  const allEntities = React.useMemo(() => {
    let entities = [];

    if (type === 'customer') {
      entities = Array.isArray(customers) ? customers : (customers?.data || []);
    } else if (type === 'supplier') {
      entities = Array.isArray(suppliers) ? suppliers : (suppliers?.data || []);
    } else {
      const customerList = Array.isArray(customers) ? customers : (customers?.data || []);
      const supplierList = Array.isArray(suppliers) ? suppliers : (suppliers?.data || []);
      entities = [...customerList, ...supplierList];
    }

    return entities;
  }, [customers, suppliers, type]);

  // Calculate totals for display
  const totalEntities = React.useMemo(() => {
    if (type === 'customer') {
      return Array.isArray(customers) ? customers.length : (customers?.data?.length || 0);
    } else if (type === 'supplier') {
      return Array.isArray(suppliers) ? suppliers.length : (suppliers?.data?.length || 0);
    } else {
      const customerCount = Array.isArray(customers) ? customers.length : (customers?.data?.length || 0);
      const supplierCount = Array.isArray(suppliers) ? suppliers.length : (suppliers?.data?.length || 0);
      return customerCount + supplierCount;
    }
  }, [customers, suppliers, type]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Head title="Ledger" />

      <div className="max-w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ledger</h1>
              <p className="text-gray-600 mt-2">
                Overview of customers, suppliers, sales, and purchases
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Ledger
            </h3>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Reset Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="search"
                  value={filterForm.data.search}
                  onChange={(e) => filterForm.setData("search", e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
                  placeholder="Search by name, phone, email..."
                  className="w-full h-12 pl-11 pr-4 border border-gray-300 rounded-xl 
                            focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                            bg-gray-50 text-gray-700 placeholder-gray-500"
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <select
                value={filterForm.data.type}
                onChange={(e) => filterForm.setData("type", e.target.value)}
                className="w-full h-12 px-4 border border-gray-300 rounded-xl bg-gray-50
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
              >
                <option value="all">All (Customers & Suppliers)</option>
                <option value="customer">Customers Only</option>
                <option value="supplier">Suppliers Only</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <button
                onClick={handleFilter}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 text-white 
                          font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                          transition-all duration-200"
              >
                Apply
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title={type === 'supplier' ? "Total Suppliers" : type === 'customer' ? "Total Customers" : "Total Entities"}
            value={stats.total_customers || stats.total_suppliers || totalEntities}
            subtitle="Active accounts"
            icon={type === 'supplier' ? Building2 : type === 'customer' ? Users : UserCheck}
            color={type === 'supplier' ? 'bg-gradient-to-br from-orange-500/10 to-orange-600/10 text-orange-600' :
              type === 'customer' ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 text-emerald-600' :
                'bg-gradient-to-br from-blue-500/10 to-blue-600/10 text-blue-600'}
          />

          <StatCard
            title="Total Sales"
            value={`৳${formatCurrency(stats.total_sales_amount)}`}
            subtitle={`${stats.sales_percentage || 0}% of total`}
            icon={ArrowDownRight}
            color="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 text-emerald-600"
            percentage={stats.sales_percentage || 0}
          />

          <StatCard
            title="Total Purchases"
            value={`৳${formatCurrency(stats.total_purchases_amount)}`}
            subtitle={`${stats.purchases_percentage || 0}% of total`}
            icon={ArrowUpRight}
            color="bg-gradient-to-br from-orange-500/10 to-orange-600/10 text-orange-600"
            percentage={stats.purchases_percentage || 0}
          />

          <StatCard
            title="Total Transactions"
            value={stats.total_transactions || 0}
            subtitle={`Avg: ৳${formatCurrency(stats.average_transaction)}`}
            icon={FileText}
            color="bg-gradient-to-br from-blue-500/10 to-blue-600/10 text-blue-600"
          />
        </div>

        {/* Charts */}
        {allEntities.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Sales Chart */}
            {type !== 'supplier' && salesChartData && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <BarChartIcon className="h-5 w-5" />
                      Top Customers by Sales
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Sales distribution among top customers
                    </p>
                  </div>
                </div>
                <div className="h-80">
                  <Bar
                    data={salesChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function (value) {
                              return '৳' + formatCurrency(value);
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Purchases Chart */}
            {type !== 'customer' && purchasesChartData && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <BarChartIcon className="h-5 w-5" />
                      Top Suppliers by Purchases
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Purchases distribution among top suppliers
                    </p>
                  </div>
                </div>
                <div className="h-80">
                  <Bar
                    data={purchasesChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function (value) {
                              return '৳' + formatCurrency(value);
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Entity List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {allEntities.length > 0 ? (
            <>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Entity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Trans
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Paid
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Advance
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Due
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {allEntities.map((entity) => {
                      const isCustomer = "customer_name" in entity;
                      const entityConfig = getEntityTypeConfig(entity);
                      const transactions = isCustomer ? entity.sales : entity.purchases;

                      const totalAmount =
                        (transactions?.reduce(
                          (sum, t) => sum + (parseFloat(t?.grand_total) || 0),
                          0
                        )) || 0;

                      const totalPaidAmount =
                        (transactions?.reduce(
                          (sum, t) => sum + (parseFloat(t?.paid_amount) || 0),
                          0
                        )) || 0;

                      const totalDueAmount = totalAmount - totalPaidAmount;
                      const transactionCount = transactions?.length || 0;
                      const EntityIcon = entityConfig.icon;
                      const advanceAmount = entity?.advance_amount || 0;

                      return (
                        <tr key={entity.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                                <User className="h-4 w-4 text-blue-600" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-gray-900 truncate max-w-[120px]">
                                  {isCustomer ? entity.customer_name : entity.name}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Type badge */}
                          <td className="px-4 py-3">
                            <div
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${entityConfig.color}`}
                            >
                              <EntityIcon className="h-3 w-3" />
                              <span className="hidden sm:inline">{entityConfig.label}</span>
                              <span className="inline sm:hidden">
                                {entityConfig.label === 'Customer' ? 'Cust' : 'Supp'}
                              </span>
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="px-4 py-3">
                            <div className="space-y-0.5">
                              {entity.phone && (
                                <div className="text-sm text-gray-900 truncate max-w-[100px]">{entity.phone}</div>
                              )}
                            </div>
                          </td>

                          {/* Transaction Count */}
                          <td className="px-4 py-3">
                            <div className="text-base font-bold text-gray-900">
                              {transactionCount}
                            </div>
                          </td>

                          {/* Total Amount */}
                          <td className="px-4 py-3">
                            <div className="text-base font-bold text-gray-900">
                              ৳{formatCurrency(totalAmount)}
                            </div>
                          </td>

                          {/* Paid Amount */}
                          <td className="px-4 py-3">
                            <div className="text-base font-bold text-gray-900">
                              ৳{formatCurrency(totalPaidAmount)}
                            </div>
                          </td>

                          {/* Advance */}
                          <td className="px-4 py-3">
                            <div
                              className={`text-base font-bold ${(advanceAmount || 0) >= 0
                                  ? "text-emerald-600"
                                  : "text-rose-600"
                                }`}
                            >
                              ৳{formatCurrency(advanceAmount)}
                            </div>
                          </td>

                          {/* Due */}
                          <td className="px-4 py-3">
                            <div className="text-base font-bold text-gray-900">
                              ৳{formatCurrency(totalDueAmount)}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {/* Ledger link */}
                              <Link
                                href={route(
                                  isCustomer ? "ledgers.customer" : "ledgers.supplier",
                                  {
                                    id: entity.id,
                                    ...(filterForm.data.start_date && {
                                      start_date: filterForm.data.start_date,
                                    }),
                                    ...(filterForm.data.end_date && {
                                      end_date: filterForm.data.end_date,
                                    }),
                                  }
                                )}
                                className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View Ledger"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Link>

                              {/* Customer / Supplier Profile */}
                              {isCustomer ? (
                                <Link
                                  href={`/customer/show/${entity.id}`}
                                  className="p-1.5 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="View Customer"
                                >
                                  <User className="h-3.5 w-3.5" />
                                </Link>
                              ) : (
                                <Link
                                  href={`/supplier/show/${entity.id}`}
                                  className="p-1.5 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                  title="View Supplier"
                                >
                                  <Truck className="h-3.5 w-3.5" />
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 sm:px-6 py-4 border-t border-gray-100">
                {type === 'all' ? (
                  <div className="space-y-4">
                    {customers && (Array.isArray(customers) ? customers.length : customers?.data?.length) > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Customers</h4>
                        <Pagination data={customers} />
                      </div>
                    )}
                    {suppliers && (Array.isArray(suppliers) ? suppliers.length : suppliers?.data?.length) > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Suppliers</h4>
                        <Pagination data={suppliers} />
                      </div>
                    )}
                  </div>
                ) : type === 'customer' ? (
                  customers && <Pagination data={customers} />
                ) : (
                  suppliers && <Pagination data={suppliers} />
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center">
              <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-6">
                <Users className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                No entities found
              </h3>
              <p className="text-gray-600 max-w-md mx-auto mb-8">
                {hasActiveFilters
                  ? "Try adjusting your search filters to find what you're looking for."
                  : "No customers or suppliers available."}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}