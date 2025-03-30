import knex from './connection.ts'

async function all() {
  return knex('projects')
}

async function get(id: number) {
  const results = await knex('projects').where({ id })
  return results[0]
}

async function create(name: string) {
  const results = await knex('projects').insert({ name }).returning('*')
  return results[0]
}

async function update(id: number, properties: { name: string }) {
  const results = await knex('projects')
    .where({ id })
    .update({ ...properties })
    .returning('*')
  return results[0]
}

// delete is a reserved keyword
async function del(id: number) {
  const results = await knex('projects').where({ id }).del().returning('*')
  return results[0]
}

async function clear() {
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
