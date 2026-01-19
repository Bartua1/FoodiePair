import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase';
import type { Restaurant, Rating, Photo, Profile } from '../types';

export function useRestaurants(pairId: string | null) {
    const { user } = useUser();
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (pairId) {
            fetchRestaurants();
        }
    }, [pairId, user?.id]);

    async function fetchRestaurants() {
        setLoading(true);

        // 1. Fetch Restaurants
        const { data: restaurantsData } = await supabase
            .from('restaurants')
            .select('*')
            .eq('pair_id', pairId);

        // 2. Fetch Profiles for the pair
        const { data: profilesData } = await supabase
            .from('profiles')
            .select('*')
            .eq('pair_id', pairId);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p as Profile]) || []);

        if (restaurantsData) {
            // 3. Fetch Favorites for the pair's users
            // We get all favorites where the user is in this pair
            // Simpler: fetch all favorites for these restaurants
            const restaurantIds = restaurantsData.map(r => r.id);
            const { data: favoritesData } = await supabase
                .from('restaurant_favorites')
                .select('*')
                .in('restaurant_id', restaurantIds);

            // Group favorites by restaurant
            const favoritesMap = new Map<string, string[]>(); // restaurant_id -> user_ids[]
            favoritesData?.forEach((fav: any) => {
                const current = favoritesMap.get(fav.restaurant_id) || [];
                current.push(fav.user_id);
                favoritesMap.set(fav.restaurant_id, current);
            });

            // For each restaurant, fetch ratings and photos to calculate average score and display images
            const enriched = await Promise.all(
                restaurantsData.map(async (r) => {
                    const [ratingsResponse, photosResponse] = await Promise.all([
                        supabase.from('ratings').select('*').eq('restaurant_id', r.id),
                        supabase.from('photos').select('*').eq('restaurant_id', r.id).limit(5)
                    ]);

                    const ratings = ratingsResponse.data;
                    const photos = photosResponse.data;

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

                    // Map favorites
                    const favUserIds = favoritesMap.get(r.id) || [];
                    const favProfiles = favUserIds.map(uid => profilesMap.get(uid)).filter(Boolean) as Profile[];
                    const is_favorite = user?.id ? favUserIds.includes(user.id) : false;

                    return {
                        ...r,
                        avg_score,
                        user_has_rated,
                        photos: (photos as Photo[]) || [],
                        is_favorite,
                        favorites: favProfiles
                    };
                })
            );
            setRestaurants(enriched);
        }
        setLoading(false);
    }

    return { restaurants, loading, refresh: fetchRestaurants };
}
