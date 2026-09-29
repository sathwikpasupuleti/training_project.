/**
 * Vehicle Service
 * Communicates with JSON Server / API for vehicle operations.
 * Contains NO DOM manipulation.
 */

async function getVehicles(params = {}) {
  try {
    const url = window.API_ENDPOINTS ? window.API_ENDPOINTS.VEHICLES : '/vehicles';
    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    throw (window.handleApiError ? window.handleApiError(error) : error);
  }
}

async function getVehicleById(id) {
  try {
    const baseUrl = window.API_ENDPOINTS ? window.API_ENDPOINTS.VEHICLES : '/vehicles';
    const response = await axios.get(`${baseUrl}/${id}`);
    return response.data;
  } catch (error) {
    throw (window.handleApiError ? window.handleApiError(error) : error);
  }
}

async function addVehicle(vehicle) {
  try {
    const url = window.API_ENDPOINTS ? window.API_ENDPOINTS.VEHICLES : '/vehicles';
    const response = await axios.post(url, vehicle);
    return response.data;
  } catch (error) {
    throw (window.handleApiError ? window.handleApiError(error) : error);
  }
}

async function updateVehicle(id, vehicle) {
  try {
    const baseUrl = window.API_ENDPOINTS ? window.API_ENDPOINTS.VEHICLES : '/vehicles';
    const response = await axios.put(`${baseUrl}/${id}`, vehicle);
    return response.data;
  } catch (error) {
    throw (window.handleApiError ? window.handleApiError(error) : error);
  }
}

async function deleteVehicle(id) {
  try {
    const baseUrl = window.API_ENDPOINTS ? window.API_ENDPOINTS.VEHICLES : '/vehicles';
    const response = await axios.delete(`${baseUrl}/${id}`);
    return response.data;
  } catch (error) {
    throw (window.handleApiError ? window.handleApiError(error) : error);
  }
}

// Attach to window object for vanilla script architecture
if (typeof window !== 'undefined') {
  window.vehicleService = {
    getVehicles,
    getVehicleById,
    addVehicle,
    updateVehicle,
    deleteVehicle
  };
}
