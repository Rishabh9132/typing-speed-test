# CLAUDE.md — TypeFluent

Guidance for Claude Code when working in this repo.

## What this is

A touch-typing tutor + speed test. Node/Express API, Postgres, and a **vanilla
ES-module SPA** frontend (no build step, no framework). Sequelize is the ORM;
Knex owns migrations and the lesson seed.

## Commands

```bash
npm start          # runs migrations + seeds, then serves on :3000
npm run dev        # same, with auto-reload (node --watch)
npm run migrate    # knex migrate:latest
npm run seed       # reseed the lesson catalog from curriculum.js
npm test           # Playwright E2E (auto-starts the server via webServer)
```

A running Postgres is required. Copy `.env.example` to `.env` first.

## Architecture

- `server.js` — Express app + REST API. On boot it runs migrations, then seeds,
  then connects Sequelize. All request numbers are clamped server-side.
- `curriculum.js` — the single source of truth for lesson content. 20 lessons in
  5 units; drill text is generated **deterministically** (seeded PRNG) so
  reseeding never changes content. Editing lessons happens here, then `npm run seed`.
- `migrations/*.cjs`, `seeds/*.cjs` — Knex. **CJS on purpose**: the project is
  ESM (`type: module`) but Knex's CLI/files expect CommonJS. The seed loads
  `curriculum.js` via dynamic `import()`.
- `models/` — Sequelize models (`TypingResult`, `User`, `Lesson`,
  `LessonProgress`) + associations in `index.js`.
- `public/js/` — the SPA:
  - `main.js` — hash router + onboarding modal
  - `typingEngine.js` — shared typing/scoring logic (timed + complete modes)
  - `keyboard.js` + `fingerMap.js` — on-screen keyboard and the finger→key map
  - `handGuide.js` — home-row hand-placement guide + finger colour legend
  - `views/` — `test`, `lessons`, `player`

## Conventions & gotchas

- **Frontend is framework-free.** Keep it that way — plain ES modules, no bundler.
- **`fingerMap.js` is the source of truth** for which finger types which key and
  the finger colours. The keyboard, hand guide, and legend all derive from it.
- **Render the literal character** in the typing display (including normal
  spaces). Do NOT substitute a non-breaking space — it silently breaks accuracy
  scoring (a real bug that was fixed; a test now pins accuracy at 100%).
- The `TypingEngine` fires `onProgress` during construction, before the caller's
  `engine` variable is assigned — callbacks must not reference that variable; use
  the payload fields (e.g. `started`) instead.
- Lesson unlock is sequential: a lesson is unlocked once the previous one is
  completed (computed server-side in `GET /api/lessons`).

## Testing

Playwright specs live in `tests/`. They cover the speed test, lessons list +
unlock gating, the on-screen keyboard/finger guidance, the hand-placement guide,
lesson completion (asserts 100% accuracy → 3 stars), and cross-reload
persistence. Add a test alongside any behaviour change.
