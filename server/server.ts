import app from './server-config.ts'
import todo from './handlers/todo.ts'
import project from './handlers/project.ts'
import user from './handlers/user.ts'
import org from './handlers/org.ts'
import orgmember from './handlers/orgmember.ts'
import { projectSchema } from './schemas/project.schema.ts'
import { validateBody } from './middlewares/zod.ts'
import { todoSchema } from './schemas/todo.schema.ts'
import { userLoginSchema, userRegisterSchema } from './schemas/user.schema.ts'
import { verifyAuth } from './middlewares/jwt.ts'
import { orgSchema } from './schemas/org.schema.ts'
import { orgMemberUpdateSchema } from './schemas/orgmember.schema.ts'

// Users
app.post('/register', validateBody(userRegisterSchema), user.postUser)
app.post('/login', validateBody(userLoginSchema), user.loginUser)
app.get('/users/self', verifyAuth(), user.getUser)
app.patch('/users', verifyAuth(), user.patchUser)

// Orgs
app.get('/orgs', verifyAuth(['admin', 'member']), org.getAllOrgs)
app.get('/orgs/:org_id', verifyAuth(['admin', 'member']), org.getOrg)
app.post('/orgs', verifyAuth(), validateBody(orgSchema), org.postOrg)
app.patch('/orgs/:org_id', verifyAuth(['admin']), validateBody(orgSchema), org.patchOrg)
app.delete('/orgs/:org_id', verifyAuth(['admin']), org.deleteOrg)

// Org Members
app.get('/orgs/:org_id/members', verifyAuth(['admin']), orgmember.getAllOrgMembers)
app.get('/orgs/:org_id/members/:id', verifyAuth(['admin']), orgmember.getOrgMember)
app.post('/orgs/:org_id/members', verifyAuth(['admin']), orgmember.postOrgMember)
// TODO: only updates member's role
app.patch(
  '/orgs/:org_id/members/:id',
  verifyAuth(['admin']),
  validateBody(orgMemberUpdateSchema),
  orgmember.patchOrgMember,
)
app.delete('/orgs/:org_id/members/:id', verifyAuth(['admin']), orgmember.deleteOrgMember)

// Projects
app.get('/projects', verifyAuth(), project.getAllProjects)
app.get('/projects/:project_id', verifyAuth(), project.getProject)
app.post('/projects', verifyAuth(), validateBody(projectSchema), project.postProject)
app.patch('/projects/:project_id', verifyAuth(), project.patchProject)
app.delete('/projects', verifyAuth(), project.deleteAllProjects)
app.delete('/projects/:project_id', verifyAuth(), project.deleteProject)

// Todos
app.get('/projects/:project_id/todos', verifyAuth(), todo.getAllTodos)
app.get('/projects/:project_id/todos/:id', verifyAuth(), todo.getTodo)
app.post('/projects/:project_id/todos', verifyAuth(), validateBody(todoSchema), todo.postTodo)
app.patch('/projects/:project_id/todos/:id', verifyAuth(), todo.patchTodo)
app.delete('/projects/:project_id/todos', verifyAuth(), todo.deleteAllTodos)
app.delete('/projects/:project_id/todos/:id', verifyAuth(), todo.deleteTodo)

const port = process.env.PORT || 5000
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => console.log(`Listening on port ${port}`))
}

export default app
