'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';

const schema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword:     z.string().min(8, 'Minimum 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path:    ['confirmPassword'],
});

type Form = z.infer<typeof schema>;

export default function ChangePasswordPage() {
  const router = useRouter();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving,      setSaving]      = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: Form) => {
    setSaving(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword:     values.newPassword,
      });
      toast.success('Password changed successfully');
      reset();
      router.push('/dashboard/profile');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-lg mx-auto space-y-4">

      {/* Header */}
      <div>
        <p className="text-[10px] font-black tracking-[0.15em] uppercase text-[#6b6b6b] dark:text-[#888]">Security</p>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">Change Password</h1>
      </div>

      {/* Form */}
      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          <div>
            <label className="block text-[10px] font-black tracking-[0.15em] uppercase text-[#6b6b6b] dark:text-[#888] mb-2">Current Password</label>
            <div className="relative">
              <input
                {...register('currentPassword')}
                type={showCurrent ? 'text' : 'password'}
                className="input-field pr-10"
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowCurrent(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa] hover:text-gray-600 dark:hover:text-[#a0a0a0]">
                {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.currentPassword && <p className="text-[#E5312A] text-xs mt-1">{errors.currentPassword.message}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-black tracking-[0.15em] uppercase text-[#6b6b6b] dark:text-[#888] mb-2">New Password</label>
            <div className="relative">
              <input
                {...register('newPassword')}
                type={showNew ? 'text' : 'password'}
                className="input-field pr-10"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa] hover:text-gray-600 dark:hover:text-[#a0a0a0]">
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.newPassword && <p className="text-[#E5312A] text-xs mt-1">{errors.newPassword.message}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-black tracking-[0.15em] uppercase text-[#6b6b6b] dark:text-[#888] mb-2">Confirm New Password</label>
            <div className="relative">
              <input
                {...register('confirmPassword')}
                type={showConfirm ? 'text' : 'password'}
                className="input-field pr-10"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa] hover:text-gray-600 dark:hover:text-[#a0a0a0]">
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-[#E5312A] text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving} className="btn-primary px-6">
              {saving ? 'Updating…' : 'Update Password'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard/profile')}
              className="px-5 py-2.5 border border-[#e5e5e5] dark:border-[#2a2a2a] text-sm font-semibold text-[#6b6b6b] dark:text-[#8a8a8a] hover:border-[#aaa] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
