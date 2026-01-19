import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Restaurant, Rating } from '../types';

export function useRestaurants(pairId: string | null) {
    const [restaurants, setRestaurants] = useState<(Restaurant & { avg_score?: number })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (pairId) {
            fetchRestaurants();
        }
    }, [pairId]);

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

                    if (ratings && (ratings as Rating[]).length > 0) {
                        const scoreList = ratings as Rating[];
                        const scores = scoreList.flatMap(rt => [rt.food_score, rt.service_score, rt.vibe_score, rt.price_quality_score]);
                        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
                        return { ...r, avg_score: avg };
                    }
                    return { ...r, avg_score: 0 };
                })
            );
            setRestaurants(enriched);
        }
        setLoading(false);
    }

    return { restaurants, loading, refresh: fetchRestaurants };
}
