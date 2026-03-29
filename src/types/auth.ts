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
export const rolePermissions: Record<UserRole, string[]> = {
  super_admin: ['*'],
  social_admin: ['social', 'orders', 'inventory', 'analytics'],
  esports_admin: ['esports', 'tournaments', 'analytics'],
  tech_admin: ['tech', 'development', 'analytics'],
  content_admin: ['content', 'media', 'analytics'],
  hr_admin: ['employees', 'internships', 'certificates', 'careers', 'holidays', 'analytics']
};

export const roleNames: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  social_admin: 'Social Admin',
  esports_admin: 'eSports Admin',
  tech_admin: 'Tech Admin',
  content_admin: 'Content Admin',
  hr_admin: 'HR Admin'
};
