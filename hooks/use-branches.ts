import { useState, useEffect } from 'react';

export interface Branch {
  id: Key;
  name: string;
  value: string;
}

// Static branch data - no API calls needed
const STATIC_BRANCHES: Branch[] = [
  { name: 'Bradford', value: 'Bradford' },
  { name: 'Leeds', value: 'Leeds' },
  { name: 'Helifax', value: 'Helifax' },
  { name: 'Darley St Market', value: 'Darley St Market' },
];

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading delay for consistency with other hooks
    const loadBranches = async () => {
      try {
        setLoading(true);
        setError(null);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 100));

        // Use static data instead of API call
        setBranches(STATIC_BRANCHES);
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
