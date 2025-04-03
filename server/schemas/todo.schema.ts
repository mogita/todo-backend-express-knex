import { z } from 'zod'

export const todoSchema = z.object({
  id: z.number(),
  title: z.string().min(1).max(500),
  order: z.number().int().min(0),
  completed: z.boolean(),
  projectId: z.number().int().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
