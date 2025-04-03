import knex from './connection.ts'

export interface Project {
  id: number
  name: string
  org_id: number
  created_at: Date
  updated_at: Date
}

async function all(): Promise<Project[]> {
  return knex('projects')
}

async function get(id: number): Promise<Project | undefined> {
  const results = await knex('projects').where({ id })
  return results[0]
}

async function create(name: string, org_id: number): Promise<Project> {
  const results = await knex('projects').insert({ name, org_id }).returning('*')
  return results[0]
}

async function update(id: number, properties: { name: string }): Promise<Project> {
  const results = await knex('projects')
    .where({ id })
    .update({ ...properties })
    .returning('*')
  return results[0]
}

// delete is a reserved keyword
async function del(id: number): Promise<Project> {
  const results = await knex('projects').where({ id }).del().returning('*')
  return results[0]
}

async function clear(): Promise<Project[]> {
  return knex('projects').del().returning('*')
}

export default {
  all,
  get,
  create,
  update,
  delete: del,
  clear,
}
