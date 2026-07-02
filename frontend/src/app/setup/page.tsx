'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';
import { AuthResponse } from '@/types';
import dynamic from 'next/dynamic';
import Logo from '@/components/Logo';
const ThemeToggle = dynamic(() => import('@/components/ThemeToggle'), { ssr: false });

const schema = z.object({
  name:        z.string().min(2, 'Full name required'),
  email:       z.string().email('Enter a valid email address'),
  password:    z.string().min(8, 'Password must be at least 8 characters'),
  setupSecret: z.string().min(1, 'Setup key required'),
});

type FormData = z.infer<typeof schema>;

export default function SetupAdminPage() {
  const router   = useRouter();
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormData) => {
    setLoading(true);
    try {
      const res = await api.post<AuthResponse>('/auth/setup-admin', values);
      localStorage.setItem('access_token',  res.data.accessToken);
      localStorage.setItem('refresh_token', res.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      toast.success('Super Admin account created. Welcome to Podversal!');
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as any).response?.data?.message
        : null;
      if (msg?.includes('already exists')) {
        toast.error('An admin account already exists. Please sign in normally.');
        router.push('/login');
      } else {
        toast.error(msg || 'Setup failed. Please try again.');
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#111111] flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>

      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo height={76} />
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-5 p-3 bg-[#E5312A]/8 dark:bg-[#E5312A]/10 border border-[#E5312A]/20">
            <ShieldCheck size={18} className="text-[#E5312A] flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">First-Time Admin Setup</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                This page only works once — when no Super Admin exists yet, and requires the setup key from the server environment.
              </p>
            </div>
          </div>

          <h1 className="font-bold text-gray-900 dark:text-white text-xl mb-1">Create Super Admin</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            This account will have full access to all studio management features.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">Full Name</label>
              <input {...register('name')} type="text" placeholder="Studio Owner Name" className="input-field" autoComplete="name" />
              {errors.name && <p className="text-[#E5312A] text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">Email</label>
              <input {...register('email')} type="email" placeholder="admin@podversal.com" className="input-field" autoComplete="email" />
              {errors.email && <p className="text-[#E5312A] text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  className="input-field pr-11"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-[#E5312A] text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">Setup Key</label>
              <input {...register('setupSecret')} type="password" placeholder="SETUP_SECRET from server .env" className="input-field" autoComplete="off" />
              {errors.setupSecret && <p className="text-[#E5312A] text-xs mt-1">{errors.setupSecret.message}</p>}
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Value of SETUP_SECRET in the backend environment — only you should know it.</p>
            </div>

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creating account...' : 'Create Super Admin Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
            Already have an account?{' '}
            <a href="/login" className="text-[#E5312A] font-semibold hover:underline">Sign in</a>
          </p>
        </div>

        <div className="mt-4 p-4 bg-white dark:bg-[#181818] border border-gray-100 dark:border-[#2a2a2a]">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">After this, you can create:</p>
          <ul className="space-y-1 text-xs text-gray-400 dark:text-gray-500">
            <li>• Studio Manager accounts via Dashboard → Settings</li>
            <li>• Employee accounts via Dashboard → Employees</li>
            <li>• Referral Agent accounts via Dashboard → Agents</li>
            <li>• Customers register themselves at /register</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
