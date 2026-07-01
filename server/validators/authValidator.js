import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('Invalid email address').transform(s => s.trim().toLowerCase()),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().optional().transform(s => s ? s.trim() : ''),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').transform(s => s.trim().toLowerCase()),
  password: z.string().min(1, 'Password is required'),
});
