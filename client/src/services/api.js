import axios from 'axios';

const api = axios.create({
  baseURL: '/', // The proxy in vite.config.js will handle the forwarding to localhost:3000
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a response interceptor to handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Clear any stored user data
      localStorage.removeItem('user');
      
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
          console.log('Session expired or unauthorized, redirecting to login...');
          window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
