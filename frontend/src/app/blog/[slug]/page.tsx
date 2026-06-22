'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/marketing/Navbar';
import api from '@/lib/api';
import { Calendar, Tag, ArrowLeft, ArrowRight, User } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  category: string;
  tags: string[];
  publishedAt: string | null;
  author: { name: string };
}

export default function BlogPostPage() {
  const params   = useParams();
  const router   = useRouter();
  const [post,    setPost]    = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  const slug = (params?.slug ?? '') as string;

  useEffect(() => {
    if (!slug) return;
    api.get<BlogPost>(`/blogs/public/${slug}`)
      .then(r => setPost(r.data))
      .catch(() => router.replace('/blog'))
      .finally(() => setLoading(false));
  }, [slug, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 pt-36 pb-20 space-y-4 animate-pulse">
          <div className="h-8 bg-gray-100 dark:bg-[#1a1a1a] rounded w-3/4" />
          <div className="h-4 bg-gray-100 dark:bg-[#1a1a1a] rounded w-1/2" />
          <div className="h-64 bg-gray-100 dark:bg-[#1a1a1a] rounded-2xl" />
          <div className="space-y-2">
            {[1,2,3,4].map(i => <div key={i} className="h-4 bg-gray-100 dark:bg-[#1a1a1a] rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 pt-32 pb-20">
        {/* Back */}
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-[#a0a0a0] hover:text-gray-900 dark:hover:text-white mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to Blog
        </Link>

        {/* Category */}
        <span className="inline-block text-xs font-semibold text-[#E5312A] bg-[#E5312A]/10 dark:bg-[#E5312A]/20 px-3 py-1 rounded-full mb-4">
          {post.category}
        </span>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white leading-tight mb-4">{post.title}</h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-[#a0a0a0] mb-8">
          <span className="flex items-center gap-1.5">
            <User size={14} /> {post.author?.name}
          </span>
          {post.publishedAt && (
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              {new Date(post.publishedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          )}
        </div>

        {/* Cover image */}
        {post.coverImage && (
          <div className="aspect-[16/9] overflow-hidden rounded-2xl mb-10">
            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Content */}
        <div className="overflow-x-auto">
          <div
            className="prose prose-gray dark:prose-invert max-w-none text-gray-700 dark:text-[#c0c0c0] leading-relaxed"
            style={{ lineHeight: 1.8 }}
            dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }}
          />
        </div>

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 pt-8 border-t border-gray-100 dark:border-[#3a3a3a]">
            {post.tags.map(tag => (
              <span key={tag} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-[#a0a0a0] bg-gray-50 dark:bg-[#1a1a1a] px-3 py-1.5 rounded-full border border-gray-100 dark:border-[#3a3a3a]">
                <Tag size={12} /> {tag}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-14 p-8 bg-[#E5312A]/8 dark:bg-[#E5312A]/15 rounded-2xl text-center border border-[#E5312A]/20 dark:border-[#E5312A]/25">
          <h3 className="font-bold text-gray-900 dark:text-white text-xl mb-2">Ready to book the studio?</h3>
          <p className="text-gray-500 dark:text-[#a0a0a0] text-sm mb-5">Professional podcast, video, and shoot sessions available online.</p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-[#E5312A] text-white font-semibold px-7 py-3 rounded-xl hover:bg-[#b51d1d] transition-all">
            Book Now <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
