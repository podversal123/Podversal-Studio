import { AuthUser, Role } from '@/types';

function cleanName(name: string | undefined): string {
  if (!name) return '';
  // Strip stray "undefined" tokens left by missing Google familyName
  return name.replace(/\bundefined\b/gi, '').replace(/\s+/g, ' ').trim();
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const user = JSON.parse(raw) as AuthUser;
    if (user?.name) user.name = cleanName(user.name) || user.email?.split('@')[0] || 'User';
    return user;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

export function isAuthenticated(): boolean {
  return !!getAccessToken() && !!getStoredUser();
}

export function logout(): void {
  const raw  = localStorage.getItem('user');
  const role = raw ? (JSON.parse(raw)?.role ?? '') : '';

  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');

  // Signal login pages to block back-navigation so the user can't step through
  // stale dashboard history after signing out.
  sessionStorage.setItem('podversal_just_logged_out', '1');

  // Use replace() so the logout action itself doesn't add a history entry —
  // pressing back from the login page won't return to the page where logout was clicked.
  if (role === 'SUPER_ADMIN')                                    window.location.replace('/admin/login');
  else if (role === 'REFERRAL_AGENT')                            window.location.replace('/agent/login');
  else if (role === 'STUDIO_MANAGER' || role === 'EMPLOYEE')     window.location.replace('/staff/login');
  else                                                           window.location.replace('/login');
}

// Role hierarchy — used to restrict page access
export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN:     'Super Admin',
  STUDIO_MANAGER:  'Studio Manager',
  EMPLOYEE:        'Employee',
  REFERRAL_AGENT:  'Referral Agent',
  CUSTOMER:        'Customer',
};
