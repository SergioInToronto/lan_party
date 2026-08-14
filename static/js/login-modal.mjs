/**
 * LoginModalElement — custom element <login-modal>.
 * Element itself IS the modal-overlay container: it self-assigns
 * id="login-modal" class="modal-overlay hidden" so pages just drop in
 * a bare <login-modal></login-modal> tag. Light DOM so app.mjs
 * getElementById/classList calls work unchanged.
 */
class LoginModalElement extends HTMLElement {
  connectedCallback() {
    this.id = 'login-modal';
    this.classList.add('modal-overlay', 'hidden');
    this.innerHTML = `
      <div class="modal-panel">
        <h2 class="font-ubuntu text-lg mb-4">Login</h2>
        <form id="login-form">
          <div class="mb-3">
            <label class="block text-sm text-text-muted mb-1">Name</label>
            <input type="text" name="name" required autocomplete="name">
          </div>
          <div class="mb-4">
            <label class="block text-sm text-text-muted mb-1">Access Code</label>
            <input type="text" name="access_code" required maxlength="7" autocomplete="off" class="font-mono tracking-widest uppercase">
          </div>
          <div id="login-error" class="text-accent-orange text-sm mb-3 hidden"></div>
          <div class="flex gap-3">
            <button type="submit" id="login-submit-btn" class="btn btn-primary flex-1 flex items-center justify-center gap-2">
              <span id="login-spinner" class="hidden h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span id="login-submit-label">LOGIN</span>
            </button>
            <button type="button" id="login-cancel-btn" class="btn btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    `;

    this.querySelector('#login-cancel-btn').addEventListener('click', () => {
      this.classList.add('hidden');
    });
  }
}

customElements.define('login-modal', LoginModalElement);
