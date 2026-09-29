/**
 * DriveEasy - Admin Vehicle Management Script
 * Implements Add, Edit, Delete, Search, and Availability Toggle
 * using window.vehicleService.
 * NO direct Axios calls.
 */

let vehiclesList = [];
let editingVehicleId = null;

document.addEventListener('DOMContentLoaded', () => {
  setupModalHandlers();
  setupFilterHandlers();
  loadVehicles();
});

async function loadVehicles() {
  const tbody = document.getElementById('vehicles-table-body');
  const countBadge = document.getElementById('manage-vehicles-count');

  try {
    vehiclesList = await window.vehicleService.getVehicles();
    if (countBadge) countBadge.textContent = vehiclesList.length;
    renderTable();
  } catch (err) {
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--error); padding: 2rem;">
            Failed to load vehicles: ${err.message}
          </td>
        </tr>
      `;
    }
  }
}

function renderTable() {
  const tbody = document.getElementById('vehicles-table-body');
  if (!tbody) return;

  const searchTerm = (document.getElementById('admin-search-vehicle')?.value || '').toLowerCase().trim();
  const catFilter = document.getElementById('admin-filter-category')?.value || 'all';
  const availFilter = document.getElementById('admin-filter-avail')?.value || 'all';

  const filtered = vehiclesList.filter(v => {
    if (catFilter !== 'all' && (v.category || '').toLowerCase() !== catFilter.toLowerCase()) {
      return false;
    }
    if (availFilter !== 'all') {
      const isAvail = v.available !== false;
      if (String(isAvail) !== availFilter) return false;
    }
    if (searchTerm) {
      const match = (
        (v.name && v.name.toLowerCase().includes(searchTerm)) ||
        (v.brand && v.brand.toLowerCase().includes(searchTerm)) ||
        (v.model && v.model.toLowerCase().includes(searchTerm))
      );
      if (!match) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--secondary); padding: 2.5rem 1rem;">
          No vehicles found matching filters.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(v => {
    const isAvail = v.available !== false;
    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 52px; height: 38px; border-radius: var(--radius-sm); overflow: hidden; background: var(--surface-container-low); flex-shrink: 0;">
              <img src="${v.image}" alt="${v.name}" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
            <div>
              <strong style="color: var(--on-surface); display: block;">${v.name}</strong>
              <span style="font-size: 0.75rem; color: var(--secondary);">${v.brand || ''} ${v.model || ''}</span>
            </div>
          </div>
        </td>
        <td>
          <span style="font-size: 0.75rem; font-weight: 600; color: var(--primary-container); background: var(--surface-container); padding: 2px 8px; border-radius: var(--radius-sm);">
            ${v.category || 'Car'}
          </span>
        </td>
        <td>
          <strong style="color: var(--on-surface);">${window.utils.formatCurrency(v.pricePerDay)}</strong>
        </td>
        <td>
          <span style="font-size: 0.8125rem; color: var(--on-surface-variant);">${v.fuel} • ${v.transmission}</span>
        </td>
        <td style="font-size: 0.75rem; color: var(--secondary); max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${v.location || 'Hub'}
        </td>
        <td>
          <button class="status-pill ${isAvail ? 'confirmed' : 'cancelled'}" onclick="toggleAvailability(${v.id}, ${isAvail})" title="Click to toggle availability" style="cursor: pointer; border: none;">
            <span class="dot"></span>
            <span>${isAvail ? 'Available' : 'Unavailable'}</span>
          </button>
        </td>
        <td>
          <div class="action-buttons-group">
            <button class="action-icon-btn" onclick="openEditModal(${v.id})" title="Edit Vehicle">
              <span class="material-symbols-outlined" style="font-size: 16px;">edit</span>
            </button>
            <button class="action-icon-btn delete" onclick="deleteVehicleItem(${v.id})" title="Delete Vehicle">
              <span class="material-symbols-outlined" style="font-size: 16px;">delete</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function setupFilterHandlers() {
  document.getElementById('admin-search-vehicle')?.addEventListener('input', renderTable);
  document.getElementById('admin-filter-category')?.addEventListener('change', renderTable);
  document.getElementById('admin-filter-avail')?.addEventListener('change', renderTable);
}

function setupModalHandlers() {
  const modal = document.getElementById('vehicle-modal');
  const addBtn = document.getElementById('add-vehicle-btn');
  const closeBtn = document.getElementById('modal-close-btn');
  const cancelBtn = document.getElementById('modal-cancel-btn');
  const form = document.getElementById('vehicle-form');

  addBtn?.addEventListener('click', () => {
    editingVehicleId = null;
    document.getElementById('modal-vehicle-title').textContent = 'Add New Vehicle';
    form.reset();
    document.getElementById('veh-id').value = '';
    document.getElementById('veh-available').checked = true;
    modal?.classList.add('show');
  });

  const closeModal = () => modal?.classList.remove('show');
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('veh-name')?.value;
    const brand = document.getElementById('veh-brand')?.value;
    const model = document.getElementById('veh-model')?.value;
    const category = document.getElementById('veh-category')?.value;
    const pricePerDay = Number(document.getElementById('veh-price')?.value);
    const fuel = document.getElementById('veh-fuel')?.value;
    const transmission = document.getElementById('veh-trans')?.value;
    const seats = Number(document.getElementById('veh-seats')?.value) || 5;
    const location = document.getElementById('veh-location')?.value;
    const image = document.getElementById('veh-image')?.value;
    const description = document.getElementById('veh-desc')?.value;
    const available = document.getElementById('veh-available')?.checked;

    try {
      window.validateRequired(name, 'Vehicle Name');
      window.validateRequired(brand, 'Brand');
      window.validateRequired(location, 'Location');
      window.validateRequired(image, 'Image URL');

      if (!pricePerDay || pricePerDay <= 0) {
        throw new window.ValidationException('Price must be greater than 0', 'pricePerDay');
      }

      const vehicleData = {
        name,
        brand,
        model,
        category,
        type: category === 'Bike' ? 'Cruiser Bike' : category === 'Scooter' ? 'Scooter' : category === 'Van' ? 'Van' : category === 'SUV' ? 'Compact SUV' : 'Hatchback',
        pricePerDay,
        fuel,
        transmission,
        seats,
        location,
        image,
        description,
        available,
        rating: 4.8
      };

      const saveBtn = document.getElementById('modal-save-btn');
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
      }

      if (editingVehicleId) {
        // Update vehicle via vehicleService
        await window.vehicleService.updateVehicle(editingVehicleId, vehicleData);
        window.utils.showToast('Vehicle updated successfully', 'success');
      } else {
        // Add vehicle via vehicleService
        await window.vehicleService.addVehicle(vehicleData);
        window.utils.showToast('New vehicle added to fleet', 'success');
      }

      closeModal();
      loadVehicles();

      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Vehicle';
      }
    } catch (err) {
      window.utils.showToast(err.message, 'error');
    }
  });
}

window.openEditModal = function(id) {
  const v = vehiclesList.find(item => item.id == id);
  if (!v) return;

  editingVehicleId = id;
  document.getElementById('modal-vehicle-title').textContent = 'Edit Vehicle';
  document.getElementById('veh-id').value = v.id;
  document.getElementById('veh-name').value = v.name;
  document.getElementById('veh-brand').value = v.brand || '';
  document.getElementById('veh-model').value = v.model || '';
  document.getElementById('veh-category').value = v.category || 'Car';
  document.getElementById('veh-price').value = v.pricePerDay;
  document.getElementById('veh-fuel').value = v.fuel || 'Petrol';
  document.getElementById('veh-trans').value = v.transmission || 'Manual';
  document.getElementById('veh-seats').value = v.seats || 5;
  document.getElementById('veh-location').value = v.location || '';
  document.getElementById('veh-image').value = v.image || '';
  document.getElementById('veh-desc').value = v.description || '';
  document.getElementById('veh-available').checked = v.available !== false;

  document.getElementById('vehicle-modal')?.classList.add('show');
};

window.deleteVehicleItem = async function(id) {
  const v = vehiclesList.find(item => item.id == id);
  if (!confirm(`Are you sure you want to permanently delete "${v?.name || 'this vehicle'}" from the fleet?`)) {
    return;
  }

  try {
    await window.vehicleService.deleteVehicle(id);
    window.utils.showToast('Vehicle deleted successfully', 'success');
    loadVehicles();
  } catch (err) {
    window.utils.showToast(`Error deleting vehicle: ${err.message}`, 'error');
  }
};

window.toggleAvailability = async function(id, currentStatus) {
  try {
    const v = vehiclesList.find(item => item.id == id);
    if (!v) return;

    const newStatus = !currentStatus;
    await window.vehicleService.updateVehicle(id, { ...v, available: newStatus });
    v.available = newStatus;
    window.utils.showToast(`Vehicle marked as ${newStatus ? 'Available' : 'Unavailable'}`);
    renderTable();
  } catch (err) {
    window.utils.showToast(`Failed to update status: ${err.message}`, 'error');
  }
};
