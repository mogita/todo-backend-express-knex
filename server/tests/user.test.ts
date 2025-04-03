import { Response } from 'supertest'
import request from './util/httpRequests.ts'
import knex from '../database/connection.ts'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { userJWTSchema } from '../schemas/user.schema'

describe('User Authentication API', () => {
  // Clean up any test users before and after tests
  beforeEach(async () => {
    await knex('org_members').del()
    await knex('organizations').del()
    await knex('users').where({ email: 'test@example.com' }).del()
    await knex('users').where({ username: 'testuser' }).del()
  })

  afterEach(async () => {
    await knex('org_members').del()
    await knex('organizations').del()
    await knex('users').where({ email: 'test@example.com' }).del()
    await knex('users').where({ username: 'testuser' }).del()
  })

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      }

      const response = await request.post('/register', userData)
      expect(response.status).toBe(200)

      const user = response.body
      expect(user).toHaveProperty('id')
      expect(user).toHaveProperty('username', userData.username)
      expect(user).toHaveProperty('email', userData.email)
      // Password should be hashed, not returned as plaintext
      expect(user.password).not.toBe(userData.password)

      // Verify user was actually created in the database
      const dbUser = await knex('users').where({ username: userData.username }).first()
      expect(dbUser).toBeTruthy()
    })

    it('should not allow registration with an existing username', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      }

      // Register once
      await request.post('/register', userData)

      // Try to register with same username but different email
      const duplicateUser = {
        ...userData,
        email: 'different@example.com',
      }

      const response = await request.post('/register', duplicateUser)
      expect(response.status).toBe(409)
      expect(response.text).toBe('Username already in use')
    })

    it('should not allow registration with an existing email', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      }

      // Register once
      await request.post('/register', userData)

      // Try to register with same email but different username
      const duplicateUser = {
        ...userData,
        username: 'differentuser',
      }

      const response = await request.post('/register', duplicateUser)
      expect(response.status).toBe(409)
      expect(response.text).toBe('Email already in use')
    })

    it('should not allow registration with an empty username', async () => {
      const userData = {
        username: '',
        email: 'test@example.com',
        password: 'password123',
      }

      const response = await request.post('/register', userData)
      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('errors')
      expect(response.body).toHaveProperty('message')
      expect(response.body.errors).toHaveLength(1)
      expect(response.body.errors[0]).toBe('string must contain at least 1 character(s): username')
      expect(response.body.message).toBe('Validation error')
    })

    it('should not allow registration with an empty email', async () => {
      const userData = {
        username: 'testuser',
        email: '',
        password: 'password123',
      }

      const response = await request.post('/register', userData)
      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('errors')
      expect(response.body).toHaveProperty('message')
      expect(response.body.errors).toHaveLength(1)
      expect(response.body.errors[0]).toBe('invalid email: email')
      expect(response.body.message).toBe('Validation error')
    })
  })

  describe('User Login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      const password = await bcrypt.hash('password123', 10)
      const [user] = await knex('users')
        .insert({
          username: 'testuser',
          email: 'test@example.com',
          password,
        })
        .returning('*')
      // create org and membership
      const [org] = await knex('organizations')
        .insert({
          name: 'testorg',
          owner_id: user.id,
        })
        .returning('*')
      await knex('org_members').insert({
        org_id: org.id,
        user_id: user.id,
        role: 'admin',
      })
    })

    afterEach(async () => {
      await knex('org_members').del()
      await knex('organizations').del()
      await knex('users').where({ username: 'testuser' }).del()
    })

    it('should login successfully with correct username and password', async () => {
      const loginData = {
        username: 'testuser',
        password: 'password123',
      }

      const response = await request.post('/login', loginData)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('token')

      // Verify the token is valid JWT
      const token = response.body.token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as z.infer<typeof userJWTSchema>

      expect(decoded).toHaveProperty('id')
      expect(decoded).toHaveProperty('username', 'testuser')
      expect(decoded).toHaveProperty('email', 'test@example.com')
    })

    it('should login successfully with email instead of username', async () => {
      const loginData = {
        username: 'test@example.com', // Using email
        password: 'password123',
      }

      const response = await request.post('/login', loginData)
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('token')
    })

    it('should not login with incorrect password', async () => {
      const loginData = {
        username: 'testuser',
        password: 'wrongpassword',
      }

      const response = await request.post('/login', loginData)
      expect(response.status).toBe(401)
      expect(response.text).toBe('Invalid username or password')
    })

    it('should not login with non-existent username', async () => {
      const loginData = {
        username: 'nonexistent',
        password: 'password123',
      }

      const response = await request.post('/login', loginData)
      expect(response.status).toBe(401)
      expect(response.text).toBe('Invalid username or password')
    })

    it('should not be able to access projects without a valid token', async () => {
      const response = await request.get('/projects')
      expect(response.status).toBe(401)
      expect(response.text).toBe('Unauthorized')
    })

    it('should not be able to access projects with an invalid token', async () => {
      const response = await request.get('/projects').set('Authorization', 'invalid-token')
      expect(response.status).toBe(401)
      expect(response.text).toBe('Unauthorized')
    })
  })
})
