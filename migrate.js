import Knex from 'knex';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const knexConfig = require('./knexfile.cjs');

// Runs pending Knex migrations. Called on server startup and also usable
// standalone via `npm run migrate`.
export async function runMigrations() {
  const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  const knex = Knex(knexConfig[env]);
  try {
    const [batch, applied] = await knex.migrate.latest();
    if (applied.length === 0) {
      console.log('Migrations: already up to date.');
    } else {
      console.log(`Migrations: batch ${batch} applied ->`, applied.join(', '));
    }
  } finally {
    await knex.destroy();
  }
}

// Runs Knex seeds (idempotent upserts). Called on startup so the lesson catalog
// is always present and in sync with curriculum.js.
export async function runSeeds() {
  const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  const knex = Knex(knexConfig[env]);
  try {
    await knex.seed.run();
    console.log('Seeds: lesson catalog synced.');
  } finally {
    await knex.destroy();
  }
}

// Allow `node migrate.js` to run migrations + seeds directly.
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(runSeeds)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration/seed failed:', err);
      process.exit(1);
    });
}
