/**
 * ApiException - Handles and standardizes all API & Network errors from Axios
 */
class ApiException extends Error {
  constructor(message, status = 500, data = null) {
    super(message);
    this.name = 'ApiException';
    this.status = status;
    this.data = data;
  }
}

/**
 * Process error from Axios or Network call
 * @param {Error} error 
 * @returns {ApiException}
 */
function handleApiError(error) {
  if (error.response) {
    // Server responded with non-2xx status
    const status = error.response.status;
    const message = error.response.data?.error || error.response.data?.message || `Server Error (${status})`;
    return new ApiException(message, status, error.response.data);
  } else if (error.request) {
    // Request made but no response received
    return new ApiException('Unable to connect to the server. Please check if the server is running.', 0);
  } else {
    // Setup or syntax issue
    return new ApiException(error.message || 'An unexpected error occurred.', 500);
  }
}

// Export for module environments and attach to window for browser script tags
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ApiException, handleApiError };
}
if (typeof window !== 'undefined') {
  window.ApiException = ApiException;
  window.handleApiError = handleApiError;
}
