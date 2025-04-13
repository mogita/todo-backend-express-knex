import type { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import jwt from 'jsonwebtoken'
import userQueries, { User } from '../database/user-queries.ts'
import orgQuries from '../database/org-queries.ts'
import orgmemberQueries from '../database/orgmember-queries.ts'
import { addErrorReporting } from './error-reporting.ts'
import { userJWTSchema } from '../schemas/user.schema.ts'

function buildUserObj(data: { user: User; orgId?: number; orgName?: string; role?: string }) {
  const token = jwt.sign(
    {
      id: data.user.id,
      username: data.user.username,
      email: data.user.email,
      role: data.role,
      org_id: data.orgId,
      org_name: data.orgName,
    },
    process.env.JWT_SECRET as string,
    {
      expiresIn: '24h',
    },
  )
  return {
    id: data.user.id,
    username: data.user.username,
    email: data.user.email,
    org_id: data.orgId,
    org_name: data.orgName,
    role: data.role,
    token,
    created_at: data.user.created_at,
    updated_at: data.user.updated_at,
  }
}

async function getAllUsers(_: Request, res: Response): Promise<void> {
  const allEntries = await userQueries.all()
  res.send(
    allEntries
      .map((o) => ({
        user: o,
      }))
      .map(buildUserObj),
  )
}

async function getUser(_: Request, res: Response): Promise<void> {
  const user = res.locals.user as z.infer<typeof userJWTSchema>
  if (!user) {
    res.status(401).send('Unauthorized')
    return
  }

  const result = await userQueries.get(user.id)
  if (!result) {
    res.status(404).send('User not found')
    return
  }
  res.send(buildUserObj({ user: result }))
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

  // create a default organization for the user
  const org = await orgQuries.create('Default Organization', created.id)
  if (!org) {
    res.status(400).send('Could not create default organization')
    return
  }

  // add the user to the Organization
  const orgMember = await orgmemberQueries.create(org.id, created.id, 'admin')
  if (!orgMember) {
    res.status(400).send('Could not add user to organization')
    return
  }

  res.send(buildUserObj({ user: created, orgId: org.id, orgName: org.name, role: orgMember.role }))
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

  // get org and membership
  const org = await orgQuries.findByOwnerId(result.id)
  if (!org) {
    res.status(404).send('Organization not found')
    return
  }

  const orgMember = await orgmemberQueries.findByOrgIdAndUserId(org.id, result.id)
  if (!orgMember) {
    res.status(404).send('Organization membership not found')
    return
  }

  res.send(buildUserObj({ user: result, orgId: org.id, orgName: org.name, role: orgMember.role }))
}

async function patchUser(req: Request, res: Response): Promise<void> {
  const patched = await userQueries.update(Number(req.params.project_id), req.body)
  if (!patched) {
    res.status(404).send('Project not found')
    return
  }
  res.send(buildUserObj({ user: patched }))
}

export default {
  getAllUsers: addErrorReporting(getAllUsers, 'Could not fetch all users'),
  getUser: addErrorReporting(getUser, 'Could not fetch user'),
  postUser: addErrorReporting(postUser, 'Could not post user'),
  loginUser: addErrorReporting(loginUser, 'Could not login user'),
  patchUser: addErrorReporting(patchUser, 'Could not patch user'),
}
