'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { 
  ChevronLeft, Calendar, Search, CheckCircle, Clock, 
  User, ChevronRight, Filter, RefreshCw
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { DEFAULT_AVATAR, formatTimeIST, formatDateIST, IST_TIMEZONE } from '@/lib/constants';
import { motion } from 'framer-motion';

interface AttendanceRecord {
  id: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

export default function AdminAttendancePage() {
  const router = useRouter();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadAttendance();
  }, [selectedDate]);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get(`/api/v1/admin/attendance?date=${selectedDate}`);
      setAttendance(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load attendance:', error);
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString: string) => {
    try {
      return formatTimeIST(timeString);
    } catch {
      return timeString;
    }
  };

  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateString === today.toISOString().split('T')[0]) return 'Today';
    if (dateString === yesterday.toISOString().split('T')[0]) return 'Yesterday';
    return formatDateIST(date, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="relative bg-gradient-to-b from-accent-purple/20 via-accent-blue/10 to-transparent pt-4 pb-8 px-4">
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent-purple/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={() => router.push('/app/admin')} 
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Attendance</h1>
            <p className="text-xs text-white/50">{formatDateDisplay(selectedDate)}</p>
          </div>
          <button
            onClick={loadAttendance}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
          >
            <RefreshCw size={18} className={`text-white/60 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Date Picker */}
        <div className="relative">
          <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent-blue/50"
          />
        </div>
      </div>

      <div className="px-4 -mt-2 space-y-4">
        {/* Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-3"
        >
          <GlassCard className="!p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <CheckCircle size={18} className="text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{attendance.length}</p>
                <p className="text-xs text-white/40">Check-ins</p>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="!p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-blue/20 flex items-center justify-center">
                <Clock size={18} className="text-accent-blue" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {attendance.filter(a => a.checkOutTime).length}
                </p>
                <p className="text-xs text-white/40">Check-outs</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Attendance List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">
            Attendance Records
          </h3>

          {loading ? (
            <GlassCard className="!p-8 text-center">
              <div className="animate-pulse">
                <div className="h-4 bg-white/10 rounded w-3/4 mx-auto mb-2" />
                <div className="h-4 bg-white/10 rounded w-1/2 mx-auto" />
              </div>
            </GlassCard>
          ) : attendance.length === 0 ? (
            <GlassCard className="!p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Calendar size={28} className="text-white/20" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-white">No Records</h3>
              <p className="text-white/50 text-sm">No attendance records for this date</p>
            </GlassCard>
          ) : (
            <GlassCard className="!p-0 divide-y divide-white/5">
              {attendance.map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/members/${record.user.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={record.user.avatarUrl || DEFAULT_AVATAR}
                      alt={record.user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-sm text-white">{record.user.name}</p>
                      <p className="text-xs text-white/40">{record.user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <CheckCircle size={12} className="text-green-400" />
                        <span className="text-xs text-green-400">{formatTime(record.checkInTime)}</span>
                      </div>
                      {record.checkOutTime && (
                        <>
                          <span className="text-white/20">→</span>
                          <div className="flex items-center gap-1">
                            <Clock size={12} className="text-accent-blue" />
                            <span className="text-xs text-accent-blue">{formatTime(record.checkOutTime)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </GlassCard>
          )}
        </motion.div>
      </div>
    </div>
  );
}
