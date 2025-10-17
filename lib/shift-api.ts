import api from "./api";

// Types for better type safety
export interface Shift {
  id: string;
  userId: string;
  branchName?: string;
  startTime: string;
  endTime?: string;
  totalHours?: number;
  status: 'ACTIVE' | 'ENDED';
  user?: {
    id: string;
    name?: string;
    email: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ShiftReport {
  shifts: Shift[];
  totalHours: number;
}

export interface PaginationParams {
  limit?: number;
  skip?: number;
}

export interface ReportParams {
  branchName?: string;
  from?: string;
  to?: string;
}

export const shiftApi = {
  // ==================== STAFF ENDPOINTS ====================

  /**
   * Start a shift for the current user
   */
  startShift: (branchName?: string) => {
    return api.post<{ data: Shift }>('/shift/start', { branchName });
  },

  /**
   * End the current active shift for the user
   */
  endShift: () => {
    return api.post<{ data: Shift }>('/shift/end');
  },

  /**
   * Get current user's shifts with pagination
   */
  getMyShifts: (params?: PaginationParams) => {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.skip) query.append('skip', params.skip.toString());

    return api.get<{ data: Shift[] }>(`/shift/my?${query.toString()}`);
  },

  // ==================== MANAGER/ADMIN ENDPOINTS ====================

  /**
   * Get all shifts for a specific branch (Manager/Admin only)
   */
  getBranchShifts: (branchName?: string, params?: PaginationParams) => {
    const query = new URLSearchParams();
    if (branchName) query.append('branchName', branchName);
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.skip) query.append('skip', params.skip.toString());
    return api.get<{ data: Shift[] }>(`/shift/branch?${query.toString()}`);
  },

  /**
   * Get all currently active shifts (Manager/Admin only)
   */
  getActiveShifts: (branchName?: string) => {
    const query = branchName ? `?branchName=${encodeURIComponent(branchName)}` : '';
    return api.get<{ data: Shift[] }>(`/shift/active${query}`);
  },

  /**
   * Get shift report with date filtering (Manager/Admin only)
   */
  getReport: (params: ReportParams) => {
    const query = new URLSearchParams();
    if (params.branchName) query.append('branchName', params.branchName);
    if (params.from) query.append('from', params.from);
    if (params.to) query.append('to', params.to);

    return api.get<{ data: ShiftReport }>(`/shift/report?${query.toString()}`);
  },

  // ==================== UTILITY ENDPOINTS ====================

  /**
   * Get a specific shift by ID
   */
  getShiftById: (shiftId: string) => {
    return api.get<{ data: Shift }>(`/shift/${shiftId}`);
  },

  /**
   * Update shift details (Admin only)
   */
  updateShift: (shiftId: string, updateData: Partial<Shift>) => {
    return api.put<{ data: Shift }>(`/shift/${shiftId}`, updateData);
  },

  /**
   * Delete a shift (Admin only)
   */
  deleteShift: (shiftId: string) => {
    return api.delete<{ data: { success: boolean } }>(`/shift/${shiftId}`);
  },

  // ==================== CONVENIENCE METHODS ====================

  /**
   * Get all shifts for a specific user (alias for getMyShifts for backward compatibility)
   */
  getUserShifts: (userId: string, params?: PaginationParams) => {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.skip) query.append('skip', params.skip.toString());

    return api.get<{ data: Shift[] }>(`/shift/user/${userId}?${query.toString()}`);
  },

  /**
   * Check if current user has an active shift
   */
  hasActiveShift: () => {
    return api.get<{ data: { hasActiveShift: boolean; activeShift?: Shift } }>('/shift/active-status');
  },

  /**
   * Get shift statistics for a date range
   */
  getShiftStats: (params: ReportParams) => {
    const query = new URLSearchParams();
    if (params.branchName) query.append('branchName', params.branchName);
    if (params.from) query.append('from', params.from);
    if (params.to) query.append('to', params.to);

    return api.get<{ data: {
      totalShifts: number;
      totalHours: number;
      averageHoursPerShift: number;
      activeShifts: number;
    } }>(`/shift/stats?${query.toString()}`);
  }
};