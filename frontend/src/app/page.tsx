'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/marketing/Navbar';
import Logo from '@/components/Logo';
import {
  Mic, Video, MonitorPlay, Newspaper, Laptop, Camera,
  ArrowRight, CheckCircle, Phone, Mail, MapPin, Play, Star, Plus, Minus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

const SERVICES = [
  { icon: Mic,         title: 'Podcast Studio',  description: 'Multi-channel recording with acoustic treatment, high-end microphones, and professional mixing. Ideal for interview shows and solo episodes.' },
  { icon: Video,       title: 'VFX Podcast',     description: 'LED backdrops, live motion graphics, and dynamic visual effects. Your podcast becomes a full video production.' },
  { icon: MonitorPlay, title: 'Monologue Shoot', description: 'Teleprompter, three-point lighting, multi-angle setup. Walk in with your script, walk out with broadcast-quality footage.' },
  { icon: Newspaper,   title: 'News Shoot',      description: 'Green screen, anchor desk, broadcast cameras. Designed for news segments, corporate announcements, and media productions.' },
  { icon: Laptop,      title: 'Online Classes',  description: 'Quiet, controlled environment with screen recording integration. Record courses that look and sound like a proper production.' },
  { icon: Camera,      title: 'Product Shoots',  description: 'Softboxes, reflectors, controlled colour temperature, multiple backdrop options. For e-commerce, brand campaigns, and product launches.' },
];

const PROCESS_STEPS = [
  { step: '01', title: 'Tell us what you need',   desc: 'Fill in your preferred date, service, and any equipment you need. Takes about 2 minutes.' },
  { step: '02', title: 'We check the slot',       desc: 'Our team confirms availability for your chosen date and time.' },
  { step: '03', title: 'We send you a quote',     desc: 'You receive a clear price breakdown — total, advance amount, and any discounts.' },
  { step: '04', title: 'You approve it',          desc: 'Review the quote and confirm. Your booking is reserved.' },
  { step: '05', title: 'Pay the advance',         desc: 'Pay via UPI, card, or bank transfer. The advance locks your slot permanently.' },
  { step: '06', title: 'Walk in and create',      desc: 'Show up on shoot day. Our crew is set up and ready for you.' },
  { step: '07', title: 'Get your GST invoice',    desc: 'After the shoot, a GST-compliant invoice arrives in your inbox automatically.' },
];

const TESTIMONIALS = [
  {
    name: 'Rahul Mehta', role: 'Podcast Host',
    quote: 'Booked my first session with zero prior experience — the team made it completely stress-free. Sound quality was better than anything I had recorded before.',
  },
  {
    name: 'Priya Sharma', role: 'Corporate Trainer',
    quote: 'We shot 30 modules over three days. The lighting stayed consistent, the teleprompter saved us hours, and every recording looked broadcast-quality straight out of the studio.',
  },
  {
    name: 'Arjun Patel', role: 'Brand Manager',
    quote: 'Our product launch visuals came out exactly how we imagined them. Professional setup, no guesswork, and the team understood what our brand needed.',
  },
];

const FAQS = [
  { q: 'What are your operating hours?',               a: 'The studio is open from 6:00 AM to 2:00 AM the next day, seven days a week — including weekends and public holidays.' },
  { q: 'How early should I book?',                     a: 'We recommend booking at least 48 hours in advance. For weekends and peak hours, a few days gives you more slot options.' },
  { q: 'What payment methods do you accept?',          a: 'You can pay via UPI, credit/debit card, or net banking through Razorpay. We also accept cash and bank transfers.' },
  { q: 'Is there a minimum booking duration?',         a: 'Podcast and monologue sessions start at 1 hour. Product shoots and VFX sessions have a 2-hour minimum.' },
  { q: 'Can someone else book on my behalf?',          a: 'Yes. Registered referral agents can submit bookings for clients and earn a commission on every confirmed booking.' },
  { q: 'Will I receive a GST invoice after my shoot?', a: 'Always. A GST-compliant invoice is generated and sent to your email as soon as your session is marked complete.' },
];

interface StudioVideo {
  id: string; title: string; description: string | null;
  youtubeId: string | null; thumbnailUrl: string | null; category: string;
}

export default function HomePage() {
  const [videos,      setVideos]      = useState<StudioVideo[]>([]);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [openFaq,     setOpenFaq]     = useState<number | null>(null);

  useEffect(() => {
    api.get<StudioVideo[]>('/studio-videos/public').then(r => setVideos(r.data)).catch(() => {});
  }, []);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="min-h-screen bg-white dark:bg-[#111111]">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="pt-[60px] bg-white dark:bg-[#111111]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-1.5 h-1.5 bg-[#E5312A] rounded-full animate-pulse" />
            <span className="section-label">Now Booking — Slots Available</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-[76px] font-bold leading-[1.05] tracking-tight text-gray-900 dark:text-white mb-6">
            Your Vision,<br />
            <span className="text-[#E5312A]">Professionally</span><br />
            Produced.
          </h1>

          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mb-10 leading-relaxed">
            Six studio services under one roof — podcasts, VFX, news shoots, online classes, monologues, and product photography. Book online in minutes.
          </p>

          <div className="flex flex-wrap gap-3 mb-16">
            <Link href="/register" className="inline-flex items-center gap-2 bg-[#E5312A] hover:bg-[#CC2A24] text-white font-semibold px-7 py-3.5 transition-colors text-sm">
              Book a Studio <ArrowRight size={16} />
            </Link>
            <button
              onClick={() => scrollTo('videos')}
              className="inline-flex items-center gap-2 border border-gray-200 dark:border-[#333] text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-[#555] font-semibold px-7 py-3.5 transition-colors text-sm"
            >
              <Play size={12} className="text-[#E5312A] fill-[#E5312A]" />
              Watch Our Work
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 pt-10 border-t border-gray-100 dark:border-[#2a2a2a]">
            {[
              { value: '6+',      label: 'Studio Services' },
              { value: '6AM–2AM', label: 'Open Daily'      },
              { value: 'GST',     label: 'Tax Compliant'   },
              { value: '100%',    label: 'Online Booking'  },
            ].map(stat => (
              <div key={stat.label}>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ──────────────────────────────────── */}
      <section id="services" className="py-20 bg-[#f8f8f8] dark:bg-[#0e0e0e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <p className="section-label mb-3">Services</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Six Studio Experiences</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-3 max-w-xl">Each service is fully set up and ready — just book a slot and walk in.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="bg-white dark:bg-[#161616] p-6 hover:shadow-md dark:hover:shadow-none dark:hover:bg-[#1a1a1a] transition-all">
                  <div className="w-10 h-10 bg-[#E5312A]/10 flex items-center justify-center mb-4">
                    <Icon size={18} className="text-[#E5312A]" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">{s.description}</p>
                  <Link href="/register" className="inline-flex items-center gap-1 text-xs font-semibold text-[#E5312A] hover:text-[#CC2A24] transition-colors">
                    Book this service <ArrowRight size={11} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── STUDIO VIDEOS ────────────────────────────── */}
      <section id="videos" className="py-20 bg-white dark:bg-[#111111]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <p className="section-label mb-3">Studio Showcase</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">See Our Work</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-3">Real sessions recorded at Podversal.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.length === 0
              ? [1, 2, 3].map(i => (
                  <div key={i} className="aspect-video bg-[#f8f8f8] dark:bg-[#181818] flex items-center justify-center">
                    <div className="text-center">
                      <Play size={20} className="text-gray-300 dark:text-[#333] mx-auto mb-2" />
                      <p className="text-xs text-gray-300 dark:text-[#444] tracking-widest uppercase">Coming Soon</p>
                    </div>
                  </div>
                ))
              : videos.map(video => (
                  <div key={video.id} className="overflow-hidden group">
                    {activeVideo === video.id && video.youtubeId ? (
                      <div className="aspect-video">
                        <iframe
                          className="w-full h-full"
                          src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1`}
                          title={video.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <button
                        className="relative block w-full aspect-video overflow-hidden bg-[#f8f8f8] dark:bg-[#181818]"
                        onClick={() => video.youtubeId && setActiveVideo(video.id)}
                      >
                        {(video.thumbnailUrl || video.youtubeId) ? (
                          <img
                            src={video.thumbnailUrl ?? `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play size={24} className="text-gray-300 dark:text-[#444]" />
                          </div>
                        )}
                        {video.youtubeId && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/15 transition-colors">
                            <div className="w-12 h-12 bg-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                              <Play size={16} className="text-gray-900 ml-1" fill="currentColor" />
                            </div>
                          </div>
                        )}
                        <span className="absolute top-3 left-3 bg-[#E5312A] text-white text-[10px] font-semibold px-2 py-1 uppercase tracking-wide">
                          {video.category}
                        </span>
                      </button>
                    )}
                    <div className="p-4 bg-[#f8f8f8] dark:bg-[#161616]">
                      <h3 className="text-gray-900 dark:text-white font-semibold text-sm">{video.title}</h3>
                      {video.description && (
                        <p className="text-gray-500 dark:text-gray-500 text-xs mt-1 line-clamp-2">{video.description}</p>
                      )}
                    </div>
                  </div>
                ))
            }
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────── */}
      <section id="process" className="py-20 bg-[#f8f8f8] dark:bg-[#0e0e0e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <p className="section-label mb-3">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">From Request to Invoice</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-3">Seven steps. Clear at every stage. No surprises.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PROCESS_STEPS.map(item => (
              <div key={item.step} className="bg-white dark:bg-[#161616] p-5">
                <p className="text-[#E5312A] font-bold text-sm mb-3">{item.step}</p>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">{item.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY US ───────────────────────────────────── */}
      <section className="py-20 bg-[#E5312A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="section-label text-white/60 mb-4">Why Podversal</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8">Why teams choose us</h2>
              <div className="space-y-4">
                {[
                  'Slot locking prevents double bookings — what you see is available',
                  'Quotations and GST invoices arrive by email automatically',
                  'Pay via UPI, card, or bank transfer — whatever works for you',
                  'Studio open from 6 AM to 2 AM, seven days a week',
                  'Track every booking and invoice from your own dashboard',
                  'Referral agents get a commission dashboard with full payout history',
                ].map(point => (
                  <div key={point} className="flex items-start gap-3">
                    <CheckCircle size={16} className="text-white/70 flex-shrink-0 mt-0.5" />
                    <p className="text-white/90 text-sm leading-relaxed">{point}</p>
                  </div>
                ))}
              </div>
              <Link href="/register" className="inline-flex items-center gap-2 mt-8 bg-white text-[#E5312A] font-semibold px-7 py-3 hover:bg-white/90 transition-colors text-sm">
                Get Started <ArrowRight size={15} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '6 AM – 2 AM', label: 'Operating Hours' },
                { value: '6+',          label: 'Studio Services' },
                { value: '100%',        label: 'Online Booking'  },
                { value: 'GST',         label: 'Tax Compliant'   },
              ].map(stat => (
                <div key={stat.label} className="bg-white/10 p-6">
                  <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                  <p className="text-white/60 text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────── */}
      <section className="py-20 bg-white dark:bg-[#111111]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <p className="section-label mb-3">Testimonials</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">What our clients say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-[#f8f8f8] dark:bg-[#161616] p-6">
                <div className="flex gap-0.5 mb-4">
                  {[1,2,3,4,5].map(i => <Star key={i} size={13} className="fill-[#E5312A] text-[#E5312A]" />)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-[#2a2a2a]">
                  <div className="w-8 h-8 bg-[#E5312A] flex items-center justify-center font-bold text-white text-xs flex-shrink-0">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{t.name}</p>
                    <p className="text-gray-400 dark:text-gray-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────── */}
      <section id="faq" className="py-20 bg-[#f8f8f8] dark:bg-[#0e0e0e]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <p className="section-label mb-3">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Common questions</h2>
          </div>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white dark:bg-[#161616]">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
                >
                  <span className="font-semibold text-gray-900 dark:text-white text-sm pr-4">{faq.q}</span>
                  {openFaq === i
                    ? <Minus size={15} className="text-[#E5312A] flex-shrink-0" />
                    : <Plus  size={15} className="text-gray-400 dark:text-[#555] flex-shrink-0" />
                  }
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ──────────────────────────────────── */}
      <section id="contact" className="py-20 bg-white dark:bg-[#111111]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <p className="section-label mb-3">Contact</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Get in Touch</h2>
          </div>
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                Got a question before booking? Need a custom quote for a multi-day shoot? Send us a message and we'll reply within a few hours.
              </p>
              <div className="space-y-5">
                {[
                  { Icon: Phone,  label: 'Phone',    value: '+91 XXXXX XXXXX'     },
                  { Icon: Mail,   label: 'Email',    value: 'studio@podversal.com' },
                  { Icon: MapPin, label: 'Location', value: 'Address coming soon'  },
                ].map(({ Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-4">
                    <div className="w-9 h-9 bg-[#E5312A]/10 flex items-center justify-center flex-shrink-0">
                      <Icon size={15} className="text-[#E5312A]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <form
                className="space-y-4"
                onSubmit={e => {
                  e.preventDefault();
                  toast.success("Got it — we'll be in touch within a few hours.");
                  (e.target as HTMLFormElement).reset();
                }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">Name</label>
                    <input type="text" placeholder="Rahul Sharma" className="input-field" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">Phone</label>
                    <input type="tel" placeholder="98765 43210" className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">Email</label>
                  <input type="email" placeholder="rahul@example.com" className="input-field" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">Message</label>
                  <textarea rows={4} placeholder="Hi, I'd like to book a podcast session for next Saturday. Can you check availability?" className="input-field resize-none" required />
                </div>
                <button type="submit" className="btn-primary">Send Message</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer className="bg-gray-50 dark:bg-[#111111] border-t border-gray-100 dark:border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 py-14 border-b border-gray-100 dark:border-white/10">
            <div>
              <div className="mb-4">
                <Logo height={52} />
              </div>
              <p className="text-sm text-gray-500 dark:text-white/50 leading-relaxed">
                Professional studio management platform. Podcasts, VFX, shoots — all bookable online.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/40 mb-4">Services</h4>
              <ul className="space-y-2">
                {['Podcast Studio', 'VFX Podcast', 'Monologue Shoot', 'News Shoot', 'Online Classes', 'Product Shoots'].map(s => (
                  <li key={s}><span className="text-sm text-gray-500 dark:text-white/60">{s}</span></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/40 mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><button onClick={() => scrollTo('services')} className="text-sm text-gray-500 dark:text-white/60 hover:text-[#E5312A] transition-colors">Services</button></li>
                <li><button onClick={() => scrollTo('videos')}   className="text-sm text-gray-500 dark:text-white/60 hover:text-[#E5312A] transition-colors">Videos</button></li>
                <li><Link href="/blog"     className="text-sm text-gray-500 dark:text-white/60 hover:text-[#E5312A] transition-colors">Blog</Link></li>
                <li><button onClick={() => scrollTo('faq')}      className="text-sm text-gray-500 dark:text-white/60 hover:text-[#E5312A] transition-colors">FAQ</button></li>
                <li><Link href="/login"    className="text-sm text-gray-500 dark:text-white/60 hover:text-[#E5312A] transition-colors">Sign In</Link></li>
                <li><Link href="/register" className="text-sm text-gray-500 dark:text-white/60 hover:text-[#E5312A] transition-colors">Book a Studio</Link></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between py-5 gap-2">
            <p className="text-xs text-gray-400 dark:text-white/30">© {new Date().getFullYear()} Podversal Studio. All rights reserved.</p>
            <p className="text-xs text-gray-400 dark:text-white/30">Professional Studio Management Platform</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
