import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

type Period = 'day' | 'week' | 'month' | 'custom';

export const dashboardApi = {
  getStats: async (
    period: Period,
    branchId?: string,
    startDate?: string,
    endDate?: string
  ) => {
    const params = new URLSearchParams();
    params.append('period', period);
    if (branchId) params.append('branchId', branchId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await axios.get(`${API_URL}/dashboard/stats?${params.toString()}`);
    return response.data;
  },
};
