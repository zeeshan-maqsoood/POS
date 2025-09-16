import api from "@/utils/api";

// ==================
// Types
// ==================

// Configure axios to send cookies with every request
api.defaults.withCredentials = true;
export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER";
  createdAt: string;
  updatedAt: string;
  createdById: string | null;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: {
    user: User;
    token: string;
  };
}

// ==================
// Auth API
// ==================
export const authApi = {
  login: (data: LoginData) => {
    return api.post<LoginResponse>("/auth/login", data);
  },

  me: () => {
    return api.get<LoginResponse>("/auth/me");
  },
};

export default authApi;