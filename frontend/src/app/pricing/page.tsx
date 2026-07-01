'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Minus } from 'lucide-react';
import Navbar from '@/components/marketing/Navbar';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import api from '@/lib/api';
import { useFadeIn, anim } from '@/lib/use-fade-in';

// Maps marketing slugs to the Service.type enum values in the database, so the
// price shown here always matches whatever an admin sets in Dashboard > Settings
// instead of a hardcoded number that drifts out of sync.
const SLUG_TO_SERVICE_TYPE: Record<string, string> = {
  'podcast-studio':      'PODCAST',
  'vfx-podcast':         'VFX_PODCAST',
  'monologue-shoot':     'MONOLOGUE',
  'news-shoot':          'NEWS_SHOOT',
  'become-a-podcaster':  'ONLINE_CLASS',
  'product-shoots':      'PRODUCT_SHOOT',
};

const ALL_PLANS = [
  {
    price: '₹12,500', unit: '+ GST / hour', name: 'Podcast Studio',  min: 'Minimum 1 hour',  slug: 'podcast-studio',
    features: ['Sennheiser professional condenser microphones','Full ceiling & wall acoustic treatment','Multi-channel recording — up to 4 guests','Live headphone monitoring for all guests','Raw WAV + professionally mixed MP3 delivered','Studio crew support available on request'],
  },
  {
    price: '₹20,000', unit: '+ GST / hour', name: 'VFX Podcast',     min: 'Minimum 2 hours', slug: 'vfx-podcast',
    features: ['LED backdrop with fully custom visual themes','Live motion graphics overlay on 4K feed','Multi-camera 4K video production','Professional colour grade on all footage','Vertical & horizontal social media cuts included','Sennheiser microphone setup throughout'],
  },
  {
    price: '₹25,000', unit: '+ GST / hour', name: 'Become a Podcaster', min: 'Minimum 1 hour', slug: 'become-a-podcaster',
    features: ['Acoustically isolated near-silent recording room','Professional teleprompter for seamless delivery','Screen capture integration for slide-based content','Consistent multi-point lighting for long shoots','Multiple backdrop options — white, black, colour','Ideal for solo or 2-person class sessions'],
  },
  {
    price: '₹15,000', unit: '+ GST / hour', name: 'Monologue Shoot', min: 'Minimum 1 hour',  slug: 'monologue-shoot',
    features: ['Digitek professional teleprompter with tablet remote','Three-point lighting — broadcast standard','Multi-angle Sony Alpha 4K camera coverage','Colour-graded footage delivered post-session','Same-day export available on request','Perfect for creators, educators, and speakers'],
  },
  {
    price: '₹22,500', unit: '+ GST / hour', name: 'News Shoot',      min: 'Minimum 2 hours', slug: 'news-shoot',
    features: ['Green screen with live compositing capability','Anchor desk and professional set dressing','Sony Alpha broadcast-quality camera rig','Lower third graphics and title cards','Export in broadcast and streaming formats','Ideal for news, PR, and corporate media'],
  },
  {
    price: '₹17,500', unit: '+ GST / hour', name: 'Product Shoots',  min: 'Minimum 2 hours', slug: 'product-shoots',
    features: ['Multiple backdrops — white, black, and colour','Softbox + reflector controlled lighting rig','Precise colour-temperature environment','High-resolution image delivery included','Same-day turnaround available on request','Ideal for e-commerce, brand, and ad shoots'],
  },
];



const FAQS = [
  { q: 'What are your operating hours?',               a: 'The studio is open from 6:00 AM to 2:00 AM the next day, seven days a week — including weekends and public holidays.' },
  { q: 'How early should I book?',                     a: 'We recommend booking at least 48 hours in advance. For weekends and peak hours, a few days ahead gives you more slot options.' },
  { q: 'What payment methods do you accept?',          a: 'You can pay via UPI, credit/debit card, or net banking through Razorpay. We also accept cash and bank transfers.' },
  { q: 'Is there a minimum booking duration?',         a: 'Podcast and monologue sessions start at 1 hour. Product shoots and VFX sessions have a 2-hour minimum.' },
  { q: 'Can someone else book on my behalf?',          a: 'Yes. Registered referral agents can submit bookings for clients and earn a commission on every confirmed booking.' },
  { q: 'Will I receive a GST invoice after my shoot?', a: 'Always. A GST-compliant invoice is generated and sent to your email as soon as your session is marked complete.' },
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});

  const heroAnim  = useFadeIn();
  const cardsAnim = useFadeIn();
  const faqAnim   = useFadeIn();

  useEffect(() => {
    api.get<Array<{ type: string; pricePerHour: number }>>('/services')
      .then(r => setLivePrices(Object.fromEntries(r.data.map(s => [s.type, Number(s.pricePerHour)]))))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <Navbar />

      {/* ── Hero ── */}
      <section className="pt-[80px] bg-white dark:bg-[#0a0a0a]">
        <div className="site-wrap pt-14 pb-12">
          <div ref={heroAnim.ref}>
            <h1
              className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white leading-tight"
              style={anim(heroAnim.visible, 0.08)}
            >
              Broadcast Quality<br />Hourly Rates
            </h1>
          </div>
        </div>
      </section>

      {/* ── Pricing cards ── */}
      <section className="pb-24 bg-white dark:bg-[#0a0a0a]">
        <div className="site-wrap">
          <div ref={cardsAnim.ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ALL_PLANS.map((plan, i) => {
              const liveRate = livePrices[SLUG_TO_SERVICE_TYPE[plan.slug]];
              const price = liveRate != null ? `₹${liveRate.toLocaleString('en-IN')}` : plan.price;
              return (
              <div
                key={plan.slug}
                className="bg-[#f8f8f8] dark:bg-[#161616] flex flex-col"
                style={anim(cardsAnim.visible, i * 0.1)}
              >
                <div className="p-8 flex-1">
                  {/* Price */}
                  <p className="font-black text-[#E5312A] mb-1" style={{ fontSize: 'clamp(22px, 2.5vw, 30px)' }}>
                    {price}{' '}
                    <span className="text-base font-semibold text-[#E5312A]/70">{plan.unit}</span>
                  </p>
                  <h3 className="text-gray-900 dark:text-white text-xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-gray-400 dark:text-white/35 text-xs mb-7 tracking-wide">{plan.min}</p>

                  <div className="border-t border-dashed border-gray-200 dark:border-white/10 mb-7" />

                  {/* Features */}
                  <ul className="space-y-4">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-3">
                        <span className="text-[#E5312A] font-bold text-base mt-0.5 flex-shrink-0">•</span>
                        <span className="text-gray-600 dark:text-white/65 text-sm leading-relaxed">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bottom CTA */}
                <div className="p-6 pt-0 space-y-2">
                  <Link
                    href="/register"
                    className="block w-full text-center bg-gray-900 dark:bg-black hover:bg-[#E5312A] text-white font-bold py-4 text-[11px] tracking-[0.22em] uppercase transition-colors"
                  >
                    Book Now
                  </Link>
                  <Link
                    href={`/services/${plan.slug}`}
                    className="block w-full text-center text-gray-400 dark:text-white/30 hover:text-gray-700 dark:hover:text-white/70 text-xs py-2 transition-colors"
                  >
                    About this service
                  </Link>
                </div>
              </div>
              );
            })}
          </div>

          {/* GST note */}
          <p className="mt-10 text-gray-400 dark:text-white/25 text-xs text-center" style={anim(cardsAnim.visible, 0.35)}>
            All rates are per hour · 18% GST applicable · Tax-compliant invoice sent by email after every session
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 bg-[#f4f4f4] dark:bg-[#111111]">
        <div className="site-wrap">
          <div ref={faqAnim.ref}>
            <div className="mb-12" style={anim(faqAnim.visible)}>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Common Questions</h2>
            </div>

            <div className="space-y-3">
              {FAQS.map((faq, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-[#161616]"
                  style={anim(faqAnim.visible, 0.05 + i * 0.05)}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-6 py-7 text-left hover:bg-[#f0f0f0] dark:hover:bg-[#1a1a1a] transition-colors"
                  >
                    <span className="font-semibold text-gray-900 dark:text-white text-base pr-4">{faq.q}</span>
                    {openFaq === i
                      ? <Minus size={16} className="text-[#E5312A] flex-shrink-0" />
                      : <Plus  size={16} className="text-gray-400 dark:text-white/30 flex-shrink-0" />
                    }
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-6">
                      <p className="text-sm text-gray-600 dark:text-white/55 leading-relaxed">{faq.a}</p>
                    </div>
                  )}
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
