'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';
import dynamic from 'next/dynamic';
import Logo from '@/components/Logo';
const ThemeToggle = dynamic(() => import('@/components/ThemeToggle'), { ssr: false });

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm:  z.string(),
}).refine(d => d.password === d.confirm, {
  message: "Passwords don't match",
  path:    ['confirm'],
});

type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get('token');

  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormData) => {
    if (!token) { toast.error('Reset link is invalid or has expired.'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password: values.password });
      setDone(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'This link has expired. Request a new one from the login page.');
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
          {!token ? (
            <div className="text-center py-4">
              <h2 className="font-black text-gray-900 dark:text-white text-xl mb-3">Invalid reset link</h2>
              <p className="text-sm text-[#6b6b6b] dark:text-[#8a8a8a] mb-6">
                This link is missing a reset token. Go back to the login page and request a new one.
              </p>
              <a href="/login" className="inline-block btn-primary !w-auto px-6">Back to Sign In</a>
            </div>
          ) : done ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-[#E5312A] flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl font-black">✓</span>
              </div>
              <h2 className="font-black text-gray-900 dark:text-white text-xl mb-3">Password updated</h2>
              <p className="text-sm text-[#6b6b6b] dark:text-[#8a8a8a] mb-6">
                Your password has been changed. You can now sign in with your new password.
              </p>
              <button onClick={() => router.push('/login')} className="btn-primary">
                Go to Sign In
              </button>
            </div>
          ) : (
            <>
              <h2 className="font-black text-gray-900 dark:text-white text-xl mb-1">Set a new password</h2>
              <p className="text-sm text-[#6b6b6b] dark:text-[#8a8a8a] mb-6">
                Choose a strong password of at least 8 characters.
              </p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black tracking-[0.15em] uppercase text-[#aaa] dark:text-[#555] mb-2">New Password</label>
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
                  <label className="block text-[10px] font-black tracking-[0.15em] uppercase text-[#aaa] dark:text-[#555] mb-2">Confirm Password</label>
                  <input
                    {...register('confirm')}
                    type="password"
                    placeholder="Same password again"
                    className="input-field"
                    autoComplete="new-password"
                  />
                  {errors.confirm && <p className="text-[#E5312A] text-xs mt-1">{errors.confirm.message}</p>}
                </div>

                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Updating password...' : 'Set New Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
