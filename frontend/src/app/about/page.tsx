'use client';

import Navbar from '@/components/marketing/Navbar';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import { useFadeIn, anim } from '@/lib/use-fade-in';

const VALUES = [
  {
    title: 'Creator First',
    body: 'Every equipment choice, every scheduling decision, and every upgrade we make is driven by what creators actually need — not what looks impressive on a spec sheet. We listen, we adapt, and we build around you.',
  },
  {
    title: 'No Surprises',
    body: 'Online booking, auto-generated quotations, and GST invoices arrive by email. Every step is documented, transparent, and trackable from your personal dashboard — so you always know exactly where you stand.',
  },
  {
    title: 'Quality Without Overhead',
    body: 'Broadcast-grade studio at honest hourly rates. No retainers, no minimum commitments, no hidden crew fees you didn\'t ask for. Pay only for the time you use, and get professional results every single time.',
  },
];

export default function AboutPage() {
  const heroAnim  = useFadeIn(0.05);
  const storyAnim = useFadeIn();
  const valAnim   = useFadeIn();

  return (
    <div className="min-h-screen bg-white dark:bg-[#111111]">
      <Navbar />

      {/* ── Hero ── */}
      <section className="pt-[80px] bg-white dark:bg-[#111111]">
        <div className="site-wrap pt-6 sm:pt-9 lg:pt-12 pb-4">
          <div ref={heroAnim.ref} style={anim(heroAnim.visible)}>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white leading-tight">
              We Are Podversal Studio
            </h1>
          </div>
        </div>
      </section>

      {/* ── Story ── */}
      <section className="pt-6 sm:pt-8 lg:pt-10 pb-10 sm:pb-14 lg:pb-20 bg-white dark:bg-[#111111]">
        <div className="site-wrap">
          <div ref={storyAnim.ref} className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            <div style={anim(storyAnim.visible)}>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                Built for creators<br />who mean business
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-5">
                Podversal Studio was founded with a single conviction — creators, educators, and brands in India deserve broadcast-quality infrastructure without having to build it themselves. Too many talented people were held back not by lack of ideas, but by lack of access to the right tools.
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-5">
                Located at NX One, Greater Noida West, our studio brings together professional acoustic treatment, 4K multi-camera rigs, broadcast-grade Sennheiser microphones, LED backdrops, a professional teleprompter, and a fully digital booking system — all under one roof, available by the hour.
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-5">
                We serve solo creators recording their debut podcast, corporate teams producing training modules, e-commerce brands shooting product campaigns, and news channels needing a professional on-demand studio. Every session is supported by our on-ground team so you can focus entirely on what you came to create.
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Podversal is more than a studio — it is a platform. Online booking, auto-generated invoices, referral commissions, and a client dashboard make the entire experience seamless from the moment you land on this page to the moment your content goes live.
              </p>
            </div>

            <div className="relative" style={anim(storyAnim.visible, 0.15)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/studio/s1.jpg"
                alt="Inside Podversal Studio"
                className="w-full aspect-[4/3] object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <p className="text-white font-semibold text-sm">NX One, Tower 4, Greater Noida West, UP</p>
                <p className="text-white/55 text-xs mt-0.5">Open 6 AM to 2 AM · 7 days a week</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="py-10 sm:py-14 lg:py-20 bg-[#f8f8f8] dark:bg-[#0e0e0e]">
        <div className="site-wrap">
          <div ref={valAnim.ref}>
            <div className="mb-6 sm:mb-8 lg:mb-12" style={anim(valAnim.visible)}>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Our values</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {VALUES.map((v, i) => (
                <div
                  key={v.title}
                  className="bg-white dark:bg-[#161616] p-8"
                  style={anim(valAnim.visible, 0.1 + i * 0.1)}
                >
                  <div className="w-8 h-1 bg-[#E5312A] mb-6" />
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-3">{v.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{v.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
