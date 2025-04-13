import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema
    .createTable('users', (table) => {
      table.increments('id').primary()
      table.string('username').unique().notNullable()
      table.string('email').unique().notNullable()
      table.string('password').notNullable()
      table.timestamps(true, true)
    })
    .createTable('organizations', (table) => {
      table.increments('id').primary()
      table.string('name').unique().notNullable()
      table.integer('owner_id').unsigned().notNullable()
      table.timestamps(true, true)

      table.foreign('owner_id').references('id').inTable('users')
    })
    .createTable('org_members', (table) => {
      table.increments('id').primary()
      table.integer('user_id').unsigned().notNullable()
      table.integer('org_id').unsigned().notNullable()
      table.string('role').notNullable()
      table.timestamps(true, true)

      table.foreign('user_id').references('id').inTable('users')
      table.foreign('org_id').references('id').inTable('organizations')
    })
    .alterTable('projects', (table) => {
      table.integer('org_id').unsigned().notNullable()
      table.foreign('org_id').references('id').inTable('organizations')
    })
    .alterTable('todos', (table) => {
      table.integer('org_id').unsigned().notNullable()
      table.foreign('org_id').references('id').inTable('organizations')
    })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema
    .alterTable('todos', (table) => {
      table.dropForeign('org_id')
      table.dropColumn('org_id')
    })
    .alterTable('projects', (table) => {
      table.dropForeign('org_id')
      table.dropColumn('org_id')
    })
    .dropTableIfExists('org_members')
    .dropTableIfExists('organizations')
    .dropTableIfExists('users')
}
