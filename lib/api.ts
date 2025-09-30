import axios from 'axios';

// const api = axios.create({
//   baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Add a request interceptor to include the auth token
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );
import api from '@/utils/api';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
  Active: boolean;
  cost: number;
  taxRate: number;
}

export const menuApi = {
  // Get all menu items
  getMenuItems: () => api.get<MenuItem[]>('/menu/items'),
  
  // Get all categories
  getCategories: () => api.get<string[]>('/menu/categories'),
  
  // Get menu items by category
  getMenuItemsByCategory: (category: string) => 
    api.get<MenuItem[]>(`/menu/items?category=${encodeURIComponent(category)}`),
};

export const fetchAnalytics = (params: { startDate?: string; endDate?: string } = {}) => {
  const queryParams = new URLSearchParams();
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  
  return api.get(`/analytics?${queryParams.toString()}`);
};

export default api;
