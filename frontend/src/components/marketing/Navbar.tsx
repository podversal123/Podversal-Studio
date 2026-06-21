'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown, Shield, User, Briefcase, UserCheck, Users } from 'lucide-react';
import { isAuthenticated } from '@/lib/auth';
import dynamic from 'next/dynamic';
import Logo from '@/components/Logo';
const ThemeToggle = dynamic(() => import('@/components/ThemeToggle'), { ssr: false });

const NAV_LINKS = [
  { label: 'Services',  href: '/#services', section: 'services' },
  { label: 'Videos',    href: '/videos',    section: null       },
  { label: 'Blog',      href: '/blog',       section: null       },
  { label: 'Gallery',   href: '/gallery',   section: null       },
  { label: 'Process',   href: '/#process',  section: 'process'  },
  { label: 'FAQ',       href: '/#faq',       section: 'faq'      },
  { label: 'Contact',   href: '/#contact',   section: 'contact'  },
];

const ROLE_OPTIONS = [
  { role: 'SUPER_ADMIN',    label: 'Super Admin',    desc: 'Studio owner',    icon: Shield,    color: 'text-[#E5312A]'              },
  { role: 'STUDIO_MANAGER', label: 'Studio Manager', desc: 'Staff member',    icon: UserCheck, color: 'text-gray-500 dark:text-gray-400' },
  { role: 'EMPLOYEE',       label: 'Employee',       desc: 'Crew / operator', icon: Users,     color: 'text-green-600'              },
  { role: 'REFERRAL_AGENT', label: 'Referral Agent', desc: 'Partner / agent', icon: Briefcase, color: 'text-orange-500'             },
  { role: 'CUSTOMER',       label: 'Customer',       desc: 'Book a session',  icon: User,      color: 'text-gray-500 dark:text-gray-400' },
];

export default function Navbar() {
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [loggedIn,   setLoggedIn]   = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const dropdownRef                 = useRef<HTMLDivElement>(null);
  const pathname                    = usePathname();

  useEffect(() => { setLoggedIn(isAuthenticated()); }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setSignInOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAnchorClick = (e: React.MouseEvent, section: string | null) => {
    if (!section) return;
    if (pathname === '/') {
      e.preventDefault();
      document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setMenuOpen(false);
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 bg-white dark:bg-[#111111] transition-all duration-300 ${
      scrolled
        ? 'border-b border-[#e5e5e5] dark:border-[#2a2a2a] shadow-[0_1px_16px_rgba(0,0,0,0.07)] dark:shadow-[0_1px_16px_rgba(0,0,0,0.35)]'
        : 'border-b border-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[80px]">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Logo height={72} />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => handleAnchorClick(e, link.section)}
                className="text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-[#E5312A] dark:hover:text-[#E5312A] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />

            {loggedIn ? (
              <Link href="/dashboard" className="text-sm font-bold px-5 py-2 bg-[#E5312A] text-white hover:bg-[#CC2A24] transition-colors">
                Dashboard
              </Link>
            ) : (
              <>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setSignInOpen(!signInOpen)}
                    className="flex items-center gap-1 text-sm font-medium text-[#6b6b6b] dark:text-[#8a8a8a] hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Sign In
                    <ChevronDown size={13} className={`transition-transform duration-200 ${signInOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {signInOpen && (
                    <div className="absolute top-full right-0 mt-0 w-60 bg-white dark:bg-[#181818] border border-[#e5e5e5] dark:border-[#2a2a2a] shadow-xl z-50">
                      <p className="text-[10px] font-black tracking-[0.15em] uppercase text-[#aaa] dark:text-[#555] px-4 pt-3 pb-2">
                        Sign In As
                      </p>
                      {ROLE_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        return (
                          <Link
                            key={opt.role}
                            href={`/login?role=${opt.role}`}
                            onClick={() => setSignInOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f5f5f5] dark:hover:bg-[#222] transition-colors"
                          >
                            <Icon size={14} className={opt.color} />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{opt.label}</p>
                              <p className="text-xs text-[#aaa] dark:text-[#555]">{opt.desc}</p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                <Link
                  href="/register"
                  className="text-sm font-bold px-5 py-2 bg-[#E5312A] text-white hover:bg-[#CC2A24] transition-colors"
                >
                  Book Now
                </Link>
              </>
            )}
          </div>

          {/* Mobile */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button className="p-2" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen
                ? <X    size={20} className="text-gray-900 dark:text-white" />
                : <Menu size={20} className="text-gray-900 dark:text-white" />
              }
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white dark:bg-[#111111] border-t border-[#e5e5e5] dark:border-[#2a2a2a]">
          <div className="px-4 py-3 space-y-0.5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => { handleAnchorClick(e, link.section); setMenuOpen(false); }}
                className="block px-3 py-2.5 text-sm font-medium text-[#6b6b6b] dark:text-[#8a8a8a] hover:text-gray-900 dark:hover:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#181818] transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-[#e5e5e5] dark:border-[#2a2a2a] mt-1">
              {loggedIn ? (
                <Link href="/dashboard" className="btn-primary !py-2.5 text-sm text-center block">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <p className="text-[10px] font-black tracking-[0.15em] uppercase text-[#aaa] dark:text-[#555] px-3 py-2">Sign In As</p>
                  {ROLE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <Link
                        key={opt.role}
                        href={`/login?role=${opt.role}`}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#f5f5f5] dark:hover:bg-[#181818] transition-colors"
                      >
                        <Icon size={14} className={opt.color} />
                        <span className="text-sm font-medium text-gray-700 dark:text-[#a0a0a0]">{opt.label}</span>
                      </Link>
                    );
                  })}
                  <div className="mt-2">
                    <Link href="/register" className="btn-primary !py-2.5 text-sm text-center block">
                      Book a Studio
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
