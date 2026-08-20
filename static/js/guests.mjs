/**
 * Guest list page logic.
 * Fetches /api/guests and renders the roster.
 */
import { api } from './api.mjs';

export async function initGuestList(el) {
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
          const avatar = guest.avatar_url
            ? `<img src="${guest.avatar_url}" alt="" class="w-10 h-10 rounded-kit border border-border-c">`
            : `<div class="w-10 h-10 rounded-kit border border-border-c bg-base flex items-center justify-center font-mono text-xs text-text-muted">?</div>`;

          return `
            <div class="flex items-center gap-4 border border-border-c bg-surface p-2 rounded-kit">
              ${avatar}
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-3">
                  <div class="font-bold truncate text-accent-blue">${guest.handle}</div>
                  <div class="">[ ${daysText(guest)} ]</div>
                </div>
                <div class="flex items-center gap-1">
                  <i class="lab la-linux"></i>
                  <div class="text-sm text-text-muted font-mono">
                    ${guest.os}
                  </div>
                </div>
              </div>
              <div>
                <div class="flex-1 min-w-0">Excited for</div>
                <div class="font-bold text-text-accent">${guest.most_looking_forward_to}</div>
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

function daysText(guest) {
  if ([guest.attending_saturday, guest.attending_sunday].includes(null)) {
    return '?';
  }
  const sat = guest.attending_saturday === 'true';
  const sun = guest.attending_sunday === 'true';
  const daysText = sat && sun ? 'Sat + Sun' : sat ? 'Sat' : sun ? 'Sun' : '—';

  return daysText;
}
