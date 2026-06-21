'use client';

import { Menu } from 'lucide-react';
import dynamic from 'next/dynamic';
import Logo from '@/components/Logo';
const ThemeToggle = dynamic(() => import('@/components/ThemeToggle'), { ssr: false });

interface Props {
  onOpen: () => void;
}

export default function MobileHeader({ onOpen }: Props) {
  return (
    <header className="lg:hidden h-16 bg-white dark:bg-[#0f0f0f] border-b border-gray-100 dark:border-[#3a3a3a] flex items-center px-4 gap-3 sticky top-0 z-30">
      <button
        onClick={onOpen}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20} className="text-gray-600 dark:text-[#a0a0a0]" />
      </button>
      <div className="flex-1">
        <Logo height={52} />
      </div>
      <ThemeToggle />
    </header>
  );
}
