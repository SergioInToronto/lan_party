/**
 * Schedule data + rendering + "Now Playing" banner.
 * All schedule data is hardcoded here.
 */

export const SCHEDULE = [
  // Saturday
  { day: 'saturday', time: '09:00', end: '10:00', title: 'Doors Open, Homemade Pancakes', description: 'Setup your rigs, get settled in' },
  { day: 'saturday', time: '10:00', end: '11:30', title: 'Muck / HL: Deathmatch', description: 'Warm up with a simple first-person survival game' },
  { day: 'saturday', time: '10:30', end: '12:30', title: 'SC2: Zombie Assault Apocalypse', description: 'StarCraft II custom map' },
  { day: 'saturday', time: '12:30', end: '13:00', title: 'Food Voting', description: 'Vote on food' },
  { day: 'saturday', time: '13:00', end: '14:00', title: 'Lunch Break (1 hour)', description: 'Om nom nom' },
  // TODO: did style work? Do I like it?
  { day: 'saturday', time: '14:00', end: '17:00', title: 'Team Verses: StarCraft II', description: 'Team up, plan, and beat your opponents', style: "text-accent-blue" },
  { day: 'saturday', time: '17:30', end: '19:00', title: 'Dinner Break (1 hour)', description: '2nd place food vote winner' },
  { day: 'saturday', time: '18:30', end: '22:00', title: 'Team Verses: L4D2 / Unrailed 2 / Factorio VS', description: 'Player\'s choice' },
  // Sunday
  { day: 'sunday', time: '09:00', end: '10:00', title: 'Doors Open. Coffee & Breakfast', description: 'Coffee and setup' },
  { day: 'sunday', time: '10:00', end: '12:00', title: 'Crab Game', description: 'Free for all in a new game' },
  { day: 'sunday', time: '12:00', end: '13:00', title: 'Lunch Break (1 hour)', description: 'New food vote' },
  { day: 'sunday', time: '13:00', end: '15:30', title: 'Free Play', description: 'Continue yesterday\'s most fun game' },
  { day: 'sunday', time: '15:30', end: '17:00', title: 'TODO', description: 'Last game, pack up' },
  { day: 'sunday', time: '17:00', end: '17:00', title: 'Thanks for Coming!', description: '' },
];

/**
 * Find the currently active schedule entry based on system clock.
 * Returns null if no event is currently happening.
 */
export function getCurrentEvent(schedule = SCHEDULE) {
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const currentTime = now.getHours().toString().padStart(2, '0') + ':' +
                      now.getMinutes().toString().padStart(2, '0');

  return schedule.find(event =>
    event.day === dayName && currentTime >= event.time && currentTime < event.end
  ) || null;
}

/**
 * Render the "Now Playing" banner.
 */
export function initNowPlaying() {
  const el = document.getElementById('now-playing');
  if (!el) return;

  function update() {
    const current = getCurrentEvent();
    if (current) {
      el.innerHTML = `
        <div class="bg-surface border border-accent-green py-3 px-4 font-mono text-center">
          <span class="text-accent-green">&gt; NOW PLAYING:</span>
          <span class="text-text-primary ml-2 font-bold ${current.style}">${current.title}</span>
          <span class="text-text-muted ml-2">— ${current.description}</span>
        </div>
      `;
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  }

  update();
  setInterval(update, 60000); // Check every minute
}

/**
 * Render the schedule table for a given day.
 */
function renderDaySchedule(day, schedule = SCHEDULE) {
  const events = schedule.filter(e => e.day === day);
  const current = getCurrentEvent(schedule);

  return events.map(event => {
    const isCurrent = current && current.time === event.time && current.day === event.day;
    const rowClass = isCurrent ? 'bg-accent-orange/10 border-l-2 border-accent-orange' : '';

    return `
      <tr class="${rowClass}">
        <td class="py-2 px-3 font-mono text-sm text-accent-orange whitespace-nowrap">${event.time}</td>
        <td class="py-2 px-3 font-bold">${event.title}</td>
        <td class="py-2 px-3 text-text-muted text-sm">${event.description}</td>
      </tr>
    `;
  }).join('');
}

/**
 * Initialize schedule section with both days always visible.
 */
export function initSchedule() {
  const el = document.getElementById('schedule');
  if (!el) return;

  el.innerHTML = `
    <div class="border border-border-c rounded-kit overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="bg-surface border-b border-border-c">
            <th class="py-2 px-3 text-left font-mono text-xs text-text-muted">TIME</th>
            <th class="py-2 px-3 text-left font-mono text-xs text-text-muted">EVENT</th>
            <th class="py-2 px-3 text-left font-mono text-xs text-text-muted">DESCRIPTION</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border-c">
          <tr class="bg-surface">
            <td colspan="3" class="py-2 px-3 font-mono text-xs text-text-muted uppercase tracking-widest">Saturday</td>
          </tr>
          ${renderDaySchedule('saturday')}
          <tr class="bg-surface border-t-2 border-border-c">
            <td colspan="3" class="py-2 px-3 font-mono text-xs text-text-muted uppercase tracking-widest">Sunday</td>
          </tr>
          ${renderDaySchedule('sunday')}
        </tbody>
      </table>
    </div>
  `;
}
