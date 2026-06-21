/**
 * Shared app logic — runs on every page.
 * Handles: auth state, nav updates, login modal, logout, preferences trigger.
 */
import { api } from './api.mjs';
import { initPreferencesModal, openPreferencesModal } from './preferences.mjs';

const AUTH_TOKEN_KEY = 'sudobash_token';

// --- Auth State ---

function getToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function isLoggedIn() {
  return !!getToken();
}

// --- Nav Updates ---

async function updateNav() {
  const loginBtn = document.getElementById('nav-login-btn');
  const userInfo = document.getElementById('nav-user-info');
  const navHandle = document.getElementById('nav-handle');
  const navAvatar = document.getElementById('nav-avatar');

  if (!isLoggedIn()) {
    loginBtn?.classList.remove('hidden');
    userInfo?.classList.add('hidden');
    return;
  }

  try {
    const data = await api.me();
    loginBtn?.classList.add('hidden');
    userInfo?.classList.remove('hidden');

    const handle = data.preferences?.handle || data.name;
    if (navHandle) navHandle.textContent = handle;

    const avatar = data.preferences?.avatar;
    if (navAvatar && avatar) {
      navAvatar.src = `/static/avatars/${avatar}`;
      navAvatar.classList.remove('hidden');
    } else if (navAvatar) {
      navAvatar.classList.add('hidden');
    }

    // Auto-open preferences if none exist
    if (!data.preferences || Object.keys(data.preferences).length === 0) {
      openPreferencesModal();
    }
  } catch (err) {
    // Session expired or invalid
    clearToken();
    loginBtn?.classList.remove('hidden');
    userInfo?.classList.add('hidden');
  }
}

// --- Login ---

function initLogin() {
  const form = document.getElementById('login-form');
  const modal = document.getElementById('login-modal');
  const errorEl = document.getElementById('login-error');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl?.classList.add('hidden');

    const name = form.querySelector('[name="name"]').value.trim();
    const access_code = form.querySelector('[name="access_code"]').value.trim();

    try {
      const data = await api.login(name, access_code);
      setToken(data.token);
      modal?.classList.add('hidden');
      window.location.reload();
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = err.data?.error || 'Login failed';
        errorEl.classList.remove('hidden');
      }
    }
  });
}

// --- Logout ---

function initLogout() {
  const btn = document.getElementById('nav-logout-btn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    try {
      await api.logout();
    } catch (err) {
      // Ignore — clear local state anyway
    }
    clearToken();
    window.location.reload();
  });
}

// --- Nav Dropdown ---

function initNavDropdown() {
  const menuBtn = document.getElementById('nav-menu-btn');
  const dropdown = document.getElementById('nav-dropdown');
  if (!menuBtn || !dropdown) return;

  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    dropdown.classList.add('hidden');
  });

  // Preferences button
  const prefsBtn = document.getElementById('nav-prefs-btn');
  if (prefsBtn) {
    prefsBtn.addEventListener('click', () => {
      dropdown.classList.add('hidden');
      openPreferencesModal();
    });
  }
}

// --- Init ---

document.addEventListener('DOMContentLoaded', () => {
  initLogin();
  initLogout();
  initNavDropdown();
  initPreferencesModal();
  updateNav();
});
