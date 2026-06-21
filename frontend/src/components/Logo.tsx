'use client';

import { useTheme } from './ThemeProvider';

interface Props {
  height?: number;
  className?: string;
}

export default function Logo({ height = 44, className = '' }: Props) {
  const { theme } = useTheme();
  const imgH = height * 2;
  const top  = -Math.round(height / 2);
  const src  = theme === 'dark' ? '/logo-dark.png' : '/logo-light.png';

  return (
    <div
      className={`flex-shrink-0 select-none overflow-hidden ${className}`}
      style={{ height }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Podversal Studio"
        style={{ height: imgH, width: 'auto', marginTop: top, display: 'block' }}
        draggable={false}
      />
    </div>
  );
}
