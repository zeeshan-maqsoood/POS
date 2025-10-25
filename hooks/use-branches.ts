import { useState, useEffect } from 'react';
import { branchApi } from '@/lib/branch-api';

export interface Branch {
  id: string;
  name: string;
  value: string;
  restaurantName?: string;
}

// Remove static data and use API
export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try the dropdown API first
        try {
          const response = await branchApi.getBranchesForDropdown();
          // The dropdown API returns data directly in response.data.data
          if (response.data && response.data.data) {
            setBranches(response.data.data);
            return;
          }
        } catch (dropdownError) {
          console.warn('Dropdown API failed, trying active branches:', dropdownError);
        }

        // Fallback to active branches API
        const response = await branchApi.getActiveBranches();
        // The active branches API returns data wrapped in response.data.data
        if (response.data && response.data.data) {
          const formattedBranches = response.data.data.map((branch: any) => ({
            id: branch.id,
            name: branch.name,
            value: branch.name,
            restaurantName: branch.restaurant?.name || 'No Restaurant'
          }));
          setBranches(formattedBranches);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load branches';
        setError(errorMessage);
        console.error('Error loading branches:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBranches();
  }, []);

  return { branches, loading, error };
}
