import todos from '../database/todo-queries.ts'
import type { Request, Response, NextFunction } from 'express'
import { addErrorReporting } from './error-reporting.ts'
import { userJWTSchema } from '../schemas/user.schema.ts'
import { z } from 'zod'

function buildTodoObj(
  req: Request,
  data: {
    id: number
    title: string
    order: number
    completed: boolean
    project_id: number
    org_id: number
    created_at: Date
    updated_at: Date
  },
) {
  const protocol = req.protocol
  const host = req.get('host')

  return {
    id: data.id,
    title: data.title,
    order: data.order,
    completed: data.completed || false,
    project_id: data.project_id,
    org_id: data.org_id,
    created_at: data.created_at,
    updated_at: data.updated_at,
    url: `${protocol}://${host}/projects/${data.project_id}/todos/${data.id}`,
  }
}

async function getAllTodos(req: Request, res: Response): Promise<void> {
  const user = res.locals.user as z.infer<typeof userJWTSchema>
  const allEntries = await todos.all(Number(req.params.project_id), user.org_id)
  res.send(allEntries.map((todo) => buildTodoObj(req, todo)))
}

async function getTodo(req: Request, res: Response): Promise<void> {
  const user = res.locals.user as z.infer<typeof userJWTSchema>
  const todo = await todos.get(Number(req.params.id), user.org_id)
  if (!todo) {
    res.status(404).send('Todo not found')
    return
  }
  res.send(todo)
}

async function postTodo(req: Request, res: Response): Promise<void> {
  const user = res.locals.user as z.infer<typeof userJWTSchema>
  const created = await todos.create(
    Number(req.params.project_id),
    req.body.title,
    req.body.order,
    req.body.completed,
    user.org_id,
  )
  res.send(buildTodoObj(req, created))
}

async function patchTodo(req: Request, res: Response): Promise<void> {
  const user = res.locals.user as z.infer<typeof userJWTSchema>
  const patched = await todos.update(Number(req.params.id), user.org_id, req.body)
  if (!patched) {
    res.status(404).send('Todo not found')
    return
  }
  res.send(buildTodoObj(req, patched))
}

async function deleteAllTodos(req: Request, res: Response): Promise<void> {
  const user = res.locals.user as z.infer<typeof userJWTSchema>
  const deletedEntries = await todos.clear(Number(req.params.project_id), user.org_id)
  res.send(deletedEntries.map((todo) => buildTodoObj(req, todo)))
}

async function deleteTodo(req: Request, res: Response): Promise<void> {
  const user = res.locals.user as z.infer<typeof userJWTSchema>
  const deleted = await todos.delete(Number(req.params.id), user.org_id)
  res.send(buildTodoObj(req, deleted))
}

export default {
  getAllTodos: addErrorReporting(getAllTodos, 'Could not fetch all todos'),
  getTodo: addErrorReporting(getTodo, 'Could not fetch todo'),
  postTodo: addErrorReporting(postTodo, 'Could not post todo'),
  patchTodo: addErrorReporting(patchTodo, 'Could not patch todo'),
  deleteAllTodos: addErrorReporting(deleteAllTodos, 'Could not delete all todos'),
  deleteTodo: addErrorReporting(deleteTodo, 'Could not delete todo'),
}
