'use client';

import { useRef } from 'react';

interface Props {
  src: string;
  className?: string;
}

// Renders a crisp video frame at 1 second using the actual video.
// preload="metadata" loads only the header (few KB), then seeks to 1s.
// This is more reliable than Cloudinary thumbnail URL derivation.
export default function CldVideoThumb({ src, className }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video
      ref={ref}
      src={src}
      preload="metadata"
      muted
      playsInline
      onLoadedMetadata={() => {
        if (ref.current) ref.current.currentTime = 1;
      }}
      className={className}
    />
  );
}
