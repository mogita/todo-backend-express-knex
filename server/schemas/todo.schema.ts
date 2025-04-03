import { z } from 'zod'

export const todoSchema = z.object({
  title: z.string().min(1).max(500),
  order: z.number().int().optional(),
  completed: z.boolean().default(false),
})
