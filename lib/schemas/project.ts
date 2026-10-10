import { z } from 'zod';

export const projectPatchSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  slug: z.string().min(1).max(200).optional(),
  description: z.string().max(10000).optional().nullable(),
  updated_at: z.string().optional(),
}).strict();

export type ProjectPatchInput = z.infer<typeof projectPatchSchema>;
