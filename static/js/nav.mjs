/**
 * NavBarElement — custom element <nav-bar current-page="...">
 * Renders site header with desktop nav + mobile hamburger menu.
 * Uses Light DOM so app.mjs getElementById calls work unchanged.
 */

const NAV_LINKS = [
  { key: 'schedule', href: '/#schedule',   label: 'Schedule' },
  { key: 'games',    href: '/games.html',  label: 'Games' },
  { key: 'guests',   href: '/guests.html', label: 'Guests' },
  { key: 'food',     href: '/food.html',   label: 'Food' },
  { key: 'gear',     href: '/gear.html',   label: 'Checklist' },
];

class NavBarElement extends HTMLElement {
  connectedCallback() {
    const currentPage = this.getAttribute('current-page') || '';
    this.innerHTML = this._render(currentPage);
    this._initHamburger();
  }

  _linkClass(key, currentPage) {
    const extra = key === currentPage ? 'text-accent-orange' : ''
    return `hitbox-4 ${extra} hover:text-accent-blue `;
  }

  _linkDivider(index, length) {
    // Last element
    if (index === length - 1) return "";
    // Not last element
    return "<span>|</span>"
  }

  _desktopLinks(currentPage) {
    return NAV_LINKS.map(({ key, href, label }, index, array) => {
      const extra = this._linkDivider(index, array.length);
      return `<a href="${href}" class="${this._linkClass(key, currentPage)}">${label}</a>${extra}`;
    }
    ).join('');
  }

  _mobileLinks(currentPage) {
    return NAV_LINKS.map(({ key, href, label }) =>
      `<a href="${href}" class="block px-4 py-3 text-sm border-b border-border-c ${this._linkClass(key, currentPage)}">${label}</a>`
    ).join('');
  }

  _render(currentPage) {
    return `
      <header class="border-b border-border-c bg-surface fixed top-0 left-0 w-full z-50">
        <nav class="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <button id="nav-hamburger" class="md:hidden text-text-muted hover:text-text-primary text-4xl p-2" aria-label="Menu" aria-expanded="false">
            <i class="las la-bars"></i>
          </button>
          <div class="flex items-center gap-6">
            <a href="/" class="font-ubuntu font-bold text-xl text-accent-orange tracking-wide hitbox-4">LAN Party '26</a>
            <div class="hidden md:flex items-center gap-4 text-xl">
              ${this._desktopLinks(currentPage)}
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div id="nav-auth">
              <button id="nav-login-btn" class="btn btn-primary text-sm" onclick="document.getElementById('login-modal').classList.remove('hidden')">LOGIN</button>
              <div id="nav-user-info" class="hidden flex items-center gap-3">
                <img id="nav-avatar" src="" alt="" class="w-8 h-8 rounded-kit border border-border-c">
                <span id="nav-handle" class="font-mono text-sm"></span>
                <div class="relative">
                  <button id="nav-menu-btn" class="text-text-muted hover:text-text-primary text-sm">
                    <i class="las la-chevron-down"></i>
                  </button>
                  <div id="nav-dropdown" class="hidden absolute right-0 top-8 bg-surface border border-border-c py-1 min-w-[140px] z-50">
                    <button id="nav-prefs-btn" class="block w-full text-left px-4 py-2 text-sm hover:bg-base">Preferences</button>
                    <button id="nav-logout-btn" class="block w-full text-left px-4 py-2 text-sm hover:bg-base text-accent-orange">Logout</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>
        <div id="nav-mobile-menu" class="hidden md:hidden fixed top-14 left-0 right-0 bg-surface border-b border-border-c z-40">
          ${this._mobileLinks(currentPage)}
        </div>
      </header>
    `;
  }

  _initHamburger() {
    const hamburger = document.getElementById('nav-hamburger');
    const mobileMenu = document.getElementById('nav-mobile-menu');
    if (!hamburger || !mobileMenu) return;

    hamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = mobileMenu.classList.toggle('hidden');
      hamburger.setAttribute('aria-expanded', String(!isHidden));
    });

    // Close on outside click
    document.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
      hamburger.setAttribute('aria-expanded', 'false');
    });

    // Close on link click (navigation will follow naturally)
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }
}

customElements.define('nav-bar', NavBarElement);
