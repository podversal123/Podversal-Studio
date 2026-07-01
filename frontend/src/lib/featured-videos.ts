export interface FeaturedVideo {
  id: string; title: string; description: string | null;
  youtubeId: string | null; cloudinaryUrl: string | null;
  thumbnailUrl: string | null; videoUrl?: string | null; category: string;
}

// Hardcoded showcase videos shown alongside CMS-managed ones on the home,
// our-work, and videos pages — single source so all three stay in sync.
export const FEATURED_VIDEOS: FeaturedVideo[] = [
  { id: 'feat-mandala',     title: 'Mandala',     description: null, youtubeId: null, cloudinaryUrl: null, thumbnailUrl: '/videos/thumbs/mandala.jpg',     videoUrl: '/videos/mandala.mp4',     category: 'Podcast' },
  { id: 'feat-du',          title: 'DU',          description: null, youtubeId: null, cloudinaryUrl: null, thumbnailUrl: '/videos/thumbs/du.jpg',          videoUrl: '/videos/du.mp4',          category: 'Podcast' },
  { id: 'feat-agriculture', title: 'Agriculture', description: null, youtubeId: null, cloudinaryUrl: null, thumbnailUrl: '/videos/thumbs/agriculture.jpg', videoUrl: '/videos/agriculture.mp4', category: 'Shoot'   },
];
