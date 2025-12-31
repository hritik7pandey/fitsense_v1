'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { 
  Megaphone, Send, Clock, Users, CheckCircle, AlertCircle, 
  ChevronDown, RefreshCw, Bell
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDateTimeIST } from '@/lib/constants';

interface Announcement {
  title: string;
  message: string;
  createdAt: string;
  recipientCount: number;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [form, setForm] = useState({
    title: '',
    message: '',
    targetAudience: 'ALL' as 'ALL' | 'ACTIVE_MEMBERS' | 'EXPIRED_MEMBERS',
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get('/api/v1/admin/announcements');
      setAnnouncements(data.announcements || []);
    } catch (error) {
      console.error('Failed to load announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendAnnouncement = async () => {
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    if (form.title.length < 3 || form.title.length > 100) {
      setError('Title must be between 3 and 100 characters');
      return;
    }
    if (!form.message.trim()) {
      setError('Message is required');
      return;
    }
    if (form.message.length < 10 || form.message.length > 500) {
      setError('Message must be between 10 and 500 characters');
      return;
    }
    
    setError('');
    setSending(true);
    try {
      await apiClient.post('/api/v1/admin/announcements', form);
      setSuccess(true);
      setForm({ title: '', message: '', targetAudience: 'ALL' });
      loadAnnouncements();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to send announcement');
    } finally {
      setSending(false);
    }
  };

  const audienceOptions = [
    { value: 'ALL', label: 'All Members', desc: 'Send to everyone' },
    { value: 'ACTIVE_MEMBERS', label: 'Active Members', desc: 'Only members with active plans' },
    { value: 'EXPIRED_MEMBERS', label: 'Expired Members', desc: 'Members without active plans' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Megaphone className="text-accent-blue" />
            Announcements
          </h1>
          <p className="text-white/50 mt-1">Send notifications to your members</p>
        </div>
        <button
          onClick={loadAnnouncements}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Create Announcement */}
        <GlassCard className="h-fit">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
              <Send size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Create Announcement</h2>
              <p className="text-sm text-white/50">Compose and send to members</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <GlassInput
                label="Title *"
                placeholder="e.g., New Year Offer! 🎉"
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                maxLength={100}
              />
              <p className="text-xs text-white/40 mt-1">{form.title.length}/100 characters</p>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Message <span className="text-red-400">*</span>
              </label>
              <textarea
                placeholder="Write your announcement message here... (minimum 10 characters)"
                value={form.message}
                onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
                maxLength={500}
                rows={5}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.08] border border-white/[0.12] text-white placeholder:text-white/30 focus:outline-none focus:border-accent-blue/50 resize-none"
              />
              <p className="text-xs text-white/40 mt-1">{form.message.length}/500 characters (min 10)</p>
            </div>

            {/* Target Audience */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Target Audience
              </label>
              <div className="space-y-2">
                {audienceOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setForm(prev => ({ ...prev, targetAudience: option.value as any }))}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                      form.targetAudience === option.value
                        ? 'border-accent-blue bg-accent-blue/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{option.label}</p>
                        <p className="text-xs text-white/50">{option.desc}</p>
                      </div>
                      {form.targetAudience === option.value && (
                        <CheckCircle size={20} className="text-accent-blue" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400"
                >
                  <AlertCircle size={18} />
                  <p className="text-sm">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400"
                >
                  <CheckCircle size={18} />
                  <p className="text-sm">Announcement sent successfully!</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Send Button */}
            <GlassButton
              onClick={sendAnnouncement}
              disabled={sending || !form.title.trim() || form.message.length < 10}
              className="w-full flex items-center justify-center gap-2"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={18} />
                  Send Announcement
                </>
              )}
            </GlassButton>
          </div>
        </GlassCard>

        {/* Announcement History */}
        <GlassCard>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
              <Clock size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Announcement History</h2>
              <p className="text-sm text-white/50">Previously sent announcements</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-white/30 border-t-accent-blue rounded-full animate-spin" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-12">
              <Bell size={48} className="mx-auto text-white/20 mb-4" />
              <p className="text-white/50">No announcements yet</p>
              <p className="text-sm text-white/30">Send your first announcement!</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {announcements.map((announcement, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-semibold text-white">{announcement.title}</h3>
                    <span className="flex items-center gap-1 text-xs text-white/50 flex-shrink-0">
                      <Users size={12} />
                      {announcement.recipientCount}
                    </span>
                  </div>
                  <p className="text-sm text-white/70 mb-3">{announcement.message}</p>
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <Clock size={12} />
                    {formatDateTimeIST(announcement.createdAt)}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
