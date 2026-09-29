/**
 * DriveEasy - My Bookings Page Script
 * Loads user bookings via window.bookingService, supports filtering and cancellation.
 * NO direct Axios calls.
 */

let userBookings = [];
let allVehiclesMap = {};
let activeStatusFilter = 'all';
let pendingCancelBookingId = null;

document.addEventListener('DOMContentLoaded', () => {
  setupFilterTabs();
  setupCancelModal();
  loadBookings();
});

async function loadBookings() {
  const container = document.getElementById('bookings-list-container');
  const user = window.utils.getCurrentUser();

  try {
    // Also fetch vehicles map for accurate vehicle images
    try {
      const vehicles = await window.vehicleService.getVehicles();
      vehicles.forEach(v => { allVehiclesMap[v.id] = v; });
    } catch (e) {
      console.warn('Could not preload vehicle images', e);
    }

    // Load bookings for current user, fallback to all bookings
    const bookings = await window.bookingService.getBookings();
    // Filter to user bookings if matching, or show all if demo
    userBookings = user ? bookings.filter(b => String(b.userId) === String(user.id)) : bookings;
    if (userBookings.length === 0) {
      userBookings = bookings; // fallback to sample bookings for demonstration
    }

    updateFilterBadges();
    renderBookings();
  } catch (error) {
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem 1rem; color: var(--error);">
          Failed to load bookings: ${error.message}
        </div>
      `;
    }
  }
}

function updateFilterBadges() {
  const total = userBookings.length;
  const activeCount = userBookings.filter(b => b.status === 'Active').length;
  const confirmedCount = userBookings.filter(b => b.status === 'Confirmed').length;
  const completedCount = userBookings.filter(b => b.status === 'Completed').length;
  const cancelledCount = userBookings.filter(b => b.status === 'Cancelled').length;

  document.getElementById('trips-count-text').textContent = `${total} Trips Total`;
  document.getElementById('filter-all-btn').textContent = `All (${total})`;
  document.getElementById('filter-active-btn').textContent = `Active (${activeCount})`;
  document.getElementById('filter-confirmed-btn').textContent = `Confirmed (${confirmedCount})`;
  document.getElementById('filter-completed-btn').textContent = `Completed (${completedCount})`;
  document.getElementById('filter-cancelled-btn').textContent = `Cancelled (${cancelledCount})`;
}

function renderBookings() {
  const container = document.getElementById('bookings-list-container');
  const emptyState = document.getElementById('bookings-empty-state');
  if (!container) return;

  const filtered = userBookings.filter(b => {
    if (activeStatusFilter === 'all') return true;
    return b.status?.toLowerCase() === activeStatusFilter.toLowerCase();
  });

  if (filtered.length === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.style.display = 'flex';
    return;
  } else {
    if (emptyState) emptyState.style.display = 'none';
  }

  container.innerHTML = filtered.map(b => {
    const v = allVehiclesMap[b.vehicleId] || {};
    const imgUrl = v.image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuD1AtVFWiYn43gtjt3fivJZkEDluBodZ2GXY_AHu00H6MhvOf1A9xoon-g-tqJw-FYVhr3fCfntv1omYs72GavLth570zras1r_KKm8jlt9ms4lfZBnHMm1oPLVgFTsCDe1bEWLzvzrsl3rbI5ZwM010VMgxyIjF-8xwuuLIUgF4Br_V8SQyiD8U2bEq74aHuplfpAT-zPe4bumHeuJBMVgSw9k4nRVm-YTvVY79NYDZ9YFq1TSAPqp';
    const vCategory = v.category || (b.vehicleName.includes('Enfield') || b.vehicleName.includes('R15') ? 'Bike' : b.vehicleName.includes('Activa') ? 'Scooter' : 'Car');
    const isCancelled = b.status === 'Cancelled';
    const isCompleted = b.status === 'Completed';

    let statusPillClass = 'status-pill confirmed';
    if (b.status === 'Active') statusPillClass = 'status-pill active';
    if (b.status === 'Completed') statusPillClass = 'status-pill completed';
    if (b.status === 'Cancelled') statusPillClass = 'status-pill cancelled';

    let priceDisplay = `
      <div class="booking-price-row">
        <span class="booking-price-val">${window.utils.formatCurrency(b.totalAmount)}</span>
        <span class="booking-price-tag">total</span>
      </div>
    `;

    if (isCancelled) {
      priceDisplay = `
        <div class="booking-price-row">
          <span class="booking-price-val" style="text-decoration: line-through; opacity: 0.6;">${window.utils.formatCurrency(b.totalAmount)}</span>
          <span style="font-size: 0.75rem; color: var(--error); font-weight: 600; margin-left: 4px;">Refunded</span>
        </div>
      `;
    }

    return `
      <div class="booking-card-item" data-id="${b.id}" style="${isCancelled ? 'opacity: 0.85;' : ''}">
        <div class="booking-card-top">
          <div class="booking-media-thumb">
            <img src="${imgUrl}" alt="${b.vehicleName}" style="${isCancelled ? 'filter: grayscale(40%);' : ''}" />
            <span class="thumb-tag">${vCategory}</span>
          </div>

          <div class="booking-info-col">
            <div class="booking-name-status">
              <h2 class="booking-vehicle-title">${b.vehicleName}</h2>
              <span class="${statusPillClass}">
                <span class="dot"></span>
                <span>${b.status}</span>
              </span>
            </div>

            ${priceDisplay}

            <div class="booking-receipt-id">
              <span class="material-symbols-outlined">receipt_long</span>
              <span>${b.id}</span>
            </div>
          </div>
        </div>

        <div class="booking-dates-strip">
          <div style="display: flex; align-items: center; min-width: 0;">
            <span class="material-symbols-outlined">calendar_today</span>
            <span style="font-weight: 600; color: var(--on-surface); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${window.utils.formatDate(b.pickupDate)} - ${window.utils.formatDate(b.returnDate)}
            </span>
          </div>
          <span class="booking-days-badge">${b.status === 'Active' ? 'In Progress' : `${b.rentalDays || 2} Days`}</span>
        </div>

        <div class="booking-actions-row">
          <a href="/views/confirmation.html?id=${b.id}" class="btn-outline" style="flex: 1; height: 38px; text-decoration: none;">
            <span class="material-symbols-outlined" style="font-size: 16px;">visibility</span>
            <span>View Details</span>
          </a>
          ${(!isCancelled && !isCompleted) ? `
            <button class="btn-danger" style="flex: 1; height: 38px;" onclick="openCancelModal('${b.id}')">
              <span class="material-symbols-outlined" style="font-size: 16px;">close</span>
              <span>Cancel Booking</span>
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function setupFilterTabs() {
  const buttons = document.querySelectorAll('.booking-filter-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeStatusFilter = btn.getAttribute('data-filter') || 'all';
      renderBookings();
    });
  });
}

function setupCancelModal() {
  const dialog = document.getElementById('cancel-dialog');
  const keepBtn = document.getElementById('modal-keep-btn');
  const confirmBtn = document.getElementById('modal-confirm-cancel-btn');

  keepBtn?.addEventListener('click', () => {
    dialog?.classList.remove('show');
    pendingCancelBookingId = null;
  });

  confirmBtn?.addEventListener('click', async () => {
    if (!pendingCancelBookingId) return;

    confirmBtn.disabled = true;
    confirmBtn.innerHTML = 'Cancelling...';

    try {
      // Axios PATCH via bookingService
      await window.bookingService.cancelBooking(pendingCancelBookingId);
      
      // Update local state
      const target = userBookings.find(b => b.id === pendingCancelBookingId);
      if (target) target.status = 'Cancelled';

      dialog?.classList.remove('show');
      window.utils.showToast(`Reservation #${pendingCancelBookingId} cancelled. Refund initiated.`, 'success');
      
      updateFilterBadges();
      renderBookings();
    } catch (err) {
      window.utils.showToast(`Failed to cancel booking: ${err.message}`, 'error');
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = 'Yes, Cancel';
      pendingCancelBookingId = null;
    }
  });
}

window.openCancelModal = function(bookingId) {
  pendingCancelBookingId = bookingId;
  const label = document.getElementById('modal-cancel-id');
  if (label) label.textContent = bookingId;
  const dialog = document.getElementById('cancel-dialog');
  if (dialog) dialog.classList.add('show');
};
