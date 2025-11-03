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
      console.log('useBranches: Starting to load branches...');
      try {
        setLoading(true);
        setError(null);

        let branchesData: Branch[] = [];
        console.log('useBranches: Initial branchesData:', branchesData);
        
        // Add an 'All Branches' option for admins
        const allBranchesOption = {
          id: 'all',
          name: 'All Branches',
          value: 'all',
          restaurantName: 'All Restaurants'
        };

        // Add 'All Branches' option if no specific branch filter is set
        if (!filterByBranchName) {
          branchesData.push(allBranchesOption);
        }
        // If we have a branch name filter, try to get that specific branch
        else if (filterByBranchName) {
          console.log('useBranches: Filtering branches by name:', filterByBranchName);
          try {
            const response = await branchApi.getAllBranches();
            console.log('useBranches: getAllBranches response:', response);
            
            const branchesList = Array.isArray(response?.data) ? response.data : [];
            console.log('useBranches: Branches list:', branchesList);
            
            const filteredBranch = branchesList.find(
              (b: any) => b?.name === filterByBranchName || b?.id === filterByBranchName
            );
            console.log('useBranches: Filtered branch:', filteredBranch);

            if (filteredBranch) {
              branchesData = [{
                id: filteredBranch.id,
                name: filteredBranch.name,
                value: filteredBranch.id, // Using ID as value for consistency
                restaurantId: filteredBranch.restaurantId,
                restaurantName: filteredBranch.restaurant?.name || 'No Restaurant'
              }];
              console.log('useBranches: Setting filtered branches:', branchesData);
              setBranches(branchesData);
              setLoading(false);
              return;
            } else {
              console.warn('useBranches: No branch found with filter, using all branches:', filterByBranchName);
              // If no specific branch found, fall back to all branches
              branchesData = [allBranchesOption];
            }
          } catch (err) {
            console.error('useBranches: Error filtering branches by name:', err);
            setError('Failed to load filtered branches');
            // Fall back to all branches option on error
            setBranches([allBranchesOption]);
            setLoading(false);
            return;
          }
        }

        // Try to get branches for dropdown
        try {
          console.log('useBranches: Fetching branches for dropdown...');
          const response = await branchApi.getBranchesForDropdown();
          console.log('useBranches: Dropdown API response:', response);
          
          // Handle different response formats
          let dropdownBranches: DropdownBranchResponse[] = [];
          
          if (Array.isArray(response?.data)) {
            // Response has data array directly
            dropdownBranches = response.data;
          } else if (response?.data?.data && Array.isArray(response.data.data)) {
            // Response has data nested in a data property
            dropdownBranches = response.data.data;
          } else if (Array.isArray(response)) {
            // Response is already an array
            dropdownBranches = response;
          }
          
          console.log('useBranches: Extracted dropdown branches:', dropdownBranches);
          
          // Map the dropdown branches to the Branch interface
          const mappedBranches = dropdownBranches.map(branch => {
            // Create a basic branch with required fields
            const branchData: Branch = {
              id: branch.id,
              name: branch.name,
              value: branch.value || branch.id, // Use value if available, otherwise fall back to id
              restaurantName: branch.restaurantName || 'No Restaurant'
            };

            // Add optional fields if they exist
            if ('restaurantId' in branch) {
              branchData.restaurantId = (branch as any).restaurantId;
            }
            
            return branchData;
          });
          
          // If we have branches, add them to the list
          if (mappedBranches.length > 0) {
            // If we already have branchesData (like 'All Branches'), append the new ones
            branchesData = [...branchesData, ...mappedBranches];
          } else if (branchesData.length === 0) {
            // If no branches found and no default, just add the all branches option
            branchesData = [allBranchesOption];
          }
          
          console.log('useBranches: Final branches data:', branchesData);
          
          if (branchesData.length > 0) {
            console.log('useBranches: Setting branches from API');
            setBranches(branchesData);
          } else {
            console.warn('useBranches: No branches found');
          }
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

  return { 
    branches: branches || [], 
    loading, 
    error 
  };
}
