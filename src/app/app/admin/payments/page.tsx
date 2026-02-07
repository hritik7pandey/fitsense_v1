'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { 
  ChevronLeft, Download, Search, Filter, IndianRupee, Calendar,
  CreditCard, Banknote, Smartphone, Building, ChevronRight, X,
  TrendingUp, Users, Clock, CheckCircle, Trash2, Phone, Mail, Shield
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/lib/toast-context';
import { useAuth } from '@/lib/auth-context';

const SUPER_ADMIN_EMAIL = '224spy@gmail.com';

interface Payment {
  id: string;
  memberName: string;
  memberEmail?: string;
  memberPhone?: string;
  amount: number;
  paymentMode: string;
  notes?: string;
  paidAt: string;
  planName?: string;
  memberId: number;
}

interface PaymentStats {
  totalCollected: number;
  todayCollection: number;
  weekCollection: number;
  monthCollection: number;
  cashTotal: number;
  onlineTotal: number;
  totalPayments: number;
}

const paymentModeIcons: { [key: string]: React.ReactNode } = {
  'CASH': <Banknote size={16} className="text-green-400" />,
  'CARD': <CreditCard size={16} className="text-blue-400" />,
  'UPI': <Smartphone size={16} className="text-purple-400" />,
  'BANK_TRANSFER': <Building size={16} className="text-orange-400" />,
  'ONLINE': <Smartphone size={16} className="text-purple-400" />,
};

const paymentModeColors: { [key: string]: string } = {
  'CASH': 'bg-green-500/20 text-green-400 border-green-500/30',
  'CARD': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'UPI': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'BANK_TRANSFER': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'ONLINE': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

export default function PaymentHistoryPage() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadPayments();
  }, [filter, dateRange]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      let url = '/api/v1/admin/payments?';
      if (filter !== 'all') url += `mode=${filter}&`;
      if (dateRange.startDate) url += `startDate=${dateRange.startDate}&`;
      if (dateRange.endDate) url += `endDate=${dateRange.endDate}&`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;

      const data = await apiClient.get(url);
      setPayments(data.payments || []);
      setStats(data.stats || null);
    } catch (error: any) {
      console.error('Failed to load payments:', error);
      toast.error('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadPayments();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatShortDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: '2-digit'
    });
  };

  const handleExport = () => {
    if (payments.length === 0) {
      toast.error('No payments to export');
      return;
    }

    const headers = ['Date', 'Member Name', 'Phone', 'Amount', 'Payment Mode', 'Plan', 'Notes'];
    const csvRows = payments.map(p => [
      formatDate(p.paidAt),
      p.memberName,
      p.memberPhone || '',
      p.amount,
      p.paymentMode,
      p.planName || '',
      p.notes || ''
    ]);

    const csvContent = [headers, ...csvRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payment_history_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Exported successfully!');
  };

  const filterOptions = [
    { value: 'all', label: 'All Payments', icon: '💰' },
    { value: 'CASH', label: 'Cash', icon: '💵' },
    { value: 'UPI', label: 'UPI', icon: '📱' },
    { value: 'CARD', label: 'Card', icon: '💳' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: '🏦' },
    { value: 'ONLINE', label: 'Online', icon: '🌐' },
  ];

  const quickDateFilters = [
    { label: 'Today', days: 0 },
    { label: 'This Week', days: 7 },
    { label: 'This Month', days: 30 },
    { label: 'Last 3 Months', days: 90 },
  ];

  const applyQuickDateFilter = (days: number) => {
    const end = new Date();
    const start = days === 0 
      ? new Date(end.setHours(0, 0, 0, 0))
      : new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    
    setDateRange({
      startDate: start.toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    });
  };

  const handleDeletePayment = async (payment: Payment) => {
    if (!isSuperAdmin) {
      toast.error('Only super admin can delete payments');
      return;
    }

    if (!confirm(`Delete payment of ${formatCurrency(payment.amount)} from ${payment.memberName}?\n\nThis action cannot be undone.`)) {
      return;
    }

    setDeletingPaymentId(payment.id);
    try {
      await apiClient.delete(`/api/v1/admin/payments?memberId=${payment.memberId}&paymentId=${payment.id}`);
      toast.success('Payment deleted successfully');
      loadPayments(); // Refresh the list
    } catch (error: any) {
      console.error('Failed to delete payment:', error);
      toast.error(error.message || 'Failed to delete payment');
    } finally {
      setDeletingPaymentId(null);
    }
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="relative bg-gradient-to-b from-green-500/20 via-emerald-500/10 to-transparent pt-4 pb-6 px-4">
        <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={() => router.push('/app/admin')} 
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">💰 Payment History</h1>
            <p className="text-xs text-white/50">{stats?.totalPayments || 0} total payments</p>
          </div>
          <button
            onClick={handleExport}
            className="w-10 h-10 rounded-full bg-green-500/20 backdrop-blur-md border border-green-500/30 flex items-center justify-center"
            title="Export to CSV"
          >
            <Download size={18} className="text-green-400" />
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <>
            {/* Revenue Stats Row */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-green-500/10 backdrop-blur-md rounded-xl p-3 border border-green-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={14} className="text-green-400" />
                  <p className="text-xs text-green-400/70">Total Collected</p>
                </div>
                <p className="text-xl font-bold text-green-400">{formatCurrency(stats.totalCollected)}</p>
              </div>
              <div className="bg-blue-500/10 backdrop-blur-md rounded-xl p-3 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar size={14} className="text-blue-400" />
                  <p className="text-xs text-blue-400/70">This Month</p>
                </div>
                <p className="text-xl font-bold text-blue-400">{formatCurrency(stats.monthCollection)}</p>
              </div>
            </div>

            {/* Payment Mode Stats */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-2 border border-white/10 text-center">
                <p className="text-lg font-bold text-white">{formatCurrency(stats.todayCollection)}</p>
                <p className="text-[10px] text-white/50">Today</p>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-2 border border-white/10 text-center">
                <p className="text-lg font-bold text-white">{formatCurrency(stats.weekCollection)}</p>
                <p className="text-[10px] text-white/50">This Week</p>
              </div>
              <div className="bg-green-500/10 backdrop-blur-md rounded-xl p-2 border border-green-500/20 text-center">
                <p className="text-lg font-bold text-green-400">{formatCurrency(stats.cashTotal)}</p>
                <p className="text-[10px] text-green-400/70">💵 Cash</p>
              </div>
              <div className="bg-purple-500/10 backdrop-blur-md rounded-xl p-2 border border-purple-500/20 text-center">
                <p className="text-lg font-bold text-purple-400">{formatCurrency(stats.onlineTotal)}</p>
                <p className="text-[10px] text-purple-400/70">📱 Online</p>
              </div>
            </div>
          </>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search by member name or phone..."
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
          />
        </div>

        {/* Quick Date Filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3">
          {quickDateFilters.map((qf) => (
            <button
              key={qf.label}
              onClick={() => applyQuickDateFilter(qf.days)}
              className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
            >
              {qf.label}
            </button>
          ))}
          {(dateRange.startDate || dateRange.endDate) && (
            <button
              onClick={() => setDateRange({ startDate: '', endDate: '' })}
              className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-red-500/20 text-red-400 border border-red-500/30"
            >
              ✕ Clear
            </button>
          )}
        </div>

        {/* Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
          >
            <span className="flex items-center gap-2">
              <Filter size={16} className="text-green-400" />
              <span className="text-sm">{filterOptions.find(f => f.value === filter)?.icon} {filterOptions.find(f => f.value === filter)?.label}</span>
            </span>
            <ChevronRight size={16} className={`transform transition-transform ${showFilterDropdown ? 'rotate-90' : ''}`} />
          </button>
          
          <AnimatePresence>
            {showFilterDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-dark-card/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
              >
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => { setFilter(option.value); setShowFilterDropdown(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      filter === option.value
                        ? 'bg-green-500/20 text-green-400'
                        : 'text-white/70 hover:bg-white/5'
                    }`}
                  >
                    <span>{option.icon}</span>
                    <span className="text-sm">{option.label}</span>
                    {filter === option.value && <CheckCircle size={14} className="ml-auto" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Payments List */}
      <div className="px-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : payments.length === 0 ? (
          <GlassCard className="text-center py-8">
            <IndianRupee size={32} className="text-white/30 mx-auto mb-4" />
            <p className="text-white/50">No payments found</p>
            <p className="text-xs text-white/30 mt-2">Payments will appear here when recorded</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {payments.map((payment, index) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <GlassCard className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500/30 to-emerald-500/30 flex items-center justify-center">
                        {paymentModeIcons[payment.paymentMode] || <IndianRupee size={18} className="text-green-400" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{payment.memberName}</h3>
                        <div className="flex items-center gap-2 text-xs text-white/50 mt-0.5">
                          <Clock size={12} />
                          <span>{formatDate(payment.paidAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex items-start gap-2">
                      <div>
                        <p className="text-lg font-bold text-green-400">{formatCurrency(payment.amount)}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${paymentModeColors[payment.paymentMode] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                          {payment.paymentMode}
                        </span>
                      </div>
                      {isSuperAdmin && (
                        <button
                          onClick={() => handleDeletePayment(payment)}
                          disabled={deletingPaymentId === payment.id}
                          className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                          title="Delete payment"
                        >
                          {deletingPaymentId === payment.id ? (
                            <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                          ) : (
                            <Trash2 size={14} className="text-red-400" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Contact Details */}
                  {(payment.memberEmail || payment.memberPhone) && (
                    <div className="mt-2 flex flex-wrap gap-3 text-xs">
                      {payment.memberPhone && (
                        <span className="inline-flex items-center gap-1 text-white/50">
                          <Phone size={12} className="text-blue-400" />
                          <span>{payment.memberPhone}</span>
                        </span>
                      )}
                      {payment.memberEmail && (
                        <span className="inline-flex items-center gap-1 text-white/50">
                          <Mail size={12} className="text-purple-400" />
                          <span className="truncate max-w-[180px]">{payment.memberEmail}</span>
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Plan and Notes */}
                  {(payment.planName || payment.notes) && (
                    <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                      {payment.planName && (
                        <span className="text-white/50">
                          Plan: <span className="text-green-400/80 font-medium">{payment.planName}</span>
                        </span>
                      )}
                      {payment.notes && (
                        <span className="text-white/40 truncate max-w-[150px]">{payment.notes}</span>
                      )}
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
