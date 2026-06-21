/**
 * Guest list page logic.
 * Fetches /api/guests and renders the roster.
 */
import { api } from './api.mjs';

export async function initGuestList() {
  const el = document.getElementById('guest-list');
  if (!el) return;

  el.innerHTML = '<div class="text-text-muted font-mono text-sm">Loading guest list...</div>';

  try {
    const guests = await api.guests();

    if (guests.length === 0) {
      el.innerHTML = '<div class="text-text-muted font-mono">[ NO GUESTS YET ]</div>';
      return;
    }

    el.innerHTML = `
      <div class="grid gap-3">
        ${guests.map(guest => {
          const avatar = guest.avatar
            ? `<img src="/static/avatars/${guest.avatar}" alt="" class="w-10 h-10 rounded-kit border border-border-c">`
            : `<div class="w-10 h-10 rounded-kit border border-border-c bg-base flex items-center justify-center font-mono text-xs text-text-muted">?</div>`;

          const daysText = guest.days_attending
            ? { saturday: 'Sat', sunday: 'Sun', both: 'Sat + Sun' }[guest.days_attending] || guest.days_attending
            : '—';

          const snack = guest.snack_contribution
            ? `<span class="text-text-muted text-sm">🍿 ${guest.snack_contribution}</span>`
            : '';

          return `
            <div class="flex items-center gap-4 border border-border-c bg-surface p-3 rounded-kit">
              ${avatar}
              <div class="flex-1 min-w-0">
                <div class="font-bold truncate">${guest.handle}</div>
                <div class="text-sm text-text-muted font-mono">[ ${daysText} ]</div>
              </div>
              <div class="text-right">
                ${snack}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } catch (err) {
    el.innerHTML = '<div class="text-accent-orange font-mono text-sm">[ ERROR LOADING GUESTS ]</div>';
    console.error('Failed to load guests:', err);
  }
}
