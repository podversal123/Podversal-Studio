"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/marketing/Navbar";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import api from "@/lib/api";
import { Calendar } from "lucide-react";
import { useRefetchOnFocus } from "@/lib/use-refetch-on-focus";
import { useFadeIn, anim } from "@/lib/use-fade-in";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
  category: string;
  tags: string[];
  publishedAt: string | null;
  author: { name: string };
}

export default function BlogListClient({ initialPosts }: { initialPosts: BlogPost[] }) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [category, setCategory] = useState<string>("All");

  const heroAnim = useFadeIn(0.05);
  const gridAnim = useFadeIn();

  const fetchPosts = () => {
    api
      .get<BlogPost[]>("/blogs/public")
      .then((r) => setPosts(r.data))
      .catch(() => {});
  };

  useRefetchOnFocus(fetchPosts);

  const categories = [
    "All",
    ...Array.from(new Set(posts.map((p) => p.category))),
  ];
  const filtered =
    category === "All" ? posts : posts.filter((p) => p.category === category);

  return (
    <div className="min-h-screen bg-white dark:bg-[#111111]">
      <Navbar />

      {/* ── Hero ── */}
      <section className="pt-[80px] bg-white dark:bg-[#111111]">
        <div className="site-wrap pt-6 sm:pt-9 lg:pt-12 pb-4">
          <div ref={heroAnim.ref} style={anim(heroAnim.visible)}>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white leading-tight">
              Blog
            </h1>
          </div>
        </div>
      </section>

      {/* ── Posts ── */}
      <section className="pt-6 sm:pt-8 lg:pt-10 pb-10 sm:pb-14 lg:pb-20 bg-white dark:bg-[#111111]">
        <div className="site-wrap">
          <div ref={gridAnim.ref}>
            {/* Category filter */}
            {categories.length > 1 && (
              <div
                className="flex flex-wrap gap-2 mb-6 sm:mb-8 lg:mb-12"
                style={anim(gridAnim.visible)}
              >
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-4 py-1.5 text-sm font-bold transition-colors border ${
                      category === cat
                        ? "bg-[#E5312A] text-white border-[#E5312A]"
                        : "bg-transparent text-[#6b6b6b] dark:text-[#8a8a8a] border-[#e5e5e5] dark:border-[#2a2a2a] hover:border-[#E5312A] hover:text-[#E5312A]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {filtered.length === 0 ? (
              <div
                className="text-center py-20 border border-[#e5e5e5] dark:border-[#2a2a2a]"
                style={anim(gridAnim.visible, 0.1)}
              >
                <p className="text-gray-900 dark:text-white font-bold mb-2">
                  No posts published yet
                </p>
                <p className="text-[#6b6b6b] dark:text-[#8a8a8a] text-sm">
                  Check back soon, studio stories are on the way.
                </p>
              </div>
            ) : (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                style={anim(gridAnim.visible, 0.1)}
              >
                {filtered.map((post, i) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group flex flex-col overflow-hidden rounded-xl bg-white dark:bg-[#161616] border border-[#e8e8e8] dark:border-[#222] transition-all duration-300"
                    style={anim(gridAnim.visible, 0.12 + i * 0.06)}
                  >
                    {/* Cover */}
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

                      <h2 className="font-bold text-gray-900 dark:text-white text-base line-clamp-2 group-hover:text-[#E5312A] transition-colors leading-snug flex-1">
                        {post.title}
                      </h2>

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
            )}
          </div>
        </div>
      </section>

      {/* Footer CTA  matches theme */}
      <div className="border-t border-[#e5e5e5] dark:border-[#2a2a2a] bg-[#E5312A] py-10 sm:py-12 lg:py-14 px-4 text-center">
        <p className="text-[11px] font-black tracking-[0.2em] uppercase text-white/50 mb-4">
          Ready to record?
        </p>
        <h2 className="text-2xl font-black text-white mb-3">
          Book your studio session today
        </h2>
        <p className="text-white/70 text-sm mb-6">
          Professional studio. Seamless online booking. GST invoice included.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center bg-white text-[#E5312A] font-bold px-7 py-3 hover:bg-white/90 transition-colors text-sm"
        >
          Book Now
        </Link>
      </div>

      <MarketingFooter />
    </div>
  );
}
