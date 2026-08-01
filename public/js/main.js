import { getUser, setUser } from './user.js';
import { renderTest } from './views/test.js';
import { renderLessons } from './views/lessons.js';
import { renderPlayer } from './views/player.js';

const app = document.getElementById('app');
let cleanup = null;

// --- routing ----------------------------------------------------------------
async function route() {
  if (cleanup) { try { cleanup(); } catch { /* ignore */ } cleanup = null; }
  const hash = location.hash || '#/lessons';
  const parts = hash.replace(/^#\//, '').split('/');
  setActiveNav(parts[0]);
  window.scrollTo({ top: 0 });

  if (parts[0] === 'test') {
    cleanup = renderTest(app);
  } else if (parts[0] === 'lessons' && parts[1]) {
    cleanup = await renderPlayer(app, decodeURIComponent(parts[1]));
  } else {
    cleanup = await renderLessons(app);
  }
}

function setActiveNav(view) {
  document.querySelectorAll('[data-nav]').forEach((a) => {
    a.classList.toggle('active', a.dataset.nav === view);
  });
}

// --- user chip + onboarding modal -------------------------------------------
const modal = document.getElementById('user-modal');
const form = document.getElementById('user-form');
const nameInput = document.getElementById('user-input');

function refreshChip() {
  const u = getUser();
  document.getElementById('user-name').textContent = u ? u.username : 'Sign in';
}

function openModal() {
  modal.classList.remove('hidden');
  const u = getUser();
  nameInput.value = u ? u.username : '';
  nameInput.focus();
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  if (!name) return;
  try {
    await setUser(name);
    modal.classList.add('hidden');
    refreshChip();
    route(); // re-render so progress shows
  } catch (err) {
    alert('Could not sign in: ' + err.message);
  }
});

document.getElementById('user-chip').addEventListener('click', openModal);
window.addEventListener('user:changed', refreshChip);
window.addEventListener('hashchange', route);

// --- boot -------------------------------------------------------------------
refreshChip();
if (!getUser()) openModal();
route();
