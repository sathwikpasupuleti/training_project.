/**
 * DriveEasy - Vehicles Listing Script
 * Implements search, category pills, drawer filtering, and sorting using vehicleService.
 * NO direct Axios calls here; only uses window.vehicleService.
 */

let allVehicles = [];
let activeCategory = 'all';
let activePriceRange = null; // { min, max }
let activeSort = 'featured';

document.addEventListener('DOMContentLoaded', () => {
  setupFilterEvents();
  checkUrlParams();
  loadAllVehicles();
});

function checkUrlParams() {
  const catParam = window.utils.getUrlParam('category');
  if (catParam) {
    activeCategory = catParam;
    updatePillActiveState(catParam);
  }
}

function updatePillActiveState(category) {
  const pills = document.querySelectorAll('.cat-pill');
  pills.forEach(pill => {
    const pCat = pill.getAttribute('data-category');
    if (pCat && pCat.toLowerCase() === category.toLowerCase()) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });
}

async function loadAllVehicles() {
  const grid = document.getElementById('vehicles-grid');
  const countText = document.getElementById('fleet-count-text');

  try {
    allVehicles = await window.vehicleService.getVehicles();
    renderVehicles();
  } catch (error) {
    if (grid) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--error);">
          Failed to load vehicles from server: ${error.message}
        </div>
      `;
    }
    if (countText) countText.textContent = '0 Available';
  }
}

function renderVehicles() {
  const grid = document.getElementById('vehicles-grid');
  const countText = document.getElementById('fleet-count-text');
  const noResults = document.getElementById('no-results-box');
  const searchInput = document.getElementById('vehicle-search-input');
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

  // Get active checkboxes
  const fuelCheckboxes = Array.from(document.querySelectorAll('input[name="fuel"]:checked')).map(cb => cb.value.toLowerCase());
  const transCheckboxes = Array.from(document.querySelectorAll('input[name="transmission"]:checked')).map(cb => cb.value.toLowerCase());

  // Filter
  let filtered = allVehicles.filter(v => {
    // Category pill
    if (activeCategory !== 'all') {
      const vCat = (v.category || '').toLowerCase();
      const vType = (v.type || '').toLowerCase();
      const targetCat = activeCategory.toLowerCase();
      if (vCat !== targetCat && !vType.includes(targetCat)) {
        return false;
      }
    }

    // Text search
    if (searchTerm) {
      const match = (
        (v.name && v.name.toLowerCase().includes(searchTerm)) ||
        (v.brand && v.brand.toLowerCase().includes(searchTerm)) ||
        (v.model && v.model.toLowerCase().includes(searchTerm)) ||
        (v.type && v.type.toLowerCase().includes(searchTerm)) ||
        (v.location && v.location.toLowerCase().includes(searchTerm))
      );
      if (!match) return false;
    }

    // Price range
    if (activePriceRange) {
      const price = Number(v.pricePerDay) || 0;
      if (price < activePriceRange.min || price > activePriceRange.max) {
        return false;
      }
    }

    // Fuel filter
    if (fuelCheckboxes.length > 0 && v.fuel) {
      if (!fuelCheckboxes.includes(v.fuel.toLowerCase())) {
        return false;
      }
    }

    // Transmission filter
    if (transCheckboxes.length > 0 && v.transmission) {
      if (!transCheckboxes.includes(v.transmission.toLowerCase())) {
        return false;
      }
    }

    return true;
  });

  // Sorting
  if (activeSort === 'price-asc') {
    filtered.sort((a, b) => a.pricePerDay - b.pricePerDay);
  } else if (activeSort === 'price-desc') {
    filtered.sort((a, b) => b.pricePerDay - a.pricePerDay);
  } else if (activeSort === 'rating') {
    filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  // Update counter
  if (countText) {
    countText.textContent = `${filtered.length} Available`;
  }

  // Handle empty state
  if (filtered.length === 0) {
    if (grid) grid.innerHTML = '';
    if (noResults) noResults.style.display = 'flex';
    return;
  } else {
    if (noResults) noResults.style.display = 'none';
  }

  // Render cards
  if (grid) {
    grid.innerHTML = filtered.map(v => {
      // trips calculation for authentic UI reproduction
      const trips = Math.floor(60 + (v.id * 17) % 240);
      return `
        <article class="listing-card" data-id="${v.id}">
          <div class="listing-card-media">
            <img src="${v.image}" alt="${v.name}" loading="lazy" />
            <span class="card-category-badge">
              <span class="material-symbols-outlined" style="font-size: 13px; vertical-align: -2px;">
                ${v.category === 'Bike' ? 'two_wheeler' : v.category === 'Scooter' ? 'moped' : v.category === 'Van' ? 'airport_shuttle' : 'directions_car'}
              </span>
              ${v.type || v.category}
            </span>
            <button class="fav-btn" aria-label="Favorite vehicle" onclick="toggleFav(this)">
              <span class="material-symbols-outlined" style="font-size: 18px;">favorite</span>
            </button>
          </div>

          <div class="listing-card-body">
            <div class="card-header-flex">
              <div>
                <h2 class="card-name" style="font-size: 1.0625rem;">${v.name}</h2>
                <div style="display: flex; align-items: center; gap: 4px; font-size: 0.75rem; color: var(--tertiary); margin-top: 2px;">
                  <span class="material-symbols-outlined" style="font-size: 15px; font-variation-settings: 'FILL' 1;">star</span>
                  <span style="font-weight: 700; color: var(--on-surface);">${v.rating || '4.8'}</span>
                  <span style="color: var(--on-surface-variant);">(${trips} trips)</span>
                </div>
              </div>
              <div class="card-price-box">
                <span class="card-price">${window.utils.formatCurrency(v.pricePerDay)}</span>
                <span class="card-price-unit">/ day</span>
              </div>
            </div>

            <!-- Micro specs pills -->
            <div class="listing-specs-grid">
              <div class="listing-spec-item">
                <span class="material-symbols-outlined">local_gas_station</span>
                <span>${v.fuel}</span>
              </div>
              <div class="listing-spec-item">
                <span class="material-symbols-outlined">settings</span>
                <span>${v.transmission}</span>
              </div>
              <div class="listing-spec-item">
                <span class="material-symbols-outlined">airline_seat_recline_normal</span>
                <span>${v.seats || 2} ${v.category === 'Bike' ? 'Helmets' : 'Seats'}</span>
              </div>
            </div>

            <!-- Buttons -->
            <div class="listing-action-row">
              <a href="/views/booking.html?id=${v.id}" class="btn-primary" style="text-decoration: none;">
                <span>Book Now</span>
                <span class="material-symbols-outlined" style="font-size: 18px;">arrow_forward</span>
              </a>
              <a href="/views/vehicle-details.html?id=${v.id}" class="info-btn" title="View details" style="text-decoration: none;">
                <span class="material-symbols-outlined">info</span>
              </a>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }
}

function setupFilterEvents() {
  // Category Pills
  const pills = document.querySelectorAll('.cat-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeCategory = pill.getAttribute('data-category') || 'all';
      renderVehicles();
    });
  });

  // Search input
  const searchInput = document.getElementById('vehicle-search-input');
  searchInput?.addEventListener('input', () => {
    renderVehicles();
  });

  // Filter drawer toggle
  const toggleBtn = document.getElementById('toggle-filter-btn');
  const drawer = document.getElementById('filter-drawer');
  toggleBtn?.addEventListener('click', () => {
    drawer?.classList.toggle('open');
  });

  // Price buttons
  const priceBtns = document.querySelectorAll('.price-btn');
  priceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('active')) {
        btn.classList.remove('active');
        activePriceRange = null;
      } else {
        priceBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activePriceRange = {
          min: Number(btn.getAttribute('data-min')),
          max: Number(btn.getAttribute('data-max'))
        };
      }
      renderVehicles();
    });
  });

  // Sort selector
  const sortSelect = document.getElementById('sort-select');
  sortSelect?.addEventListener('change', (e) => {
    activeSort = e.target.value;
    renderVehicles();
  });

  // Reset filters
  const resetBtn = document.getElementById('reset-filters-btn');
  resetBtn?.addEventListener('click', () => {
    resetAllFilters();
  });

  const clearAllBtn = document.getElementById('clear-all-filters-btn');
  clearAllBtn?.addEventListener('click', () => {
    resetAllFilters();
  });

  const applyBtn = document.getElementById('apply-filters-btn');
  applyBtn?.addEventListener('click', () => {
    drawer?.classList.remove('open');
    renderVehicles();
    window.utils.showToast('Filters applied');
  });
}

function resetAllFilters() {
  const searchInput = document.getElementById('vehicle-search-input');
  if (searchInput) searchInput.value = '';

  activeCategory = 'all';
  updatePillActiveState('all');

  activePriceRange = null;
  document.querySelectorAll('.price-btn').forEach(b => b.classList.remove('active'));

  document.querySelectorAll('input[name="fuel"]').forEach(cb => { cb.checked = true; });
  document.querySelectorAll('input[name="transmission"]').forEach(cb => { cb.checked = true; });

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) sortSelect.value = 'featured';
  activeSort = 'featured';

  renderVehicles();
  window.utils.showToast('Filters cleared');
}

// Favorite button toggle
window.toggleFav = function(btn) {
  btn.classList.toggle('active');
  const icon = btn.querySelector('.material-symbols-outlined');
  if (icon) {
    if (btn.classList.contains('active')) {
      icon.style.fontVariationSettings = "'FILL' 1";
      window.utils.showToast('Saved to favorites');
    } else {
      icon.style.fontVariationSettings = "'FILL' 0";
    }
  }
};
