import { curry } from 'lodash'
import todos from './database/todo-queries.ts'
import type { Request, Response, NextFunction } from 'express'

function createToDo(req: Request, data: { id: number; title: string; order: number; completed: boolean }) {
  const protocol = req.protocol,
    host = req.get('host'),
    id = data.id

  return {
    title: data.title,
    order: data.order,
    completed: data.completed || false,
    url: `${protocol}://${host}/${id}`,
  }
}

async function getAllTodos(req: Request, res: Response): Promise<void> {
  const allEntries = await todos.all()
  res.send(allEntries.map(curry(createToDo)(req)))
}

async function getTodo(req: Request, res: Response): Promise<void> {
  const todo = await todos.get(Number(req.params.id))
  res.send(todo)
}

async function postTodo(req: Request, res: Response): Promise<void> {
  const created = await todos.create(req.body.title, req.body.order)
  res.send(createToDo(req, created))
}

async function patchTodo(req: Request, res: Response): Promise<void> {
  const patched = await todos.update(Number(req.params.id), req.body)
  res.send(createToDo(req, patched))
}

async function deleteAllTodos(req: Request, res: Response): Promise<void> {
  const deletedEntries = await todos.clear()
  res.send(deletedEntries.map(curry(createToDo)(req)))
}

async function deleteTodo(req: Request, res: Response): Promise<void> {
  const deleted = await todos.delete(Number(req.params.id))
  res.send(createToDo(req, deleted))
}

function addErrorReporting(
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

export default {
  getAllTodos: addErrorReporting(getAllTodos, 'Could not fetch all todos'),
  getTodo: addErrorReporting(getTodo, 'Could not fetch todo'),
  postTodo: addErrorReporting(postTodo, 'Could not post todo'),
  patchTodo: addErrorReporting(patchTodo, 'Could not patch todo'),
  deleteAllTodos: addErrorReporting(deleteAllTodos, 'Could not delete all todos'),
  deleteTodo: addErrorReporting(deleteTodo, 'Could not delete todo'),
}
