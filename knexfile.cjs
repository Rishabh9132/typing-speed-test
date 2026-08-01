// Knex configuration — used only for schema migrations.
// Runtime queries go through Sequelize (see models/).
require('dotenv').config();

/** @type {import('knex').Knex.Config} */
const config = {
  client: 'pg',
  connection: {
    host: process.env.DB_ADDRESS || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'admin',
    database: process.env.DB_NAME || 'postgres',
  },
  migrations: {
    directory: './migrations',
    extension: 'cjs',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: './seeds',
    extension: 'cjs',
  },
  debug: process.env.DB_DEBUG === 'true',
};

module.exports = {
  development: config,
  production: config,
};
