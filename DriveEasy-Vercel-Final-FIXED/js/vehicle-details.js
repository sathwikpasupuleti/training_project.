/**
 * DriveEasy - Vehicle Details Page Script
 * Retrieves vehicle data via window.vehicleService.getVehicleById(id).
 * Handles carousel, specifications, dates selection, availability check, and checkout redirect.
 */

let currentVehicle = null;
let currentImageIndex = 0;
let vehicleImages = [];

document.addEventListener('DOMContentLoaded', () => {
  const vehicleId = window.utils.getUrlParam('id') || 1;
  initDatePickers();
  loadVehicleData(vehicleId);
});

function initDatePickers() {
  const startInput = document.getElementById('details-start-date');
  const endInput = document.getElementById('details-end-date');

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const returnDate = new Date();
  returnDate.setDate(today.getDate() + 3);

  const formatIso = d => d.toISOString().split('T')[0];

  if (startInput) {
    startInput.value = formatIso(tomorrow);
    startInput.min = formatIso(today);
  }
  if (endInput) {
    endInput.value = formatIso(returnDate);
    endInput.min = formatIso(tomorrow);
  }

  startInput?.addEventListener('change', updateDurationAndPrice);
  endInput?.addEventListener('change', updateDurationAndPrice);
}

function updateDurationAndPrice() {
  const startVal = document.getElementById('details-start-date')?.value;
  const endVal = document.getElementById('details-end-date')?.value;
  const badge = document.getElementById('duration-badge-text');
  const bottomPrice = document.getElementById('bottom-total-price');

  if (!currentVehicle || !startVal || !endVal) return;

  try {
    const calc = window.utils.calculateRental(currentVehicle.pricePerDay, startVal, endVal);
    if (badge) badge.textContent = `${calc.rentalDays} Day${calc.rentalDays > 1 ? 's' : ''} Rental`;
    if (bottomPrice) bottomPrice.textContent = window.utils.formatCurrency(calc.totalAmount);
  } catch (e) {
    console.error(e);
  }
}

async function loadVehicleData(id) {
  const loading = document.getElementById('loading-state');
  const detailsView = document.getElementById('vehicle-details-view');
  const stickyBar = document.getElementById('sticky-action-bar');

  try {
    currentVehicle = await window.vehicleService.getVehicleById(id);

    if (loading) loading.style.display = 'none';
    if (detailsView) detailsView.style.display = 'block';
    if (stickyBar) stickyBar.style.display = 'block';

    renderVehicleDetails(currentVehicle);
    setupCarousel(currentVehicle);
    setupAvailabilityChecker(currentVehicle);
    setupRentNowAction(currentVehicle);
    updateDurationAndPrice();
  } catch (error) {
    if (loading) {
      loading.innerHTML = `
        <div style="color: var(--error); padding: 2rem;">
          <h3>Error loading vehicle</h3>
          <p>${error.message}</p>
          <a href="/views/vehicles.html" class="btn-primary" style="margin-top: 1rem; display: inline-block;">Return to Vehicles</a>
        </div>
      `;
    }
  }
}

function renderVehicleDetails(v) {
  // Title & Price
  document.getElementById('vehicle-name').textContent = v.name;
  document.getElementById('vehicle-price').textContent = window.utils.formatCurrency(v.pricePerDay);
  document.title = `${v.name} - DriveEasy`;

  // Status Pill
  const statusPill = document.getElementById('availability-pill');
  const statusText = document.getElementById('availability-status-text');
  const isAvailable = v.available !== false;

  if (statusPill && statusText) {
    if (isAvailable) {
      statusPill.className = 'status-pill confirmed';
      statusText.textContent = 'Available';
    } else {
      statusPill.className = 'status-pill cancelled';
      statusText.textContent = 'Currently Rented';
    }
  }

  // Quick Spec Chips
  const quickSpecs = document.getElementById('quick-specs-container');
  if (quickSpecs) {
    quickSpecs.innerHTML = `
      <span class="quick-spec-pill">
        <span class="material-symbols-outlined">directions_car</span>
        ${v.type || v.category}
      </span>
      <span class="quick-spec-pill">
        <span class="material-symbols-outlined">local_gas_station</span>
        ${v.fuel}
      </span>
      <span class="quick-spec-pill">
        <span class="material-symbols-outlined">settings</span>
        ${v.transmission}
      </span>
      <span class="quick-spec-pill">
        <span class="material-symbols-outlined">group</span>
        ${v.seats || 2} ${v.category === 'Bike' ? 'Helmets' : 'Seats'}
      </span>
    `;
  }

  // Specs Table Grid
  const specsGrid = document.getElementById('specs-grid-data');
  if (specsGrid) {
    specsGrid.innerHTML = `
      <div class="spec-cell">
        <span class="spec-cell-label">Brand</span>
        <span class="spec-cell-value">${v.brand || 'DriveEasy'}</span>
      </div>
      <div class="spec-cell">
        <span class="spec-cell-label">Model</span>
        <span class="spec-cell-value">${v.model || v.name}</span>
      </div>
      <div class="spec-cell">
        <span class="spec-cell-label">Fuel Type</span>
        <span class="spec-cell-value">${v.fuel}</span>
      </div>
      <div class="spec-cell">
        <span class="spec-cell-label">Transmission</span>
        <span class="spec-cell-value">${v.transmission}</span>
      </div>
      <div class="spec-cell">
        <span class="spec-cell-label">Seating Capacity</span>
        <span class="spec-cell-value">${v.seats || 2} Passenger</span>
      </div>
      <div class="spec-cell">
        <span class="spec-cell-label">Mileage / Range</span>
        <span class="spec-cell-value">${v.fuel === 'Electric' ? '105 km / charge' : '18 - 22 kmpl'}</span>
      </div>
    `;
  }

  // Description
  const descEl = document.getElementById('vehicle-desc-text');
  if (descEl) {
    descEl.textContent = v.description || 'Verified and sanitized self-drive vehicle equipped with modern safety features and road-tested reliability.';
  }

  // Hub Name
  const hubEl = document.getElementById('hub-name-overlay');
  if (hubEl && v.location) {
    hubEl.textContent = `DriveEasy Hub • ${v.location}`;
  }
}

function setupCarousel(v) {
  // Gallery images array
  vehicleImages = [
    v.image,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAHBam3esYF9C2KXc4JKdPjuSXRP66vYcohrkDSExy5I0RsgBouEdG-Bp5JN0CwgQ4CY9KMbUqjR8lNx9sgzLHJnn3UWgo0BuiT2i61ucm0lIuY66DwHSWFgQ8n82x01mVyyjpb2Ggx6DnvHSPVtWFjIulUCGWuxRa7F323qNHa3HxmSdcNE_qoMJgD09bAlnONKT79QskdL0JmqoBs3zBYWUKk8_crcRlvgLY15iCM-nT8jQ9KZKzU',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAFCPxLVvVqu9aiDlNfeYn4AiXD2qkbHhigVeEv6vY_N76umrCkcxvEluIHV5RHfc3k8GdYWU-sPhQnXWR9xdbR4JSqLRSoeAeFimYwy6lk12a80U0TWO-nyygVD7AT5nT_KmwrHS7G0Hu89T5oYUt9jsuEC4L6D02KC9b_ypzRnOOcm4MHPXmcj2pSb32JFiWLZeUCb5Sly4EjQ5X_JzUPyILzcGYjwMMziHfx9VIlywIsveomABxo',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCjtQaQAgpIbIi74UsyD98VjRkQ8cr5qUB1mKrwOYdMIh7zxZ50WV10bVAWk34IdGzA-_BtxASsRmSXS3G8zfqQRFb5ZKFoRTSZfRrvkUTIEufr173yXogvWl3X2DoZABXabEOmqq_T132B_G_04yiIsp26IW5XL-vsEq8edqs92vrySdnhZsSF4PEKUSRD5f_s_fFQBpjAxHDnaq9pvm7emZ-FPBb03loxSUOYcjVcQrGG6gAIThCw'
  ];

  const mainImg = document.getElementById('main-vehicle-img');
  const thumbStrip = document.getElementById('thumbnail-strip');
  const dots = document.querySelectorAll('.carousel-dot');

  function updateActiveImage(idx) {
    currentImageIndex = idx;
    if (mainImg) mainImg.src = vehicleImages[currentImageIndex];

    const thumbs = thumbStrip?.querySelectorAll('.thumb-item');
    thumbs?.forEach((t, i) => {
      if (i === idx) t.classList.add('active');
      else t.classList.remove('active');
    });

    dots.forEach((d, i) => {
      if (i === idx) d.classList.add('active');
      else d.classList.remove('active');
    });
  }

  // Thumbnails render
  if (thumbStrip) {
    thumbStrip.innerHTML = vehicleImages.map((src, idx) => `
      <div class="thumb-item ${idx === 0 ? 'active' : ''}" data-idx="${idx}">
        <img src="${src}" alt="Thumb ${idx + 1}" />
      </div>
    `).join('') + `
      <div class="thumb-more">+3 more</div>
    `;

    thumbStrip.querySelectorAll('.thumb-item').forEach(thumb => {
      thumb.addEventListener('click', () => {
        const idx = parseInt(thumb.getAttribute('data-idx') || '0', 10);
        updateActiveImage(idx);
      });
    });
  }

  updateActiveImage(0);

  // Nav buttons
  document.getElementById('carousel-prev')?.addEventListener('click', () => {
    const nextIdx = (currentImageIndex - 1 + vehicleImages.length) % vehicleImages.length;
    updateActiveImage(nextIdx);
  });

  document.getElementById('carousel-next')?.addEventListener('click', () => {
    const nextIdx = (currentImageIndex + 1) % vehicleImages.length;
    updateActiveImage(nextIdx);
  });
}

function setupAvailabilityChecker(v) {
  const checkBtn = document.getElementById('check-avail-btn');
  const noticeBox = document.getElementById('avail-notice-box');
  const rentBtn = document.getElementById('rent-now-btn');

  const isAvailable = v.available !== false;

  checkBtn?.addEventListener('click', () => {
    const startDate = document.getElementById('details-start-date')?.value;
    const endDate = document.getElementById('details-end-date')?.value;

    try {
      window.validateRentalDates(startDate, endDate);

      checkBtn.innerHTML = '<span class="material-symbols-outlined animate-spin" style="font-size: 18px;">refresh</span><span>Checking...</span>';
      checkBtn.disabled = true;

      setTimeout(() => {
        checkBtn.disabled = false;
        checkBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 18px;">verified</span><span>Check Availability</span>';

        if (isAvailable) {
          noticeBox.className = 'availability-alert available';
          noticeBox.style.display = 'block';
          noticeBox.textContent = 'Vehicle Available for the selected dates!';
          if (rentBtn) {
            rentBtn.disabled = false;
            rentBtn.style.opacity = '1';
            rentBtn.style.pointerEvents = 'auto';
          }
        } else {
          noticeBox.className = 'availability-alert unavailable';
          noticeBox.style.display = 'block';
          noticeBox.textContent = 'Vehicle Not Available for the selected dates. Please try other dates or vehicles.';
          if (rentBtn) {
            rentBtn.disabled = true;
            rentBtn.style.opacity = '0.5';
            rentBtn.style.pointerEvents = 'none';
          }
        }
      }, 400);
    } catch (err) {
      window.utils.showToast(err.message, 'error');
    }
  });

  // Initial state check
  if (!isAvailable && rentBtn) {
    rentBtn.disabled = true;
    rentBtn.style.opacity = '0.5';
    rentBtn.style.pointerEvents = 'none';
  }
}

function setupRentNowAction(v) {
  const rentBtn = document.getElementById('rent-now-btn');
  if (!rentBtn) return;

  rentBtn.addEventListener('click', () => {
    const startDate = document.getElementById('details-start-date')?.value;
    const endDate = document.getElementById('details-end-date')?.value;
    const location = document.getElementById('details-pickup-loc')?.value || v.location;

    try {
      window.validateRentalDates(startDate, endDate);

      const params = new URLSearchParams({
        id: v.id,
        pickupDate: startDate,
        returnDate: endDate,
        location: location
      });

      window.location.href = `/views/booking.html?${params.toString()}`;
    } catch (err) {
      window.utils.showToast(err.message, 'error');
    }
  });
}
