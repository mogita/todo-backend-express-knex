// Abstraction layer to handle knex configuration per enviornment.
const config = require('../knexfile.js')[process.env.NODE_ENV]

module.exports = require('knex')(config)
