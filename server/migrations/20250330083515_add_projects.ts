import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema
    .createTable('projects', function (table) {
      table.increments('id')
      table.string('name')

      table.dateTime('created_at').defaultTo(knex.fn.now())
      table.dateTime('updated_at').defaultTo(knex.fn.now())
    })
    .alterTable('todos', function (table) {
      table.integer('project_id').unsigned().references('projects.id').onDelete('CASCADE')

      table.dateTime('created_at').defaultTo(knex.fn.now())
      table.dateTime('updated_at').defaultTo(knex.fn.now())
    })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema
    .alterTable('todos', function (table) {
      table.dropColumn('project_id')
      table.dropColumn('created_at')
      table.dropColumn('updated_at')
    })
    .dropTable('projects')
}
