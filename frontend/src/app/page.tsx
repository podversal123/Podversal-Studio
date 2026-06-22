'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/marketing/Navbar';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import VideoThumbnail from '@/components/VideoThumbnail';
import {
  Mic, Video, MonitorPlay, Newspaper, Laptop, Camera,
  ArrowRight, CheckCircle, Phone, Mail, MapPin, Play, Star, Plus, Minus, ChevronLeft, ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

// Only background image changes per slide — content stays the same across all
const SLIDES = [
  { image: '/studio/slide1.jpg', pos: 'object-center'     },
  { image: '/studio/slide2.jpg', pos: 'object-center'     },
  { image: '/studio/slide3.jpg', pos: 'object-center'     },
  { image: '/studio/slide4.jpg', pos: 'object-center'     },
  { image: '/studio/slide5.jpg', pos: 'object-left-bottom'},
];

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
  youtubeId: string | null; thumbnailUrl: string | null;
  videoUrl?: string | null; category: string;
}

interface BlogPost {
  id: string; title: string; slug: string; excerpt: string;
  coverImage: string | null; category: string;
  publishedAt: string | null; author: { name: string };
}

interface GalleryImage {
  id: string; imageUrl: string; title: string | null;
}

const FEATURED_IMAGES = [
  '/studio/slide1.jpg', '/studio/slide2.jpg', '/studio/slide3.jpg',
  '/studio/slide4.jpg', '/studio/slide5.jpg',
];

// Real studio recordings — always shown
const FEATURED_VIDEOS: StudioVideo[] = [
  { id: 'feat-mandala', title: 'Mandala', description: null, youtubeId: null, thumbnailUrl: null, videoUrl: '/videos/mandala.mp4', category: 'Podcast' },
  { id: 'feat-du',      title: 'DU',      description: null, youtubeId: null, thumbnailUrl: null, videoUrl: '/videos/du.mp4',      category: 'Podcast' },
];

export default function HomePage() {
  const [videos,      setVideos]      = useState<StudioVideo[]>([]);
  const [posts,       setPosts]       = useState<BlogPost[]>([]);
  const [galleryImgs, setGalleryImgs] = useState<GalleryImage[]>([]);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [openFaq,     setOpenFaq]     = useState<number | null>(null);
  const [slide,       setSlide]       = useState(0);

  useEffect(() => {
    api.get<StudioVideo[]>('/studio-videos/public').then(r => setVideos(r.data)).catch(() => {});
    api.get<BlogPost[]>('/blogs/public').then(r => setPosts(r.data)).catch(() => {});
    api.get<GalleryImage[]>('/gallery/public').then(r => setGalleryImgs(r.data)).catch(() => {});
  }, []);

  // Handle hash navigation from other pages (e.g. /blog → /#process)
  // Delay scroll so hero section is fully rendered before measuring positions
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const timer = setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const prevSlide = () => setSlide(s => (s - 1 + SLIDES.length) % SLIDES.length);
  const nextSlide = () => setSlide(s => (s + 1) % SLIDES.length);

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="min-h-screen bg-white dark:bg-[#111111]">
      <Navbar />

      {/* ── HERO SLIDER ──────────────────────────────── */}
      <section className="relative h-screen min-h-[600px] overflow-hidden bg-black">

        {/* Background photos — crossfade only, no scale */}
        {SLIDES.map((s, i) => (
          <div
            key={i}
            aria-hidden
            className={`absolute inset-0 transition-opacity ease-in-out ${i === slide ? 'opacity-100' : 'opacity-0'}`}
            style={{ transitionDuration: '1000ms' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.image}
              alt=""
              className={`w-full h-full object-cover ${s.pos}`}
              loading={i === 0 ? 'eager' : 'lazy'}
            />
          </div>
        ))}

        {/* Dark overlays */}
        <div className="absolute inset-0 bg-black/60 z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent z-[1]" />
        <div className="absolute top-0 left-0 right-0 h-36 bg-gradient-to-b from-black/60 to-transparent z-[1]" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/70 to-transparent z-[1]" />

        {/* ── Single content — same on every slide ── */}
        <div className="absolute inset-0 z-10 flex flex-col justify-end pb-[90px] px-6 sm:px-10 lg:px-16 pt-[80px]">
          <div className="max-w-2xl">

            {/* Tag */}
            <div className="flex items-center gap-2 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E5312A] animate-pulse" />
              <span className="text-[10px] font-black tracking-[0.3em] uppercase text-white/50">Now Booking — Slots Available</span>
            </div>

            {/* Headline */}
            <h1
              className="font-black leading-[0.97] tracking-tight mb-6 text-white drop-shadow-2xl"
              style={{ fontSize: 'clamp(32px, 8vw, 90px)' }}
            >
              Your Vision,<br />
              <span className="text-[#E5312A]">Professionally</span><br />
              Produced.
            </h1>

            {/* Sub */}
            <p className="text-sm sm:text-[15px] text-white/55 leading-relaxed mb-9 max-w-lg">
              Six studio services under one roof — podcasts, VFX, news shoots, online classes, monologues, and product photography. Book online in minutes.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-[#E5312A] hover:bg-[#c9261f] text-white font-bold px-8 py-3.5 text-sm tracking-wide transition-colors"
              >
                Book a Studio <ArrowRight size={14} />
              </Link>
              <button
                onClick={() => scrollTo('videos')}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/40 text-white/80 hover:text-white font-semibold px-8 py-3.5 text-sm transition-colors"
              >
                <Play size={11} className="fill-white" />
                Watch Our Work
              </button>
            </div>
          </div>
        </div>

        {/* ── Bottom bar — stats + slide controls ── */}
        <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-white/10 backdrop-blur-sm bg-black/20">
          <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 flex items-center justify-between py-4">

            {/* Stats */}
            <div className="hidden sm:flex items-center divide-x divide-white/15">
              {[
                { value: '6+',      label: 'Studio Services' },
                { value: '6AM–2AM', label: 'Open Daily'      },
                { value: 'GST',     label: 'Tax Compliant'   },
                { value: '100%',    label: 'Online Booking'  },
              ].map(stat => (
                <div key={stat.label} className="px-5 first:pl-0">
                  <p className="text-sm font-black text-white leading-none">{stat.value}</p>
                  <p className="text-[9px] tracking-widest uppercase text-white/30 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Slide controls */}
            <div className="flex items-center gap-4 ml-auto">
              <div className="flex items-center gap-1.5">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlide(i)}
                    className={`h-[2px] rounded-full transition-all duration-500 ${
                      i === slide ? 'w-8 bg-[#E5312A]' : 'w-4 bg-white/25 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-1">
                <button onClick={prevSlide} className="w-8 h-8 flex items-center justify-center border border-white/15 hover:border-white/40 text-white/50 hover:text-white transition-colors">
                  <ChevronLeft size={14} />
                </button>
                <button onClick={nextSlide} className="w-8 h-8 flex items-center justify-center border border-white/15 hover:border-white/40 text-white/50 hover:text-white transition-colors">
                  <ChevronRight size={14} />
                </button>
              </div>
              <span className="text-[11px] font-bold text-white/25 tabular-nums hidden sm:block">
                {String(slide + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES ──────────────────────────────────── */}
      <section id="services" className="pt-6 pb-20 bg-[#f8f8f8] dark:bg-[#0e0e0e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <p className="section-label mb-3">Services</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Our Studio Services</h2>
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
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{s.description}</p>
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
      <section id="videos" className="pt-6 pb-20 bg-white dark:bg-[#111111]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <p className="section-label mb-3">Studio Showcase</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">See Our Work</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...FEATURED_VIDEOS, ...videos].map(video => (
              <div key={video.id} className="overflow-hidden group">
                {activeVideo === video.id ? (
                  /* ── Active player ── */
                  <div className="aspect-video bg-black">
                    {video.videoUrl ? (
                      // eslint-disable-next-line jsx-a11y/media-has-caption
                      <video src={video.videoUrl} controls autoPlay className="w-full h-full" />
                    ) : video.youtubeId ? (
                      <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1`}
                        title={video.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : null}
                  </div>
                ) : (
                  /* ── Thumbnail / poster ── */
                  <button
                    className="relative block w-full aspect-video overflow-hidden bg-[#0a0a0a] dark:bg-[#0a0a0a]"
                    onClick={() => setActiveVideo(video.id)}
                  >
                    {video.thumbnailUrl ? (
                      <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : video.youtubeId ? (
                      <img src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : video.videoUrl ? (
                      <VideoThumbnail src={video.videoUrl} className="w-full h-full object-cover" />
                    ) : null}
                    {/* Play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
                      <div className="w-12 h-12 bg-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                        <Play size={16} className="text-gray-900 ml-1" fill="currentColor" />
                      </div>
                    </div>
                    <span className="absolute top-3 left-3 bg-[#E5312A] text-white text-[10px] font-semibold px-2 py-1 uppercase tracking-wide">
                      {video.category}
                    </span>
                  </button>
                )}
                <div className="p-4 bg-[#f8f8f8] dark:bg-[#161616]">
                  <h3 className="text-gray-900 dark:text-white font-semibold text-sm">{video.title}</h3>
                  {video.description && (
                    <p className="text-gray-600 dark:text-gray-300 text-xs mt-1 line-clamp-2">{video.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GALLERY ──────────────────────────────────── */}
      <section className="py-20 bg-[#f8f8f8] dark:bg-[#0e0e0e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="section-label mb-3">Studio Gallery</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Inside the Studio</h2>
            </div>
            <Link href="/gallery" className="hidden sm:flex items-center gap-2 text-sm font-bold text-[#E5312A] hover:underline">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1">
            {[
              ...FEATURED_IMAGES.map((url, i) => ({ id: `fs-${i}`, imageUrl: url, title: null })),
              ...galleryImgs,
            ].slice(0, 8).map(img => (
              <Link
                key={img.id}
                href="/gallery"
                className="relative aspect-square overflow-hidden bg-[#e5e5e5] dark:bg-[#181818] group block"
              >
                <img
                  src={img.imageUrl}
                  alt={img.title ?? 'Studio'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </Link>
            ))}
          </div>
          <div className="flex sm:hidden justify-center mt-6">
            <Link href="/gallery" className="flex items-center gap-2 text-sm font-bold text-[#E5312A]">
              View All Gallery <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────── */}
      <section id="process" className="pt-6 pb-20 bg-white dark:bg-[#111111]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <p className="section-label mb-3">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">From Request to Invoice</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PROCESS_STEPS.map(item => (
              <div key={item.step} className="bg-white dark:bg-[#161616] p-5">
                <p className="text-[#E5312A] font-bold text-sm mb-3">{item.step}</p>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">{item.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY US ───────────────────────────────────── */}
      <section className="py-20 bg-[#E5312A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
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
                    <p className="text-white text-sm leading-relaxed">{point}</p>
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
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
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

      {/* ── BLOG ─────────────────────────────────────── */}
      <section className="py-20 bg-[#f8f8f8] dark:bg-[#0e0e0e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="section-label mb-3">Blog</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">From the Studio</h2>
            </div>
            <Link href="/blog" className="hidden sm:flex items-center gap-2 text-sm font-bold text-[#E5312A] hover:underline">
              All Posts <ArrowRight size={14} />
            </Link>
          </div>
          {posts.length === 0 ? (
            <div className="text-center py-16 border border-[#e5e5e5] dark:border-[#2a2a2a]">
              <p className="text-[#6b6b6b] dark:text-[#8a8a8a] text-sm">Blog posts coming soon.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.slice(0, 3).map(post => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="group bg-white dark:bg-[#161616] block">
                    {post.coverImage ? (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-[#e5e5e5] dark:bg-[#1a1a1a] flex items-center justify-center">
                        <span className="text-4xl font-black text-gray-300 dark:text-[#2a2a2a]">{post.title.charAt(0)}</span>
                      </div>
                    )}
                    <div className="p-5">
                      <p className="section-label text-[10px] mb-2">{post.category}</p>
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-2 group-hover:text-[#E5312A] transition-colors line-clamp-2">{post.title}</h3>
                      {post.excerpt && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{post.excerpt}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              <div className="flex sm:hidden justify-center mt-6">
                <Link href="/blog" className="flex items-center gap-2 text-sm font-bold text-[#E5312A]">
                  All Posts <ArrowRight size={14} />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────── */}
      <section id="faq" className="pt-6 pb-24 bg-white dark:bg-[#111111]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14">
            <p className="section-label mb-3">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Common Questions</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white dark:bg-[#161616]">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
                >
                  <span className="font-semibold text-gray-900 dark:text-white text-base pr-4">{faq.q}</span>
                  {openFaq === i
                    ? <Minus size={16} className="text-[#E5312A] flex-shrink-0" />
                    : <Plus  size={16} className="text-gray-400 dark:text-[#555] flex-shrink-0" />
                  }
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6">
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ──────────────────────────────────── */}
      <section id="contact" className="pt-6 pb-20 bg-white dark:bg-[#111111]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <p className="section-label mb-3">Contact</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Get in Touch</h2>
          </div>
          <div className="grid lg:grid-cols-2 gap-10">

            {/* Left — info + map */}
            <div>
              <div className="space-y-5 mb-7">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 bg-[#E5312A]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Phone size={15} className="text-[#E5312A]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Phone</p>
                    <a href="tel:+917827882058" className="text-sm font-medium text-gray-900 dark:text-white hover:text-[#E5312A] transition-colors">
                      +91 78278 82058
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 bg-[#E5312A]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Mail size={15} className="text-[#E5312A]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Email</p>
                    <a href="mailto:info@podversal.com" className="text-sm font-medium text-gray-900 dark:text-white hover:text-[#E5312A] transition-colors">
                      info@podversal.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 bg-[#E5312A]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin size={15} className="text-[#E5312A]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Location</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed">
                      B 812, 814, Tower 4, NX One<br />Greater Noida West, UP
                    </p>
                  </div>
                </div>
              </div>
              <div className="w-full h-60 overflow-hidden border border-gray-100 dark:border-[#2a2a2a]">
                <iframe
                  title="Podversal Studio Location"
                  src="https://maps.google.com/maps?q=NX+One+Tower+4+Greater+Noida+West+Uttar+Pradesh&output=embed&z=15"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>

            {/* Right — form */}
            <div>
              <form
                className="space-y-4"
                onSubmit={e => {
                  e.preventDefault();
                  toast.success("Got it — we'll be in touch within a few hours.");
                  (e.target as HTMLFormElement).reset();
                }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Name</label>
                    <input type="text" placeholder="Full Name" className="input-field" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Phone</label>
                    <input type="tel" placeholder="98xxxxxxxx" className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Email</label>
                  <input type="email" placeholder="E-mail" className="input-field" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Message</label>
                  <textarea rows={5} placeholder="Your message" className="input-field resize-none" required />
                </div>
                <button type="submit" className="btn-primary">Send Message</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
