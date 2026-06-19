'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative flex h-7 w-14 flex-shrink-0 items-center border border-[#e5e5e5] dark:border-[#2a2a2a] bg-[#f5f5f5] dark:bg-[#1a1a1a] transition-colors duration-300 cursor-pointer ${className}`}
    >
      <Sun  size={10} className="absolute left-1.5 text-[#bbb] dark:text-[#333] transition-colors pointer-events-none" />
      <Moon size={10} className="absolute right-1.5 text-[#333] dark:text-[#888] transition-colors pointer-events-none" />
      <span
        className={`absolute flex h-5 w-5 items-center justify-center bg-white dark:bg-[#111] border border-[#e5e5e5] dark:border-[#3a3a3a] shadow-sm transition-transform duration-300 pointer-events-none ${
          isDark ? 'translate-x-[30px]' : 'translate-x-1'
        }`}
      >
        {isDark
          ? <Moon size={9} className="text-[#8a8a8a]" />
          : <Sun  size={9} className="text-[#6b6b6b]" />
        }
      </span>
    </button>
  );
}
