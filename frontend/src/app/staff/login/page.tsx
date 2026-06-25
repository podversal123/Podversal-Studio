'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Logo from '@/components/Logo';
import api from '@/lib/api';
import { AuthResponse } from '@/types';

const ThemeToggle = dynamic(() => import('@/components/ThemeToggle'), { ssr: false });

const loginSchema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const otpSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  otp:   z.string().length(6, 'OTP must be 6 digits').optional(),
});

const forgotSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

type LoginForm  = z.infer<typeof loginSchema>;
type OtpForm    = z.infer<typeof otpSchema>;
type ForgotForm = z.infer<typeof forgotSchema>;
type Tab        = 'email' | 'otp';
type StaffRole  = 'STUDIO_MANAGER' | 'EMPLOYEE';

export default function StaffLoginPage() {
  const router = useRouter();
  const [staffRole,  setStaffRole]  = useState<StaffRole>('STUDIO_MANAGER');
  const [tab,        setTab]        = useState<Tab>('email');
  const [otpSent,    setOtpSent]    = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [showPass,   setShowPass]   = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const loginForm  = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const otpForm    = useForm<OtpForm>({ resolver: zodResolver(otpSchema) });
  const forgotForm = useForm<ForgotForm>({ resolver: zodResolver(forgotSchema) });

  const saveAndRedirect = (data: AuthResponse) => {
    localStorage.setItem('access_token',  data.accessToken);
    localStorage.setItem('refresh_token', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    router.push('/dashboard');
  };

  const checkRole = (role: string) => {
    if (role !== staffRole) {
      toast.error(
        staffRole === 'STUDIO_MANAGER'
          ? 'This account is not a Studio Manager. Use Employee login.'
          : 'This account is not an Employee. Use Studio Manager login.'
      );
      return false;
    }
    return true;
  };

  const handleEmailLogin = async (values: LoginForm) => {
    setLoading(true);
    try {
      const res = await api.post<AuthResponse>('/auth/login', values);
      if (!checkRole(res.data.user.role)) return;
      toast.success('Welcome back!');
      saveAndRedirect(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Wrong email or password — please try again');
    } finally { setLoading(false); }
  };

  const handleSendOtp = async () => {
    const phone = otpForm.getValues('phone');
    if (!/^[6-9]\d{9}$/.test(phone)) {
      otpForm.setError('phone', { message: 'Enter a valid 10-digit mobile number' });
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/otp/send', { phone });
      setOtpSent(true);
      toast.success('OTP sent — check your messages');
    } catch { toast.error('Could not send OTP right now. Try again in a moment.'); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async (values: OtpForm) => {
    setLoading(true);
    try {
      const res = await api.post<AuthResponse>('/auth/otp/verify', { phone: values.phone, otp: values.otp });
      if (!checkRole(res.data.user.role)) return;
      toast.success('Logged in successfully!');
      saveAndRedirect(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'OTP is incorrect or has expired');
    } finally { setLoading(false); }
  };

  const handleForgotPassword = async (values: ForgotForm) => {
    setLoading(true);
    try { await api.post('/auth/forgot-password', { email: values.email }); } catch {}
    finally { setForgotSent(true); setLoading(false); }
  };

  const portalLabel = staffRole === 'STUDIO_MANAGER' ? 'Studio Manager Portal' : 'Employee Portal';

  if (showForgot) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#111111] flex items-center justify-center p-4 relative">
        <div className="absolute top-4 right-4"><ThemeToggle /></div>
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Link href="/"><Logo height={76} /></Link>
          </div>
          <div className="card">
            <button
              onClick={() => { setShowForgot(false); setForgotSent(false); forgotForm.reset(); }}
              className="flex items-center gap-1.5 text-sm text-[#6b6b6b] dark:text-[#8a8a8a] hover:text-gray-900 dark:hover:text-white transition-colors mb-6"
            >
              Back to sign in
            </button>
            {forgotSent ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-[#E5312A] flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-xl font-black">✓</span>
                </div>
                <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-2">Check your inbox</h2>
                <p className="text-sm text-[#6b6b6b] dark:text-[#8a8a8a] leading-relaxed">
                  Reset link sent. Check your inbox — also check spam if you don't see it.
                </p>
              </div>
            ) : (
              <>
                <h2 className="font-black text-gray-900 dark:text-white text-xl mb-1">Reset your password</h2>
                <p className="text-sm text-[#6b6b6b] dark:text-[#8a8a8a] mb-6">Enter your registered email address.</p>
                <form onSubmit={forgotForm.handleSubmit(handleForgotPassword)} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black tracking-[0.15em] uppercase text-[#aaa] dark:text-[#555] mb-2">Email Address</label>
                    <input {...forgotForm.register('email')} type="email" placeholder="E-mail" className="input-field" autoComplete="email" />
                    {forgotForm.formState.errors.email && <p className="text-[#E5312A] text-xs mt-1">{forgotForm.formState.errors.email.message}</p>}
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Sending reset link...' : 'Send Reset Link'}</button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#111111] flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo height={76} />
        </div>

        <p className="text-center text-xs font-bold tracking-widest uppercase text-white dark:text-white mb-3">{portalLabel}</p>

        <div className="card">
          <div className="flex border border-[#e5e5e5] dark:border-[#2a2a2a] mb-6">
            <button
              onClick={() => setTab('email')}
              className={`flex-1 py-2.5 text-sm font-bold transition-colors ${tab === 'email' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'text-[#6b6b6b] dark:text-[#8a8a8a] hover:text-gray-900 dark:hover:text-white'}`}
            >
              Email
            </button>
            <button
              onClick={() => { setTab('otp'); setOtpSent(false); }}
              className={`flex-1 py-2.5 text-sm font-bold transition-colors ${tab === 'otp' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'text-[#6b6b6b] dark:text-[#8a8a8a] hover:text-gray-900 dark:hover:text-white'}`}
            >
              Mobile OTP
            </button>
          </div>

          {tab === 'email' && (
            <form onSubmit={loginForm.handleSubmit(handleEmailLogin)} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black tracking-[0.15em] uppercase text-[#aaa] dark:text-[#555] mb-2">Email</label>
                <input {...loginForm.register('email')} type="email" placeholder="E-mail" className="input-field" autoComplete="email" />
                {loginForm.formState.errors.email && <p className="text-[#E5312A] text-xs mt-1">{loginForm.formState.errors.email.message}</p>}
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-black tracking-[0.15em] uppercase text-[#aaa] dark:text-[#555]">Password</label>
                  <button type="button" onClick={() => setShowForgot(true)} className="text-xs text-[#E5312A] hover:text-[#CC2A24] font-medium transition-colors">Forgot password?</button>
                </div>
                <div className="relative">
                  <input {...loginForm.register('password')} type={showPass ? 'text' : 'password'} placeholder="Password" className="input-field pr-11" autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa] hover:text-gray-600 dark:hover:text-[#a0a0a0] transition-colors" tabIndex={-1}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {loginForm.formState.errors.password && <p className="text-[#E5312A] text-xs mt-1">{loginForm.formState.errors.password.message}</p>}
              </div>
              <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Signing in...' : 'Sign In'}</button>
            </form>
          )}

          {tab === 'otp' && (
            <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black tracking-[0.15em] uppercase text-[#aaa] dark:text-[#555] mb-2">Mobile Number</label>
                <div className="flex gap-2 min-w-0">
                  <input {...otpForm.register('phone')} type="tel" placeholder="98xxxxxxxx" className="input-field min-w-0" disabled={otpSent} />
                  {!otpSent && (
                    <button type="button" onClick={handleSendOtp} disabled={loading} className="px-4 py-3 bg-[#E5312A] text-white text-sm font-bold hover:bg-[#CC2A24] transition-colors whitespace-nowrap disabled:opacity-50">
                      {loading ? '...' : 'Send OTP'}
                    </button>
                  )}
                </div>
                {otpForm.formState.errors.phone && <p className="text-[#E5312A] text-xs mt-1">{otpForm.formState.errors.phone.message}</p>}
              </div>
              {otpSent && (
                <div>
                  <label className="block text-[10px] font-black tracking-[0.15em] uppercase text-[#aaa] dark:text-[#555] mb-2">OTP</label>
                  <input {...otpForm.register('otp')} type="text" placeholder="Enter the 6-digit code" maxLength={6} className="input-field tracking-widest text-center text-lg" />
                  {otpForm.formState.errors.otp && <p className="text-[#E5312A] text-xs mt-1">{otpForm.formState.errors.otp.message}</p>}
                  <button type="button" onClick={() => setOtpSent(false)} className="text-xs text-[#E5312A] mt-2 hover:underline">Use a different number</button>
                </div>
              )}
              {otpSent && (
                <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Verifying...' : 'Verify & Sign In'}</button>
              )}
            </form>
          )}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e5e5e5] dark:border-[#2a2a2a]" />
            </div>
            <div className="relative flex justify-center text-xs text-[#aaa] dark:text-[#555]">
              <span className="bg-white dark:bg-[#181818] px-3">or</span>
            </div>
          </div>

          <button
            onClick={() => { window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`; }}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-[#e5e5e5] dark:border-[#2a2a2a] hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a] transition-colors font-medium text-gray-700 dark:text-[#a0a0a0] text-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-xs text-[#aaa] dark:text-[#555] mt-6">
            {staffRole === 'STUDIO_MANAGER' ? (
              <>Not a manager? <button type="button" onClick={() => { setStaffRole('EMPLOYEE'); loginForm.reset(); otpForm.reset(); setOtpSent(false); }} className="text-[#E5312A] hover:underline">Employee login</button></>
            ) : (
              <>Not an employee? <button type="button" onClick={() => { setStaffRole('STUDIO_MANAGER'); loginForm.reset(); otpForm.reset(); setOtpSent(false); }} className="text-[#E5312A] hover:underline">Studio Manager login</button></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
