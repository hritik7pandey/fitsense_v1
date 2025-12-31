'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { 
  Users, CreditCard, Dumbbell, Utensils, Calendar, TrendingUp, 
  ChevronRight, Sparkles, Plus, UserPlus, FileText, Settings, Megaphone, Send, X, Check, Image, Upload, Trash2, Eye
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';

// Super admin email for banner management
const SUPER_ADMIN_EMAIL = '224spy@gmail.com';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    targetAudience: 'ALL' as 'ALL' | 'ACTIVE_MEMBERS' | 'EXPIRED_MEMBERS',
  });
  const [bannerForm, setBannerForm] = useState({
    imageUrl: '',
    title: '',
    description: '',
    linkUrl: '',
    targetPages: ['all'],
    startDate: '',
    endDate: '',
    isActive: true,
  });
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [announcementSuccess, setAnnouncementSuccess] = useState(false);
  const [bannerSuccess, setBannerSuccess] = useState(false);
  const [uploadType, setUploadType] = useState<'url' | 'file'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');
  const [showManageBannersModal, setShowManageBannersModal] = useState(false);
  const [activeBanners, setActiveBanners] = useState<any[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(false);
  const [deletingBannerId, setDeletingBannerId] = useState<string | null>(null);
  
  // Check if current user is super admin
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFilePreview(base64);
        setBannerForm(prev => ({ ...prev, imageUrl: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const loadActiveBanners = async () => {
    setLoadingBanners(true);
    try {
      const data = await apiClient.get('/api/v1/admin/banners');
      setActiveBanners(data || []);
    } catch (error) {
      console.error('Failed to load banners:', error);
    } finally {
      setLoadingBanners(false);
    }
  };

  const deleteBanner = async (bannerId: string) => {
    setDeletingBannerId(bannerId);
    try {
      await apiClient.delete(`/api/v1/admin/banners?id=${bannerId}`);
      setActiveBanners(prev => prev.filter(b => b.id !== bannerId));
    } catch (error) {
      console.error('Failed to delete banner:', error);
    } finally {
      setDeletingBannerId(null);
    }
  };

  useEffect(() => {
    loadStats();
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

  const statCards = [
    { 
      label: 'Total Members', 
      value: stats?.totalMembers || 0, 
      icon: Users, 
      color: 'from-accent-blue to-blue-600',
      textColor: 'text-accent-blue'
    },
    { 
      label: 'Active Members', 
      value: stats?.activeMembers || 0, 
      icon: TrendingUp, 
      color: 'from-green-500 to-green-600',
      textColor: 'text-green-400'
    },
    { 
      label: 'Today\'s Check-ins', 
      value: stats?.todayCheckIns || 0, 
      icon: Calendar, 
      color: 'from-accent-purple to-purple-600',
      textColor: 'text-accent-purple'
    },
    { 
      label: 'Total Revenue', 
      value: `₹${stats?.totalRevenue || 0}`, 
      icon: CreditCard, 
      color: 'from-yellow-500 to-orange-500',
      textColor: 'text-yellow-400'
    },
  ];

  const quickActions = [
    { label: 'Members', desc: 'Manage all members', icon: Users, path: '/app/admin/members', color: 'text-accent-blue' },
    { label: 'Plans', desc: 'Membership plans', icon: CreditCard, path: '/app/admin/plans', color: 'text-green-400' },
    { label: 'Attendance', desc: 'View attendance', icon: Calendar, path: '/app/admin/attendance', color: 'text-accent-purple' },
    { label: 'Reports', desc: 'Analytics & exports', icon: FileText, path: '/app/admin/reports', color: 'text-yellow-400' },
  ];

  // Communication & Marketing Tools
  const communicationTools = [
    { 
      label: 'Announcements', 
      desc: 'Notify all members', 
      icon: Megaphone,
      onClick: () => router.push('/app/admin/announcements'),
      gradient: 'from-yellow-500/10 via-orange-500/5 to-transparent',
      iconColor: 'text-yellow-400',
      available: true
    },
    { 
      label: 'Create Banner', 
      desc: 'Upload new ad banner', 
      icon: Upload,
      onClick: () => isSuperAdmin && router.push('/app/admin/ads'),
      gradient: 'from-pink-500/10 via-rose-500/5 to-transparent',
      iconColor: 'text-pink-400',
      available: isSuperAdmin
    },
    { 
      label: 'Manage Ads', 
      desc: 'View & remove banners', 
      icon: Eye,
      onClick: () => {
        if (isSuperAdmin) {
          router.push('/app/admin/ads');
        }
      },
      gradient: 'from-purple-500/10 via-violet-500/5 to-transparent',
      iconColor: 'text-purple-400',
      available: isSuperAdmin
    },
  ];

  const aiTools = [
    { 
      label: 'AI Workout Generator', 
      desc: 'Create workouts for members', 
      icon: Dumbbell, 
      path: '/app/admin/workout/ai-generate',
      gradient: 'from-accent-blue/10 via-accent-purple/5 to-transparent'
    },
    { 
      label: 'AI Diet Planner', 
      desc: 'Generate diet for members', 
      icon: Utensils, 
      path: '/app/admin/diet/ai-generate',
      gradient: 'from-green-500/10 via-emerald-500/5 to-transparent'
    },
  ];

  const customTools = [
    { 
      label: 'Custom Workout', 
      desc: 'Create manual workout plan', 
      icon: Dumbbell, 
      path: '/app/admin/workout/create',
      gradient: 'from-accent-blue/10 via-blue-500/5 to-transparent'
    },
    { 
      label: 'Custom Diet', 
      desc: 'Create manual diet plan', 
      icon: Utensils, 
      path: '/app/admin/diet/create',
      gradient: 'from-green-500/10 via-teal-500/5 to-transparent'
    },
  ];

  const sendAnnouncement = async () => {
    if (!announcementForm.title.trim() || !announcementForm.message.trim()) return;
    
    setSendingAnnouncement(true);
    try {
      await apiClient.post('/api/v1/admin/announcements', announcementForm);
      setAnnouncementSuccess(true);
      setTimeout(() => {
        setShowAnnouncementModal(false);
        setAnnouncementSuccess(false);
        setAnnouncementForm({ title: '', message: '', targetAudience: 'ALL' });
      }, 1500);
    } catch (error) {
      console.error('Failed to send announcement:', error);
    } finally {
      setSendingAnnouncement(false);
    }
  };

  const uploadBanner = async () => {
    if (!bannerForm.imageUrl.trim()) return;
    
    setUploadingBanner(true);
    try {
      await apiClient.post('/api/v1/admin/banners', bannerForm);
      setBannerSuccess(true);
      setTimeout(() => {
        setShowBannerModal(false);
        setBannerSuccess(false);
        setBannerForm({
          imageUrl: '',
          title: '',
          description: '',
          linkUrl: '',
          targetPages: ['all'],
          startDate: '',
          endDate: '',
          isActive: true,
        });
      }, 1500);
    } catch (error) {
      console.error('Failed to upload banner:', error);
    } finally {
      setUploadingBanner(false);
    }
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Banner Modal */}
      <AnimatePresence>
        {showBannerModal && isSuperAdmin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => !uploadingBanner && setShowBannerModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <GlassCard className="!p-0 overflow-hidden">
                {/* Modal Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                      <Image size={18} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Upload Banner</h3>
                      <p className="text-xs text-white/50">Festival & offer banners</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowBannerModal(false)}
                    className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                    disabled={uploadingBanner}
                  >
                    <X size={16} className="text-white/60" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-4 space-y-4">
                  {bannerSuccess ? (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="py-8 text-center"
                    >
                      <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                        <Check size={32} className="text-green-400" />
                      </div>
                      <p className="text-lg font-semibold text-white">Banner Uploaded!</p>
                      <p className="text-sm text-white/50">Banner is now live</p>
                    </motion.div>
                  ) : (
                    <>
                      {/* Upload Type Toggle */}
                      <div className="flex rounded-xl overflow-hidden border border-white/10">
                        <button
                          type="button"
                          onClick={() => setUploadType('file')}
                          className={`flex-1 py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2 ${uploadType === 'file' ? 'bg-accent-blue text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                        >
                          <Upload size={16} />
                          Upload File
                        </button>
                        <button
                          type="button"
                          onClick={() => setUploadType('url')}
                          className={`flex-1 py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2 ${uploadType === 'url' ? 'bg-accent-blue text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                        >
                          <Image size={16} />
                          Image URL
                        </button>
                      </div>

                      {uploadType === 'file' ? (
                        <div>
                          <label className="block text-sm font-medium text-white/70 mb-2">Select Image *</label>
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-accent-blue/50 hover:bg-white/5 transition-all">
                            {filePreview ? (
                              <img src={filePreview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              <div className="flex flex-col items-center justify-center py-6">
                                <Upload size={32} className="text-white/40 mb-2" />
                                <p className="text-sm text-white/60">Click to upload image</p>
                                <p className="text-xs text-white/40 mt-1">PNG, JPG up to 5MB</p>
                              </div>
                            )}
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={handleFileSelect}
                            />
                          </label>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-white/70 mb-2">Image URL *</label>
                          <GlassInput
                            placeholder="https://example.com/banner.jpg"
                            value={bannerForm.imageUrl}
                            onChange={(e) => setBannerForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                          />
                        </div>
                      )}

                      {bannerForm.imageUrl && uploadType === 'url' && (
                        <div className="rounded-xl overflow-hidden border border-white/10">
                          <img 
                            src={bannerForm.imageUrl} 
                            alt="Banner preview" 
                            className="w-full h-32 object-cover"
                            onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">Title (optional)</label>
                        <GlassInput
                          placeholder="e.g., New Year Sale!"
                          value={bannerForm.title}
                          onChange={(e) => setBannerForm(prev => ({ ...prev, title: e.target.value }))}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">Link URL (optional)</label>
                        <GlassInput
                          placeholder="e.g., /membership or https://..."
                          value={bannerForm.linkUrl}
                          onChange={(e) => setBannerForm(prev => ({ ...prev, linkUrl: e.target.value }))}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-white/70 mb-2">Start Date</label>
                          <input
                            type="date"
                            value={bannerForm.startDate}
                            onChange={(e) => setBannerForm(prev => ({ ...prev, startDate: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl bg-white/[0.08] border border-white/[0.12] text-white focus:outline-none focus:border-accent-blue/50 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white/70 mb-2">End Date</label>
                          <input
                            type="date"
                            value={bannerForm.endDate}
                            onChange={(e) => setBannerForm(prev => ({ ...prev, endDate: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl bg-white/[0.08] border border-white/[0.12] text-white focus:outline-none focus:border-accent-blue/50 text-sm"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setBannerForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                          className={`w-12 h-6 rounded-full transition-colors ${bannerForm.isActive ? 'bg-green-500' : 'bg-white/20'}`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${bannerForm.isActive ? 'translate-x-6' : 'translate-x-0.5'}`} />
                        </button>
                        <span className="text-sm text-white/70">Active immediately</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Modal Footer */}
                {!bannerSuccess && (
                  <div className="p-4 border-t border-white/10 flex gap-3">
                    <GlassButton
                      variant="glass"
                      className="flex-1"
                      onClick={() => setShowBannerModal(false)}
                      disabled={uploadingBanner}
                    >
                      Cancel
                    </GlassButton>
                    <GlassButton
                      className="flex-1 flex items-center justify-center gap-2"
                      onClick={uploadBanner}
                      disabled={uploadingBanner || !bannerForm.imageUrl.trim()}
                    >
                      {uploadingBanner ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Upload size={16} />
                          Upload
                        </>
                      )}
                    </GlassButton>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manage Banners Modal */}
      <AnimatePresence>
        {showManageBannersModal && isSuperAdmin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowManageBannersModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            >
              <GlassCard className="!p-0 overflow-hidden">
                {/* Modal Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center">
                      <Eye size={18} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Manage Ads</h3>
                      <p className="text-xs text-white/50">View & remove running banners</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowManageBannersModal(false)}
                    className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <X size={16} className="text-white/60" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-4">
                  {loadingBanners ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-8 h-8 border-2 border-white/30 border-t-accent-blue rounded-full animate-spin" />
                    </div>
                  ) : activeBanners.length === 0 ? (
                    <div className="text-center py-12">
                      <Image size={48} className="mx-auto text-white/20 mb-4" />
                      <p className="text-white/50">No active banners</p>
                      <p className="text-sm text-white/30">Upload a banner to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeBanners.map((banner) => (
                        <div
                          key={banner.id}
                          className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/10"
                        >
                          <div className="w-24 h-16 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                            <img
                              src={banner.imageUrl}
                              alt={banner.title || 'Banner'}
                              className="w-full h-full object-contain"
                              onError={(e) => (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="64" fill="%23333"><rect width="96" height="64"/><text x="48" y="32" text-anchor="middle" fill="%23666" font-size="10">No Image</text></svg>'}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{banner.title || 'Untitled Banner'}</p>
                            <p className="text-xs text-white/50">
                              Pages: {banner.targetPages?.join(', ') || 'All'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${banner.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {banner.isActive ? 'Active' : 'Inactive'}
                              </span>
                              {banner.endDate && (
                                <span className="text-xs text-white/40">
                                  Ends: {new Date(banner.endDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteBanner(banner.id)}
                            disabled={deletingBannerId === banner.id}
                            className="w-10 h-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-colors disabled:opacity-50"
                          >
                            {deletingBannerId === banner.id ? (
                              <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-white/10">
                  <GlassButton
                    onClick={() => {
                      setShowManageBannersModal(false);
                      setShowBannerModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    Add New Banner
                  </GlassButton>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Announcement Modal */}
      <AnimatePresence>
        {showAnnouncementModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => !sendingAnnouncement && setShowAnnouncementModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <GlassCard className="!p-0 overflow-hidden">
                {/* Modal Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
                      <Megaphone size={18} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Send Announcement</h3>
                      <p className="text-xs text-white/50">Notify all members</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAnnouncementModal(false)}
                    className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                    disabled={sendingAnnouncement}
                  >
                    <X size={16} className="text-white/60" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-4 space-y-4">
                  {announcementSuccess ? (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="py-8 text-center"
                    >
                      <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                        <Check size={32} className="text-green-400" />
                      </div>
                      <p className="text-lg font-semibold text-white">Announcement Sent!</p>
                      <p className="text-sm text-white/50">All members have been notified</p>
                    </motion.div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">Title</label>
                        <GlassInput
                          placeholder="e.g., New Year Special Offer!"
                          value={announcementForm.title}
                          onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">Message</label>
                        <textarea
                          placeholder="Write your announcement message..."
                          value={announcementForm.message}
                          onChange={(e) => setAnnouncementForm(prev => ({ ...prev, message: e.target.value }))}
                          rows={4}
                          className="w-full px-4 py-3 rounded-2xl bg-white/[0.08] border border-white/[0.12] text-white placeholder-white/40 focus:outline-none focus:border-accent-blue/50 focus:ring-2 focus:ring-accent-blue/20 backdrop-blur-2xl resize-none text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">Target Audience</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { value: 'ALL', label: 'All Users' },
                            { value: 'ACTIVE_MEMBERS', label: 'Active' },
                            { value: 'EXPIRED_MEMBERS', label: 'Expired' },
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setAnnouncementForm(prev => ({ 
                                ...prev, 
                                targetAudience: option.value as typeof prev.targetAudience 
                              }))}
                              className={`p-2 rounded-xl text-xs font-medium transition-all ${
                                announcementForm.targetAudience === option.value
                                  ? 'bg-accent-blue/20 border-accent-blue/50 text-accent-blue border'
                                  : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Modal Footer */}
                {!announcementSuccess && (
                  <div className="p-4 border-t border-white/10 flex gap-3">
                    <GlassButton
                      variant="glass"
                      className="flex-1"
                      onClick={() => setShowAnnouncementModal(false)}
                      disabled={sendingAnnouncement}
                    >
                      Cancel
                    </GlassButton>
                    <GlassButton
                      className="flex-1 flex items-center justify-center gap-2"
                      onClick={sendAnnouncement}
                      disabled={sendingAnnouncement || !announcementForm.title.trim() || !announcementForm.message.trim()}
                    >
                      {sendingAnnouncement ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send size={16} />
                          Send
                        </>
                      )}
                    </GlassButton>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="relative bg-gradient-to-b from-accent-purple/20 via-accent-blue/10 to-transparent pt-4 pb-8 px-4">
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent-purple/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent-blue/10 rounded-full blur-3xl pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-sm text-white/50">Manage your fitness center</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="px-4 -mt-2 space-y-6">
        {/* Communication & Marketing Tools */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Megaphone size={14} className="text-yellow-400" />
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider">Communication & Marketing</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {communicationTools.map((tool, index) => (
              <button
                key={index}
                onClick={tool.onClick}
                disabled={!tool.available}
                className={`w-full p-4 rounded-2xl bg-gradient-to-r ${tool.gradient} border border-white/10 flex items-center justify-between transition-all group active:scale-[0.98] ${!tool.available ? 'opacity-50 cursor-not-allowed' : 'hover:border-white/20'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center ${tool.iconColor}`}>
                    <tool.icon size={22} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-white">{tool.label}</p>
                    <p className="text-xs text-white/50">{tool.desc}</p>
                    {!tool.available && (
                      <p className="text-[10px] text-red-400 mt-0.5">Super admin only</p>
                    )}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                  <ChevronRight size={16} className="text-white/40" />
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3"
        >
          {statCards.map((stat, index) => (
            <GlassCard key={index} className="!p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <stat.icon size={18} className="text-white" />
                </div>
              </div>
              <p className={`text-2xl font-bold ${stat.textColor}`}>
                {loading ? '-' : stat.value}
              </p>
              <p className="text-xs text-white/40">{stat.label}</p>
            </GlassCard>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Quick Actions</h3>
          <GlassCard className="!p-0 overflow-hidden">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => router.push(action.path)}
                className={`w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors ${index !== quickActions.length - 1 ? 'border-b border-white/5' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${action.color}`}>
                    <action.icon size={18} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm text-white">{action.label}</p>
                    <p className="text-xs text-white/40">{action.desc}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-white/20" />
              </button>
            ))}
          </GlassCard>
        </motion.div>

        {/* AI Tools */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-accent-purple" />
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider">AI Tools</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {aiTools.map((tool, index) => (
              <button
                key={index}
                onClick={() => router.push(tool.path)}
                className={`p-4 rounded-2xl bg-gradient-to-r ${tool.gradient} border border-white/5 text-left group active:scale-[0.98] transition-transform`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                      <tool.icon size={20} className="text-accent-purple" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-white">{tool.label}</p>
                      <p className="text-xs text-white/40">{tool.desc}</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <ChevronRight size={16} className="text-white/40" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Custom Plan Tools */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Plus size={14} className="text-accent-blue" />
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider">Custom Plans</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {customTools.map((tool, index) => (
              <button
                key={index}
                onClick={() => router.push(tool.path)}
                className={`p-4 rounded-2xl bg-gradient-to-r ${tool.gradient} border border-white/5 text-left group active:scale-[0.98] transition-transform`}
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-2">
                  <tool.icon size={18} className="text-accent-blue" />
                </div>
                <p className="font-semibold text-sm text-white">{tool.label}</p>
                <p className="text-[10px] text-white/40">{tool.desc}</p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Recent Activity</h3>
          <GlassCard className="!p-4">
            <div className="space-y-3">
              {stats?.recentActivity?.length > 0 ? (
                stats.recentActivity.slice(0, 5).map((activity: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-accent-blue/10 flex items-center justify-center">
                      <Users size={14} className="text-accent-blue" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white">{activity.description}</p>
                      <p className="text-xs text-white/40">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-white/40 text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
