import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/components/ThemeProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-inter',
});

const SITE_URL = 'https://www.podversal.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Podversal Studio — Professional Podcast & Video Studio in Greater Noida',
    template: '%s | Podversal Studio',
  },
  description: 'Podversal Studio is a professional podcast and video production studio in Greater Noida West. Book studio sessions for podcasts, video shoots, VFX, monologue, news, and product shoots.',
  keywords: [
    'Podversal', 'Podversal Studio', 'podcast studio Greater Noida',
    'video production studio Noida', 'podcast recording studio',
    'video podcast studio India', 'studio booking Greater Noida',
    'professional podcast studio', 'content creation studio',
    'NX One Greater Noida West',
  ],
  creator: 'Podversal Studio',
  publisher: 'Krishiyug Digital Private Limited',
  robots: { index: true, follow: true },
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: 'Podversal Studio',
    title: 'Podversal Studio — Professional Podcast & Video Studio in Greater Noida',
    description: 'Book a professional podcast or video recording session at Podversal Studio, Greater Noida West.',
    images: [{ url: '/studio/s2.jpg', width: 1200, height: 630, alt: 'Podversal Studio' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Podversal Studio — Podcast & Video Studio',
    description: 'Book a professional podcast or video recording session at Podversal Studio, Greater Noida West.',
    images: ['/studio/s2.jpg'],
  },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('podversal-theme');if(t!=='light'){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${inter.className} font-sans bg-white dark:bg-[#111111] text-gray-900 dark:text-white transition-colors duration-200`}>
        <ThemeProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#181818',
                color: '#fff',
                border: '1px solid #2a2a2a',
                borderRadius: 0,
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
