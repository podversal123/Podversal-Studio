'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/marketing/Navbar';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import api from '@/lib/api';
import { Calendar, User } from 'lucide-react';

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
        <div className="px-4 sm:px-10 lg:px-20 xl:px-32 pt-36 pb-20 space-y-4 animate-pulse">
          <div className="h-8 bg-gray-100 dark:bg-[#1a1a1a] rounded w-3/4" />
          <div className="h-4 bg-gray-100 dark:bg-[#1a1a1a] rounded w-1/2" />
          <div className="h-[480px] bg-gray-100 dark:bg-[#1a1a1a]" />
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

      {/* Cover image — true full bleed below navbar */}
      {post.coverImage && (
        <div className="pt-[72px]">
          <div className="w-full aspect-[21/9] sm:aspect-[3/1] overflow-hidden">
            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* Content wrapper */}
      <div className="px-4 sm:px-10 lg:px-20 xl:px-32 pt-6 sm:pt-8 lg:pt-10 pb-14 sm:pb-20 lg:pb-24">
        {/* Back */}
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-[#a0a0a0] hover:text-gray-900 dark:hover:text-white mb-5 sm:mb-6 lg:mb-8 transition-colors">
          Back to Blog
        </Link>

        {/* Category + Meta */}
        <div className="flex flex-wrap items-center gap-4 mb-5">
          <span className="text-[10px] font-black tracking-[0.15em] uppercase text-[#E5312A] bg-[#E5312A]/8 dark:bg-[#E5312A]/15 px-3 py-1">
            {post.category}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-[#a0a0a0]">
            <User size={13} /> {post.author?.name}
          </span>
          {post.publishedAt && (
            <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-[#a0a0a0]">
              <Calendar size={13} />
              {new Date(post.publishedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-6 sm:mb-8 lg:mb-10">{post.title}</h1>

        {/* Content */}
        <div
          className="prose prose-gray dark:prose-invert max-w-none
            prose-p:text-base prose-p:leading-[1.8] prose-p:my-3
            prose-strong:font-semibold prose-strong:text-gray-900 dark:prose-strong:text-white
            prose-em:text-gray-600 dark:prose-em:text-[#aaa]
            [&_h2]:text-2xl [&_h2]:font-black [&_h2]:mt-10 [&_h2]:mb-3
            [&_h2]:text-gray-900 dark:[&_h2]:text-white [&_h2]:tracking-tight [&_h2]:border-l-4
            [&_h2]:border-[#E5312A] [&_h2]:pl-4
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4
            [&_li]:text-base [&_li]:leading-[1.7] [&_li]:my-1.5
            [&_li::marker]:text-[#E5312A]
            text-gray-700 dark:text-[#c0c0c0]"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>

      <MarketingFooter />
    </div>
  );
}
