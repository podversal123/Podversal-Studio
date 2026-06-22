'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CallbackHandler() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken  = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const userStr      = searchParams.get('user');

    if (!accessToken || !userStr) {
      router.replace('/login?error=google_failed');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      localStorage.setItem('access_token',  accessToken);
      localStorage.setItem('refresh_token', refreshToken ?? '');
      localStorage.setItem('user',          JSON.stringify(user));
      window.location.href = '/dashboard';
    } catch {
      window.location.href = '/login?error=google_failed';
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#111111]">
      <p className="text-sm text-gray-500 dark:text-gray-400">Signing you in...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#111111]">
        <p className="text-sm text-gray-500 dark:text-gray-400">Signing you in...</p>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
