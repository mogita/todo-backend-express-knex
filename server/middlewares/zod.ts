import { NextFunction, Request, Response } from 'express'
import { z, ZodError } from 'zod'

export const validateBody =
  (schema: z.ZodObject<any, any>) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      schema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: 'Validation error',
          errors: error.errors.map((err) => `${err.message?.toLowerCase()}: ${err.path.join('.')}`),
        })
        return
      } else {
        res.status(500).json({
          message: 'Internal server error',
          error: error,
        })
        return
      }
    }
  }
