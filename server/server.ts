import app from './server-config.ts'
import todo from './handlers/todo.ts'
import project from './handlers/project.ts'
import user from './handlers/user.ts'
import { projectSchema } from './schemas/project.schema.ts'
import { validateBody } from './middlewares/zod.ts'
import { todoSchema } from './schemas/todo.schema.ts'
import { userLoginSchema, userRegisterSchema } from './schemas/user.schema.ts'
import { verifyAuth } from './middlewares/jwt.ts'

app.post('/register', validateBody(userRegisterSchema), user.postUser)
app.post('/login', validateBody(userLoginSchema), user.loginUser)
app.get('/users/self', verifyAuth(['superadmin']), user.getUser)
app.patch('/users', verifyAuth(['admin']), user.patchUser)

app.get('/projects', project.getAllProjects)
app.get('/projects/:project_id', project.getProject)
app.post('/projects', validateBody(projectSchema), project.postProject)
app.patch('/projects/:project_id', project.patchProject)
app.delete('/projects', project.deleteAllProjects)
app.delete('/projects/:project_id', project.deleteProject)

app.get('/projects/:project_id/todos', todo.getAllTodos)
app.get('/projects/:project_id/todos/:id', todo.getTodo)
app.post('/projects/:project_id/todos', validateBody(todoSchema), todo.postTodo)
app.patch('/projects/:project_id/todos/:id', todo.patchTodo)
app.delete('/projects/:project_id/todos', todo.deleteAllTodos)
app.delete('/projects/:project_id/todos/:id', todo.deleteTodo)

const port = process.env.PORT || 5000
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => console.log(`Listening on port ${port}`))
}

export default app
