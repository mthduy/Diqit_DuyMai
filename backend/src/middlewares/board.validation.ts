import { z } from 'zod';

export const createBoardSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
  // owner is set server-side from the authenticated user; do not require client to send it
  owner: z.string().min(1, 'Owner is required').optional(),
  members: z.array(z.string()).optional(),
  // allow passing workspace id when creating a board
  workspace: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid workspace id').optional(),
});

export const updateBoardSchema = createBoardSchema.partial();
