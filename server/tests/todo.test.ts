/*
    Tests taken from the todo-backend spec located at:
    https://github.com/TodoBackend/todo-backend-js-spec/blob/master/js/specs.js
    
    And transcribed from Mocha/Chai to Jest with async/await/promises and other ES6+ features
    for ease of extension of this project (any additional testing).
*/
import { Response } from 'supertest'
import request from './util/httpRequests.ts'
import knex from '../database/connection.ts'
import jwt from 'jsonwebtoken'

// Relative paths are used for supertest in the util file.
const urlFromTodo = (todo: { url: string }) => new URL(todo.url)['pathname']
const getBody = (response: Response) => response.body

describe(`Todo-Backend API residing at http://localhost:${process.env.PORT}`, () => {
  let projectId: number
  let userId: number
  let authToken: string
  let orgId: number

  beforeAll(async () => {
    await knex('org_members').del()
    await knex('organizations').del()
    await knex('users').del()

    const [user] = await knex('users')
      .insert({ username: 'testuser', email: 'testuser@example.com', password: 'password' })
      .returning('*')
    userId = user.id

    const [org] = await knex('organizations').insert({ name: 'Test Organization', owner_id: userId }).returning('*')
    orgId = org.id
    await knex('org_members')
      .insert({
        org_id: orgId,
        user_id: userId,
        role: 'admin',
      })
      .returning('*')

    // Create a mock JWT token instead of registering a real user
    // Create a payload that matches the structure expected by the verifyToken middleware
    const mockUser = {
      id: userId,
      username: 'testuser',
      email: 'testuser@example.com',
      org_id: orgId,
      org_name: 'Test Organization',
      role: 'admin',
    }

    // Sign the token with the same secret used in the application
    authToken = jwt.sign(mockUser, process.env.JWT_SECRET || 'test-secret', {
      expiresIn: '1h',
    })
  })

  afterAll(async () => {
    await knex('org_members').where({ user_id: userId }).del()
    await knex('organizations').where({ id: orgId }).del()
    await knex('users').where({ id: userId }).del()
  })

  beforeEach(async () => {
    // Create a project first and get its ID
    const [project] = await knex('projects').insert({ name: 'Test Project', org_id: orgId }).returning('*')
    projectId = project.id
    // Clear todos for this project
    await request.delete(`/projects/${projectId}/todos`)
  })

  afterEach(async () => {
    // Clean up todos and project
    await request.delete(`/projects/${projectId}/todos`)
    await knex('projects').where({ id: projectId }).del()
  })

  async function createFreshTodoAndGetItsUrl(params: { title?: string; order?: number } = {}) {
    if (!params.title) {
      params.title = 'unit-test-todo'
    }
    return request
      .post(`/projects/${projectId}/todos`, params)
      .set('Authorization', `Bearer ${authToken}`)
      .then(getBody)
      .then(urlFromTodo)
  }

  describe('The pre-requsites', () => {
    it('the api root responds to a GET (i.e. the server is up and accessible, CORS headers are set up)', async () => {
      const response = await request.get(`/projects/${projectId}/todos`).set('Authorization', `Bearer ${authToken}`)
      expect(response.status).toBe(200)
    })

    it('the api root responds to a POST with the todo which was posted to it', async () => {
      const starting = { title: 'a todo' }
      const getRoot = await request
        .post(`/projects/${projectId}/todos`, starting)
        .set('Authorization', `Bearer ${authToken}`)
        .then(getBody)
      expect(getRoot).toMatchObject(expect.objectContaining(starting))
    })

    it('the api root responds successfully to a DELETE', async () => {
      const deleteRoot = await request
        .delete(`/projects/${projectId}/todos`)
        .set('Authorization', `Bearer ${authToken}`)
      expect(deleteRoot.status).toBe(200)
    })

    it('after a DELETE the api root responds to a GET with a JSON representation of an empty array', async () => {
      var deleteThenGet = await request
        .delete(`/projects/${projectId}/todos`)
        .set('Authorization', `Bearer ${authToken}`)
        .then(() => request.get(`/projects/${projectId}/todos`).set('Authorization', `Bearer ${authToken}`))
        .then(getBody)
      expect(deleteThenGet).toEqual([])
    })
  })

  describe('storing new todos by posting to the root url', () => {
    beforeEach(async () => {
      return await request.delete(`/projects/${projectId}/todos`)
    })

    it('adds a new todo to the list of todos at the root url', async () => {
      const starting = { title: 'walk the dog' }
      var getAfterPost = await request
        .post(`/projects/${projectId}/todos`, starting)
        .set('Authorization', `Bearer ${authToken}`)
        .then(() => request.get(`/projects/${projectId}/todos`).set('Authorization', `Bearer ${authToken}`))
        .then(getBody)
      expect(getAfterPost).toHaveLength(1)
      expect(getAfterPost[0]).toMatchObject(expect.objectContaining(starting))
    })

    function createTodoAndVerifyItLooksValidWith(verifyTodoExpectation) {
      return request
        .post(`/projects/${projectId}/todos`, { title: 'blah' })
        .set('Authorization', `Bearer ${authToken}`)
        .then(getBody)
        .then(verifyTodoExpectation)
        .then(() => request.get(`/projects/${projectId}/todos`).set('Authorization', `Bearer ${authToken}`))
        .then(getBody)
        .then((todosFromGet) => {
          verifyTodoExpectation(todosFromGet[0])
        })
    }

    it('sets up a new todo as initially not completed', async () => {
      await createTodoAndVerifyItLooksValidWith((todo) => {
        expect(todo).toMatchObject(expect.objectContaining({ completed: false }))
        return todo
      })
    })

    it('each new todo has a url', async () => {
      await createTodoAndVerifyItLooksValidWith((todo) => {
        expect(todo).toHaveProperty('url')
        expect(typeof todo['url']).toBe('string')
        return todo
      })
    })

    it('each new todo has a url, which returns a todo', async () => {
      const starting = { title: 'my todo' }
      const newTodo = await request
        .post(`/projects/${projectId}/todos`, starting)
        .set('Authorization', `Bearer ${authToken}`)
        .then(getBody)
      const fetchedTodo = await request
        .get(urlFromTodo(newTodo))
        .set('Authorization', `Bearer ${authToken}`)
        .then(getBody)
      expect(fetchedTodo).toMatchObject(expect.objectContaining(starting))
    })
  })

  describe('working with an existing todo', () => {
    beforeEach(async () => {
      return await request.delete(`/projects/${projectId}/todos`)
    })

    it('can navigate from a list of todos to an individual todo via urls', async () => {
      const makeTwoTodos = Promise.all([
        request
          .post(`/projects/${projectId}/todos`, { title: 'todo the first' })
          .set('Authorization', `Bearer ${authToken}`),
        request
          .post(`/projects/${projectId}/todos`, { title: 'todo the second' })
          .set('Authorization', `Bearer ${authToken}`),
      ])

      const todoList = await makeTwoTodos
        .then(() => request.get(`/projects/${projectId}/todos`).set('Authorization', `Bearer ${authToken}`))
        .then(getBody)
      expect(todoList).toHaveLength(2)
      const getAgainstUrlOfFirstTodo = await request
        .get(urlFromTodo(todoList[0]))
        .set('Authorization', `Bearer ${authToken}`)
        .then(getBody)
      expect(getAgainstUrlOfFirstTodo).toHaveProperty('title')
    })

    it("can change the todo's title by PATCHing to the todo's url", async () => {
      const initialTitle = { title: 'initial title' }
      const todoUrl = await createFreshTodoAndGetItsUrl(initialTitle)
      const changedTitle = { title: 'bathe the cat' }
      const patchedTodo = await request
        .patch(todoUrl, changedTitle)
        .set('Authorization', `Bearer ${authToken}`)
        .then(getBody)
      expect(patchedTodo).toMatchObject(expect.objectContaining(changedTitle))
      expect(patchedTodo).not.toMatchObject(expect.objectContaining(initialTitle))
    })

    it("can change the todo's completedness by PATCHing to the todo's url", async () => {
      const urlForNewTodo = await createFreshTodoAndGetItsUrl()
      const patchedTodo = await request
        .patch(urlForNewTodo, { completed: true })
        .set('Authorization', `Bearer ${authToken}`)
        .then(getBody)
      expect(patchedTodo).toHaveProperty('completed', true)
    })

    it('changes to a todo are persisted and show up when re-fetching the todo', async () => {
      const urlForNewTodo = await createFreshTodoAndGetItsUrl()
      const patchedTodo = await request
        .patch(urlForNewTodo, { title: 'changed title', completed: true })
        .set('Authorization', `Bearer ${authToken}`)
        .then(getBody)

      function verifyTodosProperties(todo) {
        expect(todo).toHaveProperty('completed', true)
        expect(todo).toHaveProperty('title', 'changed title')
      }

      const verifyRefetchedTodo = request
        .get(urlFromTodo(patchedTodo))
        .set('Authorization', `Bearer ${authToken}`)
        .then(getBody)
        .then((refetchedTodo) => {
          verifyTodosProperties(refetchedTodo)
        })

      const verifyRefetchedTodoList = request
        .get(`/projects/${projectId}/todos`)
        .set('Authorization', `Bearer ${authToken}`)
        .then(getBody)
        .then((todoList) => {
          expect(todoList).toHaveLength(1)
          verifyTodosProperties(todoList[0])
        })

      await Promise.all([verifyRefetchedTodo, verifyRefetchedTodoList])
    })

    it("can delete a todo making a DELETE request to the todo's url", async () => {
      const urlForNewTodo = await createFreshTodoAndGetItsUrl()
      await request.delete(urlForNewTodo).set('Authorization', `Bearer ${authToken}`)
      const todosAfterCreatingAndDeletingTodo = await request
        .get(`/projects/${projectId}/todos`)
        .set('Authorization', `Bearer ${authToken}`)
        .then(getBody)
      expect(todosAfterCreatingAndDeletingTodo).toEqual([])
    })
  })

  describe('tracking todo order', () => {
    it('can create a todo with an order field', async () => {
      const postResult = await request
        .post(`/projects/${projectId}/todos`, { title: 'blah', order: 523 })
        .set('Authorization', `Bearer ${authToken}`)
        .then(getBody)
      expect(postResult).toHaveProperty('order', 523)
    })

    it('can PATCH a todo to change its order', async () => {
      const newTodoUrl = await createFreshTodoAndGetItsUrl({ order: 10 })
      const patchedTodo = await request
        .patch(newTodoUrl, { order: 95 })
        .set('Authorization', `Bearer ${authToken}`)
        .then(getBody)
      expect(patchedTodo).toHaveProperty('order', 95)
    })

    it("remembers changes to a todo's order", async () => {
      const newTodoUrl = await createFreshTodoAndGetItsUrl({ order: 10 })
      const patchedTodo = await request
        .patch(newTodoUrl, { order: 95 })
        .set('Authorization', `Bearer ${authToken}`)
        .then(getBody)
      const refetchedTodo = await request
        .get(urlFromTodo(patchedTodo))
        .set('Authorization', `Bearer ${authToken}`)
        .then(getBody)
      expect(refetchedTodo).toHaveProperty('order', 95)
    })
  })
})
