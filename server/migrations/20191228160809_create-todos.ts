import type { Knex } from 'knex'

export const up = function (knex: Knex) {
  return knex.schema.createTable('todos', function (table) {
    table.increments('id')
    table.string('title')
    table.integer('order')
    table.boolean('completed').defaultTo(false)
  })
}

export const down = function (knex: Knex) {
  return knex.schema.dropTable('todos')
}
