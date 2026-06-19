'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Users, CreditCard, TrendingUp, Clock, UserCheck, Shield, UserCircle, Trophy, ChevronRight } from 'lucide-react';
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

const ROLE_BADGE: Record<Role, { label: string; bg: string; text: string; border: string; avatarBg: string }> = {
  SUPER_ADMIN:    { label: 'Super Admin',    bg: 'bg-red-50 dark:bg-[#E5312A]/10',     text: 'text-[#E5312A]',                     border: 'border-red-200 dark:border-[#E5312A]/30',    avatarBg: 'bg-[#E5312A]'  },
  STUDIO_MANAGER: { label: 'Studio Manager', bg: 'bg-gray-50 dark:bg-[#1a1a1a]',       text: 'text-gray-700 dark:text-gray-400',   border: 'border-gray-200 dark:border-[#3a3a3a]',       avatarBg: 'bg-gray-600'   },
  EMPLOYEE:       { label: 'Employee',        bg: 'bg-green-50 dark:bg-green-900/20',   text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-800',       avatarBg: 'bg-green-600'  },
  REFERRAL_AGENT: { label: 'Referral Agent',  bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800',  avatarBg: 'bg-orange-600' },
  CUSTOMER:       { label: 'Customer',        bg: 'bg-gray-50 dark:bg-[#1a1a1a]',       text: 'text-gray-700 dark:text-gray-400',   border: 'border-gray-200 dark:border-[#3a3a3a]',       avatarBg: 'bg-gray-600'   },
};

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  SUPER_ADMIN:    ['Manage all bookings', 'Manage staff & agents', 'View all reports', 'Configure services', 'Process payments'],
  STUDIO_MANAGER: ['Manage bookings',     'View customers',        'Process payments', 'Generate invoices',  'View reports'],
  EMPLOYEE:       ['View bookings',        'Access calendar'],
  REFERRAL_AGENT: ['View referred bookings', 'Track commissions'],
  CUSTOMER:       ['Book studio sessions', 'Track my bookings',    'Download invoices'],
};

const PAYMENT_STEPS = [
  { step: '01', title: 'Submit Request',  desc: 'Fill in shoot date, service, and duration. We check availability.' },
  { step: '02', title: 'Get Quoted',      desc: 'Studio sends you a custom price quote via email and dashboard.' },
  { step: '03', title: 'Booking Approved', desc: 'Once approved, a "Pay Now" button appears on your booking.' },
  { step: '04', title: 'Pay Advance',     desc: 'Pay the advance online (UPI, card, net banking) to lock your slot.' },
  { step: '05', title: 'Attend Shoot',    desc: 'Show up on schedule. Balance is settled on the day of shoot.' },
  { step: '06', title: 'Get Invoice',     desc: 'A GST-compliant tax invoice is emailed after session completion.' },
];

export default function DashboardPage() {
  const [user,       setUser]       = useState<AuthUser | null>(null);
  const [stats,      setStats]      = useState<any>(null);
  const [myBookings, setMyBookings] = useState<any[] | null>(null);

  useEffect(() => {
    const u = getStoredUser();
    setUser(u);

    if (u?.role === 'SUPER_ADMIN' || u?.role === 'STUDIO_MANAGER') {
      api.get('/dashboard/stats').then(r => setStats(r.data)).catch(() => {});
    } else {
      api.get('/bookings')
        .then(r => setMyBookings(r.data.slice(0, 5)))
        .catch(() => setMyBookings([]));
    }
  }, []);

  if (!user) return null;

  const isAdmin  = user.role === 'SUPER_ADMIN' || user.role === 'STUDIO_MANAGER';
  const badge    = ROLE_BADGE[user.role];
  const perms    = ROLE_PERMISSIONS[user.role];
  const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="p-4 sm:p-6 space-y-6">

      {/* ─── IDENTITY BANNER ──────────────────────────────────────────── */}
      <div className={`rounded-xl border ${badge.border} ${badge.bg} p-5`}>
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-full ${badge.avatarBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
            <span className="text-white font-bold text-lg">{initials}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">{user.name}</h1>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
                <Shield size={11} />
                {badge.label}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-[#a0a0a0] mb-3">{user.email}</p>

            <div className="flex flex-wrap gap-1.5">
              {perms.map(p => (
                <span key={p} className="text-xs bg-white/70 dark:bg-white/5 border border-gray-200 dark:border-[#3a3a3a] text-gray-600 dark:text-[#a0a0a0] px-2 py-0.5 rounded-full">
                  {p}
                </span>
              ))}
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-end flex-shrink-0">
            <div className={`text-3xl font-black ${badge.text} opacity-20 uppercase tracking-tight`}>
              {user.role.replace(/_/g, ' ')}
            </div>
          </div>
        </div>
      </div>

      {/* ─── SECTION TITLE ──────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {isAdmin ? "Studio Overview" : `Welcome, ${user.name.split(' ')[0]}`}
        </h2>
        <p className="text-sm text-gray-500 dark:text-[#a0a0a0] mt-0.5">
          {isAdmin ? "Here's what's happening in the studio today" : "Track your bookings and activity below"}
        </p>
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
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${card.bg}`}>
                  <Icon size={18} className={card.color} />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                <p className="text-xs text-gray-500 dark:text-[#a0a0a0] mt-0.5">{card.label}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── RECENT BOOKINGS ──────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="card p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-[#3a3a3a] flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">
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
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[b.status] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
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

          {/* ─── PAYMENT WORKFLOW (customer only) ──────────────────────── */}
          {!isAdmin && user.role === 'CUSTOMER' && (
            <div className="mt-4 card p-0 overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-[#3a3a3a]">
                <p className="text-[10px] font-black tracking-[0.15em] uppercase text-[#E5312A]">How It Works</p>
                <h3 className="font-semibold text-gray-900 dark:text-white mt-0.5">Booking &amp; Payment Process</h3>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-[#3a3a3a]">
                {PAYMENT_STEPS.map(s => (
                  <div key={s.step} className="flex items-start gap-4 p-4">
                    <span className="w-7 h-7 rounded-full bg-[#E5312A]/10 dark:bg-[#E5312A]/15 text-[#E5312A] text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                      {s.step}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{s.title}</p>
                      <p className="text-xs text-gray-500 dark:text-[#8a8a8a] mt-0.5 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-gray-50 dark:bg-[#181818] border-t border-gray-100 dark:border-[#3a3a3a]">
                <Link href="/dashboard/bookings/new" className="inline-flex items-center gap-2 text-sm font-semibold text-[#E5312A] hover:underline">
                  Book a studio session now <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ─── QUICK ACTIONS + REVENUE ──────────────────────────────────── */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {isAdmin && (
                <>
                  <Link href="/dashboard/bookings/new" className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-[#3a3a3a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors text-sm font-medium text-gray-700 dark:text-[#a0a0a0]">
                    <BookOpen size={16} className="text-[#E5312A]/70" />
                    New Booking
                  </Link>
                  <Link href="/dashboard/payments" className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-[#3a3a3a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors text-sm font-medium text-gray-700 dark:text-[#a0a0a0]">
                    <CreditCard size={16} className="text-green-500" />
                    Record Payment
                  </Link>
                  <Link href="/dashboard/reports" className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-[#3a3a3a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors text-sm font-medium text-gray-700 dark:text-[#a0a0a0]">
                    <TrendingUp size={16} className="text-purple-500" />
                    Generate Report
                  </Link>
                </>
              )}

              {user.role === 'EMPLOYEE' && (
                <Link href="/dashboard/calendar" className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-[#3a3a3a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors text-sm font-medium text-gray-700 dark:text-[#a0a0a0]">
                  <Clock size={16} className="text-[#E5312A]/70" />
                  View Schedule
                </Link>
              )}

              {user.role === 'REFERRAL_AGENT' && (
                <Link href="/dashboard/commissions" className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-[#3a3a3a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors text-sm font-medium text-gray-700 dark:text-[#a0a0a0]">
                  <CreditCard size={16} className="text-orange-500" />
                  My Commissions
                </Link>
              )}

              {user.role === 'CUSTOMER' && (
                <>
                  <Link href="/dashboard/bookings/new" className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-[#3a3a3a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors text-sm font-medium text-gray-700 dark:text-[#a0a0a0]">
                    <BookOpen size={16} className="text-[#E5312A]/70" />
                    Book Studio
                  </Link>
                  <Link href="/dashboard/invoices" className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-[#3a3a3a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors text-sm font-medium text-gray-700 dark:text-[#a0a0a0]">
                    <CreditCard size={16} className="text-green-500" />
                    My Invoices
                  </Link>
                </>
              )}
            </div>
          </div>

          {stats?.revenueByMonth && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Revenue (6 months)</h3>
              <div className="space-y-2">
                {stats.revenueByMonth.map((m: any) => {
                  const max = Math.max(...stats.revenueByMonth.map((x: any) => x.revenue), 1);
                  const pct = Math.round((m.revenue / max) * 100);
                  return (
                    <div key={m.month}>
                      <div className="flex justify-between text-xs text-gray-500 dark:text-[#a0a0a0] mb-1">
                        <span>{m.month}</span>
                        <span className="font-medium text-gray-700 dark:text-white">₹{Number(m.revenue).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-[#3a3a3a] rounded-full overflow-hidden">
                        <div className="h-full bg-[#E5312A] rounded-full" style={{ width: `${pct}%` }} />
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
                <h3 className="font-semibold text-gray-900 dark:text-white">Top Agents</h3>
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
