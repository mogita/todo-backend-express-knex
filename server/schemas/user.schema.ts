import { z } from 'zod'

export const userRegisterSchema = z.object({
  username: z.string().min(1).max(255),
  email: z.string().email(),
  password: z.string().min(8),
})

export const userLoginSchema = z.object({
  username: z.string(),
  password: z.string(),
})
