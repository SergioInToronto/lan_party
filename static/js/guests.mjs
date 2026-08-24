/**
 * Guest list page logic.
 * Fetches /api/guests and renders the roster.
 */
import { api } from './api.mjs';
import { GAMES } from './games.mjs';

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
      <div class="grid gap-3 md:grid-cols-2">
        ${guests.map(guest => {
          const avatar = guest.avatar_url
            ? `<img src="${guest.avatar_url}" alt="" class="w-16 h-16 rounded-kit border border-border-c">`
            : `<div class="w-16 h-16 rounded-kit border border-border-c bg-base flex items-center justify-center font-mono text-lg text-text-muted">?</div>`;

          const gameId = guest.most_looking_forward_to;
          const game = gameId ? GAMES[gameId] : null;
          const gameName = game?.name ?? gameId;
          const days = daysInfo(guest);

          return `
            <div class="flex items-center gap-4 border border-border-c bg-surface p-4 rounded-kit hover:border-accent-blue transition-colors">
              ${avatar}
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-3">
                  <div class="font-bold truncate text-accent-blue">${guest.handle}</div>
                  <div class="${days.color}">[ ${days.text} ]</div>
                </div>
                <div class="flex items-center gap-1">
                  <i class="lab ${osIcon(guest.os)}"></i>
                  <div class="text-sm text-text-muted font-mono">
                    ${guest.os ?? ''}
                  </div>
                </div>
              </div>
              <div class="border-l border-border-c pl-4 flex-shrink-0 flex items-center gap-3 max-[480px]:hidden">
                ${game
                  ? `<img src="/static/img/games/${game.image}" alt="" class="w-10 h-10 rounded-kit border border-border-c object-cover hidden sm:block">`
                  : ''}
                <div>
                  <div class="flex items-center gap-1 text-text-muted">
                    <i class="las la-gamepad"></i>
                    <span>Hyped for</span>
                  </div>
                  ${gameName
                    ? `<div class="font-bold text-accent-green">${gameName}</div>`
                    : `<div class="font-mono text-sm text-text-muted">[ NOT SET ]</div>`}
                </div>
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

function daysInfo(guest) {
  if ([guest.attending_saturday, guest.attending_sunday].includes(null)) {
    return { text: '?', color: 'text-text-muted' };
  }
  const sat = guest.attending_saturday === 'true';
  const sun = guest.attending_sunday === 'true';

  if (sat && sun) return { text: 'Sat + Sun', color: 'text-accent-green' };
  if (sat) return { text: 'Sat', color: 'text-accent-green' };
  if (sun) return { text: 'Sun', color: 'text-accent-green' };
  return { text: '—', color: 'text-text-muted' };
}

function osIcon(os) {
  os = os?.toLowerCase();
  if (!os) return '';

  if (os.includes('windows')) return 'la-windows';
  if (os.includes('centos')) return 'la-centos';
  if (os.includes('ubuntu')) return 'la-ubuntu';
  if (os.includes('fedora')) return 'la-fedora';
  if (os.includes('linux')) return 'la-linux';
  if (os.includes('mac')) return 'la-apple';

  return '';
}
