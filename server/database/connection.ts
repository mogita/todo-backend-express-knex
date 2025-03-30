// Abstraction layer to handle knex configuration per enviornment.
import config from '../knexfile.ts'
import knex from 'knex'
export default knex(config[process.env.NODE_ENV || 'development'])
