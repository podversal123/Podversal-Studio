'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/marketing/Navbar';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import api from '@/lib/api';
import { Play, X } from 'lucide-react';
import VideoThumbnail from '@/components/VideoThumbnail';
import CldVideoThumb from '@/components/CldVideoThumb';
import { useRefetchOnFocus } from '@/lib/use-refetch-on-focus';
import { useFadeIn, anim } from '@/lib/use-fade-in';
import { FEATURED_VIDEOS, type FeaturedVideo as StudioVideo } from '@/lib/featured-videos';

function cloudinaryThumb(url: string): string {
  const transformed = url.replace('/video/upload/', '/video/upload/so_1,w_1280,h_720,c_fill,q_100/');
  return /\.(mp4|mov|avi|webm|mkv|flv|wmv)$/i.test(transformed)
    ? transformed.replace(/\.(mp4|mov|avi|webm|mkv|flv|wmv)$/i, '.jpg')
    : transformed + '.jpg';
}

const PAGE_SIZE = 9;

export default function VideosPage() {
  const [apiVideos, setApiVideos] = useState<StudioVideo[]>([]);
  const [category,  setCategory]  = useState<string>('All');
  const [visible,   setVisible]   = useState(PAGE_SIZE);
  const [playing,   setPlaying]   = useState<string | null>(null);

  const heroAnim = useFadeIn(0.05);
  const gridAnim = useFadeIn();

  const fetchVideos = () => {
    api.get<StudioVideo[]>('/studio-videos/public')
      .then(r => setApiVideos(r.data))
      .catch(() => {});
  };

  useEffect(() => { fetchVideos(); }, []);
  useRefetchOnFocus(fetchVideos);

  const allVideos  = [...FEATURED_VIDEOS, ...apiVideos];
  const categories = ['All', ...Array.from(new Set(allVideos.map(v => v.category)))];
  const filtered   = category === 'All' ? allVideos : allVideos.filter(v => v.category === category);
  const shown      = filtered.slice(0, visible);

  const getThumbnail = (v: StudioVideo) => {
    if (v.cloudinaryUrl)  return cloudinaryThumb(v.cloudinaryUrl);
    if (v.thumbnailUrl)   return v.thumbnailUrl;
    if (v.youtubeId)      return `https://img.youtube.com/vi/${v.youtubeId}/maxresdefault.jpg`;
    return null;
  };

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setVisible(PAGE_SIZE);
    setPlaying(null);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#111111]">
      <Navbar />

      {/* Banner */}
      <section className="pt-20 bg-white dark:bg-[#111111] border-b border-[#e5e5e5] dark:border-[#2a2a2a]">
        <div className="site-wrap py-16">
          <div ref={heroAnim.ref} style={anim(heroAnim.visible)}>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white">
              Studio Videos
            </h1>
          </div>
        </div>
      </section>

      <div className="site-wrap py-16">
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
            <p className="text-gray-900 dark:text-white font-bold mb-2">No videos in this category</p>
          </div>
        ) : (
          <>
            <div ref={gridAnim.ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-l border-t border-[#e5e5e5] dark:border-[#2a2a2a]" style={anim(gridAnim.visible)}>
              {shown.map(video => {
                const thumb = getThumbnail(video);
                const isPlaying = playing === video.id;
                const canPlay   = !!(video.videoUrl || video.youtubeId || video.cloudinaryUrl);

                return (
                  <div key={video.id} className="border-b border-r border-[#e5e5e5] dark:border-[#2a2a2a] overflow-hidden bg-white dark:bg-[#111111]">
                    {isPlaying ? (
                      <div className="relative aspect-[16/9] bg-black">
                        {video.videoUrl ? (
                          // eslint-disable-next-line jsx-a11y/media-has-caption
                          <video src={video.videoUrl} controls autoPlay className="w-full h-full" />
                        ) : video.cloudinaryUrl ? (
                          // eslint-disable-next-line jsx-a11y/media-has-caption
                          <video src={video.cloudinaryUrl} controls autoPlay className="w-full h-full" />
                        ) : video.youtubeId ? (
                          <iframe
                            src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen className="w-full h-full" title={video.title}
                          />
                        ) : null}
                        <button
                          onClick={() => setPlaying(null)}
                          className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-1 transition-colors z-10"
                          aria-label="Close video"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div
                        className={`relative aspect-[16/9] overflow-hidden bg-[#0a0a0a] dark:bg-[#0a0a0a] ${canPlay ? 'cursor-pointer' : ''} group`}
                        onClick={() => canPlay && setPlaying(video.id)}
                      >
                        {video.cloudinaryUrl ? (
                          <CldVideoThumb src={video.cloudinaryUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : thumb ? (
                          <img src={thumb} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                        ) : video.videoUrl ? (
                          <VideoThumbnail src={video.videoUrl} className="w-full h-full object-cover" />
                        ) : null}
                        {canPlay && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
                            <div className="w-14 h-14 bg-white flex items-center justify-center shadow-lg transition-all group-hover:scale-110">
                              <Play size={20} className="text-[#E5312A] ml-1" fill="#E5312A" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-5">
                      <span className="text-[10px] font-black tracking-[0.15em] uppercase text-[#E5312A] block mb-2">{video.category}</span>
                      <h2 className="font-bold text-gray-900 dark:text-white text-base mb-1 line-clamp-2">{video.title}</h2>
                      {video.description && (
                        <p className="text-[#6b6b6b] dark:text-[#8a8a8a] text-sm leading-relaxed line-clamp-2">{video.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
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
        <h2 className="text-2xl font-black text-white mb-6">Book your studio session today</h2>
        <Link href="/register" className="inline-flex items-center bg-white text-[#E5312A] font-bold px-7 py-3 hover:bg-white/90 transition-colors text-sm">
          Book Now
        </Link>
      </div>

      <MarketingFooter />
    </div>
  );
}
