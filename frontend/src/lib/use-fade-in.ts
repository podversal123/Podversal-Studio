import { useRef, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';

export function useFadeIn(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
        } else if (e.boundingClientRect.top > (e.rootBounds?.height ?? 0)) {
          setVisible(false);
        }
      },
      { threshold },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

export const anim = (visible: boolean, delay = 0): CSSProperties => ({
  opacity:    visible ? 1 : 0,
  transform:  visible ? 'translateY(0)' : 'translateY(24px)',
  transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
});
