/**
 * Preferences modal logic.
 * Handles form population and submission.
 */
import { api } from './api.mjs';
import { DEFAULT_MOST_LOOKING_FORWARD_TO } from './games.mjs';

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
    // Checkboxes are absent from FormData when unchecked — send explicit
    // true/false so unchecking actually clears a previously-saved day.
    prefs.attending_saturday = form.querySelector('[name="attending_saturday"]').checked ? 'true' : 'false';
    prefs.attending_sunday = form.querySelector('[name="attending_sunday"]').checked ? 'true' : 'false';

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
    if (prefs.steam_id) form.querySelector('[name="steam_id"]').value = prefs.steam_id;

    // Unset (never saved) defaults to checked/attending both days.
    form.querySelector('[name="attending_saturday"]').checked = prefs.attending_saturday !== 'false';
    form.querySelector('[name="attending_sunday"]').checked = prefs.attending_sunday !== 'false';

    form.querySelector('[name="most_looking_forward_to"]').value =
      prefs.most_looking_forward_to || DEFAULT_MOST_LOOKING_FORWARD_TO;
  } catch (err) {
    // No preferences yet — form stays at its default state
    form.querySelector('[name="most_looking_forward_to"]').value = DEFAULT_MOST_LOOKING_FORWARD_TO;
  }

  modal.classList.remove('hidden');
  form.querySelector('[name="handle"]').focus();
}
