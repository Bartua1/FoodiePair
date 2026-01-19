import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase';
import type { Restaurant, Rating } from '../types';

export function useRestaurants(pairId: string | null) {
    const { user } = useUser();
    const [restaurants, setRestaurants] = useState<(Restaurant & { avg_score?: number; user_has_rated?: boolean })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (pairId) {
            fetchRestaurants();
        }
    }, [pairId, user?.id]);

    async function fetchRestaurants() {
        setLoading(true);
        const { data: restaurantsData } = await supabase
            .from('restaurants')
            .select('*')
            .eq('pair_id', pairId);

        if (restaurantsData) {
            // For each restaurant, fetch ratings to calculate average score
            const enriched = await Promise.all(
                restaurantsData.map(async (r) => {
                    const { data: ratings } = await supabase
                        .from('ratings')
                        .select('*')
                        .eq('restaurant_id', r.id);

                    let avg_score = 0;
                    let user_has_rated = false;

                    if (ratings && (ratings as Rating[]).length > 0) {
                        const scoreList = ratings as Rating[];

                        // Calculate Average
                        const scores = scoreList.flatMap(rt => [rt.food_score, rt.service_score, rt.vibe_score, rt.price_quality_score]);
                        avg_score = scores.reduce((a, b) => a + b, 0) / scores.length;

                        // Check if current user has rated
                        if (user?.id) {
                            user_has_rated = scoreList.some(rt => rt.user_id === user.id);
                        }
                    }
                    return { ...r, avg_score, user_has_rated };
                })
            );
            setRestaurants(enriched);
        }
        setLoading(false);
    }

    return { restaurants, loading, refresh: fetchRestaurants };
}
