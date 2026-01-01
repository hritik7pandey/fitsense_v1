'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { 
  ChevronLeft, Download, Calendar, Clock, User, 
  RefreshCw, Loader2, Filter, Search
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { motion } from 'framer-motion';

interface CheckIn {
  id: string;
  userId: number;
  userName: string;
  userEmail: string;
  checkInTime: string;
  checkOutTime?: string;
  date: string;
}

export default function CheckInsReportPage() {
  const router = useRouter();
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCheckIns();
  }, [dateFilter]);

  const loadCheckIns = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get(`/api/v1/admin/attendance?date=${dateFilter}`);
      setCheckIns(Array.isArray(data) ? data : data.attendance || []);
    } catch (error) {
      console.error('Failed to load check-ins:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    setExporting(true);
    try {
      const response = await apiClient.get(`/api/v1/admin/reports/export/attendance?date=${dateFilter}`);
      const csvContent = response.csv || response;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `checkins_${dateFilter}.csv`;
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

  const filteredCheckIns = checkIns.filter(c => 
    c.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.userEmail?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (time: string) => {
    if (!time) return '-';
    return new Date(time).toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const totalHours = checkIns.reduce((sum, c) => {
    if (c.checkInTime && c.checkOutTime) {
      const diff = new Date(c.checkOutTime).getTime() - new Date(c.checkInTime).getTime();
      return sum + diff / (1000 * 60 * 60);
    }
    return sum;
  }, 0);

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="relative bg-gradient-to-b from-accent-purple/20 via-purple-500/10 to-transparent pt-4 pb-8 px-4">
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent-purple/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => router.back()} 
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Check-ins Report</h1>
            <p className="text-sm text-white/50">Daily attendance records</p>
          </div>
          <button
            onClick={loadCheckIns}
            disabled={loading}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
          >
            <RefreshCw size={18} className={`text-white/60 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-center">
            <p className="text-2xl font-bold text-accent-purple">{checkIns.length}</p>
            <p className="text-xs text-white/60">📥 Check-ins</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-center">
            <p className="text-2xl font-bold text-green-400">
              {checkIns.filter(c => c.checkOutTime).length}
            </p>
            <p className="text-xs text-white/60">📤 Checked Out</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-center">
            <p className="text-2xl font-bold text-accent-blue">{totalHours.toFixed(1)}h</p>
            <p className="text-xs text-white/60">⏱️ Total Hours</p>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Filters */}
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-accent-purple"
            />
          </div>
          <GlassButton onClick={exportReport} disabled={exporting}>
            {exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          </GlassButton>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-accent-purple"
          />
        </div>

        {/* Check-ins List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-accent-purple" size={32} />
          </div>
        ) : filteredCheckIns.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-white/20 mb-4" />
            <p className="text-white/50">No check-ins for this date</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCheckIns.map((checkIn, index) => (
              <motion.div
                key={checkIn.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard className="!p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent-purple/20 flex items-center justify-center">
                      <User size={20} className="text-accent-purple" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{checkIn.userName}</p>
                      <p className="text-xs text-white/40 truncate">{checkIn.userEmail}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-green-400">{formatTime(checkIn.checkInTime)}</span>
                        <span className="text-white/30">→</span>
                        <span className={checkIn.checkOutTime ? 'text-red-400' : 'text-white/30'}>
                          {checkIn.checkOutTime ? formatTime(checkIn.checkOutTime) : 'Active'}
                        </span>
                      </div>
                      {checkIn.checkInTime && checkIn.checkOutTime && (
                        <p className="text-xs text-white/40 mt-1">
                          {((new Date(checkIn.checkOutTime).getTime() - new Date(checkIn.checkInTime).getTime()) / (1000 * 60 * 60)).toFixed(1)}h
                        </p>
                      )}
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
