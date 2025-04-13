import { z } from 'zod'

export const orgSchema = z.object({
  name: z.string().min(1).max(255),
})
