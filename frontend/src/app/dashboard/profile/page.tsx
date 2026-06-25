'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Camera, Lock, Mail, CalendarDays, CheckCircle2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { getStoredUser } from '@/lib/auth';

const profileSchema = z.object({
  name:  z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number').optional().or(z.literal('')),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const [profileData,     setProfileData]     = useState<any>(null);
  const [avatarPreview,   setAvatarPreview]   = useState<string | null>(null);
  const [savingProfile,   setSavingProfile]   = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileForm = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });

  useEffect(() => {
    api.get('/auth/me')
      .then(r => {
        setProfileData(r.data);
        profileForm.reset({ name: r.data.name ?? '', phone: r.data.phone ?? '' });
        if (r.data.avatarUrl) setAvatarPreview(r.data.avatarUrl);
      })
      .catch(() => {});
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return; }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setAvatarPreview(base64);
      setUploadingAvatar(true);
      try {
        const res = await api.post('/auth/profile/avatar', { file: base64 });
        const stored = getStoredUser();
        if (stored) localStorage.setItem('user', JSON.stringify({ ...stored, avatarUrl: res.data.avatarUrl }));
        setProfileData((p: any) => ({ ...p, avatarUrl: res.data.avatarUrl }));
        setAvatarPreview(res.data.avatarUrl);
        toast.success('Profile photo updated');
      } catch {
        toast.error('Failed to upload photo');
        setAvatarPreview(profileData?.avatarUrl ?? null);
      } finally {
        setUploadingAvatar(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const onSaveProfile = async (values: ProfileForm) => {
    setSavingProfile(true);
    try {
      const res = await api.patch('/auth/profile', {
        name:  values.name,
        phone: values.phone || undefined,
      });
      const stored = getStoredUser();
      if (stored) localStorage.setItem('user', JSON.stringify({ ...stored, name: res.data.name }));
      setProfileData((p: any) => ({ ...p, ...res.data }));
      toast.success('Profile updated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const initials = profileData
    ? profileData.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : '…';

  return (
    <div className="max-w-3xl mx-auto space-y-4">

      {/* Page header */}
      <div>
        <p className="text-[10px] font-black tracking-[0.2em] uppercase text-[#E5312A] mb-1">Account</p>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Profile Settings</h1>
      </div>

      {/* Profile Card */}
      <div className="card">
        <form onSubmit={profileForm.handleSubmit(onSaveProfile)}>
          <div className="flex flex-col sm:flex-row gap-6">

            {/* Avatar */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <div
                className="relative w-24 h-24 cursor-pointer group"
                onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
              >
                <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-[#2a2a2a] overflow-hidden flex items-center justify-center border-2 border-[#e5e5e5] dark:border-[#3a3a3a]">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-black text-gray-400 dark:text-[#555]">{initials}</span>
                  )}
                </div>
                <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  {uploadingAvatar ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="text-xs font-bold text-[#E5312A] hover:underline disabled:opacity-50"
              >
                {uploadingAvatar ? 'Uploading…' : 'Change Photo'}
              </button>
              <p className="text-[10px] text-[#6b6b6b] dark:text-[#888]">Max 5 MB</p>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>

            {/* Fields */}
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-[10px] font-black tracking-[0.15em] uppercase text-[#6b6b6b] dark:text-[#888] mb-2">Full Name</label>
                <input {...profileForm.register('name')} type="text" className="input-field" placeholder="Your full name" />
                {profileForm.formState.errors.name && (
                  <p className="text-[#E5312A] text-xs mt-1">{profileForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black tracking-[0.15em] uppercase text-[#6b6b6b] dark:text-[#888] mb-2">Email</label>
                <div className="input-field flex items-center gap-2 bg-gray-50 dark:bg-[#181818] text-gray-400 dark:text-[#555] cursor-not-allowed select-none">
                  <Mail size={14} className="flex-shrink-0" />
                  <span className="truncate">{profileData?.email ?? '…'}</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black tracking-[0.15em] uppercase text-[#6b6b6b] dark:text-[#888] mb-2">
                  Mobile Number
                  <span className="normal-case font-normal tracking-normal text-[#ccc] dark:text-[#444] ml-1">(optional)</span>
                </label>
                <input {...profileForm.register('phone')} type="tel" className="input-field" placeholder="98xxxxxxxx" />
                {profileForm.formState.errors.phone && (
                  <p className="text-[#E5312A] text-xs mt-1">{profileForm.formState.errors.phone.message}</p>
                )}
              </div>

              {profileData?.createdAt && (
                <p className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-[#555]">
                  <CalendarDays size={12} />
                  Member since {new Date(profileData.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}

              <button type="submit" disabled={savingProfile} className="btn-primary px-6">
                {savingProfile ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Security Card */}
      <div className="card p-0">
        {profileData && !profileData.hasPassword ? (
          <div className="flex items-start gap-3 p-4">
            <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-600 dark:text-[#8a8a8a]">
              Your account is signed in with Google. Password changes are not available for OAuth accounts.
            </p>
          </div>
        ) : (
          <Link
            href="/dashboard/profile/change-password"
            className="flex items-center justify-between px-4 py-3.5 hover:bg-[#f9f9f9] dark:hover:bg-[#181818] transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Lock size={15} className="text-[#aaa]" />
              <span className="text-sm font-bold text-gray-900 dark:text-white">Change Password</span>
            </div>
            <ChevronRight size={15} className="text-[#aaa] group-hover:text-[#E5312A] transition-colors" />
          </Link>
        )}
      </div>

    </div>
  );
}
