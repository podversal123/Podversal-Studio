'use client';

interface Props {
  src: string;
  className?: string;
}

export default function VideoThumbnail({ src, className }: Props) {
  return (
    <video
      src={src}
      className={className}
      preload="auto"
      muted
      playsInline
      onLoadedData={(e) => { e.currentTarget.currentTime = 1.5; }}
    />
  );
}
