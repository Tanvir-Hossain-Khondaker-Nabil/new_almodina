import React, { useState, useEffect } from "react";
import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
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
  TrendingDown,
  Wallet,
  Users,
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { Link, router, useForm, usePage } from "@inertiajs/react";
import { useTranslation } from "../../hooks/useTranslation";
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

// Register all ChartJS components
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

export default function PaymentLedger({ payments, filters, isShadowUser }) {
  const { auth } = usePage().props;
  const { t, locale } = useTranslation();
  const [timeChartData, setTimeChartData] = useState(null);
  const [methodChartData, setMethodChartData] = useState(null);
  const [typeChartData, setTypeChartData] = useState(null);
  const [activeChart, setActiveChart] = useState('time'); // 'time', 'method', 'type'
  const [chartType, setChartType] = useState('daily'); // 'daily', 'weekly', 'monthly'
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'

  const filterForm = useForm({
    search: filters.search || "",
    type: filters.type || "all",
    entity_id: filters.entity_id || "",
    start_date: filters.start_date || "",
    end_date: filters.end_date || "",
  });

  useEffect(() => {
    if (payments.data && payments.data.length > 0) {
      updateAllChartData(payments.data);
    }
  }, [payments.data, chartType]);

  const updateAllChartData = (paymentData) => {
    // Time-based chart data
    const paymentsByPeriod = {};
    const paymentTrends = [];
    
    paymentData.forEach((payment, index) => {
      const date = new Date(payment.created_at);
      let period;
      
      switch(chartType) {
        case 'daily':
          period = date.toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-GB', {
            day: '2-digit',
            month: 'short'
          });
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          period = `Week ${Math.ceil((weekStart.getDate() + 7) / 7)} ${date.toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-GB', { month: 'short' })}`;
          break;
        case 'monthly':
          period = date.toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-GB', {
            month: 'short',
            year: '2-digit'
          });
          break;
        default:
          period = date.toLocaleDateString();
      }
      
      if (!paymentsByPeriod[period]) {
        paymentsByPeriod[period] = {
          total: 0,
          count: 0
        };
      }
      
      paymentsByPeriod[period].total += parseFloat(payment.amount || 0);
      paymentsByPeriod[period].count += 1;
      
      // For trend line
      paymentTrends.push({
        x: index,
        y: parseFloat(payment.amount || 0),
        date: date
      });
    });

    // Time Chart Data
    const timeLabels = Object.keys(paymentsByPeriod);
    const timeTotals = timeLabels.map(label => paymentsByPeriod[label].total);
    const timeCounts = timeLabels.map(label => paymentsByPeriod[label].count);

    const timeChart = {
      labels: timeLabels,
      datasets: [
        {
          type: 'bar',
          label: 'Payment Amount',
          data: timeTotals,
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          borderColor: 'rgb(99, 102, 241)',
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
          order: 2
        },
        {
          type: 'line',
          label: 'Transaction Trend',
          data: paymentTrends.map(t => t.y),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgb(239, 68, 68)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          tension: 0.4,
          fill: true,
          order: 1
        }
      ]
    };

    const timeOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index',
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20
          }
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#1f2937',
          bodyColor: '#4b5563',
          borderColor: '#e5e7eb',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 12,
          boxPadding: 6,
          usePointStyle: true,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.datasetIndex === 0) {
                label += new Intl.NumberFormat('en-BD', {
                  style: 'currency',
                  currency: 'BDT'
                }).format(context.parsed.y);
              } else {
                label += new Intl.NumberFormat('en-BD', {
                  style: 'currency',
                  currency: 'BDT'
                }).format(context.parsed.y);
              }
              return label;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            drawBorder: false,
            color: 'rgba(229, 231, 235, 0.3)'
          },
          ticks: {
            color: '#6b7280',
            padding: 8,
            callback: function(value) {
              return new Intl.NumberFormat('en-BD', {
                style: 'currency',
                currency: 'BDT',
                notation: 'compact',
                minimumFractionDigits: 0
              }).format(value);
            }
          },
          title: {
            display: true,
            text: 'Amount (BDT)',
            color: '#6b7280'
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#6b7280',
            padding: 8,
            maxRotation: 45
          }
        }
      }
    };

    setTimeChartData({ data: timeChart, options: timeOptions });

    // Payment Method Pie Chart Data
    const methodDistribution = {};
    paymentData.forEach(payment => {
      const method = payment.payment_method || 'unknown';
      methodDistribution[method] = (methodDistribution[method] || 0) + parseFloat(payment.amount || 0);
    });

    const methodLabels = Object.keys(methodDistribution);
    const methodData = methodLabels.map(method => methodDistribution[method]);
    const methodColors = {
      cash: 'rgba(34, 197, 94, 0.8)',
      card: 'rgba(59, 130, 246, 0.8)',
      bank: 'rgba(6, 182, 212, 0.8)',
      mobile: 'rgba(168, 85, 247, 0.8)',
      online: 'rgba(249, 115, 22, 0.8)',
      unknown: 'rgba(107, 114, 128, 0.8)'
    };

    const methodChart = {
      labels: methodLabels.map(m => m.charAt(0).toUpperCase() + m.slice(1)),
      datasets: [
        {
          data: methodData,
          backgroundColor: methodLabels.map(method => methodColors[method] || 'rgba(107, 114, 128, 0.8)'),
          borderColor: methodLabels.map(method => 
            method === 'cash' ? '#16a34a' :
            method === 'card' ? '#2563eb' :
            method === 'bank' ? '#0891b2' :
            method === 'mobile' ? '#7c3aed' :
            method === 'online' ? '#ea580c' : '#6b7280'
          ),
          borderWidth: 2,
          hoverOffset: 15
        }
      ]
    };

    const methodOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = methodData.reduce((a, b) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${formatCurrency(value)} (${percentage}%)`;
            }
          }
        }
      }
    };

    setMethodChartData({ data: methodChart, options: methodOptions });

    // Transaction Type Pie Chart Data
    const typeDistribution = {
      sales: 0,
      purchases: 0,
      others: 0
    };
    
    paymentData.forEach(payment => {
      if (payment.sale) {
        typeDistribution.sales += parseFloat(payment.amount || 0);
      } else if (payment.purchase) {
        typeDistribution.purchases += parseFloat(payment.amount || 0);
      } else {
        typeDistribution.others += parseFloat(payment.amount || 0);
      }
    });

    const typeChart = {
      labels: ['Sales', 'Purchases', 'Others'],
      datasets: [
        {
          data: [typeDistribution.sales, typeDistribution.purchases, typeDistribution.others],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(249, 115, 22, 0.8)',
            'rgba(107, 114, 128, 0.8)'
          ],
          borderColor: [
            '#16a34a',
            '#ea580c',
            '#6b7280'
          ],
          borderWidth: 2,
          hoverOffset: 15
        }
      ]
    };

    const typeOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = typeDistribution.sales + typeDistribution.purchases + typeDistribution.others;
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${formatCurrency(value)} (${percentage}%)`;
            }
          }
        }
      }
    };

    setTypeChartData({ data: typeChart, options: typeOptions });
  };

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

    router.get(route("payments.ledger"), queryParams, {
      preserveScroll: true,
      preserveState: true,
      replace: true,
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleFilter();
    }
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
      router.get(route("payments.ledger"), {}, {
        preserveScroll: true,
        preserveState: true,
      });
    }, 0);
  };

  const formatCurrency = (amount, compact = false) => {
    if (compact && amount >= 100000) {
      return new Intl.NumberFormat('en-BD', {
        notation: 'compact',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }).format(amount);
    }
    return new Intl.NumberFormat('en-BD', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-GB', {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString(locale === 'bn' ? 'bn-BD' : 'en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getPaymentMethodConfig = (method) => {
    const configs = {
      cash: {
        label: 'Cash',
        icon: DollarSign,
        color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
        iconColor: 'text-emerald-600',
        bg: 'bg-emerald-50'
      },
      card: {
        label: 'Card',
        icon: CreditCard,
        color: 'bg-blue-500/10 text-blue-700 border-blue-200',
        iconColor: 'text-blue-600',
        bg: 'bg-blue-50'
      },
      bank: {
        label: 'Bank',
        icon: Building,
        color: 'bg-cyan-500/10 text-cyan-700 border-cyan-200',
        iconColor: 'text-cyan-600',
        bg: 'bg-cyan-50'
      },
      mobile: {
        label: 'Mobile',
        icon: Smartphone,
        color: 'bg-violet-500/10 text-violet-700 border-violet-200',
        iconColor: 'text-violet-600',
        bg: 'bg-violet-50'
      },
      online: {
        label: 'Online',
        icon: Globe,
        color: 'bg-orange-500/10 text-orange-700 border-orange-200',
        iconColor: 'text-orange-600',
        bg: 'bg-orange-50'
      }
    };
    
    return configs[method] || {
      label: method,
      icon: DollarSign,
      color: 'bg-gray-500/10 text-gray-700 border-gray-200',
      iconColor: 'text-gray-600',
      bg: 'bg-gray-50'
    };
  };

  const getStatusConfig = (status) => {
    const configs = {
      completed: {
        label: 'Completed',
        icon: CheckCircle,
        color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
        iconColor: 'text-emerald-600'
      },
      pending: {
        label: 'Pending',
        icon: Clock,
        color: 'bg-amber-500/10 text-amber-700 border-amber-200',
        iconColor: 'text-amber-600'
      },
      failed: {
        label: 'Failed',
        icon: XCircle,
        color: 'bg-rose-500/10 text-rose-700 border-rose-200',
        iconColor: 'text-rose-600'
      }
    };
    
    return configs[status] || {
      label: status,
      icon: AlertCircle,
      color: 'bg-gray-500/10 text-gray-700 border-gray-200',
      iconColor: 'text-gray-600'
    };
  };

  const getTransactionTypeConfig = (payment) => {
    if (payment.sale) {
      return {
        label: 'Sale',
        icon: ArrowDownRight,
        color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
        iconColor: 'text-emerald-600',
        direction: 'income'
      };
    } else if (payment.purchase) {
      return {
        label: 'Purchase',
        icon: ArrowUpRight,
        color: 'bg-orange-500/10 text-orange-700 border-orange-200',
        iconColor: 'text-orange-600',
        direction: 'expense'
      };
    }
    return {
      label: 'Other',
      icon: TrendingUp,
      color: 'bg-gray-500/10 text-gray-700 border-gray-200',
      iconColor: 'text-gray-600',
      direction: 'neutral'
    };
  };

  const calculateTotals = () => {
    const paymentsData = payments.data || [];
    
    const totals = paymentsData.reduce((acc, payment) => {
      acc.totalAmount += parseFloat(payment.amount || 0);
      acc[payment.payment_method] = (acc[payment.payment_method] || 0) + parseFloat(payment.amount || 0);
      acc.totalCount += 1;
      
      if (payment.status === 'completed') acc.completedCount += 1;
      if (payment.status === 'pending') acc.pendingCount += 1;
      if (payment.status === 'failed') acc.failedCount += 1;

      if (payment.customer) {
        acc.salesCount += 1;
        acc.salesAmount += parseFloat(payment.amount || 0);
      }
      if (payment.supplier) {
        acc.purchasesCount += 1;
        acc.purchasesAmount += parseFloat(payment.amount || 0);
      }
      
      return acc;
    }, {
      totalAmount: 0,
      cash: 0,
      card: 0,
      bank: 0,
      mobile: 0,
      online: 0,
      totalCount: 0,
      completedCount: 0,
      pendingCount: 0,
      failedCount: 0,
      salesCount: 0,
      salesAmount: 0,
      purchasesCount: 0,
      purchasesAmount: 0
    });

    // Calculate percentages
    totals.completedPercentage = totals.totalCount > 0 ? Math.round((totals.completedCount / totals.totalCount) * 100) : 0;
    totals.salesPercentage = totals.totalAmount > 0 ? Math.round((totals.salesAmount / totals.totalAmount) * 100) : 0;
    totals.purchasesPercentage = totals.totalAmount > 0 ? Math.round((totals.purchasesAmount / totals.totalAmount) * 100) : 0;
    totals.avgTransaction = totals.totalCount > 0 ? totals.totalAmount / totals.totalCount : 0;

    return totals;
  };

  const totals = calculateTotals();
  const hasActiveFilters = filterForm.data.search || filterForm.data.type !== 'all' || 
                          filterForm.data.entity_id || filterForm.data.start_date || 
                          filterForm.data.end_date;

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend, percentage }) => (
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
      {trend && (
        <div className="flex items-center gap-2 mt-4">
          <TrendingUp className={`h-4 w-4 ${trend.value > 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
          <span className={`text-sm font-medium ${trend.value > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend.value > 0 ? '+' : ''}{trend.value}%
          </span>
          <span className="text-sm text-gray-500">vs last period</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payment Ledger</h1>
              <p className="text-gray-600 mt-2">
                Comprehensive overview of all payment transactions and analytics
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.download = `payment-ledger-${new Date().toISOString().split('T')[0]}.csv`;
                  link.href = '#';
                  link.click();
                }}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Filters - Fixed Design */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          {/* Filter Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Transactions
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

          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Search - Takes 5 columns on medium screens and above */}
            <div className="md:col-span-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="search"
                  value={filterForm.data.search}
                  onChange={(e) => filterForm.setData("search", e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Search by reference, customer, supplier..."
                  className="w-full h-12 pl-11 pr-4 border border-gray-300 rounded-xl 
                            focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                            bg-gray-50 text-gray-700 placeholder-gray-500"
                />
              </div>
            </div>

            {/* Transaction Type - Takes 3 columns */}
            <div className="md:col-span-3">
              <select
                value={filterForm.data.type}
                onChange={(e) => filterForm.setData("type", e.target.value)}
                className="w-full h-12 px-4 border border-gray-300 rounded-xl bg-gray-50
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
              >
                <option value="all">All Transactions</option>
                <option value="customer">Customer Payments</option>
                <option value="supplier">Supplier Payments</option>
              </select>
            </div>

            {/* Date Range - Takes 4 columns */}
            <div className="md:col-span-4 flex gap-2">
              <div className="flex-1">
                <input
                  type="date"
                  value={filterForm.data.start_date}
                  onChange={(e) => filterForm.setData("start_date", e.target.value)}
                  className="w-full h-12 px-4 border border-gray-300 rounded-xl bg-gray-50
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                />
              </div>
              <div className="flex-1">
                <input
                  type="date"
                  value={filterForm.data.end_date}
                  onChange={(e) => filterForm.setData("end_date", e.target.value)}
                  className="w-full h-12 px-4 border border-gray-300 rounded-xl bg-gray-50
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={handleFilter}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white 
                        font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                        transition-all duration-200"
            >
              Apply Filters
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 mr-2">View:</span>
              <div className="inline-flex rounded-xl border border-gray-200 p-1 bg-gray-50">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                    viewMode === 'table'
                      ? 'bg-white text-blue-700 shadow-sm border border-gray-300'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Layers className="h-4 w-4" />
                  <span className="text-sm font-medium">Table</span>
                </button>
                <button
                  onClick={() => setViewMode('card')}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                    viewMode === 'card'
                      ? 'bg-white text-blue-700 shadow-sm border border-gray-300'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">Cards</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Value"
            value={`৳${formatCurrency(totals.totalAmount)}`}
            subtitle={`${totals.totalCount} transactions`}
            icon={DollarSign}
            color="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 text-emerald-600"
          />
          
          <StatCard
            title="Completed"
            value={totals.completedCount}
            subtitle={`${totals.completedPercentage}% success rate`}
            icon={CheckCircle}
            color="bg-gradient-to-br from-blue-500/10 to-blue-600/10 text-blue-600"
            percentage={totals.completedPercentage}
          />
          
          <StatCard
            title="Customer Payments"
            value={totals.salesCount}
            subtitle={`৳${formatCurrency(totals.salesAmount)} total`}
            icon={Users}
            color="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 text-emerald-600"
            percentage={totals.salesPercentage}
          />
          
          <StatCard
            title="Supplier Payments"
            value={totals.purchasesCount}
            subtitle={`৳${formatCurrency(totals.purchasesAmount)} total`}
            icon={ShoppingBag}
            color="bg-gradient-to-br from-orange-500/10 to-orange-600/10 text-orange-600"
            percentage={totals.purchasesPercentage}
          />
        </div>

        {/* Chart Grid */}
        {payments.data.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Left Column - Time Series with Line */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <LineChart className="h-5 w-5" />
                    Payment Timeline
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Payment amounts and transaction trends over time
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-lg border border-gray-200 p-1">
                    {['daily', 'weekly', 'monthly'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setChartType(type)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg capitalize transition-colors ${
                          chartType === type 
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' 
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="h-80">
                {timeChartData && <Bar data={timeChartData.data} options={timeChartData.options} />}
              </div>
            </div>

            {/* Right Column - Pie Charts */}
            <div className="space-y-8">
              {/* Payment Methods Pie */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <PieChartIcon className="h-5 w-5" />
                      Payment Methods
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Distribution of payments by method
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveChart('method')}
                      className={`p-2 rounded-lg ${activeChart === 'method' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <PieChartIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="h-64">
                  {methodChartData && <Pie data={methodChartData.data} options={methodChartData.options} />}
                </div>
              </div>

              {/* Transaction Types Pie */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <BarChartIcon className="h-5 w-5" />
                      Transaction Types
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Breakdown by sale, purchase, and other transactions
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveChart('type')}
                      className={`p-2 rounded-lg ${activeChart === 'type' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <BarChartIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="h-64">
                  {typeChartData && <Pie data={typeChartData.data} options={typeChartData.options} />}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Method Distribution Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {Object.entries({
            cash: { icon: DollarSign, color: 'bg-gradient-to-br from-emerald-500 to-emerald-600' },
            card: { icon: CreditCard, color: 'bg-gradient-to-br from-blue-500 to-blue-600' },
            bank: { icon: Building, color: 'bg-gradient-to-br from-cyan-500 to-cyan-600' },
            mobile: { icon: Smartphone, color: 'bg-gradient-to-br from-violet-500 to-violet-600' },
            online: { icon: Globe, color: 'bg-gradient-to-br from-orange-500 to-orange-600' }
          }).map(([method, { icon: Icon, color }]) => (
            <div key={method} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-3 rounded-xl ${color}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                  {Math.round((totals[method] / totals.totalAmount) * 100)}%
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1 capitalize">{method}</p>
                <p className="text-xl font-bold text-gray-900">
                  ৳{formatCurrency(totals[method] || 0)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Transactions Table/Cards */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {payments.data.length > 0 ? (
            <>
              {/* Table View */}
              {viewMode === 'table' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th scope="col" className="px-8 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th scope="col" className="px-8 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                          Transaction
                        </th>
                        <th scope="col" className="px-8 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                          Customer/Supplier
                        </th>
                        <th scope="col" className="px-8 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                          Amount
                        </th>
                        <th scope="col" className="px-8 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                          Method & Status
                        </th>
                        <th scope="col" className="px-8 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {payments.data.map((payment) => {
                        const methodConfig = getPaymentMethodConfig(payment.payment_method);
                        const statusConfig = getStatusConfig(payment.status);
                        const typeConfig = getTransactionTypeConfig(payment);
                        const MethodIcon = methodConfig.icon;
                        const StatusIcon = statusConfig.icon;
                        const entity = payment.customer || payment.supplier;
                        
                        return (
                          <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-8 py-5">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {formatDate(payment.created_at)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {formatTime(payment.created_at)}
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-lg ${typeConfig.color}`}>
                                  <typeConfig.icon className={`h-4 w-4 ${typeConfig.iconColor}`} />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {payment.txn_ref || 'No Reference'}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {typeConfig.label}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                                    <User className="h-5 w-5 text-blue-600" />
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {entity?.customer_name || entity?.name || 'Walk-in'}
                                  </div>
                                  {entity?.phone && (
                                    <div className="text-xs text-gray-500">
                                      {entity.phone}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <div className="text-lg font-bold text-gray-900">
                                ৳{formatCurrency(payment.amount)}
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <div className="space-y-2">
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border ${methodConfig.color}`}>
                                  <MethodIcon className="h-3.5 w-3.5" />
                                  {methodConfig.label}
                                </div>
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border ${statusConfig.color}`}>
                                  <StatusIcon className="h-3.5 w-3.5" />
                                  {statusConfig.label}
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-2">
                                <Link
                                  href={route("payments.show", { payment: payment.id })}
                                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Link>
                                {payment.sale && (
                                  <Link
                                    href={route("sales.show", { sale: payment.sale.id })}
                                    className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                    title="View Sale"
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Link>
                                )}
                                {/* {payment.purchase && (
                                  <Link
                                    href={route("purchases.show", { purchase: payment.purchase.id })}
                                    className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                    title="View Purchase"
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Link>
                                )} */}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Card View */}
              {viewMode === 'card' && (
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {payments.data.map((payment) => {
                      const methodConfig = getPaymentMethodConfig(payment.payment_method);
                      const statusConfig = getStatusConfig(payment.status);
                      const typeConfig = getTransactionTypeConfig(payment);
                      const MethodIcon = methodConfig.icon;
                      const StatusIcon = statusConfig.icon;
                      const entity = payment.customer || payment.supplier;
                      
                      return (
                        <div key={payment.id} className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-6 hover:border-blue-200 hover:shadow-md transition-all">
                          <div className="flex items-start justify-between mb-5">
                            <div className="flex items-center gap-3">
                              <div className={`p-3 rounded-xl ${typeConfig.color}`}>
                                <typeConfig.icon className={`h-5 w-5 ${typeConfig.iconColor}`} />
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900">
                                  {payment.txn_ref || 'No Reference'}
                                </h4>
                                <p className="text-sm text-gray-600 mt-0.5">
                                  {typeConfig.label} • {formatDate(payment.created_at)}
                                </p>
                              </div>
                            </div>
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border ${statusConfig.color}`}>
                              <StatusIcon className="h-3.5 w-3.5" />
                              {statusConfig.label}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                                <User className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {entity?.customer_name || entity?.name || 'Walk-in Customer'}
                                </p>
                                {entity?.phone && (
                                  <p className="text-sm text-gray-600">
                                    {entity.phone}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-2 rounded-xl">
                              ৳{formatCurrency(payment.amount)}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between pt-5 border-t border-gray-100">
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border ${methodConfig.color}`}>
                              <MethodIcon className="h-4 w-4" />
                              {methodConfig.label}
                            </div>
                            <div className="flex items-center gap-2">
                              <Link
                                href={route("payments.show", { payment: payment.id })}
                                className="p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                title="View Details"
                              >
                                <Eye className="h-5 w-5" />
                              </Link>
                              {payment.sale && (
                                <Link
                                  href={route("sales.show", { sale: payment.sale.id })}
                                  className="p-2.5 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                                  title="View Sale"
                                >
                                  <FileText className="h-5 w-5" />
                                </Link>
                              )}
                              {/* {payment.purchase && (
                                <Link
                                  href={route("purchases.show", { purchase: payment.purchase.id })}
                                  className="p-2.5 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors"
                                  title="View Purchase"
                                >
                                  <FileText className="h-5 w-5" />
                                </Link>
                              )} */}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pagination */}
              <div className="px-8 py-6 border-t border-gray-100">
                <Pagination data={payments} />
              </div>
            </>
          ) : (
            <div className="p-12 text-center">
              <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-6">
                <DollarSign className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                No transactions found
              </h3>
              <p className="text-gray-600 max-w-md mx-auto mb-8">
                {hasActiveFilters
                  ? "Try adjusting your search filters to find what you're looking for."
                  : "Get started by recording your first payment transaction."}
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