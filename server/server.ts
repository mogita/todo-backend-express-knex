import app from './server-config.ts'
import todo from './handlers/todo.ts'

app.get('/', todo.getAllTodos)
app.get('/:id', todo.getTodo)

app.post('/', todo.postTodo)
app.patch('/:id', todo.patchTodo)

app.delete('/', todo.deleteAllTodos)
app.delete('/:id', todo.deleteTodo)

const port = process.env.PORT || 5000
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => console.log(`Listening on port ${port}`))
}

export default app
