import { z } from 'zod';

export const blogPostPatchSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  slug: z.string().min(1).max(200).optional(),
  status: z.enum(['draft', 'published', 'scheduled', 'archived']).optional(),
  excerpt: z.string().max(2000).optional().nullable(),
  content: z.string().optional().nullable(),
  published_at: z.string().datetime().optional().nullable(),
  updated_at: z.string().optional(),
}).strict();

export type BlogPostPatchInput = z.infer<typeof blogPostPatchSchema>;
