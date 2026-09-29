/**
 * Booking Service
 * Communicates with JSON Server / API for bookings.
 * Contains NO DOM manipulation.
 */

async function getBookings(params = {}) {
  try {
    const url = window.API_ENDPOINTS ? window.API_ENDPOINTS.BOOKINGS : '/bookings';
    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    throw (window.handleApiError ? window.handleApiError(error) : error);
  }
}

async function getBookingById(id) {
  try {
    const baseUrl = window.API_ENDPOINTS ? window.API_ENDPOINTS.BOOKINGS : '/bookings';
    const response = await axios.get(`${baseUrl}/${id}`);
    return response.data;
  } catch (error) {
    throw (window.handleApiError ? window.handleApiError(error) : error);
  }
}

async function getBookingsByUser(userId) {
  try {
    const baseUrl = window.API_ENDPOINTS ? window.API_ENDPOINTS.BOOKINGS : '/bookings';
    const response = await axios.get(baseUrl, { params: { userId } });
    return response.data;
  } catch (error) {
    throw (window.handleApiError ? window.handleApiError(error) : error);
  }
}

async function createBooking(booking) {
  try {
    const url = window.API_ENDPOINTS ? window.API_ENDPOINTS.BOOKINGS : '/bookings';
    const response = await axios.post(url, booking);
    return response.data;
  } catch (error) {
    throw (window.handleApiError ? window.handleApiError(error) : error);
  }
}

async function updateBooking(id, booking) {
  try {
    const baseUrl = window.API_ENDPOINTS ? window.API_ENDPOINTS.BOOKINGS : '/bookings';
    const response = await axios.put(`${baseUrl}/${id}`, booking);
    return response.data;
  } catch (error) {
    throw (window.handleApiError ? window.handleApiError(error) : error);
  }
}

async function cancelBooking(id) {
  try {
    const baseUrl = window.API_ENDPOINTS ? window.API_ENDPOINTS.BOOKINGS : '/bookings';
    const response = await axios.patch(`${baseUrl}/${id}`, { status: 'Cancelled' });
    return response.data;
  } catch (error) {
    throw (window.handleApiError ? window.handleApiError(error) : error);
  }
}

if (typeof window !== 'undefined') {
  window.bookingService = {
    getBookings,
    getBookingById,
    getBookingsByUser,
    createBooking,
    updateBooking,
    cancelBooking
  };
}
