import request from './util/httpRequests.ts'
import knex from '../database/connection.ts'

const getBody = (response) => response.body

describe('Project API', () => {
  beforeEach(async () => {
    await knex('projects').del()
  })

  afterEach(async () => {
    await knex('projects').del()
  })

  describe('GET /projects', () => {
    it('should return all projects', async () => {
      // Insert test data
      await knex('projects').insert([{ name: 'Project 1' }, { name: 'Project 2' }])

      const response = await request.get('/projects')
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
      const response = await request.get('/projects')
      expect(response.status).toBe(200)
      const projects = getBody(response)
      expect(projects).toHaveLength(0)
    })
  })

  describe('GET /projects/:project_id', () => {
    it('should return a single project', async () => {
      const [project] = await knex('projects').insert({ name: 'Test Project' }).returning('*')

      const response = await request.get(`/projects/${project.id}`)
      expect(response.status).toBe(200)
      const result = getBody(response)
      expect(result).toHaveProperty('name', 'Test Project')
      expect(result).toHaveProperty('url')
      expect(result).toHaveProperty('created_at')
      expect(result).toHaveProperty('updated_at')
    })

    it('should return 404 for non-existent project', async () => {
      const response = await request.get('/projects/999')
      expect(response.status).toBe(404)
      expect(response.text).toBe('Project not found')
    })
  })

  describe('POST /projects', () => {
    it('should create a new project', async () => {
      const response = await request.post('/projects', { name: 'New Project' })
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
      const response = await request.post('/projects', { name: '' })
      expect(response.status).toBe(200)
      const result = getBody(response)
      expect(result).toHaveProperty('name', '')
    })
  })

  describe('PATCH /projects/:project_id', () => {
    it('should update an existing project', async () => {
      const [project] = await knex('projects').insert({ name: 'Original Name' }).returning('*')

      const response = await request.patch(`/projects/${project.id}`, { name: 'Updated Name' })
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
      const response = await request.patch('/projects/999', { name: 'Updated Name' })
      expect(response.status).toBe(404)
      expect(response.text).toBe('Project not found')
    })
  })

  describe('DELETE /projects/:project_id', () => {
    it('should delete a single project', async () => {
      const [project] = await knex('projects').insert({ name: 'To Delete' }).returning('*')

      const response = await request.delete(`/projects/${project.id}`)
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
      await knex('projects').insert([{ name: 'Project 1' }, { name: 'Project 2' }])

      const response = await request.delete('/projects')
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
