import knex from './connection.ts'

export interface Organization {
  id: number
  name: string
  owner_id: number
  created_at: Date
  updated_at: Date
}

async function all(): Promise<Organization[]> {
  return knex('organizations')
}

async function get(id: number): Promise<Organization | undefined> {
  const results = await knex('organizations').where({ id })
  return results[0]
}

async function create(name: string, owner_id: number): Promise<Organization> {
  const results = await knex('organizations').insert({ name, owner_id }).returning('*')
  return results[0]
}

async function update(id: number, properties: { name?: string; owner_id?: number }): Promise<Organization> {
  const results = await knex('organizations')
    .where({ id })
    .update({ ...properties })
    .returning('*')
  return results[0]
}

// delete is a reserved keyword
async function del(id: number): Promise<Organization> {
  const results = await knex('organizations').where({ id }).del().returning('*')
  return results[0]
}

// NOTE: Use with extra caution!
async function clear(): Promise<Organization[]> {
  return knex('organizations').del().returning('*')
}

export default {
  all,
  get,
  create,
  update,
  delete: del,
  clear,
}
