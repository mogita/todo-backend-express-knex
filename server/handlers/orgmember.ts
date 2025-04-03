import { z } from 'zod'
import orgMembers from '../database/orgmember-queries.ts'
import type { Request, Response } from 'express'
import { addErrorReporting } from './error-reporting.ts'
import { userJWTSchema } from '../schemas/user.schema.ts'

function buildOrgMemberObj(data: {
  id: number
  org_id: number
  user_id: number
  role: string
  created_at: Date
  updated_at: Date
}) {
  return {
    id: data.id,
    org_id: data.org_id,
    user_id: data.id,
    role: data.role,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

async function getAllOrgMembers(req: Request, res: Response): Promise<void> {
  const allEntries = await orgMembers.all(Number(req.params.org_id))
  res.send(allEntries.map(buildOrgMemberObj))
}

async function getOrgMember(req: Request, res: Response): Promise<void> {
  const result = await orgMembers.findByOrgIdAndUserId(Number(req.params.org_id), Number(req.params.id))
  if (!result) {
    res.status(404).send('OrgMember not found')
    return
  }
  res.send(buildOrgMemberObj(result))
}

async function postOrgMember(req: Request, res: Response): Promise<void> {
  const created = await orgMembers.create(
    Number(req.params.org_id),
    Number(req.body.user_id),
    req.body.role || 'member',
  )
  if (!created) {
    res.status(400).send('OrgMember not created')
    return
  }

  res.send(buildOrgMemberObj(created))
}

async function patchOrgMember(req: Request, res: Response): Promise<void> {
  const patched = await orgMembers.update(Number(req.params.org_id), { role: req.body.role })
  if (!patched) {
    res.status(404).send('OrgMember not found')
    return
  }
  res.send(buildOrgMemberObj(patched))
}

async function deleteOrgMember(req: Request, res: Response): Promise<void> {
  const deleted = await orgMembers.delete(Number(req.params.org_id), Number(req.params.id))
  res.send(buildOrgMemberObj(deleted))
}

export default {
  getAllOrgMembers: addErrorReporting(getAllOrgMembers, 'Could not fetch all OrgMembers'),
  getOrgMember: addErrorReporting(getOrgMember, 'Could not fetch OrgMember'),
  postOrgMember: addErrorReporting(postOrgMember, 'Could not post OrgMember'),
  patchOrgMember: addErrorReporting(patchOrgMember, 'Could not patch OrgMember'),
  deleteOrgMember: addErrorReporting(deleteOrgMember, 'Could not delete OrgMember'),
}
