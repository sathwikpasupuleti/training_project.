/**
 * DriveEasy Utility Functions
 */

// User Session Management
function getCurrentUser() {
  try {
    const raw = localStorage.getItem('currentUser');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error parsing stored user', e);
  }
  // Default mock user if not logged in (to make previewing seamless for college evaluation)
  return {
    id: 1,
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    phone: '+91 98765 43210',
    role: 'user'
  };
}

function setCurrentUser(user) {
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
  } else {
    localStorage.removeItem('currentUser');
  }
}

function clearCurrentUser() {
  localStorage.removeItem('currentUser');
}

// Currency Formatter
function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return '₹' + num.toLocaleString('en-IN');
}

// Date Formatter
function formatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const options = { day: '2-digit', month: 'short', year: 'numeric' };
  return d.toLocaleDateString('en-GB', options);
}

// URL Parameter Parser
function getUrlParam(param) {
  const params = new URLSearchParams(window.location.search);
  return params.get(param);
}

// Price and Rental Calculation Formula
// Formula required:
// Rental Days = Return Date - Pickup Date
// Base Price = Rental Days × Price Per Day
// Tax = 10% of Base Price
// Total Amount = Base Price + Tax
function calculateRental(pricePerDay, pickupDateStr, returnDateStr) {
  const price = Number(pricePerDay) || 0;
  if (!pickupDateStr || !returnDateStr) {
    return { rentalDays: 1, basePrice: price, tax: Math.round(price * 0.1), totalAmount: Math.round(price * 1.1) };
  }

  const start = new Date(pickupDateStr);
  const end = new Date(returnDateStr);
  const diffTime = end.getTime() - start.getTime();
  let days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (days <= 0 || isNaN(days)) days = 1;

  const basePrice = days * price;
  const tax = Math.round(basePrice * 0.10);
  const totalAmount = basePrice + tax;

  return {
    rentalDays: days,
    basePrice,
    tax,
    totalAmount
  };
}

// Toast notification helper
function showToast(message, type = 'info') {
  let toast = document.getElementById('driveeasy-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'driveeasy-toast';
    toast.className = 'driveeasy-toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.className = `driveeasy-toast show ${type}`;

  setTimeout(() => {
    toast.className = 'driveeasy-toast';
  }, 3500);
}

// Export to window
if (typeof window !== 'undefined') {
  window.utils = {
    getCurrentUser,
    setCurrentUser,
    clearCurrentUser,
    formatCurrency,
    formatDate,
    getUrlParam,
    calculateRental,
    showToast
  };
}
