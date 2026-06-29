import { useEffect } from 'react';

/**
 * When arriving on a login page immediately after logout, intercept the browser
 * back button so the user stays on the login page instead of stepping through
 * all the stale dashboard history entries one by one.
 *
 * Only activates when the `podversal_just_logged_out` sessionStorage flag is
 * present (set by auth.ts → logout()). The flag is consumed on first mount so
 * subsequent visits to the login page behave normally.
 */
export function useBlockBackAfterLogout() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!sessionStorage.getItem('podversal_just_logged_out')) return;

    sessionStorage.removeItem('podversal_just_logged_out');

    // Push a duplicate entry so the very first back press stays on this page.
    window.history.pushState(null, '', window.location.href);

    const handlePop = () => {
      window.history.pushState(null, '', window.location.href);
    };

    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);
}
