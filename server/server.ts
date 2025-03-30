import app from './server-config.ts'
import todo from './handlers/todo.ts'
import project from './handlers/project.ts'

app.get('/projects', project.getAllProjects)
app.get('/projects/:project_id', project.getProject)
app.post('/projects', project.postProject)
app.patch('/projects/:project_id', project.patchProject)
app.delete('/projects', project.deleteAllProjects)
app.delete('/projects/:project_id', project.deleteProject)

app.get('/projects/:project_id/todos', todo.getAllTodos)
app.get('/projects/:project_id/todos/:id', todo.getTodo)
app.post('/projects/:project_id/todos', todo.postTodo)
app.patch('/projects/:project_id/todos/:id', todo.patchTodo)
app.delete('/projects/:project_id/todos', todo.deleteAllTodos)
app.delete('/projects/:project_id/todos/:id', todo.deleteTodo)

const port = process.env.PORT || 5000
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => console.log(`Listening on port ${port}`))
}

export default app
