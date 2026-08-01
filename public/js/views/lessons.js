import { api } from '../api.js';
import { getUser } from '../user.js';

// Renders the lesson catalog grouped by unit, with progress + sequential unlock.
export async function renderLessons(root) {
  const user = getUser();
  root.innerHTML = `
    <header class="page-head">
      <h1>Learn to Type</h1>
      <p class="muted">Master touch typing one step at a time — from the home row to full fluency. Complete a lesson to unlock the next.</p>
    </header>
    <div id="lessons-progress" class="course-progress"></div>
    <div id="units" class="units"><p class="muted">Loading lessons…</p></div>
  `;

  let units;
  try {
    units = await api.getLessons(user ? user.id : null);
  } catch (e) {
    root.querySelector('#units').innerHTML = `<p class="error">Failed to load lessons: ${e.message}</p>`;
    return () => {};
  }

  const allLessons = units.flatMap((u) => u.lessons);
  const done = allLessons.filter((l) => l.progress?.completed).length;
  const totalStars = allLessons.reduce((n, l) => n + (l.progress?.stars || 0), 0);
  root.querySelector('#lessons-progress').innerHTML = `
    <div class="cp-bar"><div class="cp-fill" style="width:${allLessons.length ? (done / allLessons.length) * 100 : 0}%"></div></div>
    <div class="cp-meta"><span>${done}/${allLessons.length} lessons complete</span><span>⭐ ${totalStars}/${allLessons.length * 3} stars</span></div>
  `;

  root.querySelector('#units').innerHTML = units.map(unitHtml).join('');
  return () => {};
}

function unitHtml(u) {
  return `
    <section class="unit">
      <h2 class="unit-title">${esc(u.unit)}</h2>
      <div class="lesson-list">
        ${u.lessons.map(cardHtml).join('')}
      </div>
    </section>`;
}

function cardHtml(l) {
  const n = l.lesson_order + 1;
  const p = l.progress;
  const locked = l.locked;
  const stars = p ? p.stars : 0;
  const typeIcon = { review: '↻', wrap: '🎁', assessment: '⏱', lesson: '' }[l.type] || '';
  const keys = (l.new_keys || []).length
    ? `<span class="key-chips">${l.new_keys.map((k) => `<kbd>${esc(k === ' ' ? 'space' : k)}</kbd>`).join('')}</span>`
    : '';

  return `
    <div class="lesson-card${locked ? ' locked' : ''}${p?.completed ? ' done' : ''}">
      <div class="lc-num">${p?.completed ? '✓' : n}</div>
      <div class="lc-body">
        <div class="lc-title">${esc(l.title)} ${typeIcon ? `<span class="lc-type">${typeIcon}</span>` : ''}</div>
        ${keys}
        <div class="stars" aria-label="${stars} of 3 stars">${starRow(stars)}</div>
      </div>
      <div class="lc-action">
        ${p ? `<span class="lc-best">${p.best_wpm} wpm · ${Math.round(p.best_accuracy)}%</span>` : ''}
        ${locked
          ? '<button class="btn lc-start" disabled>🔒 Locked</button>'
          : `<a class="btn btn-primary lc-start" href="#/lessons/${encodeURIComponent(l.lesson_key)}">▶ ${p ? 'Practice' : 'Start'}</a>`}
      </div>
    </div>`;
}

function starRow(n) {
  let s = '';
  for (let i = 0; i < 3; i++) s += `<span class="star${i < n ? ' filled' : ''}">★</span>`;
  return s;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
