/**
 * DriveEasy - Booking Checkout Page Script
 * Manages vehicle details loading, real-time fare calculation, form validation,
 * payment selection, and booking creation via window.bookingService.
 * NO direct Axios calls in this file.
 */

let selectedVehicle = null;
let selectedPaymentMethod = 'UPI';

document.addEventListener('DOMContentLoaded', () => {
  const vehicleId = window.utils.getUrlParam('id') || 1;
  prefillUserInfo();
  setupDatePickersFromUrl();
  setupPaymentMethods();
  setupBookingForm();
  loadVehicle(vehicleId);
});

function prefillUserInfo() {
  const user = window.utils.getCurrentUser();
  if (user) {
    const nameInput = document.getElementById('user-full-name');
    const phoneInput = document.getElementById('user-phone');
    const emailInput = document.getElementById('user-email');

    if (nameInput && user.name) nameInput.value = user.name;
    if (phoneInput && user.phone) {
      // Strip leading country code if present
      phoneInput.value = user.phone.replace('+91', '').trim();
    }
    if (emailInput && user.email) emailInput.value = user.email;
  }
}

function setupDatePickersFromUrl() {
  const pickupInput = document.getElementById('booking-pickup-date');
  const returnInput = document.getElementById('booking-return-date');
  const locSelect = document.getElementById('booking-pickup-loc');

  const urlPickup = window.utils.getUrlParam('pickupDate');
  const urlReturn = window.utils.getUrlParam('returnDate');
  const urlLoc = window.utils.getUrlParam('location');

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const threeDaysLater = new Date();
  threeDaysLater.setDate(today.getDate() + 3);

  const formatIso = d => d.toISOString().split('T')[0];

  if (pickupInput) {
    pickupInput.value = urlPickup || formatIso(tomorrow);
    pickupInput.min = formatIso(today);
    pickupInput.addEventListener('change', recalculateSummary);
  }

  if (returnInput) {
    returnInput.value = urlReturn || formatIso(threeDaysLater);
    returnInput.min = formatIso(tomorrow);
    returnInput.addEventListener('change', recalculateSummary);
  }

  if (locSelect && urlLoc) {
    locSelect.value = urlLoc;
  }
}

async function loadVehicle(id) {
  try {
    selectedVehicle = await window.vehicleService.getVehicleById(id);

    // Update DOM
    document.getElementById('book-vehicle-thumb').src = selectedVehicle.image;
    document.getElementById('book-vehicle-name').textContent = selectedVehicle.name;
    document.getElementById('book-price-per-day').textContent = window.utils.formatCurrency(selectedVehicle.pricePerDay);
    document.getElementById('book-vehicle-fuel').textContent = selectedVehicle.fuel;
    document.getElementById('book-vehicle-trans').textContent = selectedVehicle.transmission;
    document.getElementById('vehicle-type-badge').textContent = `Self-Drive ${selectedVehicle.category || 'Vehicle'}`;

    recalculateSummary();
  } catch (error) {
    window.utils.showToast(`Failed to load vehicle: ${error.message}`, 'error');
  }
}

function recalculateSummary() {
  if (!selectedVehicle) return;

  const pickupDate = document.getElementById('booking-pickup-date')?.value;
  const returnDate = document.getElementById('booking-return-date')?.value;

  const calc = window.utils.calculateRental(selectedVehicle.pricePerDay, pickupDate, returnDate);

  // Update Summary elements
  document.getElementById('summary-duration-tag').textContent = `${calc.rentalDays} Day${calc.rentalDays > 1 ? 's' : ''}`;
  document.getElementById('calc-duration').textContent = `${calc.rentalDays} Day${calc.rentalDays > 1 ? 's' : ''}`;
  document.getElementById('calc-base-label').textContent = `Base Price (${window.utils.formatCurrency(selectedVehicle.pricePerDay)} × ${calc.rentalDays})`;
  document.getElementById('calc-base-price').textContent = window.utils.formatCurrency(calc.basePrice);
  document.getElementById('calc-tax').textContent = window.utils.formatCurrency(calc.tax);
  document.getElementById('calc-total-amount').textContent = window.utils.formatCurrency(calc.totalAmount);
}

function setupPaymentMethods() {
  const buttons = document.querySelectorAll('.payment-method-card');
  const hint = document.getElementById('payment-hint');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedPaymentMethod = btn.getAttribute('data-payment');

      if (selectedPaymentMethod === 'Cash') {
        hint.innerHTML = '<span class="material-symbols-outlined">payments</span><p>Pay full amount in cash during vehicle key handover at hub.</p>';
      } else if (selectedPaymentMethod === 'UPI') {
        hint.innerHTML = '<span class="material-symbols-outlined">flash_on</span><p>Instant payment verification via PhonePe, Google Pay, or Paytm.</p>';
      } else if (selectedPaymentMethod === 'Card') {
        hint.innerHTML = '<span class="material-symbols-outlined">credit_card</span><p>Credit and Debit cards (Visa, Mastercard, RuPay) supported.</p>';
      }
    });
  });
}

function setupBookingForm() {
  const confirmBtn = document.getElementById('confirm-booking-btn');
  if (!confirmBtn) return;

  confirmBtn.addEventListener('click', async () => {
    if (!selectedVehicle) {
      window.utils.showToast('Please wait for vehicle details to load.', 'error');
      return;
    }

    const name = document.getElementById('user-full-name')?.value;
    const phone = document.getElementById('user-phone')?.value;
    const email = document.getElementById('user-email')?.value;
    const location = document.getElementById('booking-pickup-loc')?.value || selectedVehicle.location;
    const pickupDate = document.getElementById('booking-pickup-date')?.value;
    const returnDate = document.getElementById('booking-return-date')?.value;

    try {
      // Form Validations via exception/validationException.js
      window.validateRequired(name, 'Full Name');
      window.validatePhone(phone);
      window.validateEmail(email);
      const rentalDays = window.validateRentalDates(pickupDate, returnDate);

      // Calculations
      const calc = window.utils.calculateRental(selectedVehicle.pricePerDay, pickupDate, returnDate);
      const user = window.utils.getCurrentUser();

      // Booking payload
      const bookingPayload = {
        userId: user ? user.id : 1,
        vehicleId: selectedVehicle.id,
        vehicleName: selectedVehicle.name,
        pickupLocation: location,
        pickupDate: pickupDate,
        returnDate: returnDate,
        rentalDays: calc.rentalDays,
        pricePerDay: selectedVehicle.pricePerDay,
        basePrice: calc.basePrice,
        tax: calc.tax,
        totalAmount: calc.totalAmount,
        paymentMethod: selectedPaymentMethod,
        status: 'Confirmed',
        bookingDate: new Date().toISOString()
      };

      // Button loading state
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = `
        <span class="material-symbols-outlined animate-spin" style="font-size: 20px;">refresh</span>
        <span>Securing Vehicle...</span>
      `;

      // Call Booking Service (Axios POST)
      const createdBooking = await window.bookingService.createBooking(bookingPayload);

      window.utils.showToast('Booking Confirmed Successfully!', 'success');

      // Redirect to Confirmation Page
      setTimeout(() => {
        window.location.href = `/views/confirmation.html?id=${createdBooking.id}`;
      }, 700);

    } catch (err) {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = `
        <span>Confirm Booking</span>
        <span class="material-symbols-outlined" style="font-size: 20px;">arrow_forward</span>
      `;
      window.utils.showToast(err.message, 'error');
    }
  });
}
