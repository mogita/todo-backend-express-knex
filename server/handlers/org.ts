import { z } from 'zod'
import orgs from '../database/org-queries.ts'
import orgMembers from '../database/orgmember-queries.ts'
import type { Request, Response } from 'express'
import { addErrorReporting } from './error-reporting.ts'
import { userJWTSchema } from '../schemas/user.schema.ts'

function buildOrgObj(data: { id: number; name: string; owner_id: number; created_at: Date; updated_at: Date }) {
  return {
    id: data.id,
    name: data.name,
    owner_id: data.id,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

async function getAllOrgs(_: Request, res: Response): Promise<void> {
  const user = res.locals.user as z.infer<typeof userJWTSchema>

  const allEntries = await orgs.all(user.id)
  res.send(allEntries.map(buildOrgObj))
}

async function getOrg(_: Request, res: Response): Promise<void> {
  const user = res.locals.user as z.infer<typeof userJWTSchema>

  const result = await orgs.findByOwnerId(user.id)
  if (!result) {
    res.status(404).send('Org not found')
    return
  }
  res.send(buildOrgObj(result))
}

async function postOrg(req: Request, res: Response): Promise<void> {
  const user = res.locals.user as z.infer<typeof userJWTSchema>

  const created = await orgs.create(req.body.name, user.id)
  if (!created) {
    res.status(400).send('Org not created')
    return
  }

  await orgMembers.create(created.id, user.id, 'admin')

  res.send(buildOrgObj(created))
}

async function patchOrg(req: Request, res: Response): Promise<void> {
  const patched = await orgs.update(Number(req.params.org_id), req.body)
  if (!patched) {
    res.status(404).send('Org not found')
    return
  }
  res.send(buildOrgObj(patched))
}

async function deleteOrg(req: Request, res: Response): Promise<void> {
  const deleted = await orgs.delete(Number(req.params.org_id))
  res.send(buildOrgObj(deleted))
}

export default {
  getAllOrgs: addErrorReporting(getAllOrgs, 'Could not fetch all Orgs'),
  getOrg: addErrorReporting(getOrg, 'Could not fetch Org'),
  postOrg: addErrorReporting(postOrg, 'Could not post Org'),
  patchOrg: addErrorReporting(patchOrg, 'Could not patch Org'),
  deleteOrg: addErrorReporting(deleteOrg, 'Could not delete Org'),
}
