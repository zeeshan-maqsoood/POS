import api from "../utils/api";

export const login = async (email, password) => {
  try {
    const response = await api.post(
      "/auth/login",
      { email, password },
      { withCredentials: true }
    );
    
    // Store the token in localStorage if it exists in the response
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    // If there's an error response from the server, throw it
    if (error.response) {
      throw new Error(error.response.data.message || 'Login failed');
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Something happened in setting up the request
      throw new Error(error.message || 'An error occurred during login');
    }
  }
};

export const logout = async () => {
  try {
    // Remove the token from localStorage
    localStorage.removeItem('token');
    
    // Call the logout endpoint if you have one
    await api.post('/auth/logout', {}, { withCredentials: true });
  } catch (error) {
    console.error('Logout error:', error);
    // Even if logout fails, we still want to clear the token
    localStorage.removeItem('token');
    throw error;
  }
};

export const getCurrentUser = () => {
  // Get the token from localStorage
  const token = localStorage.getItem('token');
  
  if (!token) return null;
  
  // You might want to decode the JWT token here to get user info
  // For now, we'll just return the token
  return { token };
};