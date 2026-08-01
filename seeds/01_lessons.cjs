/**
 * Seeds the lesson catalog from curriculum.js. Uses upsert-on-conflict so it is
 * idempotent and safe to re-run (e.g. on every server boot) without disturbing
 * existing lesson_progress rows that reference lessons by lesson_key.
 * @param {import('knex').Knex} knex
 */
exports.seed = async function seed(knex) {
  // curriculum.js is ESM; load it via dynamic import from this CJS seed.
  const { CURRICULUM } = await import('../curriculum.js');

  const rows = CURRICULUM.map((l) => ({
    lesson_key: l.lesson_key,
    unit: l.unit,
    unit_order: l.unit_order,
    lesson_order: l.lesson_order,
    title: l.title,
    type: l.type,
    new_keys: JSON.stringify(l.new_keys),
    content: l.content,
    target_wpm: l.target_wpm,
    duration: l.duration,
  }));

  await knex('lessons')
    .insert(rows)
    .onConflict('lesson_key')
    .merge([
      'unit', 'unit_order', 'lesson_order', 'title', 'type',
      'new_keys', 'content', 'target_wpm', 'duration',
    ]);
};
