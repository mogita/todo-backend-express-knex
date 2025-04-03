import knex from './connection.ts'

export interface Todo {
  id: number
  project_id: number
  title: string
  order: number
  completed: boolean
  org_id: number
  created_at: Date
  updated_at: Date
}

async function all(project_id: number, org_id: number): Promise<Todo[]> {
  return knex('todos').where({ project_id, org_id })
}

async function get(id: number, org_id: number): Promise<Todo | undefined> {
  const results = await knex('todos').where({ id, org_id })
  return results[0]
}

async function create(
  project_id: number,
  title: string,
  order: number,
  completed: boolean,
  org_id: number,
): Promise<Todo> {
  const results = await knex('todos').insert({ project_id, title, order, completed, org_id }).returning('*')
  return results[0]
}

async function update(
  id: number,
  org_id: number,
  properties: { title: string; order: number; completed: boolean },
): Promise<Todo> {
  const results = await knex('todos')
    .where({ id, org_id })
    .update({ ...properties })
    .returning('*')
  return results[0]
}

// delete is a reserved keyword
async function del(id: number, org_id: number): Promise<Todo> {
  const results = await knex('todos').where({ id, org_id }).del().returning('*')
  return results[0]
}

async function clear(project_id: number, org_id: number): Promise<Todo[]> {
  return knex('todos').where({ project_id, org_id }).del().returning('*')
}

export default {
  all,
  get,
  create,
  update,
  delete: del,
  clear,
}
