import { api } from '../api.js';
import { getUser } from '../user.js';
import { TypingEngine } from '../typingEngine.js';

const DURATIONS = [15, 30, 60, 120];

// Renders the free speed-test view into `root`. Returns a cleanup function.
export function renderTest(root) {
  let duration = 60;
  let engine = null;
  let text = '';

  root.innerHTML = `
    <header class="page-head">
      <h1>Speed Test</h1>
      <p class="muted">Type the passage as fast and accurately as you can. The timer starts on your first keystroke.</p>
    </header>

    <div class="duration-picker" id="durations" role="group" aria-label="Test duration">
      <span class="muted small">Duration:</span>
      ${DURATIONS.map((d) => `<button class="pill${d === 60 ? ' active' : ''}" data-sec="${d}">${d}s</button>`).join('')}
    </div>

    <section class="stat-row">
      <div class="stat"><span id="s-time">60</span><small>seconds</small></div>
      <div class="stat"><span id="s-wpm">0</span><small>wpm</small></div>
      <div class="stat"><span id="s-cpm">0</span><small>cpm</small></div>
      <div class="stat"><span id="s-acc">100%</span><small>accuracy</small></div>
    </section>

    <div id="display" class="text-display" aria-hidden="true"></div>
    <textarea id="input" class="input" placeholder="Click here and start typing..."
      autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></textarea>

    <div class="controls">
      <button id="restart" class="btn">↻ New Test</button>
    </div>

    <section class="panel">
      <h3>🏆 Leaderboard</h3>
      <table class="table">
        <thead><tr><th>#</th><th>Name</th><th>WPM</th><th>Accuracy</th></tr></thead>
        <tbody id="lb"><tr><td colspan="4" class="empty">Loading…</td></tr></tbody>
      </table>
    </section>

    <div id="result-modal" class="modal hidden">
      <div class="modal-card">
        <h2>Time's up! 🎉</h2>
        <div class="result-grid">
          <div><span id="r-wpm">0</span><small>WPM</small></div>
          <div><span id="r-cpm">0</span><small>CPM</small></div>
          <div><span id="r-acc">0%</span><small>Accuracy</small></div>
        </div>
        <p id="r-pct" class="accent"></p>
        <button id="r-again" class="btn btn-primary">Try Again</button>
      </div>
    </div>
  `;

  const el = (id) => root.querySelector('#' + id);
  const durWrap = el('durations');
  const display = el('display');
  const input = el('input');

  async function newTest() {
    if (engine) engine.destroy();
    try { ({ text } = await api.getText()); }
    catch { text = 'The quick brown fox jumps over the lazy dog.'; }
    el('s-time').textContent = duration;
    el('s-wpm').textContent = '0';
    el('s-cpm').textContent = '0';
    el('s-acc').textContent = '100%';
    el('result-modal').classList.add('hidden');
    setDurButtons(false);

    engine = new TypingEngine({
      target: text, display, input, mode: 'timed', duration,
      onTick: (t) => { el('s-time').textContent = Math.max(t, 0); },
      onProgress: (s) => {
        if (s.started) setDurButtons(true);
        el('s-wpm').textContent = s.wpm;
        el('s-cpm').textContent = s.cpm;
        el('s-acc').textContent = `${Math.round(s.accuracy)}%`;
      },
      onComplete: onFinish,
    });
    input.focus();
  }

  function setDurButtons(disabled) {
    durWrap.querySelectorAll('.pill').forEach((b) => { b.disabled = disabled; });
  }

  async function onFinish(s) {
    el('r-wpm').textContent = s.wpm;
    el('r-cpm').textContent = s.cpm;
    el('r-acc').textContent = `${Math.round(s.accuracy)}%`;
    el('r-pct').textContent = '';
    el('result-modal').classList.remove('hidden');
    try {
      const user = getUser();
      const data = await api.saveResult({
        username: user ? user.username : 'anonymous',
        wpm: s.wpm, cpm: s.cpm, accuracy: Number(s.accuracy.toFixed(2)),
        characters: s.typed, errors: s.errors, duration,
      });
      if (data.percentile != null) {
        el('r-pct').textContent = `You're faster than ${data.percentile}% of all attempts.`;
      }
      loadLeaderboard();
    } catch {
      el('r-pct').textContent = 'Could not save result (server unavailable).';
    }
  }

  async function loadLeaderboard() {
    try {
      const rows = await api.getLeaderboard(10);
      const tbody = el('lb');
      if (!rows.length) { tbody.innerHTML = '<tr><td colspan="4" class="empty">No scores yet — be the first!</td></tr>'; return; }
      const medals = ['🥇', '🥈', '🥉'];
      tbody.innerHTML = rows.map((r, i) =>
        `<tr><td>${medals[i] || i + 1}</td><td>${esc(r.username)}</td><td class="accent">${r.wpm}</td><td>${Number(r.accuracy).toFixed(0)}%</td></tr>`
      ).join('');
    } catch { /* keep */ }
  }

  durWrap.addEventListener('click', (e) => {
    const b = e.target.closest('.pill');
    if (!b || b.disabled) return;
    duration = Number(b.dataset.sec);
    durWrap.querySelectorAll('.pill').forEach((x) => x.classList.toggle('active', x === b));
    newTest();
  });
  el('restart').addEventListener('click', newTest);
  el('r-again').addEventListener('click', newTest);

  newTest();
  loadLeaderboard();

  return () => { if (engine) engine.destroy(); };
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
