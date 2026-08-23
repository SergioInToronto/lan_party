/**
 * Shared app logic — runs on every page.
 * Handles: auth state, nav updates, login modal, logout, preferences trigger.
 */
import { api } from './api.mjs';
import { initPreferencesModal, openPreferencesModal } from './preferences.mjs';
import { DEFAULT_MOST_LOOKING_FORWARD_TO } from './games.mjs';

const AUTH_TOKEN_KEY = 'sudobash_token';
const JUST_LOGGED_IN_KEY = 'lp_just_logged_in';

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

    const avatarUrl = data.avatar_url;
    if (navAvatar && avatarUrl) {
      navAvatar.src = avatarUrl;
      navAvatar.classList.remove('hidden');
    } else if (navAvatar) {
      navAvatar.classList.add('hidden');
    }

    // Auto-open preferences only after login, not on nav/refresh —
    // only if the guest hasn't picked anything past the "sims" default.
    const justLoggedIn = sessionStorage.getItem(JUST_LOGGED_IN_KEY);
    if (justLoggedIn) sessionStorage.removeItem(JUST_LOGGED_IN_KEY);
    const mostLookingForwardTo = data.preferences?.most_looking_forward_to || DEFAULT_MOST_LOOKING_FORWARD_TO;
    if (justLoggedIn && mostLookingForwardTo === DEFAULT_MOST_LOOKING_FORWARD_TO) {
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
  const submitBtn = document.getElementById('login-submit-btn');
  const spinner = document.getElementById('login-spinner');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitBtn?.disabled) return; // already in flight, ignore Enter-key resubmit
    errorEl?.classList.add('hidden');
    if (submitBtn) submitBtn.disabled = true;
    spinner?.classList.remove('hidden');

    const name = form.querySelector('[name="name"]').value.trim();
    const access_code = form.querySelector('[name="access_code"]').value.trim();

    try {
      const data = await api.login(name, access_code);
      setToken(data.token);
      sessionStorage.setItem(JUST_LOGGED_IN_KEY, '1');
      modal?.classList.add('hidden');
      window.location.reload();
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = err.data?.error || 'Login failed';
        errorEl.classList.remove('hidden');
      }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      spinner?.classList.add('hidden');
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
  const userInfo = document.getElementById('nav-user-info');
  const dropdown = document.getElementById('nav-dropdown');
  if (!userInfo || !dropdown) return;

  userInfo.addEventListener('click', (e) => {
    if (dropdown.contains(e.target)) return; // let dropdown's own buttons handle their clicks
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
