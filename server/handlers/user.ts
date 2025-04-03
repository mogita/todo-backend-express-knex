import type { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import userQueries, { User } from '../database/user-queries.ts'
import { addErrorReporting } from './error-reporting.ts'

function buildUserObj(data: User) {
  return {
    id: data.id,
    username: data.username,
    email: data.email,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

async function getAllUsers(_: Request, res: Response): Promise<void> {
  const allEntries = await userQueries.all()
  res.send(allEntries.map(buildUserObj))
}

async function getUser(req: Request, res: Response): Promise<void> {
  const result = await userQueries.get(Number(req.params.project_id))
  if (!result) {
    res.status(404).send('Project not found')
    return
  }
  res.send(buildUserObj(result))
}

async function postUser(req: Request, res: Response): Promise<void> {
  const { username, email, password } = req.body

  const existingEmail = await userQueries.findByEmail(email)
  if (existingEmail) {
    res.status(409).send('Email already in use')
    return
  }

  const existingUsername = await userQueries.findByUsername(username)
  if (existingUsername) {
    res.status(409).send('Username already in use')
    return
  }

  const hashedPassword = bcrypt.hashSync(password, 10)
  const created = await userQueries.create(username, email, hashedPassword)
  if (!created) {
    res.status(400).send('Could not create user')
    return
  }

  res.send(buildUserObj(created))
}

async function loginUser(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body

  // by design we check the username as email and username
  let result = await userQueries.findByEmail(username)
  if (!result) {
    result = await userQueries.findByUsername(username)
    if (!result) {
      res.status(401).send('Invalid username or password')
      return
    }
  }

  if (!bcrypt.compareSync(password, result.password)) {
    res.status(401).send('Invalid username or password')
    return
  }

  res.send(buildUserObj(result))
}

async function patchUser(req: Request, res: Response): Promise<void> {
  const patched = await userQueries.update(Number(req.params.project_id), req.body)
  if (!patched) {
    res.status(404).send('Project not found')
    return
  }
  res.send(buildUserObj(patched))
}

export default {
  getAllUsers: addErrorReporting(getAllUsers, 'Could not fetch all users'),
  getUser: addErrorReporting(getUser, 'Could not fetch user'),
  postUser: addErrorReporting(postUser, 'Could not post user'),
  loginUser: addErrorReporting(loginUser, 'Could not login user'),
  patchUser: addErrorReporting(patchUser, 'Could not patch user'),
}
