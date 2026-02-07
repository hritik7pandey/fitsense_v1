'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { 
  ChevronLeft, Download, Users, UserX, UserCheck, 
  IndianRupee, RefreshCw, Loader2, FileSpreadsheet,
  Calendar, CreditCard, X, Filter
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { motion, AnimatePresence } from 'framer-motion';

interface ReportStats {
  totalMembers: number;
  activeMembers: number;
  expiredMembers: number;
  pendingMembers: number;
  pendingAmount: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: string;
  reportTitle: string;
  onExport: (startDate: string, endDate: string) => void;
  exporting: boolean;
}

function FilterModal({ isOpen, onClose, reportType, reportTitle, onExport, exporting }: FilterModalProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    // Set default dates (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, [isOpen]);

  const quickSelect = (days: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            className="w-full max-w-md bg-secondary rounded-2xl border border-white/10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-blue/20 flex items-center justify-center">
                  <Filter size={18} className="text-accent-blue" />
                </div>
                <div>
                  <h3 className="font-bold text-white">{reportTitle}</h3>
                  <p className="text-xs text-white/70">Select date range to export</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X size={16} className="text-white/60" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Date Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/70 mb-2 font-medium">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-accent-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/70 mb-2 font-medium">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-accent-blue"
                  />
                </div>
              </div>

              {/* Quick Select */}
              <div>
                <p className="text-xs text-white/70 mb-2 font-medium">Quick Select</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Today', days: 0 },
                    { label: '7 days', days: 7 },
                    { label: '30 days', days: 30 },
                    { label: '90 days', days: 90 },
                    { label: 'This Year', days: 365 },
                  ].map((option) => (
                    <button
                      key={option.label}
                      onClick={() => quickSelect(option.days)}
                      className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white/80 hover:bg-white/10 hover:text-white transition-colors font-medium"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Export Options */}
              <div className="pt-2 space-y-2">
                <GlassButton
                  onClick={() => onExport(startDate, endDate)}
                  disabled={exporting}
                  className="w-full !bg-accent-blue flex items-center justify-center gap-2"
                >
                  {exporting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Download size={16} />
                  )}
                  <span>Export with Date Filter</span>
                </GlassButton>
                
                <GlassButton
                  onClick={() => onExport('', '')}
                  disabled={exporting}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {exporting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <FileSpreadsheet size={16} />
                  )}
                  <span>Export All Data</span>
                </GlassButton>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function AdminReportsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [filterModal, setFilterModal] = useState<{ isOpen: boolean; reportId: string; title: string }>({
    isOpen: false,
    reportId: '',
    title: '',
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get('/api/v1/admin/reports/stats');
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const openFilterModal = (reportId: string, title: string) => {
    setFilterModal({ isOpen: true, reportId, title });
  };

  const closeFilterModal = () => {
    setFilterModal({ isOpen: false, reportId: '', title: '' });
  };

  const exportReport = async (startDate: string, endDate: string) => {
    const type = filterModal.reportId;
    setExporting(type);
    try {
      let url = `/api/v1/admin/reports/export/${type}`;
      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }
      const response = await apiClient.get(url);
      
      const csvContent = response.csv || response;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const fileUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = fileUrl;
      const dateRange = startDate && endDate ? `_${startDate}_to_${endDate}` : '';
      a.download = `${type}_report${dateRange}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(fileUrl);
      closeFilterModal();
    } catch (error) {
      console.error('Failed to export:', error);
      alert('Failed to export report');
    } finally {
      setExporting(null);
    }
  };

  const reportCards = [
    {
      id: 'members',
      title: 'Total Members',
      subtitle: 'All registered members',
      value: stats?.totalMembers || 0,
      icon: Users,
      gradient: 'from-blue-500 to-cyan-500',
      bgGlow: 'bg-blue-500/20',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
    },
    {
      id: 'active',
      title: 'Active Members',
      subtitle: 'Members with valid membership',
      value: stats?.activeMembers || 0,
      icon: UserCheck,
      gradient: 'from-green-500 to-emerald-500',
      bgGlow: 'bg-green-500/20',
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-400',
    },
    {
      id: 'expired',
      title: 'Expired Members',
      subtitle: 'Members needing renewal',
      value: stats?.expiredMembers || 0,
      icon: UserX,
      gradient: 'from-red-500 to-orange-500',
      bgGlow: 'bg-red-500/20',
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-400',
    },
    {
      id: 'pending',
      title: 'Pending Amount',
      subtitle: 'Revenue from expired memberships',
      value: `₹${(stats?.pendingAmount || 0).toLocaleString()}`,
      displayValue: true,
      icon: IndianRupee,
      gradient: 'from-yellow-500 to-amber-500',
      bgGlow: 'bg-yellow-500/20',
      iconBg: 'bg-yellow-500/20',
      iconColor: 'text-yellow-400',
    },
    {
      id: 'attendance',
      title: 'Attendance Report',
      subtitle: 'Check-in/out records',
      value: 'All Records',
      displayValue: true,
      icon: Calendar,
      gradient: 'from-purple-500 to-violet-500',
      bgGlow: 'bg-purple-500/20',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400',
    },
    {
      id: 'revenue',
      title: 'Revenue Report',
      subtitle: 'Detailed payment history',
      value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`,
      displayValue: true,
      icon: CreditCard,
      gradient: 'from-teal-500 to-cyan-500',
      bgGlow: 'bg-teal-500/20',
      iconBg: 'bg-teal-500/20',
      iconColor: 'text-teal-400',
    },
  ];

  return (
    <div className="min-h-screen pb-24">
      {/* Filter Modal */}
      <FilterModal
        isOpen={filterModal.isOpen}
        onClose={closeFilterModal}
        reportType={filterModal.reportId}
        reportTitle={filterModal.title}
        onExport={exportReport}
        exporting={exporting === filterModal.reportId}
      />

      {/* Header */}
      <div className="relative bg-gradient-to-b from-purple-500/20 via-accent-blue/10 to-transparent pt-4 pb-8 px-4">
        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => router.push('/app/admin')} 
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Reports</h1>
            <p className="text-sm text-white/50">Download member reports</p>
          </div>
          <button
            onClick={loadStats}
            disabled={loading}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <RefreshCw size={18} className={`text-white/60 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <p className="text-xs text-white/40 mb-1">Total Revenue</p>
            <p className="text-xl font-bold text-green-400">
              ₹{loading ? '...' : (stats?.totalRevenue || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <p className="text-xs text-white/40 mb-1">This Month</p>
            <p className="text-xl font-bold text-accent-blue">
              ₹{loading ? '...' : (stats?.monthlyRevenue || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Report Cards */}
      <div className="px-4 -mt-2 space-y-4">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">
          Download Reports
        </h3>
        
        {reportCards.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard className="!p-0 overflow-hidden">
              <div className="relative">
                {/* Background glow */}
                <div className={`absolute top-0 right-0 w-32 h-32 ${card.bgGlow} rounded-full blur-3xl opacity-50 pointer-events-none`} />
                
                <div className="relative p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-2xl ${card.iconBg} flex items-center justify-center`}>
                      <card.icon size={28} className={card.iconColor} />
                    </div>
                    <button
                      onClick={() => openFilterModal(card.id, card.title)}
                      disabled={loading}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${card.gradient} text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50`}
                    >
                      <Download size={16} />
                      <span>Export</span>
                    </button>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white">{card.title}</h3>
                    <p className="text-xs text-white/40">{card.subtitle}</p>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs text-white/40 mb-1">Count / Amount</p>
                        <p className={`text-3xl font-bold bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent`}>
                          {loading ? '...' : (card.displayValue ? card.value : card.value)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-white/30">
                        <FileSpreadsheet size={14} />
                        <span className="text-xs">CSV</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}

        {/* Info Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center pt-6 pb-4"
        >
          <p className="text-xs text-white/30">
            Reports are exported in CSV format for easy analysis in Excel or Google Sheets
          </p>
        </motion.div>
      </div>
    </div>
  );
}
