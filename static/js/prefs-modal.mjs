/**
 * PrefsModalElement — custom element <prefs-modal>.
 * Element itself IS the modal-overlay container: it self-assigns
 * id="prefs-modal" class="modal-overlay hidden" so pages just drop in
 * a bare <prefs-modal></prefs-modal> tag. Light DOM so preferences.mjs
 * getElementById/classList calls work unchanged.
 */
import { GAMES } from './games.mjs';

function gameOptionsHtml() {
  return Object.entries(GAMES)
    .map(([id, g]) => `<option value="${id}">${g.name}</option>`)
    .join('');
}

class PrefsModalElement extends HTMLElement {
  connectedCallback() {
    this.id = 'prefs-modal';
    this.classList.add('modal-overlay', 'hidden');
    this.innerHTML = `
      <div class="modal-panel max-w-lg">
        <h2 class="font-ubuntu text-lg mb-4">Your Preferences</h2>
        <form id="prefs-form">
          <div class="mb-3">
            <label class="block text-sm text-text-muted mb-1">Handle</label>
            <input type="text" name="handle" placeholder="Your display name">
          </div>
          <div class="mb-3">
            <label class="block text-sm text-text-muted mb-1">Steam Profile ID</label>
            <input type="text" name="steam_id" placeholder="e.g. 76561197960287930">
          </div>
          <div class="mb-3">
            <label class="block text-sm text-text-muted mb-1">Operating System</label>
            <input type="text" name="os" placeholder="e.g. Arch btw">
          </div>
          <div class="mb-3">
            <label class="block text-sm text-text-muted mb-1">Days Attending</label>
            <div class="flex gap-4">
              <label class="flex items-center gap-2"><input type="checkbox" name="attending_saturday" checked> Saturday</label>
              <label class="flex items-center gap-2"><input type="checkbox" name="attending_sunday" checked> Sunday</label>
            </div>
          </div>
          <div class="mb-4">
            <label class="block text-sm text-text-muted mb-1">Most Looking Forward To</label>
            <select name="most_looking_forward_to" id="most-looking-forward-to">${gameOptionsHtml()}</select>
          </div>
          <div class="flex gap-3">
            <button type="submit" class="btn btn-primary flex-1">Save</button>
            <button type="button" id="prefs-cancel-btn" class="btn btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    `;

    this.querySelector('#prefs-cancel-btn').addEventListener('click', () => {
      this.classList.add('hidden');
    });
  }
}

customElements.define('prefs-modal', PrefsModalElement);
