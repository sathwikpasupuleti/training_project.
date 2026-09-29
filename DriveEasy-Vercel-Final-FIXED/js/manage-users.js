/**
 * DriveEasy - Admin Manage Users Script
 * Uses window.userService to display, filter, and register users.
 * NO direct Axios calls.
 */

let allAdminUsers = [];

document.addEventListener('DOMContentLoaded', () => {
  setupFilterHandlers();
  setupAddUserModal();
  loadAllUsers();
});

async function loadAllUsers() {
  const tbody = document.getElementById('users-table-body');
  const countBadge = document.getElementById('manage-users-count');

  try {
    allAdminUsers = await window.userService.getUsers();
    if (countBadge) countBadge.textContent = allAdminUsers.length;
    renderTable();
  } catch (err) {
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--error); padding: 2rem;">
            Failed to load users: ${err.message}
          </td>
        </tr>
      `;
    }
  }
}

function renderTable() {
  const tbody = document.getElementById('users-table-body');
  if (!tbody) return;

  const searchTerm = (document.getElementById('admin-search-user')?.value || '').toLowerCase().trim();
  const roleFilter = document.getElementById('admin-filter-role')?.value || 'all';

  const filtered = allAdminUsers.filter(u => {
    if (roleFilter !== 'all' && (u.role || '').toLowerCase() !== roleFilter.toLowerCase()) {
      return false;
    }
    if (searchTerm) {
      const match = (
        (u.name && u.name.toLowerCase().includes(searchTerm)) ||
        (u.email && u.email.toLowerCase().includes(searchTerm)) ||
        (u.phone && u.phone.toLowerCase().includes(searchTerm))
      );
      if (!match) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--secondary); padding: 2.5rem 1rem;">
          No users found matching query.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(u => {
    const isAdmin = u.role === 'admin';
    return `
      <tr>
        <td>
          <span style="font-family: monospace; font-size: 0.8125rem; color: var(--secondary);">
            #USR-${u.id}
          </span>
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 28px; height: 28px; border-radius: 50%; background: ${isAdmin ? 'var(--tertiary-fixed)' : 'var(--surface-container)'}; color: ${isAdmin ? 'var(--tertiary)' : 'var(--primary-container)'}; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700;">
              ${u.name ? u.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <strong style="color: var(--on-surface); font-size: 0.875rem;">${u.name}</strong>
          </div>
        </td>
        <td>
          <span style="color: var(--on-surface-variant); font-size: 0.8125rem;">${u.email}</span>
        </td>
        <td>
          <span style="color: var(--secondary); font-size: 0.8125rem;">${u.phone || '—'}</span>
        </td>
        <td>
          <span class="status-pill ${isAdmin ? 'active' : 'confirmed'}" style="font-size: 0.6875rem;">
            <span class="dot"></span>
            <span>${isAdmin ? 'Administrator' : 'Customer'}</span>
          </span>
        </td>
        <td>
          <span style="font-size: 0.75rem; color: #065f46; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
            <span class="material-symbols-outlined" style="font-size: 14px;">check_circle</span>
            Active
          </span>
        </td>
      </tr>
    `;
  }).join('');
}

function setupFilterHandlers() {
  document.getElementById('admin-search-user')?.addEventListener('input', renderTable);
  document.getElementById('admin-filter-role')?.addEventListener('change', renderTable);
}

function setupAddUserModal() {
  const modal = document.getElementById('user-modal');
  const addBtn = document.getElementById('add-user-btn');
  const closeBtn = document.getElementById('user-modal-close');
  const cancelBtn = document.getElementById('user-modal-cancel');
  const form = document.getElementById('user-create-form');

  addBtn?.addEventListener('click', () => {
    form?.reset();
    modal?.classList.add('show');
  });

  const closeModal = () => modal?.classList.remove('show');
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('new-user-name')?.value;
    const email = document.getElementById('new-user-email')?.value;
    const phone = document.getElementById('new-user-phone')?.value;
    const password = document.getElementById('new-user-password')?.value;
    const role = document.getElementById('new-user-role')?.value;

    const saveBtn = document.getElementById('user-modal-save');

    try {
      window.validateRequired(name, 'Full Name');
      window.validateEmail(email);
      window.validatePhone(phone);
      window.validateRequired(password, 'Password');

      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Creating...';
      }

      const newUser = {
        name,
        email,
        phone,
        password,
        role: role || 'user'
      };

      await window.userService.registerUser(newUser);
      window.utils.showToast(`User ${name} added successfully!`, 'success');
      closeModal();
      loadAllUsers();
    } catch (err) {
      window.utils.showToast(err.message, 'error');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Create User';
      }
    }
  });
}
