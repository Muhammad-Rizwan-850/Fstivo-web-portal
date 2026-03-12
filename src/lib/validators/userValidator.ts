import { z } from 'zod';

/**
 * User Registration Validation Schema
 */
export const userRegistrationSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().regex(/^(?:\+92|0)?3\d{9}$/, 'Invalid Pakistani phone number').optional(),
  university_id: z.string().uuid('Invalid university ID').optional(),
});

/**
 * User Login Validation Schema
 */
export const userLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * User Profile Update Validation Schema
 */
export const userProfileUpdateSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  phone: z.string().regex(/^(?:\+92|0)?3\d{9}$/, 'Invalid Pakistani phone number').optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  avatar_url: z.string().url('Invalid URL').optional(),
  university_id: z.string().uuid('Invalid university ID').optional(),
});

// Type exports
export type UserRegistration = z.infer<typeof userRegistrationSchema>;
export type UserLogin = z.infer<typeof userLoginSchema>;
export type UserProfileUpdate = z.infer<typeof userProfileUpdateSchema>;

// Additional validation schemas for general user operations
export const userValidationSchema = z.object({
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['attendee', 'organizer', 'admin']),
  phone: z.string().optional(),
  avatar_url: z.string().url().optional(),
  bio: z.string().max(500).optional(),
});

export const userUpdateSchema = userValidationSchema.partial();

export type UserValidation = z.infer<typeof userValidationSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;

/**
 * Validate user registration data
 */
export function validateUserRegistration(data: unknown): {
  success: boolean;
  data?: UserRegistration;
  errors?: z.ZodError;
} {
  const result = userRegistrationSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Validate user login data
 */
export function validateUserLogin(data: unknown): {
  success: boolean;
  data?: UserLogin;
  errors?: z.ZodError;
} {
  const result = userLoginSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Validate user profile update data
 */
export function validateUserProfileUpdate(data: unknown): {
  success: boolean;
  data?: UserProfileUpdate;
  errors?: z.ZodError;
} {
  const result = userProfileUpdateSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}
