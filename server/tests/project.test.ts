import { Response } from 'supertest'
import request from './util/httpRequests.ts'
import knex from '../database/connection.ts'
import jwt from 'jsonwebtoken'
const getBody = (response: Response) => response.body

describe('Project API', () => {
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
    await knex('projects').del()
  })

  afterEach(async () => {
    await knex('projects').del()
  })

  describe('GET /projects', () => {
    it('should return all projects', async () => {
      // Insert test data
      await knex('projects').insert([
        { name: 'Project 1', org_id: orgId },
        { name: 'Project 2', org_id: orgId },
      ])

      const response = await request.get('/projects').set('Authorization', `Bearer ${authToken}`)
      expect(response.status).toBe(200)
      const projects = getBody(response)
      expect(projects).toHaveLength(2)
      expect(projects[0]).toHaveProperty('name', 'Project 1')
      expect(projects[1]).toHaveProperty('name', 'Project 2')
      expect(projects[0]).toHaveProperty('url')
      expect(projects[0]).toHaveProperty('created_at')
      expect(projects[0]).toHaveProperty('updated_at')
    })

    it('should return empty array when no projects exist', async () => {
      const response = await request.get('/projects').set('Authorization', `Bearer ${authToken}`)
      expect(response.status).toBe(200)
      const projects = getBody(response)
      expect(projects).toHaveLength(0)
    })
  })

  describe('GET /projects/:project_id', () => {
    it('should return a single project', async () => {
      const [project] = await knex('projects').insert({ name: 'Test Project', org_id: orgId }).returning('*')

      const response = await request.get(`/projects/${project.id}`).set('Authorization', `Bearer ${authToken}`)
      expect(response.status).toBe(200)
      const result = getBody(response)
      expect(result).toHaveProperty('name', 'Test Project')
      expect(result).toHaveProperty('url')
      expect(result).toHaveProperty('created_at')
      expect(result).toHaveProperty('updated_at')
    })

    it('should return 404 for non-existent project', async () => {
      const response = await request.get('/projects/999').set('Authorization', `Bearer ${authToken}`)
      expect(response.status).toBe(404)
      expect(response.text).toBe('Project not found')
    })
  })

  describe('POST /projects', () => {
    it('should create a new project', async () => {
      const response = await request
        .post('/projects', { name: 'New Project' })
        .set('Authorization', `Bearer ${authToken}`)
      expect(response.status).toBe(200)
      const result = getBody(response)
      expect(result).toHaveProperty('name', 'New Project')
      expect(result).toHaveProperty('url')
      expect(result).toHaveProperty('created_at')
      expect(result).toHaveProperty('updated_at')

      // Verify in database
      const [project] = await knex('projects').where({ name: 'New Project' })
      expect(project).toBeDefined()
    })

    it('should handle empty name', async () => {
      const response = await request.post('/projects', { name: '' }).set('Authorization', `Bearer ${authToken}`)
      expect(response.status).toBe(400)
      const result = getBody(response)
      expect(result).toHaveProperty('errors')
      expect(result).toHaveProperty('message')
      expect(result.message).toBe('Validation error')
    })
  })

  describe('PATCH /projects/:project_id', () => {
    it('should update an existing project', async () => {
      const [project] = await knex('projects').insert({ name: 'Original Name', org_id: orgId }).returning('*')

      const response = await request
        .patch(`/projects/${project.id}`, { name: 'Updated Name' })
        .set('Authorization', `Bearer ${authToken}`)
      expect(response.status).toBe(200)
      const result = getBody(response)
      expect(result).toHaveProperty('name', 'Updated Name')
      expect(result).toHaveProperty('url')
      expect(result).toHaveProperty('created_at')
      expect(result).toHaveProperty('updated_at')

      // Verify in database
      const [updated] = await knex('projects').where({ id: project.id })
      expect(updated.name).toBe('Updated Name')
    })

    it('should return 404 for non-existent project', async () => {
      const response = await request
        .patch('/projects/999', { name: 'Updated Name' })
        .set('Authorization', `Bearer ${authToken}`)
      expect(response.status).toBe(404)
      expect(response.text).toBe('Project not found')
    })
  })

  describe('DELETE /projects/:project_id', () => {
    it('should delete a single project', async () => {
      const [project] = await knex('projects').insert({ name: 'To Delete', org_id: orgId }).returning('*')

      const response = await request.delete(`/projects/${project.id}`).set('Authorization', `Bearer ${authToken}`)
      expect(response.status).toBe(200)
      const result = getBody(response)
      expect(result).toHaveProperty('name', 'To Delete')
      expect(result).toHaveProperty('url')
      expect(result).toHaveProperty('created_at')
      expect(result).toHaveProperty('updated_at')

      // Verify deletion
      const [deleted] = await knex('projects').where({ id: project.id })
      expect(deleted).toBeUndefined()
    })
  })

  describe('DELETE /projects', () => {
    it('should delete all projects', async () => {
      // Insert test data
      await knex('projects').insert([
        { name: 'Project 1', org_id: orgId },
        { name: 'Project 2', org_id: orgId },
      ])

      const response = await request.delete('/projects').set('Authorization', `Bearer ${authToken}`)
      expect(response.status).toBe(200)
      const projects = getBody(response)
      expect(projects).toHaveLength(2)
      expect(projects[0]).toHaveProperty('name', 'Project 1')
      expect(projects[1]).toHaveProperty('name', 'Project 2')

      // Verify deletion
      const remaining = await knex('projects')
      expect(remaining).toHaveLength(0)
    })
  })
})
