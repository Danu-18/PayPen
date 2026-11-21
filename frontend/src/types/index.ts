export type UserRole = 'user' | 'admin';

export interface Wallet {
  id: number;
  wallet_code: string;
  name: string;
  type: 'user' | 'system_clearing' | 'system_revenue' | 'biller';
  status: 'active' | 'frozen';
  balance: number; // minor units
  formatted_balance: string;
  currency: string;
  created_at?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  email_verified_at: string | null;
  is_email_verified: boolean;
  has_mpin: boolean;
  mpin_attempts: number;
  mpin_locked_until: string | null;
  is_active: boolean;
  wallet?: Wallet | null;
  created_at?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
  wallet: Wallet | null;
}

export interface ProfileResponse {
  user: User;
  wallet: Wallet | null;
}

export interface ApiErrorResponse {
  message?: string;
  code?: string;
  errors?: Record<string, string[]>;
}
