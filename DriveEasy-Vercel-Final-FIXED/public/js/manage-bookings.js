/**
 * DriveEasy - Admin Manage Bookings Script
 * Uses window.bookingService to query, search, update status, and cancel bookings.
 * NO direct Axios calls.
 */

let allAdminBookings = [];
let targetBookingForStatus = null;

document.addEventListener('DOMContentLoaded', () => {
  setupFilterHandlers();
  setupStatusModal();
  loadAllBookings();
});

async function loadAllBookings() {
  const tbody = document.getElementById('bookings-table-body');
  const countBadge = document.getElementById('manage-bookings-count');

  try {
    allAdminBookings = await window.bookingService.getBookings();
    if (countBadge) countBadge.textContent = allAdminBookings.length;
    renderTable();
  } catch (err) {
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; color: var(--error); padding: 2rem;">
            Failed to load bookings: ${err.message}
          </td>
        </tr>
      `;
    }
  }
}

function renderTable() {
  const tbody = document.getElementById('bookings-table-body');
  if (!tbody) return;

  const searchTerm = (document.getElementById('admin-search-booking')?.value || '').toLowerCase().trim();
  const statusFilter = document.getElementById('admin-filter-status')?.value || 'all';

  const filtered = allAdminBookings.filter(b => {
    if (statusFilter !== 'all' && (b.status || '').toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    if (searchTerm) {
      const match = (
        (b.id && b.id.toLowerCase().includes(searchTerm)) ||
        (b.vehicleName && b.vehicleName.toLowerCase().includes(searchTerm)) ||
        (b.pickupLocation && b.pickupLocation.toLowerCase().includes(searchTerm))
      );
      if (!match) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; color: var(--secondary); padding: 2.5rem 1rem;">
          No bookings found matching filters.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(b => {
    let statusClass = 'status-pill confirmed';
    if (b.status === 'Active') statusClass = 'status-pill active';
    if (b.status === 'Completed') statusClass = 'status-pill completed';
    if (b.status === 'Cancelled') statusClass = 'status-pill cancelled';

    return `
      <tr>
        <td>
          <span style="font-family: monospace; font-weight: 700; color: var(--primary-container); background: var(--surface-container); padding: 3px 6px; border-radius: 4px;">
            ${b.id}
          </span>
        </td>
        <td>
          <strong style="color: var(--on-surface); font-size: 0.875rem;">${b.vehicleName}</strong>
        </td>
        <td style="font-size: 0.8125rem; color: var(--on-surface-variant); white-space: nowrap;">
          ${window.utils.formatDate(b.pickupDate)} → ${window.utils.formatDate(b.returnDate)}
          <span style="display: block; font-size: 0.6875rem; color: var(--secondary);">${b.rentalDays || 2} Days</span>
        </td>
        <td style="font-size: 0.75rem; color: var(--secondary); max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${b.pickupLocation || 'Hub'}
        </td>
        <td>
          <strong style="color: var(--on-surface);">${window.utils.formatCurrency(b.totalAmount)}</strong>
        </td>
        <td>
          <span style="font-size: 0.75rem; color: var(--secondary); font-weight: 500;">${b.paymentMethod || 'UPI'}</span>
        </td>
        <td>
          <span class="${statusClass}">
            <span class="dot"></span>
            <span>${b.status}</span>
          </span>
        </td>
        <td>
          <div class="action-buttons-group">
            <a href="/views/confirmation.html?id=${b.id}" class="action-icon-btn" title="View details" style="text-decoration: none;">
              <span class="material-symbols-outlined" style="font-size: 16px;">visibility</span>
            </a>
            <button class="action-icon-btn" onclick="openStatusModal('${b.id}')" title="Change Status">
              <span class="material-symbols-outlined" style="font-size: 16px;">edit_note</span>
            </button>
            ${b.status !== 'Cancelled' ? `
              <button class="action-icon-btn delete" onclick="cancelBookingItem('${b.id}')" title="Cancel Booking">
                <span class="material-symbols-outlined" style="font-size: 16px;">cancel</span>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function setupFilterHandlers() {
  document.getElementById('admin-search-booking')?.addEventListener('input', renderTable);
  document.getElementById('admin-filter-status')?.addEventListener('change', renderTable);
}

function setupStatusModal() {
  const modal = document.getElementById('status-modal');
  const closeBtn = document.getElementById('status-modal-close');
  const cancelBtn = document.getElementById('status-modal-cancel');
  const saveBtn = document.getElementById('status-modal-save');

  const closeModal = () => modal?.classList.remove('show');
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);

  saveBtn?.addEventListener('click', async () => {
    if (!targetBookingForStatus) return;

    const newStatus = document.getElementById('select-new-status')?.value;
    saveBtn.disabled = true;
    saveBtn.textContent = 'Updating...';

    try {
      await window.bookingService.updateBooking(targetBookingForStatus.id, {
        ...targetBookingForStatus,
        status: newStatus
      });

      targetBookingForStatus.status = newStatus;
      window.utils.showToast(`Booking #${targetBookingForStatus.id} updated to ${newStatus}`, 'success');
      closeModal();
      renderTable();
    } catch (err) {
      window.utils.showToast(`Failed to update status: ${err.message}`, 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Update Status';
      targetBookingForStatus = null;
    }
  });
}

window.openStatusModal = function(id) {
  const b = allAdminBookings.find(item => item.id == id);
  if (!b) return;

  targetBookingForStatus = b;
  document.getElementById('status-modal-booking-id').textContent = b.id;
  document.getElementById('status-modal-vehicle').textContent = b.vehicleName;
  document.getElementById('select-new-status').value = b.status || 'Confirmed';

  document.getElementById('status-modal')?.classList.add('show');
};

window.cancelBookingItem = async function(id) {
  if (!confirm(`Are you sure you want to cancel booking #${id}?`)) return;

  try {
    await window.bookingService.cancelBooking(id);
    const target = allAdminBookings.find(item => item.id == id);
    if (target) target.status = 'Cancelled';
    window.utils.showToast(`Booking #${id} cancelled`, 'success');
    renderTable();
  } catch (err) {
    window.utils.showToast(`Error: ${err.message}`, 'error');
  }
};
