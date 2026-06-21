/**
 * Countdown timer — counts down to event start.
 * Reads event date from /api/config.
 */
import { api } from './api.mjs';

export async function initCountdown() {
  const el = document.getElementById('countdown');
  if (!el) return;

  let targetDate;
  try {
    const config = await api.config();
    targetDate = new Date(`${config.date_start}T${config.time_start}:00`);
  } catch (err) {
    el.textContent = '[ ERROR LOADING CONFIG ]';
    return;
  }

  function update() {
    const now = new Date();
    const diff = targetDate - now;

    if (diff <= 0) {
      el.innerHTML = '<span class="text-accent-green font-mono text-2xl">[ EVENT LIVE ]</span>';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    el.innerHTML = `
      <div class="flex gap-4 justify-center font-mono text-3xl md:text-5xl text-accent-orange">
        <div class="text-center">
          <div>${String(days).padStart(2, '0')}</div>
          <div class="text-xs text-text-muted mt-1">DAYS</div>
        </div>
        <span class="text-text-muted">:</span>
        <div class="text-center">
          <div>${String(hours).padStart(2, '0')}</div>
          <div class="text-xs text-text-muted mt-1">HRS</div>
        </div>
        <span class="text-text-muted">:</span>
        <div class="text-center">
          <div>${String(minutes).padStart(2, '0')}</div>
          <div class="text-xs text-text-muted mt-1">MIN</div>
        </div>
        <span class="text-text-muted">:</span>
        <div class="text-center">
          <div>${String(seconds).padStart(2, '0')}</div>
          <div class="text-xs text-text-muted mt-1">SEC</div>
        </div>
      </div>
    `;
  }

  update();
  setInterval(update, 1000);
}
