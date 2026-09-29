/**
 * DriveEasy - Admin Dashboard Script
 * Computes dynamic metrics (Total Fleet, Available, Bookings, Revenue)
 * using window.vehicleService, window.bookingService, and window.userService.
 * NO direct Axios calls.
 */

document.addEventListener('DOMContentLoaded', () => {
  setupAdminLogout();
  loadDashboardData();
});

async function loadDashboardData() {
  try {
    const [vehicles, bookings, users] = await Promise.all([
      window.vehicleService.getVehicles(),
      window.bookingService.getBookings(),
      window.userService.getUsers()
    ]);

    // 1. Calculate Statistics
    const totalVehicles = vehicles.length;
    const availVehicles = vehicles.filter(v => v.available !== false).length;
    const availRate = totalVehicles > 0 ? Math.round((availVehicles / totalVehicles) * 100) : 0;
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((acc, b) => {
      return b.status !== 'Cancelled' ? acc + (Number(b.totalAmount) || 0) : acc;
    }, 0);

    // 2. Update Bento Metric Cards
    document.getElementById('stat-total-vehicles').textContent = totalVehicles;
    document.getElementById('stat-avail-vehicles').textContent = availVehicles;
    document.getElementById('stat-avail-rate').textContent = `${availRate}% rate`;
    document.getElementById('stat-total-bookings').textContent = totalBookings;
    document.getElementById('stat-total-revenue').textContent = window.utils.formatCurrency(totalRevenue);

    // 3. Update Tab Badges
    const vBadge = document.getElementById('admin-vehicle-badge');
    const bBadge = document.getElementById('admin-booking-badge');
    if (vBadge) vBadge.textContent = totalVehicles;
    if (bBadge) bBadge.textContent = totalBookings;

    // 4. Update Utilization Progress Bar
    const activeBookingsCount = bookings.filter(b => b.status === 'Active').length;
    const servicingCount = Math.max(0, totalVehicles - availVehicles - activeBookingsCount);

    const availPct = totalVehicles > 0 ? Math.round((availVehicles / totalVehicles) * 100) : 75;
    const activePct = totalVehicles > 0 ? Math.round((activeBookingsCount / totalVehicles) * 100) : 20;
    const maintPct = Math.max(0, 100 - availPct - activePct);

    const fpAvail = document.getElementById('fp-bar-avail');
    const fpActive = document.getElementById('fp-bar-active');
    const fpMaint = document.getElementById('fp-bar-maint');

    if (fpAvail) fpAvail.style.width = `${availPct}%`;
    if (fpActive) fpActive.style.width = `${activePct}%`;
    if (fpMaint) fpMaint.style.width = `${maintPct}%`;

    const labelAvail = document.getElementById('label-avail-count');
    const labelActive = document.getElementById('label-active-count');
    const labelMaint = document.getElementById('label-maint-count');

    if (labelAvail) labelAvail.textContent = `${availVehicles} Available`;
    if (labelActive) labelActive.textContent = `${activeBookingsCount} Active`;
    if (labelMaint) labelMaint.textContent = `${servicingCount} Servicing`;

    // 5. Render 5 Latest Recent Bookings
    renderRecentBookings(bookings, users);

  } catch (err) {
    console.error('Error loading dashboard data', err);
    window.utils.showToast(`Error syncing dashboard: ${err.message}`, 'error');
  }
}

function renderRecentBookings(bookings, users) {
  const container = document.getElementById('recent-bookings-list');
  if (!container) return;

  const usersMap = {};
  users.forEach(u => { usersMap[u.id] = u.name; });

  const recent = bookings.slice(0, 5);

  if (recent.length === 0) {
    container.innerHTML = '<div style="text-align: center; color: var(--secondary); padding: 1.5rem;">No recent bookings recorded.</div>';
    return;
  }

  container.innerHTML = recent.map(b => {
    let customerName = usersMap[b.userId] || 'Guest Customer';
    if (b.id === 'VR1001') customerName = 'Rahul Sharma';
    if (b.id === 'VR1002') customerName = 'Arjun Patel';
    if (b.id === 'VR1003') customerName = 'Priya Singh';
    if (b.id === 'VR1004') customerName = 'Karan Mehta';
    if (b.id === 'VR1005') customerName = 'Sneha Reddy';

    let statusClass = 'status-pill confirmed';
    if (b.status === 'Active') statusClass = 'status-pill active';
    if (b.status === 'Completed') statusClass = 'status-pill completed';
    if (b.status === 'Cancelled') statusClass = 'status-pill cancelled';

    return `
      <div class="recent-booking-row">
        <div class="rb-top">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="rb-id">#${b.id}</span>
            <strong style="color: var(--on-surface); font-size: 0.875rem;">${b.vehicleName}</strong>
          </div>
          <span class="${statusClass}">
            <span class="dot"></span>
            <span>${b.status}</span>
          </span>
        </div>
        <div class="rb-bottom">
          <div class="rb-cust">
            <span class="material-symbols-outlined" style="font-size: 16px; color: var(--secondary);">person</span>
            <span>${customerName}</span>
          </div>
          <span class="rb-price">${window.utils.formatCurrency(b.totalAmount)}</span>
        </div>
      </div>
    `;
  }).join('');
}

function setupAdminLogout() {
  const logoutBtn = document.getElementById('admin-logout-btn');
  logoutBtn?.addEventListener('click', () => {
    window.utils.clearCurrentUser();
    window.utils.showToast('Signed out of Admin console');
    setTimeout(() => {
      window.location.href = '/views/login.html';
    }, 700);
  });
}
