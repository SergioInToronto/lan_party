/**
 * Preferences modal logic.
 * Handles form population and submission.
 */
import { api } from './api.mjs';

export function initPreferencesModal() {
  const modal = document.getElementById('prefs-modal');
  const form = document.getElementById('prefs-form');
  if (!modal || !form) return;

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const prefs = {};
    for (const [key, value] of formData.entries()) {
      if (value) prefs[key] = value;
    }

    try {
      await api.setPreferences(prefs);
      modal.classList.add('hidden');
      window.location.reload();
    } catch (err) {
      console.error('Failed to save preferences:', err);
    }
  });
}

export async function openPreferencesModal() {
  const modal = document.getElementById('prefs-modal');
  const form = document.getElementById('prefs-form');
  if (!modal || !form) return;

  // Pre-fill with existing preferences
  try {
    const prefs = await api.getPreferences();

    if (prefs.handle) form.querySelector('[name="handle"]').value = prefs.handle;
    if (prefs.os) form.querySelector('[name="os"]').value = prefs.os;
    if (prefs.snack_contribution) form.querySelector('[name="snack_contribution"]').value = prefs.snack_contribution;

    if (prefs.days_attending) {
      const radio = form.querySelector(`[name="days_attending"][value="${prefs.days_attending}"]`);
      if (radio) radio.checked = true;
    }

    if (prefs.skill_level) {
      form.querySelector('[name="skill_level"]').value = prefs.skill_level;
    }

    if (prefs.steam_id) {
      form.querySelector('[name="steam_id"]').value = prefs.steam_id;
    }
  } catch (err) {
    // No preferences yet — form stays empty
  }

  modal.classList.remove('hidden');
}
