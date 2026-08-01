import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';
import { Op } from 'sequelize';
import {
  sequelize, TypingResult, User, Lesson, LessonProgress,
} from './models/index.js';
import { runMigrations, runSeeds } from './migrate.js';
import { PARAGRAPHS } from './texts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

/* ------------------------------ Speed test -------------------------------- */

// Return a random paragraph for a free-typing test run.
app.get('/api/text', (_req, res) => {
  const idx = Math.floor(Math.random() * PARAGRAPHS.length);
  res.json({ id: idx, text: PARAGRAPHS[idx] });
});

// Save a completed speed-test result.
app.post('/api/results', async (req, res) => {
  try {
    const b = req.body ?? {};
    const username = String(b.username ?? 'anonymous').trim().slice(0, 40) || 'anonymous';
    const wpm = clampInt(b.wpm, 0, 500);
    const cpm = clampInt(b.cpm, 0, 5000);
    const accuracy = clampNum(b.accuracy, 0, 100);
    const characters = clampInt(b.characters, 0, 100000);
    const errors = clampInt(b.errors, 0, 100000);
    const duration = clampInt(b.duration, 1, 3600);

    const row = await TypingResult.create({
      username, wpm, cpm, accuracy, characters, errors, duration,
    });

    const total = await TypingResult.count();
    const below = await TypingResult.count({ where: { wpm: { [Op.lte]: wpm } } });
    const percentile = total > 0 ? Math.round((below / total) * 100) : 100;

    res.status(201).json({ id: row.id, created_at: row.created_at, percentile });
  } catch (err) {
    console.error('POST /api/results failed:', err);
    res.status(500).json({ error: 'Failed to save result' });
  }
});

// Top scores leaderboard.
app.get('/api/leaderboard', async (req, res) => {
  try {
    const limit = clampInt(req.query.limit, 1, 100) || 10;
    const rows = await TypingResult.findAll({
      attributes: ['username', 'wpm', 'cpm', 'accuracy', 'created_at'],
      order: [['wpm', 'DESC'], ['accuracy', 'DESC'], ['created_at', 'ASC']],
      limit,
      raw: true,
    });
    res.json(rows);
  } catch (err) {
    console.error('GET /api/leaderboard failed:', err);
    res.status(500).json({ error: 'Failed to load leaderboard' });
  }
});

/* --------------------------------- Users ---------------------------------- */

// Find-or-create a user by name. Returns the identity used to key progress.
app.post('/api/users', async (req, res) => {
  try {
    const username = String(req.body?.username ?? '').trim().slice(0, 40);
    if (!username) return res.status(400).json({ error: 'username is required' });
    const [user] = await User.findOrCreate({
      where: { username },
      defaults: { username },
    });
    res.json({ id: user.id, username: user.username });
  } catch (err) {
    console.error('POST /api/users failed:', err);
    res.status(500).json({ error: 'Failed to resolve user' });
  }
});

// All progress rows for a user, keyed by lesson_key.
app.get('/api/users/:id/progress', async (req, res) => {
  try {
    const userId = clampInt(req.params.id, 1, Number.MAX_SAFE_INTEGER);
    const rows = await LessonProgress.findAll({ where: { user_id: userId }, raw: true });
    res.json(byLessonKey(rows));
  } catch (err) {
    console.error('GET /api/users/:id/progress failed:', err);
    res.status(500).json({ error: 'Failed to load progress' });
  }
});

/* -------------------------------- Lessons --------------------------------- */

// Lesson catalog grouped by unit. If ?userId is passed, each lesson is decorated
// with the user's progress and a `locked` flag (sequential unlock).
app.get('/api/lessons', async (req, res) => {
  try {
    const lessons = await Lesson.findAll({
      attributes: ['lesson_key', 'unit', 'unit_order', 'lesson_order', 'title', 'type', 'new_keys', 'target_wpm', 'duration'],
      order: [['lesson_order', 'ASC']],
      raw: true,
    });

    let progress = {};
    const userId = req.query.userId ? clampInt(req.query.userId, 1, Number.MAX_SAFE_INTEGER) : null;
    if (userId) {
      const rows = await LessonProgress.findAll({ where: { user_id: userId }, raw: true });
      progress = byLessonKey(rows);
    }

    let prevCompleted = true; // first lesson is always unlocked
    const decorated = lessons.map((l) => {
      const p = progress[l.lesson_key] || null;
      const locked = userId ? !prevCompleted : false;
      prevCompleted = p ? p.completed : false;
      return {
        ...l,
        locked,
        progress: p
          ? { stars: p.stars, best_wpm: p.best_wpm, best_accuracy: Number(p.best_accuracy), completed: p.completed, attempts: p.attempts }
          : null,
      };
    });

    // Preserve unit order.
    const units = [];
    const seen = new Map();
    for (const l of decorated) {
      if (!seen.has(l.unit)) {
        seen.set(l.unit, units.length);
        units.push({ unit: l.unit, unit_order: l.unit_order, lessons: [] });
      }
      units[seen.get(l.unit)].lessons.push(l);
    }
    res.json(units);
  } catch (err) {
    console.error('GET /api/lessons failed:', err);
    res.status(500).json({ error: 'Failed to load lessons' });
  }
});

// Full lesson including drill content.
app.get('/api/lessons/:key', async (req, res) => {
  try {
    const lesson = await Lesson.findOne({ where: { lesson_key: req.params.key }, raw: true });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    res.json(lesson);
  } catch (err) {
    console.error('GET /api/lessons/:key failed:', err);
    res.status(500).json({ error: 'Failed to load lesson' });
  }
});

// Record a lesson attempt. Upserts best score + stars and marks completion.
app.post('/api/lessons/:key/progress', async (req, res) => {
  try {
    const lessonKey = req.params.key;
    const lesson = await Lesson.findOne({ where: { lesson_key: lessonKey }, raw: true });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    const b = req.body ?? {};
    const userId = clampInt(b.userId, 1, Number.MAX_SAFE_INTEGER);
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const wpm = clampInt(b.wpm, 0, 500);
    const accuracy = clampNum(b.accuracy, 0, 100);
    const stars = computeStars(accuracy, wpm, lesson.target_wpm);

    const [row, created] = await LessonProgress.findOrCreate({
      where: { user_id: userId, lesson_key: lessonKey },
      defaults: {
        user_id: userId, lesson_key: lessonKey,
        stars, best_wpm: wpm, best_accuracy: accuracy, attempts: 1, completed: true,
      },
    });

    if (!created) {
      row.attempts += 1;
      row.stars = Math.max(row.stars, stars);
      row.best_wpm = Math.max(row.best_wpm, wpm);
      row.best_accuracy = Math.max(Number(row.best_accuracy), accuracy);
      row.completed = true;
      row.updated_at = new Date();
      await row.save();
    }

    res.status(created ? 201 : 200).json({
      lesson_key: lessonKey,
      stars: row.stars,
      earned_stars: stars,
      best_wpm: row.best_wpm,
      best_accuracy: Number(row.best_accuracy),
      attempts: row.attempts,
      completed: row.completed,
    });
  } catch (err) {
    console.error('POST /api/lessons/:key/progress failed:', err);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

/* -------------------------------- Helpers --------------------------------- */

function computeStars(accuracy, wpm, targetWpm) {
  if (accuracy >= 97 && wpm >= targetWpm) return 3;
  if (accuracy >= 93) return 2;
  return 1; // completing the drill always earns at least one star
}

function byLessonKey(rows) {
  const map = {};
  for (const r of rows) {
    map[r.lesson_key] = {
      stars: r.stars,
      best_wpm: r.best_wpm,
      best_accuracy: Number(r.best_accuracy),
      attempts: r.attempts,
      completed: r.completed,
    };
  }
  return map;
}

function clampInt(v, min, max) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}
function clampNum(v, min, max) {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Number(n.toFixed(2))));
}

async function start() {
  await runMigrations();
  await runSeeds();
  await sequelize.authenticate();
  app.listen(PORT, () => {
    console.log(`Typing speed test running at http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
