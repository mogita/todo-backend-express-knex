import knex from './connection.ts'

async function all(project_id: number) {
  return knex('todos').where({ project_id })
}

async function get(id: number) {
  const results = await knex('todos').where({ id })
  return results[0]
}

async function create(project_id: number, title: string, order: number) {
  const results = await knex('todos').insert({ project_id, title, order }).returning('*')
  return results[0]
}

async function update(id: number, properties: { title: string; order: number }) {
  const results = await knex('todos')
    .where({ id })
    .update({ ...properties })
    .returning('*')
  return results[0]
}

// delete is a reserved keyword
async function del(id: number) {
  const results = await knex('todos').where({ id }).del().returning('*')
  return results[0]
}

async function clear(project_id: number) {
  return knex('todos').where({ project_id }).del().returning('*')
}

export default {
  all,
  get,
  create,
  update,
  delete: del,
  clear,
}
