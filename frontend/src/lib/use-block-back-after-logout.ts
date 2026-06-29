import { useEffect } from 'react';

/**
 * After logout, rewrites the tail of browser history so that pressing back
 * once from the login page always lands on '/' (landing page) — regardless
 * of how many dashboard pages the user visited before signing out.
 *
 * Mechanism:
 *   replaceState('/') — turns current '/login' entry into '/'
 *   pushState('/login') — adds '/login' on top
 *
 * Result: [...stale entries, '/', '/login'(current)]
 * One back press → '/'  ✓
 *
 * Only fires when auth.ts sets the 'podversal_just_logged_out' flag,
 * so normal visits to /login are unaffected.
 */
export function useBlockBackAfterLogout() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!sessionStorage.getItem('podversal_just_logged_out')) return;

    sessionStorage.removeItem('podversal_just_logged_out');

    window.history.replaceState(null, '', '/');
    window.history.pushState(null, '', '/login');
  }, []);
}
