/**
 * Adds the lessons/tutorial domain: users, the lesson catalog, and per-user
 * lesson progress. typing_results (free speed test) is left untouched.
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.schema.createTable('users', (t) => {
    t.increments('id').primary();
    t.string('username', 40).notNullable().unique();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('lessons', (t) => {
    t.increments('id').primary();
    t.string('lesson_key', 80).notNullable().unique();
    t.string('unit', 60).notNullable();
    t.integer('unit_order').notNullable().defaultTo(0);
    t.integer('lesson_order').notNullable();
    t.string('title', 120).notNullable();
    t.string('type', 20).notNullable(); // lesson | review | wrap | assessment
    t.jsonb('new_keys').notNullable().defaultTo('[]');
    t.text('content').notNullable();
    t.integer('target_wpm').notNullable().defaultTo(15);
    t.integer('duration'); // seconds, for timed assessments (nullable)
    t.index(['lesson_order'], 'idx_lessons_order');
  });

  await knex.schema.createTable('lesson_progress', (t) => {
    t.increments('id').primary();
    t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('lesson_key', 80).notNullable().references('lesson_key').inTable('lessons').onDelete('CASCADE');
    t.integer('stars').notNullable().defaultTo(0); // 0-3
    t.integer('best_wpm').notNullable().defaultTo(0);
    t.decimal('best_accuracy', 5, 2).notNullable().defaultTo(0);
    t.integer('attempts').notNullable().defaultTo(0);
    t.boolean('completed').notNullable().defaultTo(false);
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.unique(['user_id', 'lesson_key']);
  });

  await knex.raw('ALTER TABLE lesson_progress ADD CONSTRAINT chk_stars CHECK (stars >= 0 AND stars <= 3)');
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('lesson_progress');
  await knex.schema.dropTableIfExists('lessons');
  await knex.schema.dropTableIfExists('users');
};
