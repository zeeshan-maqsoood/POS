import { useState, useEffect } from 'react';
import { restaurantApi, Restaurant } from '@/lib/restaurant-api';

export interface RestaurantOption {
  id: string;
  name: string;
  value: string;
}

// Remove static data and use API
export function useRestaurants() {
  const [restaurants, setRestaurants] = useState<RestaurantOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try the dropdown API first
        try {
          const response = await restaurantApi.getRestaurantsForDropdown();
          // The dropdown API returns data directly in response.data.data
          if (response.data && response.data.data) {
            const formattedRestaurants = response.data.data.map((restaurant: Restaurant) => ({
              id: restaurant.id,
              name: restaurant.name,
              value: restaurant.id
            }));
            setRestaurants(formattedRestaurants);
            return;
          }
        } catch (dropdownError) {
          console.warn('Dropdown API failed, trying active restaurants:', dropdownError);
        }

        // Fallback to active restaurants API
        const response = await restaurantApi.getActiveRestaurants();
        // The active restaurants API returns data wrapped in response.data.data
        if (response.data && response.data.data) {
          const formattedRestaurants = response.data.data.map((restaurant: Restaurant) => ({
            id: restaurant.id,
            name: restaurant.name,
            value: restaurant.id
          }));
          setRestaurants(formattedRestaurants);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load restaurants';
        setError(errorMessage);
        console.error('Error loading restaurants:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRestaurants();
  }, []);

  return { restaurants, loading, error };
}
