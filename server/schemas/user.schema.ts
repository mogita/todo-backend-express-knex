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

export const userJWTSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  role: z.string(),
  org_id: z.number(),
  org_name: z.string(),
  iat: z.number(),
  exp: z.number(),
})
