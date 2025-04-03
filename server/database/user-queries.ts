import knex from './connection.ts'

export interface User {
  id: number
  username: string
  email: string
  password: string
  created_at: Date
  updated_at: Date
}

async function all(): Promise<User[]> {
  return knex('users')
}

async function get(id: number): Promise<User | undefined> {
  const results = await knex('users').where({ id })
  return results[0]
}

async function findByEmail(email: string): Promise<User | undefined> {
  const results = await knex('users').where({ email })
  return results[0]
}

async function findByUsername(username: string): Promise<User | undefined> {
  const results = await knex('users').where({ username })
  return results[0]
}

async function create(username: string, email: string, password: string): Promise<User> {
  const results = await knex('users').insert({ username, email, password }).returning('*')
  return results[0]
}

async function update(id: number, properties: { username?: string; email?: string; password?: string }): Promise<User> {
  const results = await knex('users')
    .where({ id })
    .update({ ...properties })
    .returning('*')
  return results[0]
}

// delete is a reserved keyword
async function del(id: number): Promise<User> {
  const results = await knex('users').where({ id }).del().returning('*')
  return results[0]
}

// NOTE: Use with extra caution!
async function clear(): Promise<User[]> {
  return knex('users').del().returning('*')
}

export default {
  all,
  get,
  findByEmail,
  findByUsername,
  create,
  update,
  delete: del,
  clear,
}
