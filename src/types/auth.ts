export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  lastLogin?: Date;
  isActive: boolean;
}

export type UserRole = 
  | 'super_admin'
  | 'social_admin'
  | 'esports_admin'
  | 'tech_admin'
  | 'content_admin'
  | 'hr_admin';

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}
