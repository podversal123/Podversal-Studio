import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://www.podversal.com';
  const now  = new Date();

  return [
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
}
