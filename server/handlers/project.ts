import { curry } from 'lodash'
import { z } from 'zod'
import projects from '../database/project-queries.ts'
import type { Request, Response } from 'express'
import { addErrorReporting } from './error-reporting.ts'
import { userJWTSchema } from '../schemas/user.schema.ts'

function buildProjectObj(req: Request, data: { id: number; name: string; created_at: Date; updated_at: Date }) {
  const protocol = req.protocol,
    host = req.get('host'),
    id = data.id

  return {
    id: data.id,
    name: data.name,
    created_at: data.created_at.toISOString(),
    updated_at: data.updated_at.toISOString(),
    url: `${protocol}://${host}/projects/${id}`,
  }
}

async function getAllProjects(req: Request, res: Response): Promise<void> {
  const allEntries = await projects.all()
  res.send(allEntries.map(curry(buildProjectObj)(req)))
}

async function getProject(req: Request, res: Response): Promise<void> {
  const result = await projects.get(Number(req.params.project_id))
  if (!result) {
    res.status(404).send('Project not found')
    return
  }
  res.send(buildProjectObj(req, result))
}

async function postProject(req: Request, res: Response): Promise<void> {
  const user = res.locals.user as z.infer<typeof userJWTSchema>

  const created = await projects.create(req.body.name, user.org_id)
  res.send(buildProjectObj(req, created))
}

async function patchProject(req: Request, res: Response): Promise<void> {
  const patched = await projects.update(Number(req.params.project_id), req.body)
  if (!patched) {
    res.status(404).send('Project not found')
    return
  }
  res.send(buildProjectObj(req, patched))
}

async function deleteAllProjects(req: Request, res: Response): Promise<void> {
  const deletedEntries = await projects.clear()
  res.send(deletedEntries.map(curry(buildProjectObj)(req)))
}

async function deleteProject(req: Request, res: Response): Promise<void> {
  const deleted = await projects.delete(Number(req.params.project_id))
  res.send(buildProjectObj(req, deleted))
}

export default {
  getAllProjects: addErrorReporting(getAllProjects, 'Could not fetch all Projects'),
  getProject: addErrorReporting(getProject, 'Could not fetch Project'),
  postProject: addErrorReporting(postProject, 'Could not post Project'),
  patchProject: addErrorReporting(patchProject, 'Could not patch Project'),
  deleteAllProjects: addErrorReporting(deleteAllProjects, 'Could not delete all Projects'),
  deleteProject: addErrorReporting(deleteProject, 'Could not delete Project'),
}
