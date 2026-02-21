import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Restaurant, Rating } from '../types';
import { generateRecommendations } from '../utils/recommendationEngine';
import type { RecommendationResult } from '../utils/recommendationEngine';
import { discoverNearbyRestaurants } from '../services/discoveryService';
import { useGeolocation } from './useGeolocation';

export function useRecommendations(pairId: string | null, cuisine: string | null = null) {
    const { location: userLocation } = useGeolocation();
    const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRecommendations = useCallback(async () => {
        if (!pairId) return;

        setLoading(true);
        setError(null);

        try {
            // 1. Fetch all restaurants for the pair
            const { data: restaurants, error: rError } = await supabase
                .from('restaurants')
                .select('*')
                .eq('pair_id', pairId);

            if (rError) throw rError;
            if (!restaurants) {
                setRecommendations([]);
                return;
            }

            const restaurantIds = restaurants.length > 0 ? restaurants.map((r) => r.id) : [];

            // 2. Fetch all ratings for these restaurants
            let ratings: Rating[] = [];
            if (restaurantIds.length > 0) {
                const { data, error: rtError } = await supabase
                    .from('ratings')
                    .select('*')
                    .in('restaurant_id', restaurantIds);
                if (rtError) throw rtError;
                ratings = data || [];
            }

            // 2.5 Fetch external discoveries if location is available
            let externalResults: any[] = [];
            if (userLocation) {
                try {
                    externalResults = await discoverNearbyRestaurants(
                        userLocation.lat,
                        userLocation.lng,
                        2000,
                        cuisine
                    );
                } catch (discoveryErr) {
                    console.error('External discovery failed (non-blocking):', discoveryErr);
                }
            }

            // 3. Generate recommendations
            const results = generateRecommendations(
                restaurants as Restaurant[],
                ratings as Rating[],
                externalResults,
                cuisine,
                userLocation || undefined
            );
            setRecommendations(results);
        } catch (err: any) {
            console.error('Error fetching recommendations:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [pairId, userLocation, cuisine]);

    useEffect(() => {
        fetchRecommendations();
    }, [fetchRecommendations]);

    return { recommendations, loading, error, refresh: fetchRecommendations };
}
