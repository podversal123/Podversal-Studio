'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Users, CreditCard, TrendingUp, Clock, UserCheck, UserCircle, Trophy, Calendar, FileText, Bell } from 'lucide-react';
import { getStoredUser } from '@/lib/auth';
import { AuthUser, Role } from '@/types';
import api from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  REQUEST:      'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  CHECKING:     'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  QUOTED:       'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  APPROVED:     'bg-[#E5312A]/10 dark:bg-[#E5312A]/20 text-[#E5312A]',
  ADVANCE_PAID: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  IN_PROGRESS:  'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  COMPLETED:    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  CANCELLED:    'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
};


export default function DashboardPage() {
  const [user,          setUser]          = useState<AuthUser | null>(null);
  const [stats,         setStats]         = useState<any>(null);
  const [myBookings,    setMyBookings]    = useState<any[] | null>(null);
  const [notifications, setNotifications] = useState<any[] | null>(null);

  useEffect(() => {
    const u = getStoredUser();
    setUser(u);

    const loadData = (role: string) => {
      if (role === 'SUPER_ADMIN' || role === 'STUDIO_MANAGER') {
        api.get('/dashboard/stats').then(r => setStats(r.data)).catch(() => {});
        api.get('/notifications').then(r => setNotifications(r.data)).catch(() => setNotifications([]));
      } else {
        api.get('/bookings')
          .then(r => setMyBookings(r.data.slice(0, 5)))
          .catch(() => setMyBookings([]));
      }
    };

    if (u) loadData(u.role);

    const handler = () => { if (u) loadData(u.role); };
    window.addEventListener('podversal:live', handler);
    return () => window.removeEventListener('podversal:live', handler);
  }, []);

  if (!user) return null;

  // ─── CUSTOMER DASHBOARD ──────────────────────────────────────────────────────
  if (user.role === 'CUSTOMER') {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const bookings: any[] = myBookings ?? [];
    const now = new Date();
    const upcoming     = bookings.filter(b => !['COMPLETED','CANCELLED'].includes(b.status) && new Date(b.shootDate) >= now).length;
    const completed    = bookings.filter(b => b.status === 'COMPLETED').length;
    const needsPayment = bookings.filter(b => b.status === 'APPROVED').length;
    const recent       = bookings.slice(0, 3);

    return (
      <div className="space-y-5">

        {/* Greeting */}
        <div>
          <p className="text-[10px] font-black tracking-[0.15em] uppercase text-[#aaa] dark:text-[#555]">
            {greeting} &middot; {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 className="text-2xl 2xl:text-3xl 3xl:text-4xl font-black text-gray-900 dark:text-white mt-1">{user.name}</h1>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 2xl:gap-4 3xl:gap-5">
          {([
            { label: 'Total Bookings', value: myBookings === null ? '—' : bookings.length,  icon: BookOpen,  color: 'text-gray-700 dark:text-white',                                                              bg: 'bg-gray-100 dark:bg-[#2a2a2a]'                  },
            { label: 'Upcoming',       value: myBookings === null ? '—' : upcoming,          icon: Calendar,  color: 'text-blue-600 dark:text-blue-400',                                                           bg: 'bg-blue-50 dark:bg-blue-900/20'                  },
            { label: 'Completed',      value: myBookings === null ? '—' : completed,         icon: UserCheck, color: 'text-green-600 dark:text-green-400',                                                         bg: 'bg-green-50 dark:bg-green-900/20'                },
            { label: 'Needs Payment',  value: myBookings === null ? '—' : needsPayment,      icon: CreditCard,color: needsPayment > 0 ? 'text-[#E5312A]' : 'text-gray-400 dark:text-[#555]',                     bg: needsPayment > 0 ? 'bg-[#E5312A]/10 dark:bg-[#E5312A]/15' : 'bg-gray-50 dark:bg-[#1a1a1a]' },
          ] as const).map(card => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="card p-4 flex items-center gap-3">
                <div className={`w-9 h-9 flex items-center justify-center flex-shrink-0 ${card.bg}`}>
                  <Icon size={16} className={card.color} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">{card.value}</p>
                  <p className="text-[11px] text-gray-400 dark:text-[#666] mt-0.5 truncate">{card.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 3xl:grid-cols-4 gap-4 2xl:gap-5 3xl:gap-6">

          {/* Recent Bookings */}
          <div className="lg:col-span-2 card p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-[#3a3a3a] flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Recent Bookings</h3>
              <Link href="/dashboard/bookings" className="text-xs font-medium text-[#E5312A] hover:underline">View all</Link>
            </div>
            {myBookings === null ? (
              <div className="p-8 text-center text-sm text-gray-400 dark:text-[#555]">Loading…</div>
            ) : recent.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="text-sm text-gray-500 dark:text-[#555]">No bookings yet.</p>
                <Link href="/dashboard/bookings/new" className="inline-block text-sm font-semibold text-[#E5312A] hover:underline">
                  Book your first session →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-[#3a3a3a]">
                {recent.map((b: any) => (
                  <Link key={b.id} href={`/dashboard/bookings/${b.id}`}
                    className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-gray-400 dark:text-[#555]">{b.bookingCode}</span>
                        <span className={`px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[b.status] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                          {b.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5 truncate">{b.service?.name}</p>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-[#555] flex-shrink-0">
                      {new Date(b.shootDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card">
            <p className="text-[10px] font-black tracking-[0.15em] uppercase text-[#aaa] dark:text-[#555] mb-3">Actions</p>
            <div className="space-y-2">
              <Link href="/dashboard/bookings/new"
                className="flex items-center gap-3 p-3 border border-gray-100 dark:border-[#3a3a3a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors text-sm font-medium text-gray-700 dark:text-[#a0a0a0]"
              >
                <BookOpen size={15} className="text-[#E5312A] flex-shrink-0" />
                Book Studio Session
              </Link>
              <Link href="/dashboard/invoices"
                className="flex items-center gap-3 p-3 border border-gray-100 dark:border-[#3a3a3a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors text-sm font-medium text-gray-700 dark:text-[#a0a0a0]"
              >
                <FileText size={15} className="text-gray-400 flex-shrink-0" />
                My Invoices
              </Link>
              <Link href="/dashboard/profile"
                className="flex items-center gap-3 p-3 border border-gray-100 dark:border-[#3a3a3a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors text-sm font-medium text-gray-700 dark:text-[#a0a0a0]"
              >
                <UserCircle size={15} className="text-gray-400 flex-shrink-0" />
                My Profile
              </Link>
              {needsPayment > 0 && (
                <Link href="/dashboard/bookings"
                  className="flex items-center gap-3 p-3 border border-[#E5312A]/30 bg-[#E5312A]/5 hover:bg-[#E5312A]/10 transition-colors text-sm font-semibold text-[#E5312A]"
                >
                  <CreditCard size={15} className="flex-shrink-0" />
                  {needsPayment} booking{needsPayment !== 1 ? 's' : ''} need{needsPayment === 1 ? 's' : ''} payment
                </Link>
              )}
            </div>
          </div>

        </div>
      </div>
    );
  }

  // ─── EMPLOYEE DASHBOARD ──────────────────────────────────────────────────────
  if (user.role === 'EMPLOYEE') {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const bookings: any[] = myBookings ?? [];
    const now  = new Date();
    const today = new Date().toISOString().split('T')[0];
    const upcoming    = bookings.filter(b => !['COMPLETED','CANCELLED'].includes(b.status) && new Date(b.shootDate) >= now).length;
    const completed   = bookings.filter(b => b.status === 'COMPLETED').length;
    const todayShoots = bookings.filter(b => b.shootDate?.split('T')[0] === today && b.status !== 'CANCELLED').length;
    const recent = bookings.slice(0, 3);

    return (
      <div className="space-y-5">
        <div>
          <p className="text-[10px] font-black tracking-[0.15em] uppercase text-[#aaa] dark:text-[#555]">
            {greeting} &middot; {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 className="text-2xl 2xl:text-3xl 3xl:text-4xl font-black text-gray-900 dark:text-white mt-1">{user.name}</h1>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 2xl:gap-4 3xl:gap-5">
          {([
            { label: 'Total Assigned', value: myBookings === null ? '—' : bookings.length, icon: BookOpen,  color: 'text-gray-700 dark:text-white',          bg: 'bg-gray-100 dark:bg-[#2a2a2a]'                   },
            { label: 'Upcoming',       value: myBookings === null ? '—' : upcoming,        icon: Calendar,  color: 'text-blue-600 dark:text-blue-400',       bg: 'bg-blue-50 dark:bg-blue-900/20'                   },
            { label: 'Completed',      value: myBookings === null ? '—' : completed,       icon: UserCheck, color: 'text-green-600 dark:text-green-400',     bg: 'bg-green-50 dark:bg-green-900/20'                 },
            { label: "Today's Shoots", value: myBookings === null ? '—' : todayShoots,     icon: Clock,     color: todayShoots > 0 ? 'text-[#E5312A]' : 'text-gray-400 dark:text-[#555]', bg: todayShoots > 0 ? 'bg-[#E5312A]/10 dark:bg-[#E5312A]/15' : 'bg-gray-50 dark:bg-[#1a1a1a]' },
          ] as const).map(card => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="card p-4 flex items-center gap-3">
                <div className={`w-9 h-9 flex items-center justify-center flex-shrink-0 ${card.bg}`}>
                  <Icon size={16} className={card.color} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">{card.value}</p>
                  <p className="text-[11px] text-gray-400 dark:text-[#666] mt-0.5 truncate">{card.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 3xl:grid-cols-4 gap-4 2xl:gap-5 3xl:gap-6">
          <div className="lg:col-span-2 card p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-[#3a3a3a] flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Assigned Bookings</h3>
              <Link href="/dashboard/bookings" className="text-xs font-medium text-[#E5312A] hover:underline">View all</Link>
            </div>
            {myBookings === null ? (
              <div className="p-8 text-center text-sm text-gray-400 dark:text-[#555]">Loading…</div>
            ) : recent.length === 0 ? (
              <div className="p-8 text-center"><p className="text-sm text-gray-500 dark:text-[#555]">No assigned bookings yet.</p></div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-[#3a3a3a]">
                {recent.map((b: any) => (
                  <Link key={b.id} href={`/dashboard/bookings/${b.id}`}
                    className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-gray-400 dark:text-[#555]">{b.bookingCode}</span>
                        <span className={`px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[b.status] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                          {b.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5 truncate">{b.service?.name}</p>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-[#555] flex-shrink-0">
                      {new Date(b.shootDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <p className="text-[10px] font-black tracking-[0.15em] uppercase text-[#aaa] dark:text-[#555] mb-3">Actions</p>
            <div className="space-y-2">
              <Link href="/dashboard/calendar"
                className="flex items-center gap-3 p-3 border border-gray-100 dark:border-[#3a3a3a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors text-sm font-medium text-gray-700 dark:text-[#a0a0a0]"
              >
                <Calendar size={15} className="text-[#E5312A] flex-shrink-0" />
                View Schedule
              </Link>
              <Link href="/dashboard/bookings"
                className="flex items-center gap-3 p-3 border border-gray-100 dark:border-[#3a3a3a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors text-sm font-medium text-gray-700 dark:text-[#a0a0a0]"
              >
                <BookOpen size={15} className="text-gray-400 flex-shrink-0" />
                My Bookings
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── REFERRAL AGENT DASHBOARD ─────────────────────────────────────────────────
  if (user.role === 'REFERRAL_AGENT') {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const bookings: any[] = myBookings ?? [];
    const now = new Date();
    const active    = bookings.filter(b => !['COMPLETED','CANCELLED'].includes(b.status)).length;
    const completed = bookings.filter(b => b.status === 'COMPLETED').length;
    const pending   = bookings.filter(b => b.status === 'ADVANCE_PAID' || b.status === 'IN_PROGRESS').length;
    const recent = bookings.slice(0, 3);

    return (
      <div className="space-y-5">
        <div>
          <p className="text-[10px] font-black tracking-[0.15em] uppercase text-[#aaa] dark:text-[#555]">
            {greeting} &middot; {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 className="text-2xl 2xl:text-3xl 3xl:text-4xl font-black text-gray-900 dark:text-white mt-1">{user.name}</h1>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 2xl:gap-4 3xl:gap-5">
          {([
            { label: 'Total Referred', value: myBookings === null ? '—' : bookings.length, icon: BookOpen,   color: 'text-gray-700 dark:text-white',        bg: 'bg-gray-100 dark:bg-[#2a2a2a]'                    },
            { label: 'Active',         value: myBookings === null ? '—' : active,          icon: TrendingUp, color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/20'                    },
            { label: 'Completed',      value: myBookings === null ? '—' : completed,       icon: UserCheck,  color: 'text-green-600 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-900/20'                  },
            { label: 'Pending Payout', value: myBookings === null ? '—' : pending,         icon: CreditCard, color: pending > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-[#555]', bg: pending > 0 ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-gray-50 dark:bg-[#1a1a1a]' },
          ] as const).map(card => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="card p-4 flex items-center gap-3">
                <div className={`w-9 h-9 flex items-center justify-center flex-shrink-0 ${card.bg}`}>
                  <Icon size={16} className={card.color} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">{card.value}</p>
                  <p className="text-[11px] text-gray-400 dark:text-[#666] mt-0.5 truncate">{card.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 3xl:grid-cols-4 gap-4 2xl:gap-5 3xl:gap-6">
          <div className="lg:col-span-2 card p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-[#3a3a3a] flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Referred Bookings</h3>
              <Link href="/dashboard/bookings" className="text-xs font-medium text-[#E5312A] hover:underline">View all</Link>
            </div>
            {myBookings === null ? (
              <div className="p-8 text-center text-sm text-gray-400 dark:text-[#555]">Loading…</div>
            ) : recent.length === 0 ? (
              <div className="p-8 text-center"><p className="text-sm text-gray-500 dark:text-[#555]">No referred bookings yet.</p></div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-[#3a3a3a]">
                {recent.map((b: any) => (
                  <Link key={b.id} href={`/dashboard/bookings/${b.id}`}
                    className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-gray-400 dark:text-[#555]">{b.bookingCode}</span>
                        <span className={`px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[b.status] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                          {b.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5 truncate">{b.service?.name}</p>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-[#555] flex-shrink-0">
                      {new Date(b.shootDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <p className="text-[10px] font-black tracking-[0.15em] uppercase text-[#aaa] dark:text-[#555] mb-3">Actions</p>
            <div className="space-y-2">
              <Link href="/dashboard/commissions"
                className="flex items-center gap-3 p-3 border border-gray-100 dark:border-[#3a3a3a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors text-sm font-medium text-gray-700 dark:text-[#a0a0a0]"
              >
                <CreditCard size={15} className="text-orange-500 flex-shrink-0" />
                My Commissions
              </Link>
              <Link href="/dashboard/bookings"
                className="flex items-center gap-3 p-3 border border-gray-100 dark:border-[#3a3a3a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors text-sm font-medium text-gray-700 dark:text-[#a0a0a0]"
              >
                <BookOpen size={15} className="text-gray-400 flex-shrink-0" />
                My Bookings
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── ADMIN DASHBOARD (SUPER_ADMIN / STUDIO_MANAGER) ──────────────────────────
  const isAdmin = true;
  const hour    = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">

      {/* ─── GREETING HEADER ──────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-black tracking-[0.15em] uppercase text-[#aaa] dark:text-[#555]">
          {greeting} &middot; {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{user.name}</h1>
        <p className="text-sm text-[#6b6b6b] dark:text-[#8a8a8a] mt-0.5">Studio Overview</p>
      </div>

      {/* ─── ADMIN KPI CARDS ────────────────────────────────────────────── */}
      {isAdmin && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Today's Bookings",   value: stats?.todaysBookings ?? '—',                                      icon: BookOpen,   color: 'text-[#E5312A]',                         bg: 'bg-[#E5312A]/10 dark:bg-[#E5312A]/15'     },
            { label: 'Pending Actions',    value: stats?.pendingBookings ?? '—',                                     icon: Clock,      color: 'text-yellow-600 dark:text-yellow-400',   bg: 'bg-yellow-50 dark:bg-yellow-900/20'        },
            { label: 'Monthly Revenue',    value: stats ? `₹${Math.round(stats.monthlyRevenue / 1000)}K` : '—',     icon: TrendingUp, color: 'text-green-600 dark:text-green-400',     bg: 'bg-green-50 dark:bg-green-900/20'          },
            { label: 'Customers',          value: stats?.totalCustomers ?? '—',                                      icon: Users,      color: 'text-gray-600 dark:text-[#a0a0a0]',      bg: 'bg-gray-100 dark:bg-[#2a2a2a]'             },
            { label: 'Pending Commission', value: stats ? `₹${Math.round(stats.pendingCommissions / 1000)}K` : '—', icon: CreditCard, color: 'text-orange-600 dark:text-orange-400',   bg: 'bg-orange-50 dark:bg-orange-900/20'        },
            { label: 'Occupancy Today',    value: stats ? `${stats.occupancyRate}%` : '—',                           icon: UserCheck,  color: 'text-gray-600 dark:text-[#a0a0a0]',      bg: 'bg-gray-100 dark:bg-[#2a2a2a]'             },
          ].map(card => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="card p-4">
                <div className={`w-9 h-9 flex items-center justify-center mb-3 ${card.bg}`}>
                  <Icon size={18} className={card.color} />
                </div>
                <p className="text-2xl font-black text-gray-900 dark:text-white">{card.value}</p>
                <p className="text-xs text-gray-500 dark:text-[#a0a0a0] mt-0.5">{card.label}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── RECENT BOOKINGS ──────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-[#3a3a3a] flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white">
                {isAdmin ? 'Recent Bookings' : 'My Bookings'}
              </h3>
              <Link href="/dashboard/bookings" className="text-sm text-[#E5312A] hover:underline">
                View all
              </Link>
            </div>

            {(() => {
              const bookingList = isAdmin ? (stats?.recentBookings ?? null) : myBookings;
              if (bookingList === null) {
                return (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-sm text-gray-400 dark:text-[#555]">Loading...</p>
                  </div>
                );
              }
              if (bookingList.length > 0) {
                return (
                  <div className="divide-y divide-gray-50 dark:divide-[#3a3a3a]">
                    {bookingList.map((b: any) => (
                      <Link
                        key={b.id}
                        href={`/dashboard/bookings/${b.id}`}
                        className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs text-gray-500 dark:text-[#666]">{b.bookingCode}</span>
                            <span className={`px-2 py-0.5 text-xs font-bold ${STATUS_COLORS[b.status] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                              {b.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{b.service?.name}</p>
                        </div>
                        <span className="text-xs text-gray-400 dark:text-[#555] flex-shrink-0">
                          {new Date(b.shootDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                      </Link>
                    ))}
                  </div>
                );
              }
              return (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <UserCircle size={36} className="text-gray-200 dark:text-[#333] mb-2" />
                  <p className="text-sm text-gray-400 dark:text-[#555]">No bookings yet</p>
                </div>
              );
            })()}
          </div>


          {/* ─── ACTIVITY FEED ──────────────────────────────────────────── */}
          <div className="card p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-[#3a3a3a] flex items-center gap-2">
              <Bell size={14} className="text-[#E5312A]" />
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Recent Activity</h3>
            </div>
            {notifications === null ? (
              <div className="p-6 text-center text-sm text-gray-400 dark:text-[#555]">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400 dark:text-[#555]">No activity yet</div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-[#1a1a1a] max-h-80 overflow-y-auto">
                {notifications.slice(0, 20).map((n: any) => (
                  <div key={n.id} className="px-4 py-3">
                    <p className="text-xs font-bold text-gray-800 dark:text-white">{n.subject}</p>
                    <p className="text-xs text-gray-400 dark:text-[#666] mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-gray-300 dark:text-[#444] mt-1">
                      {new Date(n.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* ─── QUICK ACTIONS + REVENUE ──────────────────────────────────── */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link href="/dashboard/bookings/new" className="flex items-center gap-3 p-3 border border-gray-100 dark:border-[#3a3a3a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors text-sm font-medium text-gray-700 dark:text-[#a0a0a0]">
                <BookOpen size={16} className="text-[#E5312A]/70" />
                New Booking
              </Link>
              <Link href="/dashboard/payments" className="flex items-center gap-3 p-3 border border-gray-100 dark:border-[#3a3a3a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors text-sm font-medium text-gray-700 dark:text-[#a0a0a0]">
                <CreditCard size={16} className="text-green-500" />
                Record Payment
              </Link>
              <Link href="/dashboard/reports" className="flex items-center gap-3 p-3 border border-gray-100 dark:border-[#3a3a3a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors text-sm font-medium text-gray-700 dark:text-[#a0a0a0]">
                <TrendingUp size={16} className="text-purple-500" />
                Generate Report
              </Link>
            </div>
          </div>

          {stats?.revenueByMonth && (
            <div className="card">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">Revenue (6 months)</h3>
              <div className="space-y-2">
                {stats.revenueByMonth.map((m: any) => {
                  const max = Math.max(...stats.revenueByMonth.map((x: any) => x.revenue), 1);
                  const pct = Math.round((m.revenue / max) * 100);
                  return (
                    <div key={m.month}>
                      <div className="flex justify-between text-xs text-gray-500 dark:text-[#a0a0a0] mb-1">
                        <span>{m.month}</span>
                        <span className="font-bold text-gray-700 dark:text-white">₹{Number(m.revenue).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-[#3a3a3a] overflow-hidden">
                        <div className="h-full bg-[#E5312A]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {stats?.topAgents?.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={16} className="text-yellow-500" />
                <h3 className="font-bold text-gray-900 dark:text-white">Top Agents</h3>
              </div>
              <div className="space-y-2.5">
                {stats.topAgents.map((agent: any, i: number) => (
                  <div key={agent.agentId} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      i === 0 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                      i === 1 ? 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-[#a0a0a0]' :
                      i === 2 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'bg-gray-50 dark:bg-[#1a1a1a] text-gray-400 dark:text-[#666]'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{agent.name}</p>
                    </div>
                    <span className="text-xs font-semibold text-green-700 dark:text-green-400 flex-shrink-0">
                      ₹{Number(agent.totalCommission).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
