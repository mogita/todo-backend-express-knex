import app from './server-config.ts'
import routes from './server-routes.ts'

const port = process.env.PORT || 5000

app.get('/', routes.getAllTodos)
app.get('/:id', routes.getTodo)

app.post('/', routes.postTodo)
app.patch('/:id', routes.patchTodo)

app.delete('/', routes.deleteAllTodos)
app.delete('/:id', routes.deleteTodo)

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => console.log(`Listening on port ${port}`))
}

export default app
