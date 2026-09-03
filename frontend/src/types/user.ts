
export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string | null;
  last_name: string | null;
  status: 'active' | 'inactive';
  email_verified_at: Date | null;
  last_login_at: Date | null;
  avatar_url: string | null;
  timezone: string;
  preferences: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  is_active: boolean;
}