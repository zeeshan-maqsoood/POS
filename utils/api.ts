import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    // Skip if it's a login request to avoid circular dependency
    if (config.url?.includes('/auth/login')) {
      return config;
    }
    
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (user) {
      const userData = JSON.parse(user);
      const token = userData.token || (userData.data?.token);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 unauthorized
const setupResponseInterceptor = (router: any) => {
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Clear user data and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user');
          router.push('/');
        }
      }
      return Promise.reject(error);
    }
  );
};

// Export the interceptor setup function
export { setupResponseInterceptor };

export default api;
