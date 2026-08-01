import { api } from '../api.js';
import { getUser } from '../user.js';
import { TypingEngine } from '../typingEngine.js';
import { createKeyboard } from '../keyboard.js';
import { fingerHint } from '../fingerMap.js';

// Renders the lesson player for `lessonKey`. Returns a cleanup function.
export async function renderPlayer(root, lessonKey) {
  const user = getUser();
  root.innerHTML = `<p class="muted">Loading lesson…</p>`;

  let lesson, units;
  try {
    [lesson, units] = await Promise.all([
      api.getLesson(lessonKey),
      api.getLessons(user ? user.id : null),
    ]);
  } catch (e) {
    root.innerHTML = `<p class="error">Failed to load lesson: ${e.message}</p><a class="btn" href="#/lessons">← Back to lessons</a>`;
    return () => {};
  }

  const ordered = units.flatMap((u) => u.lessons);
  const idx = ordered.findIndex((l) => l.lesson_key === lessonKey);
  const nextLesson = idx >= 0 ? ordered[idx + 1] : null;

  const isTimed = lesson.type === 'assessment' && lesson.duration;
  const target = lesson.content.replace(/\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim();

  root.innerHTML = `
    <div class="player">
      <div class="player-head">
        <a class="back" href="#/lessons">← Lessons</a>
        <div class="player-title">
          <span class="lc-num small">${idx + 1}</span>
          <h1>${esc(lesson.title)}</h1>
          <span class="badge badge-${lesson.type}">${lesson.type}</span>
        </div>
      </div>

      <div class="player-stats">
        ${isTimed ? `<div class="stat"><span id="p-time">${lesson.duration}</span><small>seconds</small></div>` : ''}
        <div class="stat"><span id="p-wpm">0</span><small>wpm</small></div>
        <div class="stat"><span id="p-acc">100%</span><small>accuracy</small></div>
        <div class="stat"><span id="p-prog">0%</span><small>progress</small></div>
      </div>

      <div id="hint" class="finger-hint">Click the text below, then start typing.</div>

      <div id="display" class="text-display lesson-text" tabindex="0" role="textbox" aria-label="Lesson text"></div>
      <textarea id="input" class="hidden-input" autocomplete="off" autocorrect="off"
        autocapitalize="off" spellcheck="false" aria-hidden="true"></textarea>
      <div id="blur-hint" class="blur-hint hidden">⌨️ Click the text to keep typing</div>

      <div id="keyboard"></div>

      <div class="controls center">
        <button id="restart" class="btn">↻ Restart Lesson</button>
      </div>

      <div id="lesson-result" class="modal hidden">
        <div class="modal-card">
          <h2 id="lr-heading">Lesson Complete! 🎉</h2>
          <div class="stars big" id="lr-stars"></div>
          <div class="result-grid">
            <div><span id="lr-wpm">0</span><small>WPM</small></div>
            <div><span id="lr-acc">0%</span><small>Accuracy</small></div>
          </div>
          <div class="lr-actions">
            <button id="lr-retry" class="btn">↻ Retry</button>
            ${nextLesson ? `<a id="lr-next" class="btn btn-primary" href="#/lessons/${encodeURIComponent(nextLesson.lesson_key)}">Next Lesson →</a>` : '<a class="btn btn-primary" href="#/lessons">Back to Lessons →</a>'}
          </div>
        </div>
      </div>
    </div>
  `;

  const el = (id) => root.querySelector('#' + id);
  const display = el('display');
  const input = el('input');
  const hint = el('hint');
  const kb = createKeyboard(el('keyboard'));
  let engine = null;

  function start() {
    if (engine) engine.destroy();
    el('lesson-result').classList.add('hidden');
    el('p-wpm').textContent = '0';
    el('p-acc').textContent = '100%';
    el('p-prog').textContent = '0%';
    if (isTimed) el('p-time').textContent = lesson.duration;

    engine = new TypingEngine({
      target, display, input,
      mode: isTimed ? 'timed' : 'complete',
      duration: isTimed ? lesson.duration : 60,
      onTick: (t) => { if (isTimed) el('p-time').textContent = Math.max(t, 0); },
      onProgress: (s) => {
        el('p-wpm').textContent = s.wpm;
        el('p-acc').textContent = `${Math.round(s.accuracy)}%`;
        el('p-prog').textContent = `${Math.round((s.typed / target.length) * 100)}%`;
        updateGuidance(s.nextChar);
      },
      onComplete: onFinish,
    });
    updateGuidance(target[0]);
    input.focus();
  }

  function updateGuidance(ch) {
    if (ch === undefined) { kb.clear(); hint.textContent = 'Done!'; return; }
    kb.highlightChar(ch);
    const shown = ch === ' ' ? 'Space' : ch;
    hint.innerHTML = `Next: <kbd>${esc(shown)}</kbd> &nbsp; ${esc(fingerHint(ch))}`;
  }

  async function onFinish(s) {
    kb.clear();
    el('lr-wpm').textContent = s.wpm;
    el('lr-acc').textContent = `${Math.round(s.accuracy)}%`;
    renderStars(el('lr-stars'), 0); // filled after save tells us earned stars

    let earned = starsFor(s.accuracy, s.wpm, lesson.target_wpm);
    renderStars(el('lr-stars'), earned);
    el('lesson-result').classList.remove('hidden');

    if (user) {
      try {
        const res = await api.saveLessonProgress(lessonKey, {
          userId: user.id, wpm: s.wpm, cpm: s.cpm,
          accuracy: Number(s.accuracy.toFixed(2)), characters: s.typed,
          errors: s.errors, durationSeconds: isTimed ? lesson.duration : Math.round((Date.now() - engine.startTime) / 1000),
        });
        renderStars(el('lr-stars'), res.earned_stars ?? earned);
      } catch { /* keep local stars */ }
    } else {
      el('lr-heading').textContent = 'Lesson Complete! (sign in to save)';
    }
  }

  // Focus management: keep the hidden input focused; dim when it loses focus.
  const focusInput = () => input.focus();
  display.addEventListener('click', focusInput);
  input.addEventListener('blur', () => { if (engine && !engine.finished) el('blur-hint').classList.remove('hidden'); });
  input.addEventListener('focus', () => el('blur-hint').classList.add('hidden'));
  el('restart').addEventListener('click', start);
  el('lr-retry').addEventListener('click', start);

  start();

  return () => { if (engine) engine.destroy(); display.removeEventListener('click', focusInput); };
}

// Mirror of the server's star rule so the modal can show stars instantly.
function starsFor(accuracy, wpm, targetWpm) {
  if (accuracy >= 97 && wpm >= targetWpm) return 3;
  if (accuracy >= 93) return 2;
  return 1;
}
function renderStars(container, n) {
  let s = '';
  for (let i = 0; i < 3; i++) s += `<span class="star${i < n ? ' filled' : ''}">★</span>`;
  container.innerHTML = s;
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
