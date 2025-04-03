import knex from './connection.ts'

export interface Organization {
  id: number
  name: string
  owner_id: number
  created_at: Date
  updated_at: Date
}

async function all(user_id: number): Promise<Organization[]> {
  // first query the org membership for the user id, then query the orgs
  const orgMemberships = await knex('org_members').where({ user_id }).returning('org_id')
  const orgIds = orgMemberships.map((membership) => membership.org_id)
  return knex('organizations').whereIn('id', orgIds)
}

async function get(id: number): Promise<Organization | undefined> {
  const results = await knex('organizations').where({ id })
  return results[0]
}

async function findByOwnerId(owner_id: number): Promise<Organization | undefined> {
  const results = await knex('organizations').where({ owner_id })
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
  findByOwnerId,
  create,
  update,
  delete: del,
  clear,
}
