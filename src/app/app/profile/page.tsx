'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DEFAULT_AVATAR } from '@/lib/constants';
import { User, Shield, ChevronRight, LogOut, Lock, Crown, Dumbbell, Utensils, Camera, Sparkles, Star, Activity } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await apiClient.get('/api/v1/users/profile');
      setProfile(data);
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      setProfile(user);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const sections = [
    { 
      title: "Account",
      items: [
        { icon: User, label: "Personal Details", desc: "Update your info", path: "/app/profile/edit", color: "text-accent-blue" },
        { icon: Lock, label: "Security", desc: "Password & privacy", path: "/app/profile/security", color: "text-yellow-400" },
      ]
    },
    ...(user?.role === 'ADMIN' ? [{
      title: "Admin",
      items: [
        { icon: Shield, label: "Admin Dashboard", desc: "Manage gym", path: "/app/admin", color: "text-accent-purple" },
      ]
    }] : [])
  ];

  return (
    <div className="min-h-screen pb-24 relative overflow-hidden">
      {/* === PREMIUM FROSTED GLASS BACKGROUND === */}
      {/* Multiple layered glass orbs for depth */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        {/* Base dark layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a15] via-[#0f0f1a] to-[#0a0a12]" />
        
        {/* Animated floating orbs */}
        <motion.div 
          animate={{ 
            x: [0, 30, 0], 
            y: [0, -20, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -left-20 w-[400px] h-[400px] bg-gradient-to-br from-accent-blue/30 via-accent-blue/10 to-transparent rounded-full blur-[100px]" 
        />
        <motion.div 
          animate={{ 
            x: [0, -40, 0], 
            y: [0, 30, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-1/4 -right-32 w-[500px] h-[500px] bg-gradient-to-br from-accent-purple/25 via-pink-500/10 to-transparent rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            x: [0, 20, 0], 
            y: [0, -40, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 -left-32 w-[450px] h-[450px] bg-gradient-to-br from-cyan-500/20 via-teal-500/10 to-transparent rounded-full blur-[100px]" 
        />
        <motion.div 
          animate={{ 
            x: [0, -30, 0], 
            y: [0, 20, 0],
            scale: [1, 1.15, 1]
          }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute -bottom-20 right-1/4 w-[350px] h-[350px] bg-gradient-to-br from-rose-500/20 via-orange-500/10 to-transparent rounded-full blur-[90px]" 
        />
        
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
        
        {/* Noise texture for premium feel */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
        }} />
      </div>

      {/* === PREMIUM HEADER WITH MAXIMUM GLASS === */}
      <div className="relative pt-8 pb-16 px-4">
        {/* Header glass morphism layer */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] via-white/[0.01] to-transparent backdrop-blur-3xl" />
        
        {/* Decorative light beams */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-gradient-to-b from-accent-blue/10 via-accent-purple/5 to-transparent blur-[60px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center relative z-10"
        >
          {/* Premium Avatar with Glass Ring */}
          <div className="relative mb-6 group">
            {/* Outer glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent-blue via-accent-purple to-accent-glow rounded-full blur-xl opacity-50 scale-110 group-hover:opacity-70 transition-opacity" />
            
            {/* Glass ring */}
            <div className="w-32 h-32 rounded-full p-[3px] bg-gradient-to-br from-white/30 via-white/10 to-white/5 backdrop-blur-2xl relative">
              {/* Inner glass container */}
              <div className="w-full h-full rounded-full p-[3px] bg-gradient-to-br from-accent-blue/50 via-accent-purple/30 to-accent-glow/40 backdrop-blur-xl">
                <div className="w-full h-full rounded-full bg-black/30 backdrop-blur-xl p-1">
                  <img 
                    src={profile?.avatarUrl || DEFAULT_AVATAR} 
                    className="w-full h-full rounded-full object-cover" 
                    alt="Profile" 
                  />
                </div>
              </div>
            </div>
            
            {/* Edit button with glass effect */}
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/app/profile/edit')}
              className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full flex items-center justify-center 
                         bg-gradient-to-br from-white/20 via-white/10 to-white/5 
                         backdrop-blur-2xl border border-white/20 
                         shadow-lg shadow-accent-blue/20
                         hover:from-white/30 hover:via-white/15 hover:to-white/10 transition-all"
            >
              <Camera size={16} className="text-white" />
            </motion.button>
            
            {/* Sparkle effects */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-2 -right-2"
            >
              <Sparkles size={16} className="text-yellow-400/60" />
            </motion.div>
          </div>
          
          {/* Name with premium styling */}
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold mb-2 bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent"
          >
            {user?.name || 'User'}
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-white/40 text-sm mb-4 tracking-wide"
          >
            {user?.email}
          </motion.p>
          
          {/* Premium Role Badge with Glass */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-2 px-5 py-2 
                       bg-gradient-to-r from-white/[0.08] via-white/[0.04] to-white/[0.02]
                       backdrop-blur-2xl rounded-full 
                       border border-white/10 
                       shadow-lg shadow-black/20"
          >
            <Crown size={14} className="text-yellow-400" />
            <span className="text-sm font-medium text-white/80 tracking-wide">
              {user?.role === 'ADMIN' ? 'Administrator' : 'Premium Member'}
            </span>
            {user?.role !== 'ADMIN' && <Star size={12} className="text-yellow-400/60" />}
          </motion.div>
        </motion.div>
      </div>

      {/* === CONTENT WITH GLASS CARDS === */}
      <div className="px-4 -mt-4 space-y-6 relative z-10">
        
        {/* Premium Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { value: profile?.heightCm || '--', label: 'Height (cm)', color: 'from-accent-blue/30 to-accent-blue/5', iconColor: 'text-accent-blue' },
            { value: profile?.weightKg || '--', label: 'Weight (kg)', color: 'from-green-500/30 to-green-500/5', iconColor: 'text-green-400' },
            { value: profile?.age || '--', label: 'Age (yrs)', color: 'from-accent-purple/30 to-accent-purple/5', iconColor: 'text-accent-purple' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="relative group"
            >
              {/* Card glass background */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-transparent backdrop-blur-2xl border border-white/[0.08] shadow-xl shadow-black/10" />
              
              {/* Hover glow */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl`} />
              
              <div className="relative p-4 text-center">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} backdrop-blur-xl flex items-center justify-center mx-auto mb-2 border border-white/10`}>
                  <span className={`${stat.iconColor} font-bold text-lg`}>{stat.value}</span>
                </div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Premium Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-2 gap-3"
        >
          {[
            { icon: Dumbbell, label: 'My Workouts', desc: 'View plans', path: '/app/workout', gradient: 'from-accent-blue/20 via-accent-blue/5 to-transparent', iconColor: 'text-accent-blue', borderColor: 'border-accent-blue/20' },
            { icon: Utensils, label: 'My Diet', desc: 'Meal plans', path: '/app/diet', gradient: 'from-green-500/20 via-green-500/5 to-transparent', iconColor: 'text-green-400', borderColor: 'border-green-500/20' },
          ].map((action, i) => (
            <motion.button 
              key={i}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(action.path)}
              className={`relative p-4 rounded-2xl text-left group overflow-hidden`}
            >
              {/* Glass background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} backdrop-blur-2xl border ${action.borderColor} rounded-2xl`} />
              
              {/* Shine effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              
              <div className="relative">
                <action.icon size={22} className={`${action.iconColor} mb-3`} />
                <p className="font-semibold text-sm text-white">{action.label}</p>
                <p className="text-xs text-white/40">{action.desc}</p>
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* Premium Settings Sections */}
        {sections.map((section, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + i * 0.1 }}
          >
            <h3 className="text-xs font-bold text-white/20 uppercase mb-3 ml-1 tracking-[0.2em]">{section.title}</h3>
            
            {/* Glass Card Container */}
            <div className="relative rounded-2xl overflow-hidden">
              {/* Background glass */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent backdrop-blur-2xl border border-white/[0.06]" />
              
              <div className="relative">
                {section.items.map((item, j) => (
                  <motion.button 
                    key={j}
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                    onClick={() => router.push(item.path)}
                    className={`w-full p-4 flex items-center justify-between transition-colors relative ${j !== section.items.length - 1 ? 'border-b border-white/[0.05]' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br from-white/10 to-white/[0.02] backdrop-blur-xl flex items-center justify-center ${item.color} border border-white/10`}>
                        <item.icon size={18} />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-sm text-white/90">{item.label}</p>
                        <p className="text-xs text-white/30">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-white/15" />
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        ))}

        {/* Premium Logout Button */}
        <motion.button 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleLogout} 
          className="w-full py-4 flex items-center justify-center gap-3 relative rounded-2xl overflow-hidden group"
        >
          {/* Glass background */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.08] via-red-500/[0.03] to-transparent backdrop-blur-2xl border border-red-500/10 group-hover:from-red-500/[0.12] transition-colors" />
          
          <LogOut size={18} className="text-red-400 relative z-10" />
          <span className="font-medium text-red-400/80 relative z-10">Sign Out</span>
        </motion.button>
        
        {/* Activity indicator (decorative) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex items-center justify-center gap-2 py-4"
        >
          <Activity size={12} className="text-green-400/40" />
          <span className="text-[10px] text-white/20 tracking-wider">ONLINE</span>
        </motion.div>
      </div>
    </div>
  );
}
