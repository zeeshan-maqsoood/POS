// Base API response type
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode?: number;
}

// Error response type
export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: string;
  statusCode: number;
}
