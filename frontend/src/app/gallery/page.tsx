'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/marketing/Navbar';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import api from '@/lib/api';
import { ArrowRight, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface GalleryImage {
  id: string;
  title: string | null;
  imageUrl: string;
  category: string;
  createdAt: string;
}

// Studio photos — always shown first in gallery
const FEATURED_IMAGES: GalleryImage[] = [
  { id: 'feat-1', title: null, imageUrl: '/studio/slide1.jpg', category: 'Studio', createdAt: '' },
  { id: 'feat-2', title: null, imageUrl: '/studio/slide2.jpg', category: 'Studio', createdAt: '' },
  { id: 'feat-3', title: null, imageUrl: '/studio/slide3.jpg', category: 'Studio', createdAt: '' },
  { id: 'feat-4', title: null, imageUrl: '/studio/slide4.jpg', category: 'Studio', createdAt: '' },
  { id: 'feat-5', title: null, imageUrl: '/studio/slide5.jpg', category: 'Studio', createdAt: '' },
];

const PAGE_SIZE = 16;

export default function GalleryPage() {
  const [apiImages, setApiImages] = useState<GalleryImage[]>([]);
  const [category,  setCategory]  = useState<string>('All');
  const [visible,   setVisible]   = useState(PAGE_SIZE);
  const [lightbox,  setLightbox]  = useState<number | null>(null);

  // Featured images render immediately; API images merge in when ready
  useEffect(() => {
    api.get<GalleryImage[]>('/gallery/public')
      .then(r => setApiImages(r.data))
      .catch(() => {});
  }, []);

  const allImages  = [...FEATURED_IMAGES, ...apiImages];
  const categories = ['All', ...Array.from(new Set(allImages.map(img => img.category)))];
  const filtered   = category === 'All' ? allImages : allImages.filter(img => img.category === category);
  const shown      = filtered.slice(0, visible);

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setVisible(PAGE_SIZE);
    setLightbox(null);
  };

  const openLightbox = (index: number) => setLightbox(index);
  const closeLightbox = () => setLightbox(null);

  const prevImage = useCallback(() => {
    if (lightbox === null) return;
    setLightbox(lightbox === 0 ? filtered.length - 1 : lightbox - 1);
  }, [lightbox, filtered.length]);

  const nextImage = useCallback(() => {
    if (lightbox === null) return;
    setLightbox(lightbox === filtered.length - 1 ? 0 : lightbox + 1);
  }, [lightbox, filtered.length]);

  useEffect(() => {
    if (lightbox === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape')     closeLightbox();
      if (e.key === 'ArrowLeft')  prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox, prevImage, nextImage]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (lightbox !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [lightbox]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#111111]">
      <Navbar />

      {/* Banner */}
      <section className="pt-[60px] bg-white dark:bg-[#111111] border-b border-[#e5e5e5] dark:border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <p className="section-label mb-4">Studio Gallery</p>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white">
            Studio Gallery
          </h1>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Category filter */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-10">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-4 py-1.5 text-sm font-bold transition-colors border ${
                  category === cat
                    ? 'bg-[#E5312A] text-white border-[#E5312A]'
                    : 'bg-transparent text-[#6b6b6b] dark:text-[#8a8a8a] border-[#e5e5e5] dark:border-[#2a2a2a] hover:border-[#E5312A] hover:text-[#E5312A]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {shown.length === 0 ? (
          <div className="text-center py-20 border border-[#e5e5e5] dark:border-[#2a2a2a]">
            <p className="text-gray-900 dark:text-white font-bold mb-2">No images in this category</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1">
              {shown.map((img, index) => (
                <div
                  key={img.id}
                  className="relative aspect-square overflow-hidden bg-[#f5f5f5] dark:bg-[#181818] cursor-pointer group"
                  onClick={() => openLightbox(index)}
                >
                  <img
                    src={img.imageUrl}
                    alt={img.title ?? 'Gallery image'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Title overlay on hover */}
                  {img.title && (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                      <div className="p-3 w-full">
                        <p className="text-white text-xs font-bold truncate">{img.title}</p>
                        <p className="text-white/60 text-[10px] uppercase tracking-wide">{img.category}</p>
                      </div>
                    </div>
                  )}
                  {!img.title && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                      <div className="p-3 w-full">
                        <p className="text-white/60 text-[10px] uppercase tracking-wide">{img.category}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* See More */}
            {visible < filtered.length && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={() => setVisible(v => v + PAGE_SIZE)}
                  className="px-8 py-3 border border-[#e5e5e5] dark:border-[#2a2a2a] text-sm font-bold text-[#6b6b6b] dark:text-[#8a8a8a] hover:border-[#E5312A] hover:text-[#E5312A] transition-colors"
                >
                  See More ({filtered.length - visible} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer CTA */}
      <div className="border-t border-[#e5e5e5] dark:border-[#2a2a2a] bg-[#E5312A] py-14 px-4 text-center">
        <h2 className="text-2xl font-black text-white mb-3">Book your studio session today</h2>
        <p className="text-white/70 text-sm mb-6">Professional studio. Seamless online booking. GST invoice included.</p>
        <Link href="/register" className="inline-flex items-center gap-2 bg-white text-[#E5312A] font-bold px-7 py-3 hover:bg-white/90 transition-colors text-sm">
          Book Now <ArrowRight size={15} />
        </Link>
      </div>

      <MarketingFooter />

      {/* Lightbox */}
      {lightbox !== null && filtered[lightbox] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 transition-colors z-10"
            aria-label="Close lightbox"
          >
            <X size={24} />
          </button>

          {/* Prev */}
          <button
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
            className="absolute left-4 text-white/70 hover:text-white p-2 transition-colors z-10"
            aria-label="Previous image"
          >
            <ChevronLeft size={32} />
          </button>

          {/* Image */}
          <div
            className="max-w-5xl max-h-[90vh] mx-12 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={filtered[lightbox].imageUrl}
              alt={filtered[lightbox].title ?? 'Gallery image'}
              className="max-w-full max-h-[80vh] object-contain"
            />
            {filtered[lightbox].title && (
              <p className="text-white font-bold mt-3 text-center">{filtered[lightbox].title}</p>
            )}
            <p className="text-white/50 text-xs uppercase tracking-widest mt-1">
              {filtered[lightbox].category} &nbsp;·&nbsp; {lightbox + 1} / {filtered.length}
            </p>
          </div>

          {/* Next */}
          <button
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
            className="absolute right-4 text-white/70 hover:text-white p-2 transition-colors z-10"
            aria-label="Next image"
          >
            <ChevronRight size={32} />
          </button>
        </div>
      )}
    </div>
  );
}
