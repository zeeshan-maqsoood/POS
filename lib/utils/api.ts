import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    // Only run on client-side
    if (typeof window !== 'undefined') {
      // Try to get token from cookies first, then fallback to localStorage
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
      };
      
      const token = getCookie('token') || localStorage.getItem('token');
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        // Ensure credentials are included for cross-origin requests
        config.withCredentials = true;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        document.cookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        // Redirect to login with current path as redirect
        const currentPath = window.location.pathname;
        if (currentPath !== '/') {
          window.location.href = `/?redirect=${encodeURIComponent(currentPath)}`;
        } else {
          window.location.href = '/';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 unauthorized
export const setupResponseInterceptor = (router: any) => {
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Clear user data and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          router.push('/');
        }
      }
      return Promise.reject(error);
    }
  );
};

export default api;
