'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DEFAULT_AVATAR } from '@/lib/constants';
import { User, Shield, ChevronRight, LogOut, Lock, Crown, Dumbbell, Utensils, Camera } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';

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
      {/* === OPTIMIZED BACKGROUND === */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        {/* Base dark layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a15] via-[#0f0f1a] to-[#0a0a12]" />
        
        {/* Static orbs - no animation for performance */}
        <div className="absolute -top-20 -left-20 w-[300px] h-[300px] bg-gradient-to-br from-accent-blue/20 via-accent-blue/5 to-transparent rounded-full blur-[80px]" />
        <div className="absolute top-1/4 -right-32 w-[350px] h-[350px] bg-gradient-to-br from-accent-purple/15 via-pink-500/5 to-transparent rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -left-32 w-[300px] h-[300px] bg-gradient-to-br from-cyan-500/10 via-teal-500/5 to-transparent rounded-full blur-[80px]" />
      </div>

      {/* === HEADER === */}
      <div className="relative pt-8 pb-16 px-4">
        {/* Header gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] via-transparent to-transparent" />
        
        <div className="flex flex-col items-center relative z-10">
          {/* Avatar */}
          <div className="relative mb-6">
            {/* Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent-blue via-accent-purple to-accent-glow rounded-full blur-xl opacity-40 scale-110" />
            
            {/* Avatar container */}
            <div className="w-28 h-28 rounded-full p-[3px] bg-gradient-to-br from-white/20 via-white/10 to-white/5 relative">
              <div className="w-full h-full rounded-full p-[3px] bg-gradient-to-br from-accent-blue/40 via-accent-purple/30 to-accent-glow/30">
                <div className="w-full h-full rounded-full bg-black/40 p-1">
                  <img 
                    src={profile?.avatarUrl || DEFAULT_AVATAR} 
                    className="w-full h-full rounded-full object-cover" 
                    alt="Profile" 
                  />
                </div>
              </div>
            </div>
            
            {/* Edit button */}
            <button 
              onClick={() => router.push('/app/profile/edit')}
              className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full flex items-center justify-center 
                         bg-white/10 backdrop-blur-xl border border-white/20 
                         active:scale-95 transition-transform"
            >
              <Camera size={16} className="text-white" />
            </button>
          </div>
          
          {/* Name */}
          <h2 className="text-2xl font-bold mb-2 text-white">
            {user?.name || 'User'}
          </h2>
          
          <p className="text-white/40 text-sm mb-4">
            {user?.email}
          </p>
          
          {/* Role Badge */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] backdrop-blur-xl rounded-full border border-white/10">
            <Crown size={14} className="text-yellow-400" />
            <span className="text-sm font-medium text-white/80">
              {user?.role === 'ADMIN' ? 'Administrator' : 'Premium Member'}
            </span>
          </div>
        </div>
      </div>

      {/* === CONTENT === */}
      <div className="px-4 -mt-4 space-y-5 relative z-10">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: profile?.heightCm || '--', label: 'Height (cm)', color: 'text-accent-blue', bg: 'bg-accent-blue/10' },
            { value: profile?.weightKg || '--', label: 'Weight (kg)', color: 'text-green-400', bg: 'bg-green-500/10' },
            { value: profile?.age || '--', label: 'Age (yrs)', color: 'text-accent-purple', bg: 'bg-accent-purple/10' },
          ].map((stat, i) => (
            <div key={i} className="p-4 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] text-center">
              <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center mx-auto mb-2`}>
                <span className={`${stat.color} font-bold text-lg`}>{stat.value}</span>
              </div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Dumbbell, label: 'My Workouts', desc: 'View plans', path: '/app/workout', color: 'text-accent-blue', bg: 'bg-accent-blue/10', border: 'border-accent-blue/20' },
            { icon: Utensils, label: 'My Diet', desc: 'Meal plans', path: '/app/diet', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
          ].map((action, i) => (
            <button 
              key={i}
              onClick={() => router.push(action.path)}
              className={`p-4 rounded-2xl text-left bg-white/[0.04] backdrop-blur-xl border ${action.border} active:scale-[0.98] transition-transform`}
            >
              <action.icon size={22} className={`${action.color} mb-3`} />
              <p className="font-semibold text-sm text-white">{action.label}</p>
              <p className="text-xs text-white/40">{action.desc}</p>
            </button>
          ))}
        </div>

        {/* Settings Sections */}
        {sections.map((section, i) => (
          <div key={i}>
            <h3 className="text-xs font-bold text-white/20 uppercase mb-3 ml-1 tracking-widest">{section.title}</h3>
            
            <div className="rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] overflow-hidden">
              {section.items.map((item, j) => (
                <button 
                  key={j}
                  onClick={() => router.push(item.path)}
                  className={`w-full p-4 flex items-center justify-between active:bg-white/[0.04] transition-colors ${j !== section.items.length - 1 ? 'border-b border-white/[0.04]' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl bg-white/[0.06] flex items-center justify-center ${item.color}`}>
                      <item.icon size={18} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm text-white/90">{item.label}</p>
                      <p className="text-xs text-white/30">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-white/15" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Logout Button */}
        <button 
          onClick={handleLogout} 
          className="w-full py-4 flex items-center justify-center gap-3 rounded-2xl bg-red-500/[0.06] border border-red-500/10 active:bg-red-500/[0.1] transition-colors"
        >
          <LogOut size={18} className="text-red-400" />
          <span className="font-medium text-red-400/80">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
