import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { calculateDistance } from '../lib/distance';

export function useProcessedRestaurants() {
    const restaurants = useAppStore(state => state.restaurants);
    const filters = useAppStore(state => state.filters);
    const userLocation = useAppStore(state => state.userLocation);

    const processedRestaurants = useMemo(() => {
        let result = restaurants.map(r => {
            let distance: number | undefined;
            if (userLocation && r.lat && r.lng) {
                distance = calculateDistance(userLocation.lat, userLocation.lng, r.lat, r.lng);
            }
            return { ...r, distance };
        });

        if (filters.favoritesOnly) {
            result = result.filter(r => r.is_favorite);
        }
        if (filters.price) {
            result = result.filter(r => r.price_range === filters.price);
        }
        if (filters.cuisine !== 'all') {
            result = result.filter(r => r.cuisine_type === filters.cuisine);
        }
        if (filters.distance !== 'any' && userLocation) {
            const maxDist = parseFloat(filters.distance);
            result = result.filter(r => r.distance !== undefined && r.distance <= maxDist);
        }

        return result.sort((a, b) => {
            if (filters.sort === 'distance') {
                const distA = a.distance ?? Infinity;
                const distB = b.distance ?? Infinity;
                return distA - distB;
            }
            // Default: sort by rating (avg_score)
            const scoreA = a.avg_score || 0;
            const scoreB = b.avg_score || 0;
            return scoreB - scoreA;
        });
    }, [restaurants, filters, userLocation]);

    const uniqueCuisines = useMemo(() => {
        const set = new Set(restaurants.map(r => r.cuisine_type).filter((c): c is string => Boolean(c)));
        return Array.from(set);
    }, [restaurants]);

    return { processedRestaurants, uniqueCuisines };
}
