import { z } from 'zod';

export const menuItemSchema = z.object({
  name: z.string().min(1, 'Name is required').transform(s => s.trim()),
  price: z.number().min(0, 'Price must be a valid positive number'),
  category: z.string().min(1, 'Category is required').transform(s => s.trim()),
  image_url: z.string().optional().nullable().transform(s => s ? s.trim() : null),
  is_bestseller: z.boolean().optional().default(false),
  is_active: z.boolean().optional().default(true),
}).superRefine((data, ctx) => {
  if (data.image_url && !/^(https?:\/\/)|\//i.test(data.image_url)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Image URL must be a valid HTTP/HTTPS URL or absolute path starting with /.',
      path: ['image_url']
    });
  }
});

export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').transform(s => s.trim()),
  display_order: z.number().optional().default(0),
  is_active: z.boolean().optional().default(true),
});
