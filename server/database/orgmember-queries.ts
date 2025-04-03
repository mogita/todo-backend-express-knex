import knex from './connection.ts'

export interface OrgMember {
  id: number
  org_id: number
  user_id: number
  role: string
  created_at: Date
  updated_at: Date
}

async function all(org_id: number): Promise<OrgMember[]> {
  return knex('org_members').where({ org_id })
}

async function get(id: number): Promise<OrgMember | undefined> {
  const results = await knex('org_members').where({ id })
  return results[0]
}

async function findByOrgIdAndUserId(org_id: number, user_id: number): Promise<OrgMember | undefined> {
  const results = await knex('org_members').where({ org_id, user_id })
  return results[0]
}

async function create(org_id: number, user_id: number, role: string): Promise<OrgMember> {
  const results = await knex('org_members').insert({ org_id, user_id, role }).returning('*')
  return results[0]
}

async function update(
  id: number,
  properties: { org_id?: number; user_id?: number; role?: string },
): Promise<OrgMember> {
  const results = await knex('org_members')
    .where({ id })
    .update({ ...properties })
    .returning('*')
  return results[0]
}

// delete is a reserved keyword
async function del(org_id: number, user_id: number): Promise<OrgMember> {
  // FIXME: check if the user has less than 1 org after deletion and need to prevent that
  const results = await knex('org_members').where({ org_id, user_id }).del().returning('*')
  return results[0]
}

// NOTE: Use with extra caution!
async function clear(): Promise<OrgMember[]> {
  return knex('org_members').del().returning('*')
}

export default {
  all,
  get,
  findByOrgIdAndUserId,
  create,
  update,
  delete: del,
  clear,
}
