'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { 
  ChevronLeft, Download, CreditCard, IndianRupee, 
  RefreshCw, Loader2, Search, TrendingUp, Calendar
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { motion } from 'framer-motion';

interface Payment {
  id: string;
  amount: number;
  status: string;
  paymentMethod?: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
  plan?: {
    name: string;
  };
}

export default function RevenueReportPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadPayments();
  }, [startDate, endDate]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get(`/api/v1/admin/reports/revenue?startDate=${startDate}&endDate=${endDate}`);
      setPayments(Array.isArray(data) ? data : data.payments || []);
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    setExporting(true);
    try {
      const response = await apiClient.get(`/api/v1/admin/reports/export/revenue?startDate=${startDate}&endDate=${endDate}`);
      const csvContent = response.csv || response;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `revenue_${startDate}_to_${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export:', error);
      alert('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  const filteredPayments = payments.filter(p => 
    p.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.plan?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = payments.reduce((sum, p) => p.status === 'COMPLETED' ? sum + p.amount : sum, 0);
  const completedCount = payments.filter(p => p.status === 'COMPLETED').length;
  const pendingCount = payments.filter(p => p.status === 'PENDING').length;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="relative bg-gradient-to-b from-yellow-500/20 via-orange-500/10 to-transparent pt-4 pb-8 px-4">
        <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => router.back()} 
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Revenue Report</h1>
            <p className="text-sm text-white/50">Payment history & analytics</p>
          </div>
          <button
            onClick={loadPayments}
            disabled={loading}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
          >
            <RefreshCw size={18} className={`text-white/60 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-center">
            <p className="text-xl font-bold text-yellow-400">₹{totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-white/60">💰 Total Revenue</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-center">
            <p className="text-xl font-bold text-green-400">{completedCount}</p>
            <p className="text-xs text-white/60">✅ Completed</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-center">
            <p className="text-xl font-bold text-orange-400">{pendingCount}</p>
            <p className="text-xs text-white/60">⏳ Pending</p>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Date Filters */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs text-white/50 mb-1">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-yellow-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-white/50 mb-1">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-yellow-500"
            />
          </div>
          <div className="flex items-end">
            <GlassButton onClick={exportReport} disabled={exporting} className="!py-2.5">
              {exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            </GlassButton>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search by name, email or plan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-yellow-500"
          />
        </div>

        {/* Payments List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-yellow-400" size={32} />
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard size={48} className="mx-auto text-white/20 mb-4" />
            <p className="text-white/50">No payments found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPayments.map((payment, index) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <GlassCard className="!p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      payment.status === 'COMPLETED' ? 'bg-green-500/20' : 'bg-orange-500/20'
                    }`}>
                      <IndianRupee size={20} className={
                        payment.status === 'COMPLETED' ? 'text-green-400' : 'text-orange-400'
                      } />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{payment.user?.name || 'Unknown'}</p>
                      <p className="text-xs text-white/40 truncate">{payment.plan?.name || 'N/A'}</p>
                      <p className="text-xs text-white/30 mt-1">{formatDate(payment.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">₹{payment.amount.toLocaleString()}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        payment.status === 'COMPLETED' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-orange-500/20 text-orange-400'
                      }`}>
                        {payment.status}
                      </span>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
