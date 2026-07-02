"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/marketing/Navbar";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import VideoThumbnail from "@/components/VideoThumbnail";
import {
  Mic,
  Video,
  MonitorPlay,
  Newspaper,
  Laptop,
  Camera,
  CheckCircle,
  Play,
  Pause,
  Calendar,
} from "lucide-react";
import api from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import { useRefetchOnFocus } from "@/lib/use-refetch-on-focus";
import { useFadeIn, anim } from "@/lib/use-fade-in";
import { FEATURED_VIDEOS } from "@/lib/featured-videos";

// ── Static data ───────────────────────────────────────
const SERVICES = [
  {
    icon: Mic,
    slug: "podcast-studio",
    title: "Podcast Studio",
    description:
      "Multi-channel recording with acoustic treatment, high-end microphones, and professional mixing. Ideal for interview shows and solo episodes.",
  },
  {
    icon: Video,
    slug: "vfx-podcast",
    title: "VFX Podcast",
    description:
      "LED backdrops, live motion graphics, and dynamic visual effects. Your podcast becomes a full video production.",
  },
  {
    icon: MonitorPlay,
    slug: "monologue-shoot",
    title: "Monologue Shoot",
    description:
      "Teleprompter, three-point lighting, multi-angle setup. Walk in with your script, walk out with broadcast-quality footage.",
  },
  {
    icon: Newspaper,
    slug: "news-shoot",
    title: "News Shoot",
    description:
      "Green screen, anchor desk, broadcast cameras. Designed for news segments, corporate announcements, and media productions.",
  },
  {
    icon: Laptop,
    slug: "become-a-podcaster",
    title: "Become a Podcaster",
    description:
      "Quiet, controlled environment with teleprompter and screen recording integration. Everything you need to launch and grow your podcast.",
  },
  {
    icon: Camera,
    slug: "product-shoots",
    title: "Product Shoots",
    description:
      "Softboxes, reflectors, controlled colour temperature, multiple backdrop options. For e-commerce, brand campaigns, and product launches.",
  },
];

const TESTIMONIALS = [
  {
    name: "Ankita Ramvir Singh",
    role: "Content Creator",
    photo: "/ankita.jpg",
    quote:
      "Booked my first session with zero prior experience. The team made it completely stress-free. Sound quality was better than anything I had recorded before.",
  },
  {
    name: "Devendra Sharma",
    role: "President, Delhi University",
    photo: "/du-president.jpg",
    quote:
      "We shot 30 modules over three days. The lighting stayed consistent, the teleprompter saved us hours, and every recording looked broadcast-quality straight out of the studio.",
  },
  {
    name: "Sandeep Verma",
    role: "Business Professional",
    photo: "/sandeep-verma.jpg",
    quote:
      "Our product launch visuals came out exactly how we imagined them. Professional setup, no guesswork, and the team understood what our brand needed.",
  },
];

const INVENTORY = [
  {
    name: "Sennheiser Profile Microphone",
    spec: "Professional condenser, cardioid polar pattern, broadcast-grade preamp",
    image: "/studio/s3.jpg",
  },
  {
    name: "Sony Alpha ZV-E10",
    spec: "4K mirrorless camera · 18-50mm E-mount lens · stabilised footage",
    image: "/studio/s5.jpg",
  },
  {
    name: "Digitek Teleprompter",
    spec: "Professional prompter system with wireless tablet control",
    image: "/studio/s6.jpg",
  },
  {
    name: "Studio Lighting Rig",
    spec: "Softbox + bi-colour LED panels · broadcast colour calibrated",
    image: "/studio/s2.jpg",
  },
  {
    name: "Acoustic Treatment",
    spec: "Full ceiling & wall acoustic panels · isolated recording environment",
    image: "/studio/s7.jpg",
  },
  {
    name: "Fluid Head Tripod System",
    spec: "Precision pan/tilt control for cinematic, shake-free camera movement",
    image: "/studio/s8.jpg",
  },
];

interface StudioVideo {
  id: string;
  title: string;
  description: string | null;
  youtubeId: string | null;
  cloudinaryUrl: string | null;
  thumbnailUrl: string | null;
  videoUrl?: string | null;
  category: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
  category: string;
  publishedAt: string | null;
  author: { name: string };
}

const HERO_SLIDES = [
  "/studio/s1.jpg",
  "/studio/s6.jpg",
  "/studio/s5.jpg",
  "/studio/s8.jpg",
  "/studio/s2.jpg",
];

// ── Page ──────────────────────────────────────────────
export default function HomePage() {
  const [videos, setVideos] = useState<StudioVideo[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const [loggedIn, setLoggedIn] = useState(false);
  const [slide, setSlide] = useState(0);
  const videosRef = useRef<HTMLElement>(null);

  const bookHref = loggedIn ? "/dashboard/bookings/new" : "/register";

  const fetchPublicData = () => {
    api
      .get<StudioVideo[]>("/studio-videos/public")
      .then((r) => setVideos(r.data))
      .catch(() => {});
    api
      .get<BlogPost[]>("/blogs/public")
      .then((r) => setPosts(r.data))
      .catch(() => {});
  };

  useEffect(() => {
    setLoggedIn(isAuthenticated());
    fetchPublicData();
  }, []);
  useRefetchOnFocus(fetchPublicData);

  useEffect(() => {
    const t = setInterval(
      () => setSlide((s) => (s + 1) % HERO_SLIDES.length),
      4500,
    );
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const timer = setTimeout(() => {
      document
        .getElementById(hash)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  // Pause all videos when section scrolls out of view
  useEffect(() => {
    const onScroll = () => {
      const el = videosRef.current;
      if (!el) return;
      const { top, bottom } = el.getBoundingClientRect();
      const outOfView = bottom < 0 || top > window.innerHeight;
      if (outOfView) {
        el.querySelectorAll<HTMLVideoElement>("video").forEach((v) => {
          if (!v.paused) v.pause();
        });
        setActiveVideo(null);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const svcAnim = useFadeIn();
  const prodAnim = useFadeIn();
  const testAnim = useFadeIn();
  const whyAnim = useFadeIn();
  const invAnim = useFadeIn();
  const blogAnim = useFadeIn();

  const allVideos = [...FEATURED_VIDEOS, ...videos];

  return (
    <div className="min-h-screen bg-white dark:bg-[#111111]">
      <Navbar />

      {/* ════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════ */}
      <section className="relative h-screen min-h-[560px] sm:min-h-[640px] overflow-hidden bg-black">
        {/* Slideshow images */}
        {HERO_SLIDES.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000"
            style={{ opacity: i === slide ? 1 : 0 }}
            loading={i === 0 ? "eager" : "lazy"}
          />
        ))}
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Slide dots */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === slide ? "bg-white w-4" : "bg-white/35"}`}
            />
          ))}
        </div>

        <div className="relative z-10 h-full flex flex-col justify-center sm:justify-end pb-14 sm:pb-[90px] site-wrap pt-24 sm:pt-[80px]">
          <div className="max-w-2xl">
            <h1
              className="font-black leading-[0.97] tracking-tight mb-6 text-white"
              style={{ fontSize: "clamp(36px, 6.5vw, 108px)" }}
            >
              Where Ideas
              <br />
              <span className="text-[#E5312A]">Become</span>
              <br />
              Content
            </h1>
            <p className="text-sm sm:text-[15px] text-white/55 leading-relaxed mb-9 max-w-lg">
              Six studio services under one roof: podcasts, VFX, news shoots,
              online classes, monologues, and product photography. Book online
              in minutes.
            </p>
            <div className="flex flex-col items-start gap-2.5 sm:flex-row sm:gap-3">
              <Link
                href={bookHref}
                className="inline-flex items-center justify-center bg-[#E5312A] hover:bg-[#c9261f] text-white font-bold px-7 py-2.5 sm:px-8 sm:py-3.5 text-xs sm:text-sm tracking-wide transition-colors min-w-[160px] sm:min-w-[180px]"
              >
                Book a Studio
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center border border-white/30 hover:border-white/60 text-white/80 hover:text-white font-semibold px-7 py-2.5 sm:px-8 sm:py-3.5 text-xs sm:text-sm transition-colors min-w-[160px] sm:min-w-[180px]"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          SERVICES
      ════════════════════════════════════════════════════ */}
      <section
        id="services"
        className="pt-8 sm:pt-10 lg:pt-14 pb-10 sm:pb-14 lg:pb-20 bg-[#f8f8f8] dark:bg-[#0e0e0e]"
      >
        <div className="site-wrap">
          <div ref={svcAnim.ref}>
            <div
              style={anim(svcAnim.visible)}
              className="mb-6 sm:mb-8 lg:mb-12"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Our Studio Services
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {SERVICES.map((s, i) => {
                const Icon = s.icon;
                return (
                  <Link
                    key={s.slug}
                    href={`/services/${s.slug}`}
                    className="block bg-white dark:bg-[#161616] p-6 hover:shadow-md dark:hover:shadow-none dark:hover:bg-[#1a1a1a] transition-all group"
                    style={anim(svcAnim.visible, 0.1 + i * 0.07)}
                  >
                    <div className="w-10 h-10 bg-[#E5312A]/10 flex items-center justify-center mb-4">
                      <Icon size={18} className="text-[#E5312A]" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-[#E5312A] transition-colors">
                      {s.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                      {s.description}
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#E5312A]">
                      Learn more
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          FEATURED PRODUCTIONS
      ════════════════════════════════════════════════════ */}
      <section
        id="videos"
        ref={videosRef}
        className="pt-6 pb-8 sm:pb-10 lg:pb-14 bg-white dark:bg-[#111111] overflow-hidden"
      >
        <div className="site-wrap">
          <div
            ref={prodAnim.ref}
            className="mb-6 sm:mb-8 lg:mb-10"
            style={anim(prodAnim.visible)}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Featured Productions
            </h2>
          </div>
        </div>

        {/* Just double (not pad-then-double)  with large local video files, every
            extra copy is another full video element loading concurrently, which
            was starving bandwidth and leaving some thumbnails stuck black. */}
        {(() => {
          const strip = [...allVideos, ...allVideos];
          return (
            <div
              className="w-full overflow-hidden group/strip pl-4 sm:pl-6 lg:pl-8"
              style={anim(prodAnim.visible, 0.15)}
            >
              <div
                className="animate-marquee-left group-hover/strip:[animation-play-state:paused] flex gap-6"
                style={
                  {
                    "--dur": "55s",
                    width: "max-content",
                  } as React.CSSProperties
                }
              >
                {strip.map((video, i) => {
                  const key = `${video.id}-${i}`;
                  return (
                    <div
                      key={key}
                      className="flex-none w-[75vw] sm:w-[44vw] lg:w-[38vw] max-w-[600px] group"
                    >
                      <div className="relative aspect-video bg-black overflow-hidden">
                        {video.videoUrl || video.cloudinaryUrl ? (
                          <>
                            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                            <video
                              ref={(el) => {
                                videoRefs.current[key] = el;
                              }}
                              src={video.videoUrl ?? video.cloudinaryUrl ?? ""}
                              poster={video.thumbnailUrl ?? undefined}
                              preload={
                                i < allVideos.length ? "metadata" : "none"
                              }
                              playsInline
                              className="w-full h-full object-cover"
                              onPlay={() => setPlayingKey(key)}
                              onPause={() =>
                                setPlayingKey((p) => (p === key ? null : p))
                              }
                              onEnded={(e) => {
                                // load() resets the element so the poster image reappears
                                // instead of the video sitting on its last/black frame
                                e.currentTarget.load();
                                setPlayingKey((p) => (p === key ? null : p));
                              }}
                            />
                            {/* Play/pause only appears on hover  hidden during playback and after pausing */}
                            <button
                              type="button"
                              aria-label={
                                playingKey === key
                                  ? "Pause video"
                                  : "Play video"
                              }
                              className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 focus:opacity-100 bg-black/0 hover:bg-black/20 transition-opacity"
                              onClick={() => {
                                const el = videoRefs.current[key];
                                if (!el) return;
                                if (el.paused) el.play();
                                else el.pause();
                              }}
                            >
                              <div className="w-12 h-12 bg-white flex items-center justify-center shadow-lg">
                                {playingKey === key ? (
                                  <Pause
                                    size={16}
                                    className="text-gray-900"
                                    fill="currentColor"
                                  />
                                ) : (
                                  <Play
                                    size={16}
                                    className="text-gray-900 ml-1"
                                    fill="currentColor"
                                  />
                                )}
                              </div>
                            </button>
                          </>
                        ) : video.youtubeId ? (
                          activeVideo === video.id ? (
                            <iframe
                              className="w-full h-full"
                              src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1`}
                              title={video.title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <button
                              className="relative w-full h-full"
                              onClick={() => setActiveVideo(video.id)}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={`https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`}
                                alt={video.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src =
                                    `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
                                }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/20 transition-colors">
                                <div className="w-12 h-12 bg-white flex items-center justify-center shadow-lg">
                                  <Play
                                    size={16}
                                    className="text-gray-900 ml-1"
                                    fill="currentColor"
                                  />
                                </div>
                              </div>
                            </button>
                          )
                        ) : null}
                        <span className="absolute top-3 left-3 z-10 bg-[#E5312A] text-white text-[10px] font-semibold px-2 py-1 uppercase tracking-wide pointer-events-none">
                          {video.category}
                        </span>
                      </div>
                      <div className="py-3 px-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                          {video.title}
                        </h3>
                        {video.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                            {video.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </section>

      {/* ════════════════════════════════════════════════════
          TESTIMONIALS  large photo top, quote below, red name
      ════════════════════════════════════════════════════ */}
      <section className="py-10 sm:py-14 lg:py-20 bg-[#f8f8f8] dark:bg-[#0a0a0a]">
        <div className="site-wrap">
          <div
            ref={testAnim.ref}
            className="mb-6 sm:mb-8 lg:mb-12"
            style={anim(testAnim.visible)}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Testimonials
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.name}
                className="bg-white dark:bg-[#141414] flex flex-col border border-[#e8e8e8] dark:border-transparent"
                style={anim(testAnim.visible, 0.1 + i * 0.1)}
              >
                {/* Large photo */}
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={t.photo}
                    alt={t.name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                {/* Quote + name */}
                <div className="p-6 flex flex-col flex-1">
                  <p className="text-sm text-gray-600 dark:text-white/70 leading-relaxed flex-1">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="mt-5 pt-4 border-t border-gray-100 dark:border-white/10">
                    <p className="font-bold text-[#E5312A] text-sm">{t.name}</p>
                    <p className="text-gray-400 dark:text-white/40 text-xs mt-0.5">
                      {t.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          WHY PODVERSAL  original red section (exact)
      ════════════════════════════════════════════════════ */}
      <section className="py-10 sm:py-14 lg:py-20 bg-[#E5312A]">
        <div className="site-wrap">
          <div
            ref={whyAnim.ref}
            className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start"
          >
            <div style={anim(whyAnim.visible)}>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-5 sm:mb-6 lg:mb-8">
                Why teams choose us
              </h2>
              <div className="space-y-4">
                {[
                  "Slot locking prevents double bookings: what you see is available",
                  "Quotations and GST invoices arrive by email automatically",
                  "Pay via UPI, card, or bank transfer, whatever works for you",
                  "Studio open from 6 AM to 2 AM, seven days a week",
                  "Track every booking and invoice from your own dashboard",
                  "Referral agents get a commission dashboard with full payout history",
                ].map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <CheckCircle
                      size={16}
                      className="text-white/70 flex-shrink-0 mt-0.5"
                    />
                    <p className="text-white text-sm leading-relaxed">
                      {point}
                    </p>
                  </div>
                ))}
              </div>
              <Link
                href={bookHref}
                className="inline-flex items-center gap-2 mt-5 sm:mt-6 lg:mt-8 bg-white text-[#E5312A] font-semibold px-7 py-3 hover:bg-white/90 transition-colors text-sm"
              >
                Get Started
              </Link>
            </div>
            <div
              className="grid grid-cols-2 gap-4"
              style={anim(whyAnim.visible, 0.15)}
            >
              {[
                { value: "6 AM – 2 AM", label: "Operating Hours" },
                { value: "6+", label: "Studio Services" },
                { value: "100%", label: "Online Booking" },
                { value: "GST", label: "Tax Compliant" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/10 p-6">
                  <p className="text-2xl font-bold text-white mb-1">
                    {stat.value}
                  </p>
                  <p className="text-white/60 text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          INVENTORY  CSS auto-scroll horizontal
      ════════════════════════════════════════════════════ */}
      <section className="pt-8 sm:pt-10 lg:pt-14 pb-8 sm:pb-10 lg:pb-14 bg-white dark:bg-[#111111] overflow-hidden">
        <div className="site-wrap">
          <div
            ref={invAnim.ref}
            className="mb-6 sm:mb-8 lg:mb-10"
            style={anim(invAnim.visible)}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Our Studio
            </h2>
          </div>
        </div>

        {/* Strip fades in on scroll, pauses on hover */}
        <div
          className="w-full overflow-hidden group/inv pl-4 sm:pl-6 lg:pl-8"
          style={anim(invAnim.visible, 0.15)}
        >
          <div
            className="animate-marquee-left group-hover/inv:[animation-play-state:paused] flex gap-6"
            style={
              { "--dur": "38s", width: "max-content" } as React.CSSProperties
            }
          >
            {[...INVENTORY, ...INVENTORY].map((item, i) => (
              <div
                key={`${item.name}-${i}`}
                className="flex-none w-[72vw] sm:w-[38vw] lg:w-[30vw] max-w-[480px] bg-[#f8f8f8] dark:bg-[#161616] border border-gray-100 dark:border-[#2a2a2a] group"
              >
                <div className="aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-[#1a1a1a]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1.5">
                    {item.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    {item.spec}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          BLOG
      ════════════════════════════════════════════════════ */}
      <section className="py-10 sm:py-14 lg:py-20 bg-[#f8f8f8] dark:bg-[#0e0e0e]">
        <div className="site-wrap">
          <div ref={blogAnim.ref}>
            <div
              className="flex items-end justify-between mb-6 sm:mb-8 lg:mb-10"
              style={anim(blogAnim.visible)}
            >
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                  Blog
                </h2>
              </div>
              <Link
                href="/blog"
                className="hidden sm:flex items-center gap-2 text-sm font-bold text-[#E5312A] hover:underline"
              >
                All Posts
              </Link>
            </div>

            {posts.length === 0 ? (
              <div
                className="text-center py-16 border border-[#e5e5e5] dark:border-[#2a2a2a]"
                style={anim(blogAnim.visible, 0.1)}
              >
                <p className="text-[#6b6b6b] dark:text-[#8a8a8a] text-sm">
                  Blog posts coming soon.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
                  {posts.slice(0, 3).map((post, i) => (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      className="group flex flex-col overflow-hidden rounded-xl bg-white dark:bg-[#161616] border border-[#e8e8e8] dark:border-[#222] transition-all duration-300"
                      style={anim(blogAnim.visible, 0.1 + i * 0.1)}
                    >
                      <div className="aspect-[16/9] overflow-hidden bg-[#f5f5f5] dark:bg-[#1a1a1a]">
                        {post.coverImage ? (
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#f5f5f5] dark:bg-[#1a1a1a] flex items-center justify-center">
                            <span className="text-5xl font-black text-[#e5e5e5] dark:text-[#2a2a2a]">
                              {post.title.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col flex-1 p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-[10px] font-black tracking-[0.15em] uppercase text-[#E5312A] bg-[#E5312A]/8 dark:bg-[#E5312A]/15 px-2.5 py-1">
                            {post.category}
                          </span>
                          {post.publishedAt && (
                            <span className="flex items-center gap-1 text-xs text-[#aaa] dark:text-[#555]">
                              <Calendar size={10} />
                              {new Date(post.publishedAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-gray-900 dark:text-white text-base line-clamp-2 group-hover:text-[#E5312A] transition-colors leading-snug flex-1">
                          {post.title}
                        </h3>

                        <div className="flex items-center justify-between mt-5 pt-4 border-t border-[#f0f0f0] dark:border-[#222]">
                          <span className="text-xs text-[#aaa] dark:text-[#555]">
                            By {post.author?.name}
                          </span>
                          <span className="text-xs font-bold text-[#E5312A] group-hover:underline">
                            Read
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="flex sm:hidden justify-center mt-6">
                  <Link
                    href="/blog"
                    className="text-sm font-bold text-[#E5312A]"
                  >
                    All Posts
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
