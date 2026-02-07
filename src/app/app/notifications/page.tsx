'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Bell, CheckCircle, AlertCircle, Info, Dumbbell, Utensils, Crown, Trash2, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDateIST, IST_TIMEZONE } from '@/lib/constants';

type NotificationType = 'WORKOUT' | 'DIET' | 'MEMBERSHIP' | 'GENERAL' | 'ALERT' | 'ANNOUNCEMENT';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get('/api/v1/notifications');
      // API returns { notifications: [...], pagination: {...} }
      setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
    } catch (error: any) {
      console.error('Failed to load notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await apiClient.post(`/api/v1/notifications/${id}/mark-read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.post('/api/v1/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await apiClient.delete(`/api/v1/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getTypeConfig = (type: NotificationType) => {
    switch (type) {
      case 'WORKOUT': return { icon: Dumbbell, color: 'text-accent-blue', bg: 'bg-accent-blue/10' };
      case 'DIET': return { icon: Utensils, color: 'text-green-400', bg: 'bg-green-500/10' };
      case 'MEMBERSHIP': return { icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/10' };
      case 'ALERT': return { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' };
      case 'ANNOUNCEMENT': return { icon: Bell, color: 'text-orange-400', bg: 'bg-orange-500/10' };
      default: return { icon: Info, color: 'text-accent-purple', bg: 'bg-accent-purple/10' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;
    return formatDateIST(date);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="relative bg-gradient-to-b from-accent-purple/20 via-accent-blue/10 to-transparent pt-4 pb-8 px-4">
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent-purple/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            <p className="text-sm text-white/50">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadNotifications}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 h-10 rounded-full bg-accent-blue/10 border border-accent-blue/30 flex items-center gap-2 text-accent-blue text-sm font-medium"
              >
                <CheckCircle size={16} />
                Mark all read
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-3">
        {loading ? (
          <GlassCard className="!p-8 text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-white/10 rounded w-3/4 mx-auto mb-2" />
              <div className="h-4 bg-white/10 rounded w-1/2 mx-auto" />
            </div>
          </GlassCard>
        ) : notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <GlassCard className="!p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Bell size={28} className="text-white/20" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-white">No Notifications</h3>
              <p className="text-white/50 text-sm">You're all caught up! Check back later.</p>
            </GlassCard>
          </motion.div>
        ) : (
          <AnimatePresence>
            {notifications.map((notification, index) => {
              const config = getTypeConfig(notification.type);
              const Icon = config.icon;
              
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <GlassCard 
                    className={`!p-4 relative overflow-hidden ${!notification.isRead ? 'border-l-2 border-l-accent-blue' : ''}`}
                    onClick={() => !notification.isRead && markAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon size={18} className={config.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className={`font-semibold text-sm ${notification.isRead ? 'text-white/70' : 'text-white'}`}>
                            {notification.title}
                          </h4>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="text-white/20 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <p className={`text-xs mb-2 ${notification.isRead ? 'text-white/40' : 'text-white/60'}`}>
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-white/30">{formatDate(notification.createdAt)}</p>
                      </div>
                    </div>
                    
                    {!notification.isRead && (
                      <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-accent-blue" />
                    )}
                  </GlassCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
