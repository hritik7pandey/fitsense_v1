'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { 
  Users, CreditCard, Dumbbell, Utensils, Calendar, TrendingUp, 
  ChevronRight, Sparkles, Plus, UserPlus, FileText, Megaphone, 
  Image, ClipboardList, Bell, ArrowUpRight, Activity, Clock, Shield, BarChart3
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';

// Super admin email for banner management
const SUPER_ADMIN_EMAIL = '224spy@gmail.com';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Check if current user is super admin
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;

  useEffect(() => {
    loadStats();
    
    // Update time every minute
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const loadStats = async () => {
    try {
      const data = await apiClient.get('/api/v1/admin/stats');
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Main stat cards with trends
  const mainStats = [
    { 
      label: 'Total Members', 
      value: stats?.totalMembers || 0,
      trend: '+12%',
      trendUp: true,
      icon: Users, 
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-500/10 to-cyan-500/5',
      path: '/app/admin/members'
    },
    { 
      label: 'Active Members', 
      value: stats?.activeMembers || 0, 
      trend: '+8%',
      trendUp: true,
      icon: TrendingUp, 
      gradient: 'from-emerald-500 to-green-500',
      bgGradient: 'from-emerald-500/10 to-green-500/5',
      path: '/app/admin/members?status=active'
    },
    { 
      label: 'Today\'s Check-ins', 
      value: stats?.todayCheckIns || 0, 
      trend: stats?.todayCheckIns > 0 ? 'Active' : 'None',
      trendUp: true,
      icon: Calendar, 
      gradient: 'from-violet-500 to-purple-500',
      bgGradient: 'from-violet-500/10 to-purple-500/5',
      path: '/app/admin/attendance'
    },
    { 
      label: 'Revenue', 
      value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`, 
      trend: '+23%',
      trendUp: true,
      icon: CreditCard, 
      gradient: 'from-amber-500 to-orange-500',
      bgGradient: 'from-amber-500/10 to-orange-500/5',
      path: '/app/admin/reports'
    },
  ];

  // Management modules
  const modules = [
    {
      title: 'Member Management',
      items: [
        { label: 'All Members', desc: 'View and manage members', icon: Users, path: '/app/admin/members', color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { label: 'Member Registry', desc: 'Manual records & payments', icon: ClipboardList, path: '/app/admin/member-registry', color: 'text-pink-400', bg: 'bg-pink-500/10' },
        { label: 'Add Member', desc: 'Register new member', icon: UserPlus, path: '/app/admin/members/new', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
      ]
    },
    {
      title: 'Financial',
      items: [
        { label: 'Payment History', desc: 'All transactions', icon: CreditCard, path: '/app/admin/payments', color: 'text-green-400', bg: 'bg-green-500/10' },
        { label: 'Plans & Pricing', desc: 'Membership plans', icon: BarChart3, path: '/app/admin/plans', color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { label: 'Reports', desc: 'Analytics & exports', icon: FileText, path: '/app/admin/reports', color: 'text-purple-400', bg: 'bg-purple-500/10' },
      ]
    },
    {
      title: 'Operations',
      items: [
        { label: 'Attendance', desc: 'Today\'s check-ins', icon: Calendar, path: '/app/admin/attendance', color: 'text-violet-400', bg: 'bg-violet-500/10' },
        { label: 'Announcements', desc: 'Notify members', icon: Megaphone, path: '/app/admin/announcements', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
        ...(isSuperAdmin ? [{ label: 'Ad Banners', desc: 'Manage promotions', icon: Image, path: '/app/admin/ads', color: 'text-rose-400', bg: 'bg-rose-500/10' }] : []),
      ]
    },
  ];

  // AI Tools
  const aiTools = [
    { 
      label: 'AI Workout Generator', 
      desc: 'Create personalized workout plans using AI', 
      icon: Dumbbell, 
      path: '/app/admin/workout/ai-generate',
      gradient: 'from-orange-500/20 via-red-500/10 to-transparent',
      iconGradient: 'from-orange-400 to-red-500'
    },
    { 
      label: 'AI Diet Planner', 
      desc: 'Generate customized nutrition plans', 
      icon: Utensils, 
      path: '/app/admin/diet/ai-generate',
      gradient: 'from-emerald-500/20 via-green-500/10 to-transparent',
      iconGradient: 'from-emerald-400 to-green-500'
    },
  ];

  // Quick create buttons
  const quickCreate = [
    { label: 'New Member', icon: UserPlus, path: '/app/admin/members/new', color: 'from-blue-500 to-cyan-500' },
    { label: 'New Plan', icon: Plus, path: '/app/admin/plans', color: 'from-purple-500 to-pink-500' },
    { label: 'Custom Workout', icon: Dumbbell, path: '/app/admin/workout/create', color: 'from-orange-500 to-red-500' },
    { label: 'Custom Diet', icon: Utensils, path: '/app/admin/diet/create', color: 'from-green-500 to-emerald-500' },
  ];

  return (
    <div className="min-h-screen pb-24">
      {/* Welcome Header */}
      <div className="relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-purple-600/10 to-transparent" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-blue-500/20 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-pink-500/10 to-orange-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative px-4 pt-6 pb-8">
          {/* Security indicator */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-4 flex-wrap"
          >
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] font-medium text-green-400">Secure Session</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
              <Clock size={10} className="text-white/40" />
              <span className="text-[10px] font-medium text-white/40">
                {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {isSuperAdmin && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                <Shield size={10} className="text-amber-400" />
                <span className="text-[10px] font-medium text-amber-400">Super Admin</span>
              </div>
            )}
          </motion.div>

          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-3xl font-bold text-white mb-1">
              {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{user?.name?.split(' ')[0] || 'Admin'}</span>
            </h1>
            <p className="text-white/50 text-sm">Here's your gym overview for today</p>
          </motion.div>
        </div>
      </div>

      <div className="px-4 -mt-2 space-y-6">
        {/* Quick Create Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar"
        >
          {quickCreate.map((item, i) => (
            <button
              key={i}
              onClick={() => router.push(item.path)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r ${item.color} text-white font-medium text-sm shadow-lg active:scale-95 transition-transform`}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </motion.div>

        {/* Main Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-white/40 uppercase tracking-wider">Overview</h2>
            <button 
              onClick={loadStats}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <Activity size={12} />
              Refresh
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {mainStats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * i }}
              >
                <GlassCard 
                  className={`!p-4 cursor-pointer hover:scale-[1.02] transition-all bg-gradient-to-br ${stat.bgGradient} border-white/5`}
                  onClick={() => router.push(stat.path)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                      <stat.icon size={18} className="text-white" />
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-medium ${stat.trendUp ? 'text-green-400' : 'text-red-400'}`}>
                      <ArrowUpRight size={12} />
                      {stat.trend}
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white mb-0.5">
                    {loading ? (
                      <span className="inline-block w-16 h-7 bg-white/10 rounded animate-pulse" />
                    ) : (
                      stat.value
                    )}
                  </p>
                  <p className="text-xs text-white/50">{stat.label}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Management Modules */}
        {modules.map((module, moduleIndex) => (
          <motion.div
            key={module.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + moduleIndex * 0.05 }}
          >
            <h2 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">{module.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {module.items.map((item, i) => (
                <button
                  key={i}
                  onClick={() => router.push(item.path)}
                  className="group flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all active:scale-[0.98]"
                >
                  <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                    <item.icon size={18} className={item.color} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium text-sm text-white truncate">{item.label}</p>
                    <p className="text-xs text-white/40 truncate">{item.desc}</p>
                  </div>
                  <ChevronRight size={16} className="text-white/20 group-hover:text-white/40 transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>
          </motion.div>
        ))}

        {/* AI Tools Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-purple-400" />
            <h2 className="text-xs font-bold text-white/40 uppercase tracking-wider">AI-Powered Tools</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {aiTools.map((tool, i) => (
              <button
                key={i}
                onClick={() => router.push(tool.path)}
                className={`group relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br ${tool.gradient} border border-white/10 hover:border-white/20 transition-all active:scale-[0.98]`}
              >
                {/* Animated sparkle effect */}
                <div className="absolute top-2 right-2 opacity-30 group-hover:opacity-60 transition-opacity">
                  <Sparkles size={24} className="text-white animate-pulse" />
                </div>
                
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.iconGradient} flex items-center justify-center shadow-lg`}>
                    <tool.icon size={22} className="text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-white mb-1">{tool.label}</p>
                    <p className="text-xs text-white/50 leading-relaxed">{tool.desc}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-white/70 group-hover:text-white transition-colors">
                  <span>Get Started</span>
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-blue-400" />
              <h2 className="text-xs font-bold text-white/40 uppercase tracking-wider">Recent Activity</h2>
            </div>
            <button 
              onClick={() => router.push('/app/admin/reports')}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              View All
            </button>
          </div>
          <GlassCard className="!p-0 overflow-hidden">
            {loading ? (
              <div className="p-8 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white/20 border-t-blue-400 rounded-full animate-spin" />
              </div>
            ) : stats?.recentActivity?.length > 0 ? (
              <div className="divide-y divide-white/5">
                {stats.recentActivity.slice(0, 5).map((activity: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                      <Bell size={16} className="text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{activity.description}</p>
                      <p className="text-xs text-white/40">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                  <Activity size={20} className="text-white/20" />
                </div>
                <p className="text-white/40 text-sm">No recent activity</p>
                <p className="text-white/30 text-xs mt-1">Activities will appear here</p>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Security Tip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="pb-8"
        >
          <GlassCard className="!p-4 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Shield size={20} className="text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm">Security Tip</p>
                <p className="text-xs text-white/50 mt-0.5">Your session is protected. Always log out when using shared devices.</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
