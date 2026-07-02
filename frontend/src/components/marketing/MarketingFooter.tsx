'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowUp } from 'lucide-react';

export default function MarketingFooter() {
  const pathname = usePathname();
  const router   = useRouter();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goTo = (section: string) => {
    if (pathname === '/') {
      document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      router.push(`/#${section}`);
    }
  };

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <>
      {/* WhatsApp floating button */}
      <a
        href="https://wa.me/917827882058?text=Hi%2C%20I%20would%20like%20to%20book%20a%20studio%20session%20at%20Podversal%20Studio.%20Please%20share%20availability%20and%20pricing."
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-6 right-6 z-50 group flex items-center gap-2.5"
      >
        <span className="hidden sm:block max-w-0 group-hover:max-w-[160px] overflow-hidden transition-all duration-300 ease-out">
          <span className="whitespace-nowrap bg-[#0a0a0a] text-white text-xs font-semibold px-3 py-1.5 rounded-sm">
            Chat with us
          </span>
        </span>
        <div className="relative w-14 h-14 bg-[#25D366] hover:bg-[#1ebe5d] rounded-full shadow-lg hover:shadow-[0_8px_32px_rgba(37,211,102,0.45)] transition-all duration-300 flex items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
          <svg viewBox="0 0 32 32" className="w-7 h-7 fill-white relative z-10" xmlns="http://www.w3.org/2000/svg">
            <path d="M16.002 2.667C8.638 2.667 2.667 8.638 2.667 16c0 2.365.637 4.672 1.846 6.693L2.667 29.333l6.82-1.789A13.28 13.28 0 0016.002 29.333C23.365 29.333 29.333 23.362 29.333 16S23.365 2.667 16.002 2.667zm0 24.267a11.06 11.06 0 01-5.636-1.544l-.403-.24-4.047 1.062 1.08-3.94-.264-.418A11.02 11.02 0 014.987 16c0-6.07 4.945-11.013 11.015-11.013S27.02 9.93 27.02 16s-4.948 10.934-11.018 10.934zm6.05-8.24c-.33-.166-1.957-.966-2.261-1.076-.304-.11-.526-.165-.747.166-.22.33-.855 1.076-1.047 1.296-.193.22-.385.247-.715.083-.33-.165-1.392-.513-2.651-1.637-.98-.874-1.64-1.954-1.833-2.284-.192-.33-.02-.508.145-.672.148-.147.33-.385.496-.578.165-.193.22-.33.33-.55.11-.22.055-.413-.028-.579-.083-.165-.747-1.8-1.023-2.466-.27-.648-.545-.56-.748-.57a13.62 13.62 0 00-.636-.012c-.22 0-.578.083-.882.413-.303.33-1.158 1.132-1.158 2.76 0 1.628 1.186 3.202 1.35 3.422.166.22 2.336 3.566 5.659 4.998.79.342 1.407.546 1.888.699.793.252 1.515.217 2.086.132.636-.096 1.957-.8 2.233-1.572.275-.77.275-1.43.192-1.57-.082-.137-.303-.22-.633-.386z"/>
          </svg>
        </div>
      </a>

      {/* Scroll to top */}
      <button
        onClick={scrollTop}
        aria-label="Back to top"
        className={`fixed bottom-24 right-6 z-40 w-11 h-11 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] shadow-md hover:border-[#E5312A] hover:text-[#E5312A] text-gray-500 dark:text-gray-400 flex items-center justify-center transition-all duration-300 ${
          showTop ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <ArrowUp size={16} />
      </button>

      <footer className="bg-[#f8f8f8] dark:bg-[#0e0e0e] border-t border-gray-100 dark:border-[#2a2a2a]">
        <div className="site-wrap">

          {/* ── Main grid ── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10 py-14 border-b border-gray-200 dark:border-white/10">

            {/* Brand */}
            <div className="col-span-2 md:col-span-3 lg:col-span-1">
              <div className="mb-4"><Logo height={64} /></div>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4 max-w-[220px]">
                Broadcast-quality studio in Greater Noida West. Open 6 AM – 2 AM, 7 days a week.
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                +91 78278 82058
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed max-w-[220px]">
                NX One, Tower 4, Greater Noida West, Uttar Pradesh, 201306
              </p>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-white/40 mb-5">Services</h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'Podcast Studio',  slug: 'podcast-studio'  },
                  { label: 'VFX Podcast',     slug: 'vfx-podcast'     },
                  { label: 'Monologue Shoot', slug: 'monologue-shoot' },
                  { label: 'News Shoot',      slug: 'news-shoot'      },
                  { label: 'Become a Podcaster', slug: 'become-a-podcaster' },
                  { label: 'Product Shoots',  slug: 'product-shoots'  },
                ].map(s => (
                  <li key={s.slug}>
                    <Link href={`/services/${s.slug}`} className="text-sm text-gray-600 dark:text-gray-300 hover:text-[#E5312A] dark:hover:text-[#E5312A] transition-colors">
                      {s.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pricing */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-white/40 mb-5">Pricing</h4>
              <ul className="space-y-2.5">
                {[
                  'Podcast Studio',
                  'VFX Podcast',
                  'Monologue Shoot',
                  'News Shoot',
                  'Become a Podcaster',
                  'Product Shoots',
                ].map(label => (
                  <li key={label}>
                    <Link href="/pricing" className="text-sm text-gray-600 dark:text-gray-300 hover:text-[#E5312A] dark:hover:text-[#E5312A] transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-white/40 mb-5">Quick Links</h4>
              <ul className="space-y-2.5">
                <li><Link href="/"          className="text-sm text-gray-600 dark:text-gray-300 hover:text-[#E5312A] transition-colors">Home</Link></li>
                <li><Link href="/our-work"  className="text-sm text-gray-600 dark:text-gray-300 hover:text-[#E5312A] transition-colors">Our Work</Link></li>
                <li><Link href="/about"     className="text-sm text-gray-600 dark:text-gray-300 hover:text-[#E5312A] transition-colors">About Us</Link></li>
                <li><Link href="/blog"      className="text-sm text-gray-600 dark:text-gray-300 hover:text-[#E5312A] transition-colors">Blog</Link></li>
                <li><Link href="/contact"   className="text-sm text-gray-600 dark:text-gray-300 hover:text-[#E5312A] transition-colors">Contact</Link></li>
                <li><Link href="/register"  className="text-sm text-gray-600 dark:text-gray-300 hover:text-[#E5312A] transition-colors">Book a Session</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-white/40 mb-5">Legal</h4>
              <ul className="space-y-2.5">
                <li><Link href="/terms"          className="text-sm text-gray-600 dark:text-gray-300 hover:text-[#E5312A] transition-colors">Terms &amp; Conditions</Link></li>
                <li><Link href="/privacy-policy" className="text-sm text-gray-600 dark:text-gray-300 hover:text-[#E5312A] transition-colors">Privacy Policy</Link></li>
                <li><Link href="/refund-policy"  className="text-sm text-gray-600 dark:text-gray-300 hover:text-[#E5312A] transition-colors">Refund Policy</Link></li>
              </ul>
            </div>

          </div>

          {/* ── Bottom bar ── */}
          <div className="flex flex-col sm:flex-row items-center justify-between py-5 gap-4">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              © {new Date().getFullYear()} Podversal Studio · A Unit Krishiyug Technologies Pvt. Ltd. All rights reserved.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3 mr-0 sm:mr-16 lg:mr-20">
              {/* YouTube */}
              <a href="https://studio.youtube.com/channel/UCDpE8P1-l7zT8VyqoA3gRpw" target="_blank" rel="noopener noreferrer" aria-label="YouTube"
                className="w-8 h-8 rounded-full flex items-center justify-center bg-[#FF0000] hover:opacity-80 transition-opacity">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              {/* Instagram */}
              <a href="https://www.instagram.com/podversalhq?igsh=NGRveGs1ZTc2bWRu" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
                style={{ background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)' }}>
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              {/* LinkedIn */}
              <a href="https://www.linkedin.com/company/podversal-studio/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
                className="w-8 h-8 rounded-full flex items-center justify-center bg-[#0A66C2] hover:opacity-80 transition-opacity">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              {/* Facebook */}
              <a href="https://www.facebook.com/share/1CmPL6rWtj/" target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                className="w-8 h-8 rounded-full flex items-center justify-center bg-[#1877F2] hover:opacity-80 transition-opacity">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            </div>
          </div>

        </div>
      </footer>
    </>
  );
}
