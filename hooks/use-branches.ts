import { useState, useEffect } from 'react';
import { branchApi } from '@/lib/branch-api';
import { AxiosResponse } from 'axios';

interface BranchResponse {
  id: string;
  name: string;
  restaurantId: string;
  restaurant?: {
    id: string;
    name: string;
  };
}

interface DropdownBranchResponse {
  id: string;
  name: string;
  value: string;
  restaurantName?: string;
}

export interface Branch {
  id: string;
  name: string;
  value: string;
  restaurantId?: string;
  restaurantName?: string;
}

interface UseBranchesProps {
  filterByBranchName?: string;
}

// Remove static data and use API
export function useBranches({ filterByBranchName }: UseBranchesProps = {}) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        setLoading(true);
        setError(null);

        let branchesData: Branch[] = [];

        // If we have a branch name filter, try to get that specific branch
        if (filterByBranchName) {
          try {
            const response = await branchApi.getAllBranches();
            const branchesList = (response as AxiosResponse<BranchResponse[]>).data || [];
            
            const filteredBranch = branchesList.find(
              (b) => b.name === filterByBranchName || b.id === filterByBranchName
            );
            
            if (filteredBranch) {
              branchesData = [{
                id: filteredBranch.id,
                name: filteredBranch.name,
                value: filteredBranch.name,
                restaurantId: filteredBranch.restaurantId,
                restaurantName: filteredBranch.restaurant?.name
              }];
              setBranches(branchesData);
              return;
            }
          } catch (err) {
            console.warn('Failed to filter branches by name, falling back to all branches', err);
          }
        }

        // Try to get branches for dropdown
        try {
          const response = await branchApi.getBranchesForDropdown();
          const dropdownBranches = (response as AxiosResponse<DropdownBranchResponse[]>).data || [];
          
          branchesData = dropdownBranches.map(branch => ({
            ...branch,
            value: branch.value || branch.name,
            restaurantName: branch.restaurantName || 'No Restaurant'
          }));
          
          if (branchesData.length > 0) {
            setBranches(branchesData);
            return;
          }
        } catch (dropdownError) {
          console.warn('Dropdown API failed, trying active branches:', dropdownError);
        }

        // Fallback to active branches API
        try {
          const response = await branchApi.getActiveBranches();
          const activeBranches = (response as AxiosResponse<BranchResponse[]>).data || [];
          
          branchesData = activeBranches.map(branch => ({
            id: branch.id,
            name: branch.name,
            value: branch.name,
            restaurantId: branch.restaurantId,
            restaurantName: branch.restaurant?.name || 'No Restaurant'
          }));
          
          setBranches(branchesData);
        } catch (err) {
          console.error('Failed to load branches:', err);
          setError('Failed to load branches. Please try again later.');
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
