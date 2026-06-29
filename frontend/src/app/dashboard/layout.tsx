'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import MobileHeader from '@/components/layout/MobileHeader';
import { getStoredUser, isAuthenticated } from '@/lib/auth';
import { AuthUser } from '@/types';
import { useLiveEvents } from '@/lib/use-live-events';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }
    setUser(getStoredUser());
  }, [router]);

  useLiveEvents((event) => {
    window.dispatchEvent(new CustomEvent('podversal:live', { detail: event }));
  });

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-[#0a0a0a]">
      <Sidebar
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <MobileHeader onOpen={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 lg:p-6 2xl:p-8 3xl:p-10 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
