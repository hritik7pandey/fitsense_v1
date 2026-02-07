'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassInput } from '@/components/ui/GlassInput';
import { GlassButton } from '@/components/ui/GlassButton';
import { 
  ChevronLeft, Search, Users, UserPlus, ChevronRight, 
  Crown, CheckCircle, XCircle, Clock, Filter, Ban, MessageCircle
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { DEFAULT_AVATAR } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';

interface Member {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  phone?: string;
  role: string;
  isBlocked?: boolean;
  membership?: {
    status: string;
    plan?: { name: string };
    endDate: string;
  };
}

export default function AdminMembersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get('status')?.toUpperCase() || 'ALL'
  );

  useEffect(() => {
    loadMembers();
  }, []);

  // Update filter when URL changes
  useEffect(() => {
    const status = searchParams.get('status');
    if (status) {
      setStatusFilter(status.toUpperCase());
    }
  }, [searchParams]);

  const loadMembers = async () => {
    try {
      const data = await apiClient.get('/api/v1/admin/members');
      setMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(member => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = member.name.toLowerCase().includes(searchLower) ||
                         member.email.toLowerCase().includes(searchLower) ||
                         (member.phone && member.phone.includes(searchQuery));
    
    if (statusFilter === 'ALL') return matchesSearch;
    if (statusFilter === 'ACTIVE') return matchesSearch && member.membership?.status === 'ACTIVE';
    if (statusFilter === 'EXPIRED') return matchesSearch && member.membership?.status === 'EXPIRED';
    if (statusFilter === 'BLOCKED') return matchesSearch && (member.isBlocked || member.membership?.status === 'BLOCKED');
    if (statusFilter === 'NONE') return matchesSearch && !member.membership;
    return matchesSearch;
  });

  const getStatusBadge = (member: Member) => {
    if (member.isBlocked) {
      return { label: 'Blocked', color: 'text-red-400', bg: 'bg-red-500/20', icon: Ban };
    }
    if (!member.membership) {
      return { label: 'No Plan', color: 'text-gray-400', bg: 'bg-gray-500/20', icon: Clock };
    }
    switch (member.membership.status) {
      case 'ACTIVE':
        return { label: 'Active', color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle };
      case 'EXPIRED':
        return { label: 'Expired', color: 'text-orange-400', bg: 'bg-orange-500/20', icon: XCircle };
      case 'BLOCKED':
        return { label: 'Blocked', color: 'text-red-400', bg: 'bg-red-500/20', icon: Ban };
      default:
        return { label: member.membership.status, color: 'text-gray-400', bg: 'bg-gray-500/20', icon: Clock };
    }
  };

  const filterOptions = [
    { value: 'ALL', label: 'All Members' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'EXPIRED', label: 'Expired' },
    { value: 'BLOCKED', label: 'Blocked' },
    { value: 'NONE', label: 'No Membership' },
  ];

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="relative bg-gradient-to-b from-accent-blue/20 via-accent-purple/10 to-transparent pt-4 pb-8 px-4">
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent-blue/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={() => router.push('/app/admin')} 
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Members</h1>
            <p className="text-xs text-white/50">{members.length} total members</p>
          </div>
          <button 
            onClick={() => router.push('/app/admin/members/new')}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center shadow-lg"
          >
            <UserPlus size={18} className="text-white" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-accent-blue/50"
          />
        </div>
      </div>

      <div className="px-4 -mt-2">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === option.value
                  ? 'bg-accent-blue text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Members List */}
        {loading ? (
          <GlassCard className="!p-8 text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-white/10 rounded w-3/4 mx-auto mb-2" />
              <div className="h-4 bg-white/10 rounded w-1/2 mx-auto" />
            </div>
          </GlassCard>
        ) : filteredMembers.length === 0 ? (
          <GlassCard className="!p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Users size={28} className="text-white/20" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-white">No Members Found</h3>
            <p className="text-white/50 text-sm">
              {searchQuery ? 'Try a different search term' : 'Add your first member to get started'}
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredMembers.map((member, index) => {
                const status = getStatusBadge(member);
                const StatusIcon = status.icon;
                
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <GlassCard 
                      className="!p-5 cursor-pointer hover:bg-white/[0.08] transition-colors"
                      onClick={() => router.push(`/app/admin/members/${member.id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img 
                            src={member.avatarUrl || DEFAULT_AVATAR} 
                            alt={member.name}
                            className="w-14 h-14 rounded-full object-cover border-2 border-white/10"
                          />
                          {member.role === 'ADMIN' && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                              <Crown size={12} className="text-yellow-900" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-base text-white truncate">{member.name}</h4>
                            <div className={`px-2.5 py-1 rounded-full ${status.bg} flex items-center gap-1.5`}>
                              <StatusIcon size={12} className={status.color} />
                              <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                            </div>
                          </div>
                          <p className="text-sm text-white/50 truncate mt-0.5">{member.email}</p>
                          {member.membership?.plan && (
                            <p className="text-sm text-accent-blue mt-1 font-medium">{member.membership.plan.name}</p>
                          )}
                        </div>
                        <ChevronRight size={18} className="text-white/20 flex-shrink-0" />
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
