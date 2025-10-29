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

// Add a response interceptor to handle 401 responses and token refresh
let isRefreshing = false;
let failedQueue: { resolve: (value: any) => void; reject: (error: any) => void }[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is not 401 or it's a retry request, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If we're already refreshing the token, add the request to the queue
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
      .then((token) => {
        originalRequest.headers['Authorization'] = 'Bearer ' + token;
        return api(originalRequest);
      })
      .catch((err) => {
        return Promise.reject(err);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Try to refresh the token
      const response = await api.post('/auth/refresh-token');
      const { token } = response.data;
      
      // Update the token in localStorage and axios defaults
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
      }
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Process the queued requests
      processQueue(null, token);
      
      // Retry the original request
      originalRequest.headers['Authorization'] = `Bearer ${token}`;
      return api(originalRequest);
    } catch (refreshError) {
      // If refresh fails, clear auth and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        document.cookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        
        // Only redirect if not already on the login page
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        }
      }
      
      processQueue(refreshError, null);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
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
