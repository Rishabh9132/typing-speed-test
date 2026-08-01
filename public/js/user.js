import { api } from './api.js';

const KEY = 'typefluent.user';
let current = null;

try {
  const raw = localStorage.getItem(KEY);
  if (raw) current = JSON.parse(raw);
} catch { /* ignore malformed */ }

export function getUser() {
  return current;
}

// Resolve (find-or-create) a user by name and persist locally.
export async function setUser(username) {
  const user = await api.resolveUser(username);
  current = user;
  localStorage.setItem(KEY, JSON.stringify(user));
  window.dispatchEvent(new CustomEvent('user:changed', { detail: user }));
  return user;
}
