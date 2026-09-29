/**
 * DriveEasy - Home Page Script
 * Interacts with vehicleService to load popular vehicles dynamically.
 * All Axios calls remain in vehicleService.js.
 */

document.addEventListener('DOMContentLoaded', () => {
  initDateInputs();
  loadPopularVehicles();
  setupSearchForm();
});

function initDateInputs() {
  const pickupInput = document.getElementById('search-pickup-date');
  const returnInput = document.getElementById('search-return-date');

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const threeDaysLater = new Date();
  threeDaysLater.setDate(today.getDate() + 3);

  const formatIsoDate = (d) => d.toISOString().split('T')[0];

  if (pickupInput && !pickupInput.value) {
    pickupInput.value = formatIsoDate(tomorrow);
    pickupInput.min = formatIsoDate(today);
  }

  if (returnInput && !returnInput.value) {
    returnInput.value = formatIsoDate(threeDaysLater);
    returnInput.min = formatIsoDate(tomorrow);
  }

  pickupInput?.addEventListener('change', () => {
    if (pickupInput.value && returnInput) {
      returnInput.min = pickupInput.value;
      if (returnInput.value <= pickupInput.value) {
        const next = new Date(pickupInput.value);
        next.setDate(next.getDate() + 2);
        returnInput.value = formatIsoDate(next);
      }
    }
  });
}

async function loadPopularVehicles() {
  const container = document.getElementById('popular-vehicles-container');
  if (!container) return;

  try {
    const vehicles = await window.vehicleService.getVehicles();
    // Pick the top 4 vehicles (or popular models: Hyundai i20, Tata Nexon, Royal Enfield Classic 350, Honda Activa)
    const popular = vehicles.slice(0, 4);

    if (!popular.length) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--secondary);">
          No vehicles currently available.
        </div>
      `;
      return;
    }

    container.innerHTML = popular.map(vehicle => `
      <div class="vehicle-card">
        <div class="card-media">
          <img src="${vehicle.image}" alt="${vehicle.name}" loading="lazy" />
          <span class="card-category-badge">${vehicle.category || vehicle.type}</span>
          <div class="card-rating-badge">
            <span class="material-symbols-outlined" style="font-size: 14px; font-variation-settings: 'FILL' 1;">star</span>
            <span>${vehicle.rating || '4.8'}</span>
          </div>
        </div>
        <div class="card-body">
          <div class="card-header-flex">
            <div>
              <h3 class="card-name">${vehicle.name}</h3>
              <p class="card-subtitle">${vehicle.type} • ${vehicle.transmission} • ${vehicle.fuel}</p>
            </div>
            <div class="card-price-box">
              <span class="card-price">${window.utils.formatCurrency(vehicle.pricePerDay)}</span>
              <span class="card-price-unit">/ day</span>
            </div>
          </div>

          <div class="card-specs-row">
            <span class="spec-chip">
              <span class="material-symbols-outlined">airline_seat_recline_normal</span>
              ${vehicle.seats || 2} Seats
            </span>
            <span class="spec-chip">
              <span class="material-symbols-outlined">speed</span>
              Unlimited KMs
            </span>
          </div>

          <a href="/views/vehicle-details.html?id=${vehicle.id}" class="btn-primary" style="margin-top: 0.5rem; text-decoration: none;">
            <span>View Details</span>
            <span class="material-symbols-outlined" style="font-size: 16px;">chevron_right</span>
          </a>
        </div>
      </div>
    `).join('');
  } catch (error) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--error);">
        Unable to load vehicles: ${error.message}
      </div>
    `;
  }
}

function setupSearchForm() {
  const searchBtn = document.getElementById('find-rides-btn');
  if (!searchBtn) return;

  searchBtn.addEventListener('click', () => {
    const location = document.getElementById('search-location')?.value || '';
    const pickupDate = document.getElementById('search-pickup-date')?.value || '';
    const returnDate = document.getElementById('search-return-date')?.value || '';

    try {
      if (pickupDate && returnDate) {
        window.validateRentalDates(pickupDate, returnDate);
      }
      
      const query = new URLSearchParams();
      if (location) query.set('location', location);
      if (pickupDate) query.set('pickupDate', pickupDate);
      if (returnDate) query.set('returnDate', returnDate);

      window.location.href = `/views/vehicles.html?${query.toString()}`;
    } catch (validationErr) {
      window.utils.showToast(validationErr.message, 'error');
    }
  });
}
