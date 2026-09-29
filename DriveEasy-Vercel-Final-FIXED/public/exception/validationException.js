/**
 * ValidationException - Handles and standardizes form and data validation errors
 */
class ValidationException extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationException';
    this.field = field;
  }
}

/**
 * Validate required text field
 */
function validateRequired(value, fieldName) {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    throw new ValidationException(`${fieldName} is required`, fieldName);
  }
  return value.trim();
}

/**
 * Validate email format
 */
function validateEmail(email) {
  validateRequired(email, 'Email');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationException('Please enter a valid email address', 'email');
  }
  return email.trim();
}

/**
 * Validate phone number format (supports 10-digit Indian numbers with optional country code)
 */
function validatePhone(phone) {
  validateRequired(phone, 'Phone number');
  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.length < 10) {
    throw new ValidationException('Please enter a valid phone number (at least 10 digits)', 'phone');
  }
  return phone.trim();
}

/**
 * Validate rental dates (Start date <= End date, valid format)
 */
function validateRentalDates(pickupDate, returnDate) {
  validateRequired(pickupDate, 'Pickup date');
  validateRequired(returnDate, 'Return date');

  const start = new Date(pickupDate);
  const end = new Date(returnDate);

  if (isNaN(start.getTime())) {
    throw new ValidationException('Invalid pickup date format', 'pickupDate');
  }
  if (isNaN(end.getTime())) {
    throw new ValidationException('Invalid return date format', 'returnDate');
  }

  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    throw new ValidationException('Return date must be at least 1 day after pickup date', 'returnDate');
  }

  return diffDays;
}

// Export for module and browser script contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ValidationException,
    validateRequired,
    validateEmail,
    validatePhone,
    validateRentalDates
  };
}
if (typeof window !== 'undefined') {
  window.ValidationException = ValidationException;
  window.validateRequired = validateRequired;
  window.validateEmail = validateEmail;
  window.validatePhone = validatePhone;
  window.validateRentalDates = validateRentalDates;
}
