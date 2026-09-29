/**
 * DriveEasy Main Global Script
 * Manages universal header, footer, user session states, and active routes.
 */

document.addEventListener('DOMContentLoaded', () => {
  setupUserNav();
  highlightActiveNav();
  setupGlobalActions();
});

function setupUserNav() {
  const user = window.utils?.getCurrentUser();
  const userProfileContainer = document.getElementById('user-profile-widget');
  const userNavContainer = document.getElementById('auth-nav-action');

  if (user && userProfileContainer) {
    userProfileContainer.innerHTML = `
      <div class="user-chip-dropdown">
        <a href="/views/dashboard.html" class="user-avatar-btn" title="${user.name} (${user.role})">
          <span class="user-initial">${user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
        </a>
      </div>
    `;
  }

  if (userNavContainer) {
    if (user) {
      userNavContainer.innerHTML = `
        <span class="nav-user-greeting">Hi, ${user.name.split(' ')[0]}</span>
        <button id="logout-btn" class="btn-outline-sm">Logout</button>
      `;
      document.getElementById('logout-btn')?.addEventListener('click', () => {
        window.utils.clearCurrentUser();
        window.utils.showToast('You have been logged out.');
        setTimeout(() => {
          window.location.href = '/views/login.html';
        }, 800);
      });
    } else {
      userNavContainer.innerHTML = `
        <a href="/views/login.html" class="btn-primary-sm">Login / Sign Up</a>
      `;
    }
  }
}

function highlightActiveNav() {
  const currentPath = window.location.pathname;

  // Header desktop links
  const navLinks = document.querySelectorAll('header nav a, .header-nav a');
  navLinks.forEach(link => {
    const href = link.getAttribute('href') || '';
    if (currentPath.includes(href) && href !== '#' && href !== '/') {
      link.classList.add('active');
    } else if ((currentPath === '/' || currentPath.endsWith('index.html')) && href.includes('index.html')) {
      link.classList.add('active');
    }
  });

  // Mobile bottom bar links
  const bottomLinks = document.querySelectorAll('.bottom-nav a, nav.fixed a');
  bottomLinks.forEach(link => {
    const dataPath = link.getAttribute('data-path') || '';
    const href = link.getAttribute('href') || '';
    if (
      (dataPath === 'home' && (currentPath === '/' || currentPath.endsWith('index.html'))) ||
      (dataPath === 'vehicles' && currentPath.includes('vehicles')) ||
      (dataPath === 'my-bookings' && currentPath.includes('my-bookings')) ||
      (dataPath === 'dashboard' && currentPath.includes('dashboard'))
    ) {
      link.classList.add('active');
    }
  });
}

function setupGlobalActions() {
  // Search toggle
  const searchBtn = document.querySelector('[aria-label="Search"]');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      if (!window.location.pathname.includes('vehicles.html')) {
        window.location.href = '/views/vehicles.html';
      } else {
        const input = document.getElementById('vehicle-search-input');
        if (input) input.focus();
      }
    });
  }
}
