'use client';

import Link from 'next/link';
import { Shield, UserCheck, Users, Briefcase } from 'lucide-react';
import dynamic from 'next/dynamic';
import Logo from '@/components/Logo';
const ThemeToggle = dynamic(() => import('@/components/ThemeToggle'), { ssr: false });

const STAFF_ROLES = [
  {
    role:  'SUPER_ADMIN',
    label: 'Super Admin',
    desc:  'Full studio access — manage bookings, staff, reports, and settings',
    icon:  Shield,
    color: 'text-[#E5312A]',
    bg:    'bg-[#E5312A]/8 dark:bg-[#E5312A]/12',
    border:'border-[#E5312A]/20',
  },
  {
    role:  'STUDIO_MANAGER',
    label: 'Studio Manager',
    desc:  'Manage bookings, customers, payments, and team assignments',
    icon:  UserCheck,
    color: 'text-gray-600 dark:text-gray-300',
    bg:    'bg-gray-50 dark:bg-[#1a1a1a]',
    border:'border-gray-200 dark:border-[#3a3a3a]',
  },
  {
    role:  'EMPLOYEE',
    label: 'Employee',
    desc:  'View assigned bookings and check the studio calendar',
    icon:  Users,
    color: 'text-green-600 dark:text-green-400',
    bg:    'bg-green-50 dark:bg-green-900/15',
    border:'border-green-200 dark:border-green-800',
  },
  {
    role:  'REFERRAL_AGENT',
    label: 'Referral Agent',
    desc:  'Track referred bookings and view your commission earnings',
    icon:  Briefcase,
    color: 'text-orange-600 dark:text-orange-400',
    bg:    'bg-orange-50 dark:bg-orange-900/15',
    border:'border-orange-200 dark:border-orange-800',
  },
];

export default function StaffLoginPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#111111] flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>

      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo height={76} />
        </div>

        <div className="text-center mb-6">
          <p className="text-[10px] font-black tracking-[0.2em] uppercase text-[#E5312A] mb-1">Internal Portal</p>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Staff Sign In</h1>
          <p className="text-sm text-[#6b6b6b] dark:text-[#8a8a8a] mt-1.5">Select your role to continue</p>
        </div>

        <div className="space-y-2.5">
          {STAFF_ROLES.map(({ role, label, desc, icon: Icon, color, bg, border }) => (
            <Link
              key={role}
              href={`/login?role=${role}`}
              className={`flex items-center gap-4 p-4 border ${border} ${bg} hover:scale-[1.01] transition-all duration-150 group`}
            >
              <div className={`w-10 h-10 flex items-center justify-center flex-shrink-0 bg-white dark:bg-[#181818] border ${border}`}>
                <Icon size={18} className={color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 dark:text-white text-sm">{label}</p>
                <p className="text-xs text-[#6b6b6b] dark:text-[#8a8a8a] mt-0.5 leading-snug">{desc}</p>
              </div>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={`flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${color}`}>
                <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          ))}
        </div>

        <p className="text-center text-xs text-[#6b6b6b] dark:text-[#555] mt-8">
          Not staff?{' '}
          <Link href="/login" className="text-[#E5312A] font-semibold hover:underline">
            Customer login →
          </Link>
        </p>
      </div>
    </div>
  );
}
