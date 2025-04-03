import { z } from 'zod'

export const orgMemberUpdateSchema = z.object({
  role: z.enum(['admin', 'member']),
})
