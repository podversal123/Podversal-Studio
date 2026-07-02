import type { MetadataRoute } from 'next';

interface PublicBlogPost {
  slug: string;
  publishedAt: string | null;
}

async function getBlogPosts(): Promise<PublicBlogPost[]> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  try {
    const res = await fetch(`${apiBase}/blogs/public`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://www.podversal.com';
  const now  = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base,                                   lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/pricing`,                      lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/our-work`,                     lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${base}/blog`,                         lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${base}/about`,                        lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/contact`,                      lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/services/podcast-studio`,      lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/services/vfx-podcast`,         lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/services/monologue-shoot`,     lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/services/news-shoot`,          lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/services/become-a-podcaster`,  lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/services/product-shoots`,      lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ];

  const posts = await getBlogPosts();
  const blogRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: post.publishedAt ? new Date(post.publishedAt) : now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...blogRoutes];
}
