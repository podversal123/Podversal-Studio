import { AuthUser, Role } from '@/types';

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
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
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

// Role hierarchy — used to restrict page access
export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN:     'Super Admin',
  STUDIO_MANAGER:  'Studio Manager',
  EMPLOYEE:        'Employee',
  REFERRAL_AGENT:  'Referral Agent',
  CUSTOMER:        'Customer',
};
