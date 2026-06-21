/**
 * API client — thin fetch wrapper.
 * All API calls go through here.
 */

const API_BASE = '/api';

export async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const resp = await fetch(url, config);
  const data = await resp.json().catch(() => null);

  if (!resp.ok) {
    const err = new Error(data?.error || `HTTP ${resp.status}`);
    err.status = resp.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  login: (name, access_code) =>
    apiFetch('/login', { method: 'POST', body: { name, access_code } }),

  logout: () =>
    apiFetch('/logout', { method: 'POST' }),

  me: () =>
    apiFetch('/me'),

  config: () =>
    apiFetch('/config'),

  guests: () =>
    apiFetch('/guests'),

  getPreferences: () =>
    apiFetch('/preferences'),

  setPreferences: (prefs) =>
    apiFetch('/preferences', { method: 'POST', body: prefs }),

  foods: () =>
    apiFetch('/foods'),

  addFood: (name) =>
    apiFetch('/foods', { method: 'POST', body: { name } }),

  vote: (votes) =>
    apiFetch('/foods/vote', { method: 'POST', body: { votes } }),

  myVotes: () =>
    apiFetch('/foods/votes'),
};
