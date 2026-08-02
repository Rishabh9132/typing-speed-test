# ⌨️ TypeFluent — Learn to Type

A touch-typing tutor and speed test, backed by Postgres. Work through a 20-lesson
curriculum with an on-screen keyboard and finger guidance, or take a timed speed
test and climb the leaderboard.

## Features

- **Guided curriculum** — 20 lessons across 5 units (home row → full keyboard →
  capitals, numbers, symbols), modelled on classic touch-typing progressions.
  Lessons unlock sequentially as you complete them.
- **Lesson player** — on-screen keyboard with **colour-coded finger zones**,
  next-key highlighting, live finger guidance ("Use your left index finger"),
  and 0–3 star scoring based on speed and accuracy.
- **Speed test** — selectable durations (15/30/60/120s), live WPM / CPM /
  accuracy, per-character feedback, percentile ranking, and a leaderboard.
- **Progress tracking** — per-learner best WPM, accuracy, stars and completion,
  persisted to Postgres and restored across reloads.

## Stack

- **Backend** — Node.js + Express
- **ORM** — Sequelize (runtime queries)
- **Migrations & seeds** — Knex
- **Database** — PostgreSQL
- **Frontend** — vanilla ES-module SPA (hash router, no build step)
- **Testing** — Playwright (end-to-end)

## Getting started

### Prerequisites

- Node.js 18+
- A running PostgreSQL instance

### Setup

```bash
npm install
cp .env.example .env      # then edit .env with your Postgres credentials
npm start                 # runs migrations + seeds, then serves on :3000
```

Open http://localhost:3000.

### Run with Docker

Brings up Postgres + the app (migrations and the lesson seed run automatically on boot):

```bash
docker compose up --build
```

App → http://localhost:3000, Postgres → localhost:5432.

## Scripts

| Command                  | Description                                   |
| ------------------------ | --------------------------------------------- |
| `npm start`              | Run migrations + seeds, then start the server |
| `npm run dev`            | Start with auto-reload (`node --watch`)       |
| `npm run migrate`        | Apply Knex migrations                         |
| `npm run migrate:rollback` | Roll back the last migration batch          |
| `npm run seed`           | Re-seed the lesson catalog                    |
| `npm test`               | Run the Playwright end-to-end suite           |

## Project structure

```
typing-speed-test/
├── server.js            Express app + REST API
├── curriculum.js        Lesson catalog + deterministic drill generation
├── migrations/          Knex schema migrations
├── seeds/               Knex seed (loads the curriculum)
├── models/              Sequelize models (User, Lesson, LessonProgress, ...)
├── public/              Frontend SPA
│   ├── index.html
│   ├── style.css
│   └── js/              api, router, views, on-screen keyboard, finger map
└── tests/               Playwright E2E tests
```

## API

| Method | Route                          | Description                          |
| ------ | ------------------------------ | ------------------------------------ |
| GET    | `/api/text`                    | Random passage for the speed test    |
| POST   | `/api/results`                 | Save a speed-test result             |
| GET    | `/api/leaderboard`             | Top scores                           |
| POST   | `/api/users`                   | Find-or-create a learner by name     |
| GET    | `/api/lessons`                 | Lesson catalog (with progress)       |
| GET    | `/api/lessons/:key`            | A single lesson with drill content   |
| POST   | `/api/lessons/:key/progress`   | Record a lesson attempt              |
| GET    | `/api/users/:id/progress`      | A learner's progress                 |
