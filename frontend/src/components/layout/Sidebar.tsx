'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Calendar, BookOpen, Users, UserCheck,
  Briefcase, CreditCard, FileText, BarChart2, Settings,
  LogOut, ChevronRight, X, PenSquare, Video, LayoutGrid, User, ShieldCheck,
} from 'lucide-react';
import { AuthUser, Role } from '@/types';
import { logout, ROLE_LABELS } from '@/lib/auth';
import dynamic from 'next/dynamic';
import Logo from '@/components/Logo';
const ThemeToggle = dynamic(() => import('@/components/ThemeToggle'), { ssr: false });

const ROLE_AVATAR_BG: Record<Role, string> = {
  SUPER_ADMIN:    'bg-[#E5312A]',
  STUDIO_MANAGER: 'bg-gray-600 dark:bg-gray-500',
  EMPLOYEE:       'bg-green-600',
  REFERRAL_AGENT: 'bg-orange-600',
  CUSTOMER:       'bg-gray-500',
};

const ROLE_BADGE_CLASS: Record<Role, string> = {
  SUPER_ADMIN:    'bg-[#E5312A]/10 text-[#E5312A]',
  STUDIO_MANAGER: 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-400',
  EMPLOYEE:       'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  REFERRAL_AGENT: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  CUSTOMER:       'bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-400',
};

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  SUPER_ADMIN: [
    { label: 'Dashboard',  href: '/dashboard',             icon: LayoutDashboard },
    { label: 'Bookings',   href: '/dashboard/bookings',    icon: BookOpen        },
    { label: 'Calendar',   href: '/dashboard/calendar',    icon: Calendar        },
    { label: 'Customers',  href: '/dashboard/customers',   icon: Users           },
    { label: 'Agents',     href: '/dashboard/agents',      icon: Briefcase       },
    { label: 'Staff',      href: '/dashboard/staff',       icon: ShieldCheck     },
    { label: 'Employees',  href: '/dashboard/employees',   icon: UserCheck       },
    { label: 'Payments',   href: '/dashboard/payments',    icon: CreditCard      },
    { label: 'Invoices',   href: '/dashboard/invoices',    icon: FileText        },
    { label: 'Reports',    href: '/dashboard/reports',     icon: BarChart2       },
    { label: 'Blog Posts', href: '/dashboard/blogs',       icon: PenSquare       },
    { label: 'Videos',     href: '/dashboard/videos',      icon: Video           },
    { label: 'Gallery',    href: '/dashboard/gallery',     icon: LayoutGrid      },
    { label: 'Settings',   href: '/dashboard/settings',    icon: Settings        },
    { label: 'Profile',    href: '/dashboard/profile',     icon: User            },
  ],
  STUDIO_MANAGER: [
    { label: 'Dashboard',  href: '/dashboard',             icon: LayoutDashboard },
    { label: 'Bookings',   href: '/dashboard/bookings',    icon: BookOpen        },
    { label: 'Calendar',   href: '/dashboard/calendar',    icon: Calendar        },
    { label: 'Customers',  href: '/dashboard/customers',   icon: Users           },
    { label: 'Employees',  href: '/dashboard/employees',   icon: UserCheck       },
    { label: 'Payments',   href: '/dashboard/payments',    icon: CreditCard      },
    { label: 'Invoices',   href: '/dashboard/invoices',    icon: FileText        },
    { label: 'Reports',    href: '/dashboard/reports',     icon: BarChart2       },
    { label: 'Profile',    href: '/dashboard/profile',     icon: User            },
  ],
  EMPLOYEE: [
    { label: 'Dashboard',  href: '/dashboard',             icon: LayoutDashboard },
    { label: 'Bookings',   href: '/dashboard/bookings',    icon: BookOpen        },
    { label: 'Calendar',   href: '/dashboard/calendar',    icon: Calendar        },
    { label: 'Customers',  href: '/dashboard/customers',   icon: Users           },
    { label: 'Profile',    href: '/dashboard/profile',     icon: User            },
  ],
  REFERRAL_AGENT: [
    { label: 'Dashboard',   href: '/dashboard',            icon: LayoutDashboard },
    { label: 'My Bookings', href: '/dashboard/bookings',   icon: BookOpen        },
    { label: 'Commissions', href: '/dashboard/commissions',icon: CreditCard      },
    { label: 'Profile',     href: '/dashboard/profile',    icon: User            },
  ],
  CUSTOMER: [
    { label: 'Dashboard',   href: '/dashboard',              icon: LayoutDashboard },
    { label: 'Book Studio', href: '/dashboard/bookings/new', icon: Calendar        },
    { label: 'My Bookings', href: '/dashboard/bookings',     icon: BookOpen        },
    { label: 'Invoices',    href: '/dashboard/invoices',     icon: FileText        },
    { label: 'Profile',     href: '/dashboard/profile',      icon: User            },
  ],
};

interface SidebarProps {
  user:     AuthUser;
  isOpen?:  boolean;
  onClose?: () => void;
}

export default function Sidebar({ user, isOpen, onClose }: SidebarProps) {
  const pathname  = usePathname();
  const navItems  = NAV_BY_ROLE[user.role] ?? [];
  const initials  = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const content = (
    <div className="flex flex-col h-full">

      {/* Logo bar */}
      <div className="h-20 flex items-center px-5 flex-shrink-0 gap-3">
        <Logo height={56} />
        <div className="flex-1" />
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a] transition-colors"
          >
            <X size={16} className="text-[#6b6b6b] dark:text-[#8a8a8a]" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = (() => {
            if (item.href === '/dashboard') return pathname === '/dashboard';
            if (pathname === item.href) return true;
            if (pathname.startsWith(item.href + '/')) {
              // Don't activate if a more-specific sibling nav item matches
              const moreSpecific = navItems.some(
                other => other.href !== item.href &&
                         other.href.startsWith(item.href) &&
                         pathname.startsWith(other.href),
              );
              return !moreSpecific;
            }
            return false;
          })();

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors group ${
                isActive
                  ? 'bg-[#E5312A]/8 dark:bg-[#E5312A]/12 text-[#E5312A]'
                  : 'text-[#6b6b6b] dark:text-[#8a8a8a] hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a] hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {isActive && <div className="w-0.5 h-4 bg-[#E5312A] -ml-3 mr-2.5 flex-shrink-0" />}
              <Icon
                size={16}
                className={isActive ? 'text-[#E5312A]' : 'text-[#aaa] dark:text-[#555] group-hover:text-[#6b6b6b] dark:group-hover:text-[#8a8a8a]'}
              />
              {item.label}
              {isActive && <ChevronRight size={13} className="ml-auto text-[#E5312A]/50" />}
            </Link>
          );
        })}
      </nav>

      {/* User + theme + logout */}
      <div className="p-4 border-t border-[#e5e5e5] dark:border-[#2a2a2a] flex-shrink-0 space-y-3">
        <div className="flex items-center gap-3 px-1">
          <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 text-white font-black text-xs ${ROLE_AVATAR_BG[user.role]}`}>
            {initials}
          </div>
          <div className="overflow-hidden flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
            {user.role !== 'CUSTOMER' && (
              <span className={`inline-block text-[10px] font-black tracking-[0.1em] uppercase px-1.5 py-0.5 ${ROLE_BADGE_CLASS[user.role]}`}>
                {ROLE_LABELS[user.role]}
              </span>
            )}
          </div>
          <ThemeToggle />
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-[#E5312A] hover:bg-[#E5312A]/5 transition-colors"
        >
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex w-64 2xl:w-72 3xl:w-80 sticky top-0 h-screen bg-white dark:bg-[#0f0f0f] border-r border-[#e5e5e5] dark:border-[#2a2a2a] flex-col flex-shrink-0">
        {content}
      </aside>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/40 dark:bg-black/60" onClick={onClose} />
          <aside className="relative w-64 bg-white dark:bg-[#0f0f0f] flex flex-col border-r border-[#e5e5e5] dark:border-[#2a2a2a]">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
