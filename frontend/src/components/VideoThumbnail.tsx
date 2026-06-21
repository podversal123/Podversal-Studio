'use client';
import { useEffect, useRef } from 'react';

interface Props {
  src: string;
  className?: string;
}

export default function VideoThumbnail({ src, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const video = document.createElement('video');
    video.muted = true;
    video.preload = 'metadata';
    video.playsInline = true;
    video.src = src;

    const onMeta = () => {
      video.currentTime = Math.min(2, video.duration * 0.1);
    };

    const onSeeked = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width  = video.videoWidth  || 640;
      canvas.height = video.videoHeight || 360;
      canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
      video.src = '';
    };

    video.addEventListener('loadedmetadata', onMeta);
    video.addEventListener('seeked', onSeeked);

    return () => {
      video.removeEventListener('loadedmetadata', onMeta);
      video.removeEventListener('seeked', onSeeked);
      video.src = '';
    };
  }, [src]);

  return <canvas ref={canvasRef} className={className} />;
}
