'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/marketing/Navbar';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import api from '@/lib/api';
import { Calendar, Tag, ArrowRight } from 'lucide-react';
import { useRefetchOnFocus } from '@/lib/use-refetch-on-focus';

interface BlogPost {
  id: string; title: string; slug: string; excerpt: string;
  coverImage: string | null; category: string; tags: string[];
  publishedAt: string | null; author: { name: string };
}

export default function BlogPage() {
  const [posts,    setPosts]    = useState<BlogPost[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [category, setCategory] = useState<string>('All');

  const fetchPosts = () => {
    api.get<BlogPost[]>('/blogs/public').then(r => setPosts(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchPosts(); }, []);
  useRefetchOnFocus(fetchPosts);

  const categories = ['All', ...Array.from(new Set(posts.map(p => p.category)))];
  const filtered   = category === 'All' ? posts : posts.filter(p => p.category === category);

  return (
    <div className="min-h-screen bg-white dark:bg-[#111111]">
      <Navbar />

      {/* Banner — theme-aware, no dark gradient */}
      <section className="pt-20 bg-white dark:bg-[#111111] border-b border-[#e5e5e5] dark:border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <p className="section-label mb-4">Studio Blog</p>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white">
            Studio Blog
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
                onClick={() => setCategory(cat)}
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

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-l border-t border-[#e5e5e5] dark:border-[#2a2a2a]">
            {[1,2,3].map(i => (
              <div key={i} className="border-b border-r border-[#e5e5e5] dark:border-[#2a2a2a] h-64 bg-[#f5f5f5] dark:bg-[#181818] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border border-[#e5e5e5] dark:border-[#2a2a2a]">
            <p className="text-gray-900 dark:text-white font-bold mb-2">No posts published yet</p>
            <p className="text-[#6b6b6b] dark:text-[#8a8a8a] text-sm">Check back soon — studio stories are on the way.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-l border-t border-[#e5e5e5] dark:border-[#2a2a2a]">
            {filtered.map(post => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group border-b border-r border-[#e5e5e5] dark:border-[#2a2a2a] overflow-hidden bg-white dark:bg-[#111111] hover:bg-[#fafafa] dark:hover:bg-[#161616] transition-colors"
              >
                {/* Cover */}
                <div className="aspect-[16/9] overflow-hidden bg-[#f5f5f5] dark:bg-[#181818]">
                  {post.coverImage ? (
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#f5f5f5] dark:bg-[#181818] flex items-center justify-center">
                      <span className="text-5xl font-black text-[#e5e5e5] dark:text-[#2a2a2a]">{post.title.charAt(0)}</span>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[10px] font-black tracking-[0.15em] uppercase text-[#E5312A]">
                      {post.category}
                    </span>
                    {post.publishedAt && (
                      <span className="flex items-center gap-1 text-xs text-[#aaa] dark:text-[#555]">
                        <Calendar size={10} />
                        {new Date(post.publishedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>

                  <h2 className="font-bold text-gray-900 dark:text-white text-base mb-2 line-clamp-2 group-hover:text-[#E5312A] transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-[#6b6b6b] dark:text-[#8a8a8a] text-sm leading-relaxed line-clamp-3 mb-4">{post.excerpt}</p>

                  <div className="flex items-center justify-between border-t border-[#f5f5f5] dark:border-[#2a2a2a] pt-3">
                    <span className="text-xs text-[#aaa] dark:text-[#555]">By {post.author?.name}</span>
                    <span className="flex items-center gap-1 text-xs font-bold text-[#E5312A]">
                      Read <ArrowRight size={11} />
                    </span>
                  </div>

                  {post.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {post.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="flex items-center gap-1 text-xs text-[#aaa] dark:text-[#555]">
                          <Tag size={9} /> {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer CTA — matches theme */}
      <div className="border-t border-[#e5e5e5] dark:border-[#2a2a2a] bg-[#E5312A] py-14 px-4 text-center">
        <p className="text-[11px] font-black tracking-[0.2em] uppercase text-white/50 mb-4">Ready to record?</p>
        <h2 className="text-2xl font-black text-white mb-3">Book your studio session today</h2>
        <p className="text-white/70 text-sm mb-6">Professional studio. Seamless online booking. GST invoice included.</p>
        <Link href="/register" className="inline-flex items-center gap-2 bg-white text-[#E5312A] font-bold px-7 py-3 hover:bg-white/90 transition-colors text-sm">
          Book Now <ArrowRight size={15} />
        </Link>
      </div>

      <MarketingFooter />
    </div>
  );
}
