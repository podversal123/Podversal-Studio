'use client';

import { useRef, useEffect } from 'react';

interface Props {
  src: string;
  className?: string;
}

export default function VideoThumbnail({ src, className }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const onMetadata = () => { video.currentTime = 1.5; };
    video.addEventListener('loadedmetadata', onMetadata);
    return () => video.removeEventListener('loadedmetadata', onMetadata);
  }, [src]);

  return (
    <video
      ref={ref}
      src={src}
      className={className}
      preload="metadata"
      muted
      playsInline
    />
  );
}
