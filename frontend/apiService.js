import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';

// Initialize with a default value, will be updated once we fetch the config
let API_URL = '';
let api = null;

// Fetch server configuration and initialize the API
const initAPI = async () => {
  try {
    console.log('Initializing API service...');
    const configResponse = await axios.get('/api/config');
    console.log('Config response:', configResponse.data);
    
    const { serverIP, apiPort } = configResponse.data;
    API_URL = `http://${serverIP}:${apiPort}/api`;
    console.log('API URL configured:', API_URL);
    
    // Create axios instance with auth token
    api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 100000 // Add timeout to avoid long waits on network issues
    });
    console.log('Axios instance created with baseURL:', API_URL);

    // Add auth token to requests if available
    api.interceptors.request.use(config => {
      console.log('Processing request:', {
        url: config.url,
        method: config.method,
        headers: config.headers
      });
      
      const token = localStorage.getItem('token');
      if (token) {
        console.log('Auth token found, adding to request headers');
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.log('No auth token found in localStorage');
      }
      return config;
    });

    // Add response interceptor for debugging
    api.interceptors.response.use(
      response => {
        console.log('API Response:', {
          url: response.config.url,
          status: response.status,
          data: response.data
        });
        return response;
      },
      error => {
        console.error('API Error:', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message,
          data: error.response?.data
        });
        return Promise.reject(error);
      }
    );
    
    console.log('API service initialization complete');
    return true;
  } catch (error) {
    console.error('Failed to fetch server configuration, using default', error);
    
    // Fallback to using the current hostname instead of hardcoded IP
    const currentHostname = window.location.hostname;
    API_URL = `http://${currentHostname}:3000/api`;
    
    // Create axios instance with auth token
    api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    // Add auth token to requests if available
    api.interceptors.request.use(config => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    
    return false;
  }
};

// Helper function to ensure API is initialized before making requests
const ensureAPI = async () => {
  console.log('ensureAPI hit');
  if (!api) {
    console.log('api is null, calling initAPI');
    await initAPI();
    console.log('initAPI complete');
  }
  console.log('api is not null, returning api');
  return api;
};

// Auth endpoints
export const login = async (email, password) => {
  console.log('Login endpoint about to hit', email, password);
  const apiInstance = await ensureAPI();
  console.log('Login endpoint hit');
  return apiInstance.post('/auth/login', { email, password });
};

export const register = async (username, email, password) => {
  const apiInstance = await ensureAPI();
  return apiInstance.post('/auth/register', { username, email, password });
};

export const getProfile = async () => {
  const apiInstance = await ensureAPI();
  return apiInstance.get('/auth/me');
};

// Title endpoints
export const createTitle = async (title, instructions) => {
  const apiInstance = await ensureAPI();
  return apiInstance.post('/titles', { title, instructions });
};

export const getTitles = async () => {
  const apiInstance = await ensureAPI();
  return apiInstance.get('/titles');
};

export const getTitle = async (id) => {
  const apiInstance = await ensureAPI();
  return apiInstance.get(`/titles/${id}`);
};

export const updateTitle = async (id, title, instructions) => {
  const apiInstance = await ensureAPI();
  return apiInstance.put(`/titles/${id}`, { title, instructions });
};

export const deleteTitle = async (id) => {
  const apiInstance = await ensureAPI();
  return apiInstance.delete(`/titles/${id}`);
};

// Reference endpoints
export const uploadReference = async (titleId, imageData, isGlobal = false) => {
  const apiInstance = await ensureAPI();
  return apiInstance.post('/references', { titleId, imageData, isGlobal });
};

export const getReferences = async (titleId) => {
  const apiInstance = await ensureAPI();
  return apiInstance.get(`/references/${titleId}`);
};

export const getGlobalReferences = async () => {
  const apiInstance = await ensureAPI();
  return apiInstance.get('/references/global');
};

export const deleteReference = async (id) => {
  const apiInstance = await ensureAPI();
  return apiInstance.delete(`/references/${id}`);
};

// Painting endpoints (renamed from Thumbnail)
export const generateThumbnails = async (titleId, quantity = 5) => {
  const apiInstance = await ensureAPI();
  return apiInstance.post('/paintings/generate', { titleId, quantity });
};

export const getThumbnails = async (titleId) => {
  const apiInstance = await ensureAPI();
  return apiInstance.get(`/paintings/${titleId}`);
};

// Initialize API when this module is imported
initAPI();

export default async () => ensureAPI(); 