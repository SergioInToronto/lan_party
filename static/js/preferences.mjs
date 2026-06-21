/**
 * Preferences modal logic.
 * Handles avatar picker, form population, and submission.
 */
import { api } from './api.mjs';

const AVATARS = [
  'pixel-cat.svg', 'pixel-dog.svg', 'pixel-robot.svg', 'pixel-warrior.svg',
  'pixel-wizard.svg', 'pixel-alien.svg', 'pixel-ghost.svg', 'pixel-tux.svg',
  'pixel-skull.svg', 'pixel-mushroom.svg', 'pixel-crown.svg', 'pixel-flame.svg',
];

let selectedAvatar = null;

export function initPreferencesModal() {
  const modal = document.getElementById('prefs-modal');
  const form = document.getElementById('prefs-form');
  const picker = document.getElementById('avatar-picker');
  if (!modal || !form || !picker) return;

  // Build avatar picker grid
  picker.innerHTML = '';
  AVATARS.forEach(filename => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'w-10 h-10 border border-border-c rounded-kit p-0.5 hover:border-accent-blue transition-colors';
    btn.dataset.avatar = filename;

    const img = document.createElement('img');
    img.src = `/static/avatars/${filename}`;
    img.alt = filename.replace('.svg', '');
    img.className = 'w-full h-full object-contain';
    btn.appendChild(img);

    btn.addEventListener('click', () => {
      picker.querySelectorAll('button').forEach(b => b.classList.remove('border-accent-orange'));
      btn.classList.add('border-accent-orange');
      selectedAvatar = filename;
      form.querySelector('[name="avatar"]').value = filename;
    });

    picker.appendChild(btn);
  });

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

    if (prefs.avatar) {
      form.querySelector('[name="avatar"]').value = prefs.avatar;
      const avatarBtn = document.querySelector(`[data-avatar="${prefs.avatar}"]`);
      if (avatarBtn) avatarBtn.classList.add('border-accent-orange');
      selectedAvatar = prefs.avatar;
    }
  } catch (err) {
    // No preferences yet — form stays empty
  }

  modal.classList.remove('hidden');
}
