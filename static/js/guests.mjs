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

    const sorted_guests = guests.sort((a, b) => (a.hidden - b.hidden) || a.handle.localeCompare(b.handle));

    el.innerHTML = `
      <div class="grid gap-4 lg:grid-cols-2">
        ${sorted_guests.map(guest => {
          const avatar = guest.avatar_url
            ? `<img src="${guest.avatar_url}" alt="" class="w-16 h-16 rounded-kit border border-border-c">`
            : `<div class="w-16 h-16 rounded-kit border border-border-c bg-base flex items-center justify-center font-mono text-lg text-text-muted">?</div>`;

          const gameId = guest.most_looking_forward_to;
          const game = gameId ? GAMES[gameId] : null;
          const gameName = game?.name ?? gameId;
          const fadedClass = guest.hidden ? 'opacity-50' : ''

          return `
            <div class="flex items-center gap-4 border border-border-c bg-surface p-4 rounded-kit hover:border-accent-blue transition-colors ${fadedClass}">
              ${avatar}
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-3">
                  <div class="font-bold truncate text-accent-blue">${guest.handle}</div>
                  ${attendingInfo(guest)}
                </div>
                <div class="flex items-center gap-1">
                  ${osIcon(guest.os)}
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

function attendingInfo(guest) {
  const [attending, daysText] = daysAttendingText(guest);
  if (!attending) {
    return '<div class="text-text-muted">[ — ]</div>'
  }

  const arrivingAt = guest.arrival_time;
  const arrivingText = arrivingAt ? ` @ ${arrivingAt}` : '';

  return `<div class="text-accent-green">[ ${daysText}${arrivingText} ]</div>`
}

function daysAttendingText(guest) {
  const sat = guest.attending_saturday === 'true';
  const sun = guest.attending_sunday === 'true';

  if (sat && sun) return [true, 'Sat + Sun'];
  if (sat) return [true, 'Sat'];
  if (sun) return [true, 'Sun'];
  return [false, '—'];
}

function osIcon(os) {
  os = os?.toLowerCase();
  if (!os) return '';

  if (os.includes('arch')) return '<img src="/static/img/icons/arch-linux.svg" alt="" class="w-4 h-4">';
  if (os.includes('steamos')) return '<img src="/static/img/icons/arch-linux.svg" alt="" class="w-4 h-4">';
  if (os.includes('steam os')) return '<img src="/static/img/icons/arch-linux.svg" alt="" class="w-4 h-4">';
  if (os.includes('steam deck')) return '<img src="/static/img/icons/arch-linux.svg" alt="" class="w-4 h-4">';

  if (os.includes('windows')) return '<i class="lab la-windows"></i>';
  if (os.includes('centos')) return '<i class="lab la-centos"></i>';
  if (os.includes('ubuntu')) return '<i class="lab la-ubuntu"></i>';
  if (os.includes('fedora')) return '<i class="lab la-fedora"></i>';
  if (os.includes('linux')) return '<i class="lab la-linux"></i>';
  if (os.includes('mint')) return '<i class="lab la-linux"></i>';
  if (os.includes('mac')) return '<i class="lab la-apple"></i>';

  return '';
}
