import { Database } from '@/types/database';

type AdminProfile = Database['public']['Tables']['admins']['Row'];

/**
 * Type guard to check if value is an object
 */
const isObject = (value: unknown): value is Record<string, any> => {
  return typeof value === 'object' && value !== null;
};

/**
 * Validate role safely
 */
const isValidRole = (role: any): role is AdminProfile['role'] => {
  const allowedRoles: AdminProfile['role'][] = ['super_admin', 'admin', 'moderator']; // adjust to your enum
  return allowedRoles.includes(role);
};

/**
 * Normalize single admin profile
 */
export const castToAdminProfile = (data: unknown): AdminProfile => {
  if (!isObject(data)) {
    throw new Error('Invalid admin profile: not an object');
  }

  return {
    id: data.id ?? '',
    email: data.email ?? '',
    name: data.name ?? null,
    created_at: data.created_at ?? new Date().toISOString(),
    
    // Safe role casting with fallback
    role: isValidRole(data.role) ? data.role : 'admin',

    // Spread remaining fields (optional)
    ...data,
  };
};

/**
 * Normalize multiple admin profiles safely
 */
export const castToAdminProfiles = (data: unknown): AdminProfile[] => {
  if (!Array.isArray(data)) {
    console.warn('Expected array for admin profiles, received:', data);
    return [];
  }

  return data
    .filter(isObject)
    .map((item, index) => {
      try {
        return castToAdminProfile(item);
      } catch (error) {
        console.error(`Error parsing admin at index ${index}:`, error);
        return null;
      }
    })
    .filter((item): item is AdminProfile => item !== null);
};

/**
 * Optional: Strict version (throws instead of failing silently)
 */
export const castToAdminProfilesStrict = (data: unknown): AdminProfile[] => {
  if (!Array.isArray(data)) {
    throw new Error('Invalid admin profiles: expected an array');
  }

  return data.map(castToAdminProfile);
};

/**
 * Optional: Partial update caster (useful for PATCH requests)
 */
export const castToPartialAdminProfile = (
  data: unknown
): Partial<AdminProfile> => {
  if (!isObject(data)) return {};

  return {
    ...(data.id && { id: data.id }),
    ...(data.email && { email: data.email }),
    ...(data.name && { name: data.name }),
    ...(data.created_at && { created_at: data.created_at }),
    ...(isValidRole(data.role) && { role: data.role }),
  };
};
