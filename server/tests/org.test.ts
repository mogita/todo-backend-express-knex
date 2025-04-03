import { Response } from 'supertest'
import request from './util/httpRequests.ts'
import knex from '../database/connection.ts'
import jwt from 'jsonwebtoken'
const getBody = (response: Response) => response.body

describe('Organization API', () => {
  let userId: number
  let authToken: string
  let orgId: number
  let membershipId: number

  beforeAll(async () => {
    // Clean up any existing data
    await knex('org_members').del()
    await knex('organizations').del()
    await knex('users').del()

    // Create test user
    const [user] = await knex('users')
      .insert({ username: 'testuser', email: 'testuser@example.com', password: 'password' })
      .returning('*')
    userId = user.id

    // Create test organization
    const [org] = await knex('organizations').insert({ name: 'Test Organization', owner_id: userId }).returning('*')
    orgId = org.id

    // Create admin membership
    const [membership] = await knex('org_members')
      .insert({
        org_id: orgId,
        user_id: userId,
        role: 'admin',
      })
      .returning('*')
    membershipId = membership.id

    // Create a mock JWT token
    const mockUser = {
      id: userId,
      username: 'testuser',
      email: 'testuser@example.com',
      org_id: orgId,
      org_name: 'Test Organization',
      role: 'admin',
    }

    authToken = jwt.sign(mockUser, process.env.JWT_SECRET || 'test-secret', {
      expiresIn: '1h',
    })
  })

  afterAll(async () => {
    // Clean up in the correct order to avoid foreign key constraint errors
    await knex('org_members').del()
    await knex('organizations').del()
    await knex('users').del()
  })

  // We don't need beforeEach/afterEach to clean organizations since that causes FK constraint issues
  // Instead, we'll handle cleanup within each test that creates additional orgs

  describe('GET /orgs', () => {
    it('should return all orgs the user is a member of', async () => {
      const response = await request.get('/orgs').set('Authorization', `Bearer ${authToken}`)
      expect(response.status).toBe(200)
      const orgs = getBody(response)
      expect(orgs).toHaveLength(1)
      expect(orgs[0]).toHaveProperty('name', 'Test Organization')
      expect(orgs[0]).toHaveProperty('owner_id')
      expect(orgs[0]).toHaveProperty('created_at')
      expect(orgs[0]).toHaveProperty('updated_at')
    })
  })

  describe('GET /orgs/:org_id', () => {
    it('should return a single org', async () => {
      const response = await request.get(`/orgs/${orgId}`).set('Authorization', `Bearer ${authToken}`)
      expect(response.status).toBe(200)
      const result = getBody(response)
      expect(result).toHaveProperty('name', 'Test Organization')
      expect(result).toHaveProperty('owner_id')
      expect(result).toHaveProperty('created_at')
      expect(result).toHaveProperty('updated_at')
    })

    it('should return expected response for non-existent org', async () => {
      const response = await request.get('/orgs/999').set('Authorization', `Bearer ${authToken}`)
      expect(response.status).toBe(200)
    })
  })

  describe('POST /orgs', () => {
    afterEach(async () => {
      // Clean up any organizations created during this test
      // First delete the membership, then the org
      const createdOrg = await knex('organizations').where({ name: 'New Organization' }).first()
      if (createdOrg) {
        await knex('org_members').where({ org_id: createdOrg.id }).del()
        await knex('organizations').where({ id: createdOrg.id }).del()
      }
    })

    it('should create a new org', async () => {
      const response = await request
        .post('/orgs', { name: 'New Organization' })
        .set('Authorization', `Bearer ${authToken}`)
      expect(response.status).toBe(200)
      const result = getBody(response)
      expect(result).toHaveProperty('name', 'New Organization')
      expect(result).toHaveProperty('owner_id')
      expect(result).toHaveProperty('created_at')
      expect(result).toHaveProperty('updated_at')

      // Verify in database
      const org = await knex('organizations').where({ name: 'New Organization' }).first()
      expect(org).toBeDefined()

      // Verify org membership was created
      const member = await knex('org_members').where({ org_id: org.id, user_id: userId }).first()
      expect(member).toBeDefined()
      expect(member.role).toBe('admin')
    })

    it('should handle empty name', async () => {
      const response = await request.post('/orgs', { name: '' }).set('Authorization', `Bearer ${authToken}`)
      expect(response.status).toBe(400)
      const result = getBody(response)
      expect(result).toHaveProperty('errors')
      expect(result).toHaveProperty('message')
      expect(result.message).toBe('Validation error')
    })
  })

  describe('PATCH /orgs/:org_id', () => {
    let testOrgId: number

    beforeEach(async () => {
      // Create a test org for each test
      const [org] = await knex('organizations').insert({ name: 'Original Name', owner_id: userId }).returning('*')
      testOrgId = org.id
    })

    afterEach(async () => {
      // Clean up test data in correct order
      await knex('org_members').where({ org_id: testOrgId }).del()
      await knex('organizations').where({ id: testOrgId }).del()
    })

    it('should update an existing org', async () => {
      const response = await request
        .patch(`/orgs/${testOrgId}`, { name: 'Updated Name' })
        .set('Authorization', `Bearer ${authToken}`)
      expect(response.status).toBe(200)
      const result = getBody(response)
      expect(result).toHaveProperty('name', 'Updated Name')
      expect(result).toHaveProperty('owner_id')
      expect(result).toHaveProperty('created_at')
      expect(result).toHaveProperty('updated_at')

      // Verify in database
      const updated = await knex('organizations').where({ id: testOrgId }).first()
      expect(updated.name).toBe('Updated Name')
    })

    it('should return 404 for non-existent org', async () => {
      const response = await request
        .patch('/orgs/999', { name: 'Updated Name' })
        .set('Authorization', `Bearer ${authToken}`)
      expect(response.status).toBe(404)
      expect(response.text).toBe('Org not found')
    })
  })

  describe('DELETE /orgs/:org_id', () => {
    let testOrgId: number

    beforeEach(async () => {
      // Create an org to delete
      const [org] = await knex('organizations').insert({ name: 'To Delete', owner_id: userId }).returning('*')
      testOrgId = org.id
    })

    it('should delete an org', async () => {
      const response = await request.delete(`/orgs/${testOrgId}`).set('Authorization', `Bearer ${authToken}`)
      expect(response.status).toBe(200)
      const result = getBody(response)
      expect(result).toHaveProperty('name', 'To Delete')
      expect(result).toHaveProperty('owner_id')
      expect(result).toHaveProperty('created_at')
      expect(result).toHaveProperty('updated_at')

      // Verify deletion
      const deleted = await knex('organizations').where({ id: testOrgId }).first()
      expect(deleted).toBeUndefined()
    })
  })
})
