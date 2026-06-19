'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';
import { AuthResponse } from '@/types';
import dynamic from 'next/dynamic';
import Logo from '@/components/Logo';
const ThemeToggle = dynamic(() => import('@/components/ThemeToggle'), { ssr: false });

const registerSchema = z.object({
  name:     z.string().min(2, 'Full name must be at least 2 characters'),
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone:    z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number')
    .optional()
    .or(z.literal('')),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterForm) => {
    setLoading(true);
    try {
      const payload = { ...values, phone: values.phone || undefined };
      const res = await api.post<AuthResponse>('/auth/register', payload);
      localStorage.setItem('access_token',  res.data.accessToken);
      localStorage.setItem('refresh_token', res.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      toast.success('Account created — welcome to Podversal!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Something went wrong — please try again');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#111111] flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>

      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo height={60} />
        </div>

        <div className="card">
          <h1 className="font-black text-gray-900 dark:text-white text-xl mb-1">Create your account</h1>
          <p className="text-sm text-[#6b6b6b] dark:text-[#8a8a8a] mb-6">Get started with Podversal Studio — it only takes a minute.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black tracking-[0.15em] uppercase text-[#aaa] dark:text-[#555] mb-2">Full Name</label>
              <input {...register('name')} type="text" placeholder="Rahul Sharma" className="input-field" autoComplete="name" />
              {errors.name && <p className="text-[#E5312A] text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-black tracking-[0.15em] uppercase text-[#aaa] dark:text-[#555] mb-2">Email</label>
              <input {...register('email')} type="email" placeholder="rahul@example.com" className="input-field" autoComplete="email" />
              {errors.email && <p className="text-[#E5312A] text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-black tracking-[0.15em] uppercase text-[#aaa] dark:text-[#555] mb-2">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  className="input-field pr-11"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa] hover:text-gray-600 dark:hover:text-[#a0a0a0] transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-[#E5312A] text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-black tracking-[0.15em] uppercase text-[#aaa] dark:text-[#555] mb-2">
                Mobile Number <span className="text-[#ccc] dark:text-[#444] font-normal normal-case tracking-normal">(optional)</span>
              </label>
              <input {...register('phone')} type="tel" placeholder="98765 43210" className="input-field" />
              {errors.phone && <p className="text-[#E5312A] text-xs mt-1">{errors.phone.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-[#6b6b6b] dark:text-[#8a8a8a] mt-6">
            Already have an account?{' '}
            <a href="/login" className="text-[#E5312A] font-bold hover:underline">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}
