import { curry } from 'lodash'
import todos from './database/todo-queries.ts'
import type { Request, Response, NextFunction } from 'express'

function createToDo(req, data) {
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

async function getAllTodos(req, res) {
  const allEntries = await todos.all()
  return res.send(allEntries.map(curry(createToDo)(req)))
}

async function getTodo(req, res) {
  const todo = await todos.get(req.params.id)
  return res.send(todo)
}

async function postTodo(req, res) {
  const created = await todos.create(req.body.title, req.body.order)
  return res.send(createToDo(req, created))
}

async function patchTodo(req, res) {
  const patched = await todos.update(req.params.id, req.body)
  return res.send(createToDo(req, patched))
}

async function deleteAllTodos(req, res) {
  const deletedEntries = await todos.clear()
  return res.send(deletedEntries.map(curry(createToDo)(req)))
}

async function deleteTodo(req, res) {
  const deleted = await todos.delete(req.params.id)
  return res.send(createToDo(req, deleted))
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
