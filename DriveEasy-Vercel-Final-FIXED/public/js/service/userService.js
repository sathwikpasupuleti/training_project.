/**
 * User Service
 * Communicates with JSON Server / API for user accounts and auth.
 * Contains NO DOM manipulation.
 */

async function getUsers(params = {}) {
  try {
    const url = window.API_ENDPOINTS ? window.API_ENDPOINTS.USERS : '/users';
    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    throw (window.handleApiError ? window.handleApiError(error) : error);
  }
}

async function getUserById(id) {
  try {
    const baseUrl = window.API_ENDPOINTS ? window.API_ENDPOINTS.USERS : '/users';
    const response = await axios.get(`${baseUrl}/${id}`);
    return response.data;
  } catch (error) {
    throw (window.handleApiError ? window.handleApiError(error) : error);
  }
}

async function loginUser(email, password) {
  try {
    const loginUrl = window.API_ENDPOINTS ? window.API_ENDPOINTS.LOGIN : '/login';
    // Try POST /login or fallback to GET /users?email=...&password=...
    try {
      const response = await axios.post(loginUrl, { email, password });
      return response.data;
    } catch (postErr) {
      // Fallback to standard JSON Server query:
      const usersUrl = window.API_ENDPOINTS ? window.API_ENDPOINTS.USERS : '/users';
      const response = await axios.get(usersUrl, { params: { email, password } });
      if (response.data && response.data.length > 0) {
        return response.data[0];
      }
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    throw (window.handleApiError ? window.handleApiError(error) : error);
  }
}

async function registerUser(user) {
  try {
    const url = window.API_ENDPOINTS ? window.API_ENDPOINTS.USERS : '/users';
    const response = await axios.post(url, user);
    return response.data;
  } catch (error) {
    throw (window.handleApiError ? window.handleApiError(error) : error);
  }
}

if (typeof window !== 'undefined') {
  window.userService = {
    getUsers,
    getUserById,
    loginUser,
    registerUser
  };
}
