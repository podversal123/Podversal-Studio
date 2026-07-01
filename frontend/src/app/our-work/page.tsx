'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Play, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '@/components/marketing/Navbar';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import api from '@/lib/api';
import { useFadeIn, anim } from '@/lib/use-fade-in';
import { FEATURED_VIDEOS, type FeaturedVideo as StudioVideo } from '@/lib/featured-videos';

const GALLERY = [
  { src: '/studio/s1.jpg', alt: 'Studio seating area — ambient bookshelf lighting' },
  { src: '/studio/s3.jpg', alt: 'Sennheiser mic — green accent wall'               },
  { src: '/studio/s4.jpg', alt: 'Sennheiser mic — blue accent wall'                },
  { src: '/studio/s2.jpg', alt: 'Full studio setup with professional lighting'      },
  { src: '/studio/s5.jpg', alt: 'Sony Alpha ZV-E10 camera on rig'                  },
  { src: '/studio/s6.jpg', alt: 'Digitek professional teleprompter'                 },
  { src: '/studio/s7.jpg', alt: 'Studio microphone on chair arm'                   },
  { src: '/studio/s8.jpg', alt: 'Chairs and ambient bookshelf — evening look'      },
];

export default function OurWorkPage() {
  const [videos,      setVideos]      = useState<StudioVideo[]>([]);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [lightbox,    setLightbox]    = useState<number | null>(null);

  const heroAnim    = useFadeIn(0.05);
  const videoAnim   = useFadeIn();
  const galleryAnim = useFadeIn();

  useEffect(() => {
    api.get<StudioVideo[]>('/studio-videos/public').then(r => setVideos(r.data)).catch(() => {});
  }, []);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightbox === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowRight') setLightbox(i => i !== null ? (i + 1) % GALLERY.length : null);
      if (e.key === 'ArrowLeft')  setLightbox(i => i !== null ? (i - 1 + GALLERY.length) % GALLERY.length : null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox]);


  const allVideos = videos.length > 0
    ? [...FEATURED_VIDEOS.filter(fv => !videos.find(v => v.title === fv.title)), ...videos]
    : FEATURED_VIDEOS;

  return (
    <div className="min-h-screen bg-white dark:bg-[#111111]">
      <Navbar />

      {/* ── Hero ── */}
      <section className="pt-[80px] bg-white dark:bg-[#111111]">
        <div className="site-wrap pt-12 pb-10">
          <div ref={heroAnim.ref} style={anim(heroAnim.visible)}>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white leading-tight">
              Our Work
            </h1>
          </div>
        </div>
      </section>

      {/* ── Productions ── */}
      <section className="py-20 bg-white dark:bg-[#111111]">
        <div className="site-wrap">
          <div ref={videoAnim.ref}>
            <div className="mb-12" style={anim(videoAnim.visible)}>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Featured Productions</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {allVideos.map((video, i) => (
                <div
                  key={video.id}
                  className="group"
                  style={anim(videoAnim.visible, 0.08 + i * 0.06)}
                >
                  <div className="relative aspect-video bg-black overflow-hidden">
                    {(video.videoUrl || video.cloudinaryUrl) ? (
                      // eslint-disable-next-line jsx-a11y/media-has-caption
                      <video
                        src={video.videoUrl ?? video.cloudinaryUrl ?? ''}
                        controls
                        preload="metadata"
                        poster={video.thumbnailUrl ?? undefined}
                        className="w-full h-full"
                      />
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
                          className="absolute inset-0 w-full h-full"
                          onClick={() => setActiveVideo(video.id)}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={e => { (e.currentTarget as HTMLImageElement).src = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`; }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/35 group-hover:bg-black/20 transition-colors">
                            <div className="w-14 h-14 bg-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
                              <Play size={18} className="text-gray-900 ml-1" fill="currentColor" />
                            </div>
                          </div>
                        </button>
                      )
                    ) : null}
                    <span className="absolute top-3 left-3 z-10 pointer-events-none bg-[#E5312A] text-white text-[10px] font-semibold px-2 py-1 uppercase tracking-wide">
                      {video.category}
                    </span>
                  </div>
                  <div className="py-4 bg-white dark:bg-[#111111]">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{video.title}</h3>
                    {video.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{video.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Studio Gallery ── */}
      <section className="py-20 bg-[#0a0a0a]">
        <div className="site-wrap">
          <div ref={galleryAnim.ref}>
            <div className="mb-12" style={anim(galleryAnim.visible)}>
              <h2 className="text-3xl sm:text-4xl font-bold text-white">Studio Gallery</h2>
              <p className="text-white/40 text-sm mt-2">Click any image to view full size</p>
            </div>

            <div
              className="grid grid-cols-2 md:grid-cols-4 gap-3"
              style={anim(galleryAnim.visible, 0.1)}
            >
              {GALLERY.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setLightbox(i)}
                  className="relative overflow-hidden bg-[#161616] group cursor-zoom-in aspect-[4/3]"
                  style={anim(galleryAnim.visible, 0.1 + i * 0.06)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-end p-4">
                    <p className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0 text-left leading-snug">
                      {img.alt}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Lightbox ── */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          {/* Close */}
          <button
            className="absolute top-5 right-5 w-10 h-10 bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
            onClick={() => setLightbox(null)}
          >
            <X size={18} />
          </button>

          {/* Prev */}
          <button
            className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
            onClick={e => { e.stopPropagation(); setLightbox(l => l !== null ? (l - 1 + GALLERY.length) % GALLERY.length : null); }}
          >
            <ChevronLeft size={20} />
          </button>

          {/* Image */}
          <div className="max-w-5xl max-h-[85vh] mx-16 sm:mx-24 flex items-center justify-center" onClick={e => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={GALLERY[lightbox].src}
              alt={GALLERY[lightbox].alt}
              className="max-w-full max-h-[80vh] object-contain shadow-2xl"
            />
          </div>

          {/* Next */}
          <button
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
            onClick={e => { e.stopPropagation(); setLightbox(l => l !== null ? (l + 1) % GALLERY.length : null); }}
          >
            <ChevronRight size={20} />
          </button>

          {/* Counter */}
          <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/40 text-xs">
            {lightbox + 1} / {GALLERY.length}
          </p>
        </div>
      )}

      <MarketingFooter />
    </div>
  );
}
