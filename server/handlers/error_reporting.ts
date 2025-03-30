import type { Request, Response, NextFunction } from 'express'

export function addErrorReporting(
  func: (req: Request, res: Response, next: NextFunction) => Promise<void> | void,
  message: string,
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      return await func(req, res, next)
    } catch (err) {
      console.log(`${message} caused by: ${err}`)
      // Not always 500, but for simplicity's sake.
      res.status(500).send(`Opps! ${message}.`)
    }
  }
}
