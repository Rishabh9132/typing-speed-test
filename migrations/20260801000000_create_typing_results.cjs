/**
 * Creates the typing_results table that stores every completed test run.
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.schema.createTable('typing_results', (t) => {
    t.increments('id').primary();
    t.string('username', 40).notNullable().defaultTo('anonymous');
    t.integer('wpm').notNullable();
    t.integer('cpm').notNullable();
    t.decimal('accuracy', 5, 2).notNullable();
    t.integer('characters').notNullable().defaultTo(0);
    t.integer('errors').notNullable().defaultTo(0);
    t.integer('duration').notNullable().defaultTo(60);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index(['wpm'], 'idx_typing_results_wpm');
  });

  // Guard rails matching the app's validation bounds.
  await knex.raw('ALTER TABLE typing_results ADD CONSTRAINT chk_wpm CHECK (wpm >= 0 AND wpm <= 500)');
  await knex.raw('ALTER TABLE typing_results ADD CONSTRAINT chk_accuracy CHECK (accuracy >= 0 AND accuracy <= 100)');
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('typing_results');
};
