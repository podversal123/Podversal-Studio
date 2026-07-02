import type { Metadata } from "next";
import BlogListClient from "./BlogListClient";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Studio stories, tips, and behind-the-scenes from Podversal Studio  Greater Noida's professional podcast and video production studio.",
};

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

async function getPosts(): Promise<BlogPost[]> {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
  try {
    const res = await fetch(`${base}/blogs/public`, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getPosts();
  return <BlogListClient initialPosts={posts} />;
}
