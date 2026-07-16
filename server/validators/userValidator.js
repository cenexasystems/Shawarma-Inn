import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().optional().transform(s => s ? s.trim() : ''),
  phone: z.string().optional().transform(s => s ? s.trim() : ''),
  avatar_url: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
  status: z.string().optional().transform(s => s ? s.trim() : ''),
});
