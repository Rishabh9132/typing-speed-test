// Thin wrapper around the REST API.
async function req(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try { msg = (await res.json()).error || msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  return res.json();
}

export const api = {
  // Speed test
  getText: () => req('/api/text'),
  saveResult: (body) => req('/api/results', post(body)),
  getLeaderboard: (limit = 10) => req(`/api/leaderboard?limit=${limit}`),

  // Users
  resolveUser: (username) => req('/api/users', post({ username })),
  getProgress: (userId) => req(`/api/users/${userId}/progress`),

  // Lessons
  getLessons: (userId) => req(`/api/lessons${userId ? `?userId=${userId}` : ''}`),
  getLesson: (key) => req(`/api/lessons/${encodeURIComponent(key)}`),
  saveLessonProgress: (key, body) => req(`/api/lessons/${encodeURIComponent(key)}/progress`, post(body)),
};

function post(body) {
  return { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}
