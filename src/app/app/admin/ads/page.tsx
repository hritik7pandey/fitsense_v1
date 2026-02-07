'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { 
  Image, Upload, Trash2, Eye, Plus, CheckCircle, AlertCircle, 
  RefreshCw, Calendar, Link as LinkIcon, Target, X
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';

const SUPER_ADMIN_EMAIL = '224spy@gmail.com';

interface Banner {
  id: string;
  imageUrl: string;
  title?: string;
  description?: string;
  linkUrl?: string;
  targetPages?: string[];
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdsManagementPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;
  
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [uploadType, setUploadType] = useState<'file' | 'url'>('file');
  const [filePreview, setFilePreview] = useState('');
  
  const [form, setForm] = useState({
    imageUrl: '',
    title: '',
    description: '',
    linkUrl: '/app/membership',
    targetPages: ['all'] as string[],
    startDate: '',
    endDate: '',
    isActive: true,
  });

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get('/api/v1/admin/banners');
      setBanners(data || []);
    } catch (error) {
      console.error('Failed to load banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFilePreview(base64);
        setForm(prev => ({ ...prev, imageUrl: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadBanner = async () => {
    if (!form.imageUrl) {
      setError('Please upload an image or provide a URL');
      return;
    }
    
    setError('');
    setUploading(true);
    try {
      await apiClient.post('/api/v1/admin/banners', form);
      setSuccess('Banner uploaded successfully!');
      setShowCreateModal(false);
      resetForm();
      loadBanners();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to upload banner');
    } finally {
      setUploading(false);
    }
  };

  const deleteBanner = async (id: string) => {
    setDeletingId(id);
    try {
      await apiClient.delete(`/api/v1/admin/banners?id=${id}`);
      setBanners(prev => prev.filter(b => b.id !== id));
      setSuccess('Banner deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete banner');
    } finally {
      setDeletingId(null);
    }
  };

  const resetForm = () => {
    setForm({
      imageUrl: '',
      title: '',
      description: '',
      linkUrl: '/app/membership',
      targetPages: ['all'],
      startDate: '',
      endDate: '',
      isActive: true,
    });
    setFilePreview('');
    setUploadType('file');
  };

  const targetPageOptions = [
    { value: 'all', label: 'All Pages' },
    { value: 'home', label: 'User Dashboard' },
    { value: 'landing', label: 'Landing Page' },
    { value: 'membership', label: 'Membership Page' },
  ];

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlassCard className="text-center max-w-md">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-white/50">Only super admin can manage ads</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Image className="text-pink-400" />
            Ad Management
          </h1>
          <p className="text-white/50 mt-1">Create and manage promotional banners</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadBanners}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <GlassButton onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
            <Plus size={18} />
            Create Ad
          </GlassButton>
        </div>
      </div>

      {/* Success/Error Messages */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400"
          >
            <CheckCircle size={18} />
            <p>{success}</p>
          </motion.div>
        )}
        {error && !showCreateModal && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400"
          >
            <AlertCircle size={18} />
            <p>{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="!p-4">
          <p className="text-2xl font-bold">{banners.length}</p>
          <p className="text-sm text-white/50">Total Ads</p>
        </GlassCard>
        <GlassCard className="!p-4">
          <p className="text-2xl font-bold text-green-400">{banners.filter(b => b.isActive).length}</p>
          <p className="text-sm text-white/50">Active Ads</p>
        </GlassCard>
        <GlassCard className="!p-4">
          <p className="text-2xl font-bold text-yellow-400">{banners.filter(b => !b.isActive).length}</p>
          <p className="text-sm text-white/50">Inactive Ads</p>
        </GlassCard>
        <GlassCard className="!p-4">
          <p className="text-2xl font-bold text-purple-400">{banners.filter(b => b.targetPages?.includes('all')).length}</p>
          <p className="text-sm text-white/50">Global Ads</p>
        </GlassCard>
      </div>

      {/* Banners Grid */}
      <GlassCard>
        <h2 className="text-lg font-semibold mb-4">All Banners</h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-white/30 border-t-accent-blue rounded-full animate-spin" />
          </div>
        ) : banners.length === 0 ? (
          <div className="text-center py-12">
            <Image size={48} className="mx-auto text-white/20 mb-4" />
            <p className="text-white/50">No banners created yet</p>
            <p className="text-sm text-white/30 mb-4">Create your first promotional ad</p>
            <GlassButton onClick={() => setShowCreateModal(true)}>
              <Plus size={16} className="mr-2" />
              Create First Ad
            </GlassButton>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {banners.map((banner) => (
              <motion.div
                key={banner.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl overflow-hidden bg-white/5 border border-white/10"
              >
                <div className="aspect-video relative bg-black/50">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title || 'Banner'}
                    className="w-full h-full object-contain"
                    onError={(e) => (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" fill="%23222"><rect width="400" height="200"/><text x="200" y="100" text-anchor="middle" fill="%23666" font-size="14">Image Failed</text></svg>'}
                  />
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${banner.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {banner.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold truncate">{banner.title || 'Untitled Banner'}</h3>
                  <div className="flex items-center gap-2 text-xs text-white/50 mt-2">
                    <Target size={12} />
                    {banner.targetPages?.join(', ') || 'All pages'}
                  </div>
                  {banner.linkUrl && (
                    <div className="flex items-center gap-2 text-xs text-accent-blue mt-1">
                      <LinkIcon size={12} />
                      <span className="truncate">{banner.linkUrl}</span>
                    </div>
                  )}
                  {banner.endDate && (
                    <div className="flex items-center gap-2 text-xs text-white/40 mt-1">
                      <Calendar size={12} />
                      Ends: {new Date(banner.endDate).toLocaleDateString()}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => deleteBanner(banner.id)}
                      disabled={deletingId === banner.id}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-50"
                    >
                      {deletingId === banner.id ? (
                        <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                      ) : (
                        <>
                          <Trash2 size={16} />
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Create Banner Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => !uploading && setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <GlassCard className="!p-0">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                      <Plus size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Create New Ad</h3>
                      <p className="text-xs text-white/50">Full-screen promotional banner</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    disabled={uploading}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Body */}
                <div className="p-4 space-y-4">
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
                      <LinkIcon size={16} />
                      Image URL
                    </button>
                  </div>

                  {/* Image Upload */}
                  {uploadType === 'file' ? (
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Upload Image</label>
                      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-accent-blue/50 hover:bg-white/5 transition-all">
                        {filePreview ? (
                          <img src={filePreview} alt="Preview" className="w-full h-full object-contain rounded-xl" />
                        ) : (
                          <div className="flex flex-col items-center justify-center py-6">
                            <Upload size={32} className="text-white/40 mb-2" />
                            <p className="text-sm text-white/60">Click to upload</p>
                            <p className="text-xs text-white/40 mt-1">PNG, JPG up to 5MB</p>
                          </div>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                      </label>
                    </div>
                  ) : (
                    <div>
                      <GlassInput
                        label="Image URL"
                        placeholder="https://example.com/banner.jpg"
                        value={form.imageUrl}
                        onChange={(e) => setForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                      />
                    </div>
                  )}

                  {/* Title */}
                  <div>
                    <GlassInput
                      label="Title (Optional)"
                      placeholder="e.g., New Year Special Offer!"
                      value={form.title}
                      onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>

                  {/* Link URL */}
                  <div>
                    <GlassInput
                      label="Click Action URL"
                      placeholder="/app/membership"
                      value={form.linkUrl}
                      onChange={(e) => setForm(prev => ({ ...prev, linkUrl: e.target.value }))}
                    />
                    <p className="text-xs text-white/40 mt-1">Where to redirect when user clicks the ad</p>
                  </div>

                  {/* Target Pages */}
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Show On Pages</label>
                    <div className="flex flex-wrap gap-2">
                      {targetPageOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            if (option.value === 'all') {
                              setForm(prev => ({ ...prev, targetPages: ['all'] }));
                            } else {
                              setForm(prev => {
                                const pages = prev.targetPages.filter(p => p !== 'all');
                                if (pages.includes(option.value)) {
                                  return { ...prev, targetPages: pages.filter(p => p !== option.value) };
                                }
                                return { ...prev, targetPages: [...pages, option.value] };
                              });
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                            form.targetPages.includes(option.value)
                              ? 'bg-accent-blue text-white'
                              : 'bg-white/10 text-white/60 hover:bg-white/20'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={form.startDate}
                        onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.08] border border-white/[0.12] text-white focus:outline-none focus:border-accent-blue/50 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">End Date</label>
                      <input
                        type="date"
                        value={form.endDate}
                        onChange={(e) => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.08] border border-white/[0.12] text-white focus:outline-none focus:border-accent-blue/50 text-sm"
                      />
                    </div>
                  </div>

                  {/* Error */}
                  {error && showCreateModal && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                      <AlertCircle size={18} />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 flex gap-3">
                  <GlassButton
                    variant="glass"
                    onClick={() => setShowCreateModal(false)}
                    disabled={uploading}
                    className="flex-1"
                  >
                    Cancel
                  </GlassButton>
                  <GlassButton
                    onClick={uploadBanner}
                    disabled={uploading || !form.imageUrl}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Upload size={18} />
                        Create Ad
                      </>
                    )}
                  </GlassButton>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
