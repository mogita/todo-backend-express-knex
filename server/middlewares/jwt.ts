import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { userJWTSchema } from '../schemas/user.schema'

export const verifyAuth =
  (roles: string[] = []) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const token = req.headers['authorization']
    if (!token) {
      res.status(401).send('Unauthorized')
      return
    }

    const parts = token.split(' ')
    if (parts.length !== 2) {
      res.status(401).send('Unauthorized')
      return
    }

    jwt.verify(parts[1], process.env.JWT_SECRET as string, (err, decoded) => {
      if (err) {
        res.status(401).send('Unauthorized')
        return
      }

      const user = decoded as z.infer<typeof userJWTSchema>

      // put user to the request context
      res.locals.user = user

      if (roles.length && !roles.includes(user.role)) {
        res.status(403).send('Forbidden')
        return
      }

      next()
    })
  }
