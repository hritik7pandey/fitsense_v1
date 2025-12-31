'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Calendar, Clock, Flame, CheckCircle, AlertCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { motion } from 'framer-motion';

interface AttendanceRecord {
  id: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
}

interface AttendanceStats {
  totalDays: number;
  currentStreak: number;
  longestStreak: number;
}

export default function AttendancePage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttendance();
  }, [currentMonth]);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      
      const [attendanceData, statsData] = await Promise.all([
        apiClient.get(`/api/v1/attendance/my-attendance?year=${year}&month=${month}`),
        apiClient.get('/api/v1/attendance/stats')
      ]);
      
      setAttendance(Array.isArray(attendanceData) ? attendanceData : []);
      setStats(statsData);
    } catch (error: any) {
      console.error('Failed to load attendance:', error);
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    
    // Add empty slots for days before the 1st
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  const isAttendedDay = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return attendance.some(a => a.date.startsWith(dateStr));
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getFullYear() === currentMonth.getFullYear() &&
           today.getMonth() === currentMonth.getMonth() &&
           today.getDate() === day;
  };

  const isFuture = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date > new Date();
  };

  const monthYearLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const days = getDaysInMonth();
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="relative bg-gradient-to-b from-accent-blue/20 via-accent-purple/10 to-transparent pt-4 pb-8 px-4">
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent-blue/10 rounded-full blur-3xl pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold mb-1 text-white">Attendance</h1>
          <p className="text-sm text-white/50">Track your gym visits</p>
        </motion.div>
      </div>

      <div className="px-4 -mt-2 space-y-6">
        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3"
        >
          <GlassCard className="!p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-accent-blue/20 flex items-center justify-center mx-auto mb-2">
              <Calendar size={18} className="text-accent-blue" />
            </div>
            <p className="text-2xl font-bold text-white">{stats?.totalDays || 0}</p>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Total Days</p>
          </GlassCard>
          
          <GlassCard className="!p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center mx-auto mb-2">
              <Flame size={18} className="text-orange-400" />
            </div>
            <p className="text-2xl font-bold text-white">{stats?.currentStreak || 0}</p>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Current Streak</p>
          </GlassCard>
          
          <GlassCard className="!p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-2">
              <CheckCircle size={18} className="text-green-400" />
            </div>
            <p className="text-2xl font-bold text-white">{stats?.longestStreak || 0}</p>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Best Streak</p>
          </GlassCard>
        </motion.div>

        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard className="!p-5">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={prevMonth}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <h3 className="font-bold text-white">{monthYearLabel}</h3>
              <button 
                onClick={nextMonth}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Day Labels */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayLabels.map((label, i) => (
                <div key={i} className="text-center text-xs font-semibold text-white/30 py-2">
                  {label}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            {loading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="animate-spin text-accent-blue" size={24} />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => (
                  <div 
                    key={index}
                    className={`aspect-square flex items-center justify-center rounded-lg relative ${
                      day === null ? '' :
                      isAttendedDay(day) ? 'bg-gradient-to-br from-green-500/30 to-green-600/20 border border-green-500/30' :
                      isToday(day) ? 'bg-accent-blue/10 border border-accent-blue/30' :
                      isFuture(day) ? 'bg-white/[0.02] text-white/20' :
                      'bg-white/[0.02]'
                    }`}
                  >
                    {day !== null && (
                      <>
                        <span className={`text-sm font-medium ${
                          isAttendedDay(day) ? 'text-green-400' :
                          isToday(day) ? 'text-accent-blue' :
                          isFuture(day) ? 'text-white/20' :
                          'text-white/50'
                        }`}>
                          {day}
                        </span>
                        {isAttendedDay(day) && (
                          <CheckCircle size={10} className="absolute bottom-1 right-1 text-green-400" />
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-br from-green-500/30 to-green-600/20 border border-green-500/30" />
                <span className="text-xs text-white/40">Attended</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-accent-blue/10 border border-accent-blue/30" />
                <span className="text-xs text-white/40">Today</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-white/[0.02]" />
                <span className="text-xs text-white/40">Missed</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Recent Activity */}
        {attendance.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Recent Activity</h3>
            <GlassCard className="!p-0 divide-y divide-white/5">
              {attendance.slice(0, 5).map((record, index) => (
                <div key={record.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <CheckCircle size={18} className="text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-white">
                        {new Date(record.date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })}
                      </p>
                      <p className="text-xs text-white/40">
                        <Clock size={10} className="inline mr-1" />
                        {record.checkInTime}
                        {record.checkOutTime && ` - ${record.checkOutTime}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </GlassCard>
          </motion.div>
        )}
      </div>
    </div>
  );
}
