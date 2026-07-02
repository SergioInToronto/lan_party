/**
 * Schedule data + rendering + "Now Playing" banner.
 * All schedule data is hardcoded here.
 */

export const SCHEDULE = [
  // Saturday
  { day: 'saturday', time: '08:00', end: '10:00', title: 'Doors Open, Pancakes Breakfast', description: 'Setup your rigs, get settled in' },
  { day: 'saturday', time: '10:00', end: '11:30', title: 'Free Play', description: 'Warm up with whatever you want' },
  { day: 'saturday', time: '11:30', end: '12:00', title: 'Tournament Bracket Draw', description: 'Random seeding for afternoon tournament' },
  { day: 'saturday', time: '12:00', end: '13:00', title: 'Lunch Break', description: 'Food vote winner served' },
  { day: 'saturday', time: '13:00', end: '15:00', title: 'Dota Tournament', description: 'Round robin, best of 1' },
  { day: 'saturday', time: '15:30', end: '17:30', title: 'Minecraft Build Battle', description: 'Theme announced at start' },
  { day: 'saturday', time: '17:30', end: '18:30', title: 'Dinner Break', description: 'Second food vote winner' },
  { day: 'saturday', time: '18:30', end: '22:00', title: 'Free Play / CoD2', description: 'Casual games until close' },
  // Sunday
  { day: 'sunday', time: '09:00', end: '10:00', title: 'Doors Open, Pancakes?', description: 'Coffee and setup' },
  { day: 'sunday', time: '10:00', end: '12:00', title: 'Pokemon Tournament', description: 'Link battles, single elimination' },
  { day: 'sunday', time: '12:00', end: '13:00', title: 'Lunch Break', description: '' },
  { day: 'sunday', time: '13:00', end: '15:00', title: 'Sims 2 Challenge', description: 'Speed-build a house, community judges' },
  { day: 'sunday', time: '15:00', end: '15:30', title: 'Awards Ceremony', description: 'Trophies for tournament winners' },
  { day: 'sunday', time: '15:30', end: '17:00', title: 'Free Play / Wrap Up', description: 'Last games, pack up' },
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
          <span class="text-text-primary ml-2 font-bold">${current.title}</span>
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
