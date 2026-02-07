'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassInput } from '@/components/ui/GlassInput';
import { GlassButton } from '@/components/ui/GlassButton';
import { ChevronLeft, User, Mail, Phone, Ruler, Weight, Calendar, Loader2, CheckCircle, Camera } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { DEFAULT_AVATAR } from '@/lib/constants';
import { uploadAvatar } from '@/lib/supabase';

export default function EditProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string>(DEFAULT_AVATAR);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    heightCm: '',
    weightKg: '',
    age: '',
    gender: 'MALE',
    avatarUrl: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await apiClient.get('/api/v1/users/profile');
      setFormData({
        name: data.name || '',
        phone: data.phone || '',
        heightCm: data.heightCm?.toString() || '',
        weightKg: data.weightKg?.toString() || '',
        age: data.age?.toString() || '',
        gender: data.gender || 'MALE',
        avatarUrl: data.avatarUrl || ''
      });
      if (data.avatarUrl) {
        setAvatarPreview(data.avatarUrl);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setUploadingAvatar(true);
    setError('');

    try {
      // Show preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const publicUrl = await uploadAvatar(user.id, file);
      setFormData(prev => ({ ...prev, avatarUrl: publicUrl }));
      setAvatarPreview(publicUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
      // Reset preview on error
      setAvatarPreview(formData.avatarUrl || DEFAULT_AVATAR);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const updatedProfile = await apiClient.put('/api/v1/users/profile', {
        name: formData.name,
        phone: formData.phone || undefined,
        heightCm: formData.heightCm ? parseFloat(formData.heightCm) : undefined,
        weightKg: formData.weightKg ? parseFloat(formData.weightKg) : undefined,
        age: formData.age ? parseInt(formData.age) : undefined,
        gender: formData.gender,
        avatarUrl: formData.avatarUrl || undefined
      });
      
      // Update auth context with new user data
      if (user && updatedProfile) {
        const updatedUser = {
          ...user,
          name: updatedProfile.name,
          phone: updatedProfile.phone,
          avatarUrl: updatedProfile.avatarUrl
        };
        // Update localStorage so the header picks up the new avatar
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('storage')); // Trigger re-render
      }
      
      setSuccess(true);
      setTimeout(() => {
        router.push('/app/profile');
        router.refresh(); // Force refresh to pick up new data
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const avatarOptions = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Rocky',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella',
  ];

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="relative bg-gradient-to-b from-accent-blue/20 via-accent-purple/10 to-transparent pt-4 pb-8 px-4">
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent-blue/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={() => router.push('/app/profile')} 
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Edit Profile</h1>
            <p className="text-xs text-white/50">Update your personal information</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4">
        {/* Success Message */}
        {success && (
          <div className="mb-4 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-center gap-3">
            <CheckCircle size={20} />
            <span className="text-sm font-medium">Profile updated successfully!</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Profile Picture Section */}
          <div>
            <GlassCard className="!p-5 mb-4">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">Profile Picture</h3>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <div className={`w-20 h-20 rounded-full overflow-hidden border-2 ${uploadingAvatar ? 'border-accent-gold/50' : 'border-accent-blue/30'}`}>
                    {uploadingAvatar ? (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center">
                        <Loader2 size={24} className="text-accent-gold animate-spin" />
                      </div>
                    ) : (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <label className={`absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${uploadingAvatar ? 'bg-white/20 cursor-not-allowed' : 'bg-accent-blue cursor-pointer'}`}>
                    {uploadingAvatar ? (
                      <Loader2 size={14} className="text-white animate-spin" />
                    ) : (
                      <Camera size={14} className="text-primary" />
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      accept="image/jpeg,image/png,image/webp,image/gif" 
                      onChange={handleAvatarChange}
                      className="hidden"
                      disabled={uploadingAvatar}
                    />
                  </label>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1 text-white">
                    {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
                  </p>
                  <p className="text-xs text-white/50">
                    {uploadingAvatar ? 'Please wait' : 'Upload a photo (max 2MB)'}
                  </p>
                </div>
              </div>

              {/* Avatar Options */}
              <div>
                <p className="text-xs text-white/40 mb-2">Or choose an avatar:</p>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {avatarOptions.map((avatar, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setAvatarPreview(avatar);
                        setFormData(prev => ({ ...prev, avatarUrl: avatar }));
                      }}
                      className={`w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 transition-all ${
                        avatarPreview === avatar 
                          ? 'border-accent-blue scale-110' 
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <img src={avatar} alt={`Avatar ${index + 1}`} className="w-full h-full" />
                    </button>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Basic Information */}
          <div>
            <GlassCard className="!p-5 space-y-1">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">Basic Information</h3>
              
              <GlassInput
                label="Full Name"
                type="text"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                icon={<User size={18} />}
                required
              />

              <GlassInput
                label="Email"
                type="email"
                value={user?.email || ''}
                icon={<Mail size={18} />}
                disabled
                className="opacity-50"
              />

              <GlassInput
                label="Phone Number"
                type="tel"
                value={formData.phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone: e.target.value })}
                icon={<Phone size={18} />}
                placeholder="+91 9876543210"
              />
            </GlassCard>
          </div>

          {/* Physical Details */}
          <div className="mt-4">
            <GlassCard className="!p-5 space-y-1">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">Physical Details</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <GlassInput
                  label="Height (cm)"
                  type="number"
                  value={formData.heightCm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, heightCm: e.target.value })}
                  icon={<Ruler size={18} />}
                  placeholder="175"
                />

                <GlassInput
                  label="Weight (kg)"
                  type="number"
                  value={formData.weightKg}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, weightKg: e.target.value })}
                  icon={<Weight size={18} />}
                  placeholder="70"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <GlassInput
                  label="Age"
                  type="number"
                  value={formData.age}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, age: e.target.value })}
                  icon={<Calendar size={18} />}
                  placeholder="25"
                />

                <div className="relative mb-4">
                  <label className="absolute left-4 top-2 text-[10px] font-semibold text-accent-blue tracking-wider uppercase z-10">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-4 pt-6 pb-2.5 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] text-white text-base focus:border-accent-blue/50 focus:bg-white/[0.06] focus:outline-none transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_4px_16px_rgba(0,0,0,0.1)] appearance-none cursor-pointer"
                    style={{ 
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, 
                      backgroundRepeat: 'no-repeat', 
                      backgroundPosition: 'right 12px center', 
                      backgroundSize: '18px' 
                    }}
                  >
                    <option value="MALE" className="bg-primary">Male</option>
                    <option value="FEMALE" className="bg-primary">Female</option>
                    <option value="OTHER" className="bg-primary">Other</option>
                  </select>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            <GlassButton
              type="button"
              variant="glass"
              onClick={() => router.push('/app/profile')}
              className="flex-1"
            >
              Cancel
            </GlassButton>
            <GlassButton
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </GlassButton>
          </div>
        </form>
      </div>
    </div>
  );
}
