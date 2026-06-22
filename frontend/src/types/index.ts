export type Role =
  | 'SUPER_ADMIN'
  | 'STUDIO_MANAGER'
  | 'EMPLOYEE'
  | 'REFERRAL_AGENT'
  | 'CUSTOMER';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  profileId: string | null;
  phone?: string;
  avatarUrl?: string;
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}
