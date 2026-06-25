import { useEffect, useRef } from 'react';

// Refetch data whenever the user switches back to this tab or window
export function useRefetchOnFocus(refetch: () => void) {
  const fn = useRef(refetch);
  fn.current = refetch;

  useEffect(() => {
    const onFocus      = () => fn.current();
    const onVisibility = () => { if (!document.hidden) fn.current(); };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
}
