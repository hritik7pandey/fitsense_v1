'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { 
  ChevronLeft, FileText, Download, Users, CreditCard, 
  Calendar, TrendingUp, RefreshCw, Loader2, Filter, X
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { motion, AnimatePresence } from 'framer-motion';

interface ReportStats {
  totalMembers: number;
  activeMembers: number;
  expiredMembers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalCheckIns: number;
  avgCheckInsPerDay: number;
}

export default function AdminReportsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  
  // Date range filter state
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateFilterApplied, setDateFilterApplied] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  // Set default dates (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      let url = '/api/v1/admin/reports/stats';
      if (dateFilterApplied && startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }
      const data = await apiClient.get(url);
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyDateFilter = () => {
    setDateFilterApplied(true);
    setShowDateFilter(false);
    loadStats();
  };

  const clearDateFilter = () => {
    setDateFilterApplied(false);
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    setShowDateFilter(false);
    loadStats();
  };

  const exportReport = async (type: string) => {
    setExporting(type);
    try {
      let url = `/api/v1/admin/reports/export/${type}`;
      if (dateFilterApplied && startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }
      const response = await apiClient.get(url);
      
      // Create and download CSV
      const csvContent = response.csv || response;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const fileUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = fileUrl;
      const dateRange = dateFilterApplied ? `_${startDate}_to_${endDate}` : '';
      a.download = `${type}_report${dateRange}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(fileUrl);
    } catch (error) {
      console.error('Failed to export:', error);
      alert('Failed to export report');
    } finally {
      setExporting(null);
    }
  };

  const statCards = [
    { 
      label: 'Total Members', 
      value: stats?.totalMembers || 0, 
      icon: Users, 
      color: 'text-accent-blue',
      bg: 'bg-accent-blue/10'
    },
    { 
      label: 'Active Members', 
      value: stats?.activeMembers || 0, 
      icon: TrendingUp, 
      color: 'text-green-400',
      bg: 'bg-green-500/10'
    },
    { 
      label: 'Expired Members', 
      value: stats?.expiredMembers || 0, 
      icon: Calendar, 
      color: 'text-red-400',
      bg: 'bg-red-500/10'
    },
    { 
      label: 'Total Revenue', 
      value: `₹${stats?.totalRevenue || 0}`, 
      icon: CreditCard, 
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10'
    },
  ];

  const exportOptions = [
    { 
      type: 'members', 
      label: 'Members Report', 
      desc: 'Export all member data with contact info and membership status',
      icon: Users,
      color: 'text-accent-blue'
    },
    { 
      type: 'attendance', 
      label: 'Attendance Report', 
      desc: 'Export attendance records with check-in/out times',
      icon: Calendar,
      color: 'text-green-400'
    },
    { 
      type: 'revenue', 
      label: 'Revenue Report', 
      desc: 'Export payment and membership revenue data',
      icon: CreditCard,
      color: 'text-yellow-400'
    },
  ];

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="relative bg-gradient-to-b from-yellow-500/20 via-accent-blue/10 to-transparent pt-4 pb-8 px-4">
        <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={() => router.push('/app/admin')} 
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Reports</h1>
            <p className="text-xs text-white/50">Analytics & exports</p>
          </div>
          <button
            onClick={() => setShowDateFilter(true)}
            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${
              dateFilterApplied 
                ? 'bg-accent-blue text-white border-accent-blue' 
                : 'bg-white/5 border-white/10 text-white/60'
            }`}
          >
            <Filter size={18} />
          </button>
          <button
            onClick={loadStats}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
          >
            <RefreshCw size={18} className={`text-white/60 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Date Filter Badge */}
        {dateFilterApplied && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 bg-accent-blue/20 border border-accent-blue/30 rounded-xl px-3 py-2 mt-2"
          >
            <Calendar size={14} className="text-accent-blue" />
            <span className="text-xs text-accent-blue font-medium">
              {startDate} to {endDate}
            </span>
            <button 
              onClick={clearDateFilter}
              className="ml-auto p-1 rounded-full hover:bg-white/10"
            >
              <X size={14} className="text-white/60" />
            </button>
          </motion.div>
        )}
      </div>

      {/* Date Filter Modal */}
      <AnimatePresence>
        {showDateFilter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center"
            onClick={() => setShowDateFilter(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full max-w-md bg-secondary rounded-t-3xl p-6 border-t border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Custom Date Range</h3>
                <button 
                  onClick={() => setShowDateFilter(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-white/40 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-accent-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-2">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-accent-blue"
                  />
                </div>

                {/* Quick Select Options */}
                <div className="pt-2">
                  <p className="text-xs text-white/40 mb-2">Quick Select</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Today', days: 0 },
                      { label: 'Last 7 days', days: 7 },
                      { label: 'Last 30 days', days: 30 },
                      { label: 'Last 90 days', days: 90 },
                      { label: 'This Year', days: 365 },
                    ].map((option) => (
                      <button
                        key={option.label}
                        onClick={() => {
                          const end = new Date();
                          const start = new Date(end.getTime() - option.days * 24 * 60 * 60 * 1000);
                          setEndDate(end.toISOString().split('T')[0]);
                          setStartDate(start.toISOString().split('T')[0]);
                        }}
                        className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white/70 hover:bg-white/10 transition-colors"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <GlassButton 
                    onClick={clearDateFilter} 
                    className="flex-1"
                  >
                    Clear
                  </GlassButton>
                  <GlassButton 
                    onClick={applyDateFilter}
                    className="flex-1 !bg-accent-blue"
                  >
                    Apply Filter
                  </GlassButton>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 -mt-2 space-y-6">
        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Overview</h3>
          <div className="grid grid-cols-2 gap-3">
            {statCards.map((stat, index) => (
              <GlassCard key={index} className="!p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <stat.icon size={18} className={stat.color} />
                  </div>
                  <div>
                    <p className={`text-lg font-bold ${stat.color}`}>
                      {loading ? '-' : stat.value}
                    </p>
                    <p className="text-[10px] text-white/40">{stat.label}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </motion.div>

        {/* Monthly Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">This Month</h3>
          <GlassCard className="!p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-white/40 text-xs mb-1">Monthly Revenue</p>
                <p className="text-2xl font-bold text-green-400">
                  ₹{loading ? '-' : stats?.monthlyRevenue || 0}
                </p>
              </div>
              <div>
                <p className="text-white/40 text-xs mb-1">Avg. Daily Check-ins</p>
                <p className="text-2xl font-bold text-accent-blue">
                  {loading ? '-' : stats?.avgCheckInsPerDay?.toFixed(1) || 0}
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Export Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Export Reports</h3>
          <div className="space-y-3">
            {exportOptions.map((option, index) => (
              <GlassCard key={index} className="!p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                      <option.icon size={20} className={option.color} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-white">{option.label}</h4>
                      <p className="text-xs text-white/40">{option.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => exportReport(option.type)}
                    disabled={exporting === option.type}
                    className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    {exporting === option.type ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Download size={18} />
                    )}
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        </motion.div>

        {/* Info Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center pt-4"
        >
          <p className="text-xs text-white/40">
            Reports are exported in CSV format for easy analysis
          </p>
        </motion.div>
      </div>
    </div>
  );
}
