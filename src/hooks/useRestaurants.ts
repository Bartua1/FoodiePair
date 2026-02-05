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

        try {
            // 1. Get IDs of shared restaurants where I am explicitly added
            let sharedRestaurantIds: string[] = [];
            if (user) {
                const { data: sharedAssignments } = await supabase
                    .from('shared_restaurant_users')
                    .select('shared_restaurant_id, shared_restaurants(restaurant_id)')
                    .eq('user_id', user.id);

                if (sharedAssignments) {
                    sharedRestaurantIds = sharedAssignments
                        .map((a: any) => a.shared_restaurants?.restaurant_id)
                        .filter(Boolean);
                }
            }

            // 2. Fetch Restaurants (Base Pair + Shared)
            let query = supabase.from('restaurants').select('*');

            if (pairId && sharedRestaurantIds.length > 0) {
                query = query.or(`pair_id.eq.${pairId},id.in.(${sharedRestaurantIds.join(',')})`);
            } else if (pairId) {
                query = query.eq('pair_id', pairId);
            } else if (sharedRestaurantIds.length > 0) {
                query = query.in('id', sharedRestaurantIds);
            } else {
                // No pair, no shares -> empty
                setRestaurants([]);
                setLoading(false);
                return;
            }

            const { data: restaurantsData, error } = await query;

            if (error) {
                console.error('Error fetching restaurants:', error);
                setRestaurants([]);
                setLoading(false);
                return;
            }

            // 3. Fetch Profiles for the pair AND created_by of shared restaurants
            // We need profiles to display who added the restaurant or comments
            // For simplicity, we fetch pair profiles. Shared profiles might be missing in this map, 
            // but we can fetch them on demand or ignore for now.
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('*')
                .eq('pair_id', pairId);

            const profilesMap = new Map(profilesData?.map(p => [p.id, p as Profile]) || []);

            // 4. Enrich Data
            if (restaurantsData) {
                const restaurantIds = restaurantsData.map(r => r.id);

                // Fetch Favorites
                const { data: favoritesData } = await supabase
                    .from('restaurant_favorites')
                    .select('*')
                    .in('restaurant_id', restaurantIds);

                const favoritesMap = new Map<string, string[]>();
                favoritesData?.forEach((fav: any) => {
                    const current = favoritesMap.get(fav.restaurant_id) || [];
                    current.push(fav.user_id);
                    favoritesMap.set(fav.restaurant_id, current);
                });

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
                            const scores = scoreList.flatMap(rt => [rt.food_score, rt.service_score, rt.vibe_score, rt.price_quality_score]);
                            avg_score = scores.reduce((a, b) => a + b, 0) / scores.length;

                            if (user?.id) {
                                user_has_rated = scoreList.some(rt => rt.user_id === user.id);
                            }
                        }

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
        } catch (err) {
            console.error('Error in useRestaurants:', err);
        } finally {
            setLoading(false);
        }
    }

    return { restaurants, loading, refresh: fetchRestaurants };
}
