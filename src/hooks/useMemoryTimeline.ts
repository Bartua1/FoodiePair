import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Restaurant, Rating, Photo, Comment, Profile } from '../types';
import { useThrottledCallback } from './useThrottledCallback';

export interface MemoryEntry extends Restaurant {
    ratings: Rating[];
    photos: Photo[];
    comments: Comment[];
    profiles: Record<string, Profile>;
    favoriteUserIds: string[];
}

export function useMemoryTimeline(pairId: string | null) {
    const [entries, setEntries] = useState<MemoryEntry[]>([]);
    const [loading, setLoading] = useState(true);

    async function fetchTimeline() {
        if (!pairId) {
            setEntries([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // 1. Fetch Visited Restaurants
            const { data: restaurantsData, error: resError } = await supabase
                .from('restaurants')
                .select('*')
                .eq('pair_id', pairId)
                .not('visit_date', 'is', null)
                .order('visit_date', { ascending: false });

            if (resError) throw resError;
            if (!restaurantsData) {
                setEntries([]);
                return;
            }

            const restaurantIds = restaurantsData.map(r => r.id);

            // 2. Fetch All Related Data in parallel for all restaurants
            const [ratingsRes, photosRes, commentsRes, profilesRes, favoritesRes] = await Promise.all([
                supabase.from('ratings').select('*').in('restaurant_id', restaurantIds),
                supabase.from('photos').select('*').in('restaurant_id', restaurantIds),
                supabase.from('comments').select('*').in('restaurant_id', restaurantIds).order('created_at', { ascending: true }),
                supabase.from('profiles').select('*').eq('pair_id', pairId),
                supabase.from('restaurant_favorites').select('restaurant_id, user_id').in('restaurant_id', restaurantIds)
            ]);

            const profilesMap: Record<string, Profile> = {};
            profilesRes.data?.forEach(p => {
                profilesMap[p.id] = p as Profile;
            });

            // 3. Assemble Entries
            const enrichedEntries: MemoryEntry[] = restaurantsData.map(r => {
                const restaurantRatings = ratingsRes.data?.filter(rt => rt.restaurant_id === r.id) || [];
                const restaurantPhotos = photosRes.data?.filter(p => p.restaurant_id === r.id) || [];
                const restaurantComments = commentsRes.data?.filter(c => c.restaurant_id === r.id) || [];
                const favoriteUserIds = favoritesRes.data?.filter(f => f.restaurant_id === r.id).map(f => f.user_id) || [];

                // Calculate average score for this specific restaurant
                let avg_score = 0;
                if (restaurantRatings.length > 0) {
                    const scores = restaurantRatings.flatMap(rt => [rt.food_score, rt.service_score, rt.vibe_score, rt.price_quality_score]);
                    avg_score = scores.reduce((a, b) => a + b, 0) / scores.length;
                }

                return {
                    ...r,
                    avg_score,
                    ratings: restaurantRatings,
                    photos: restaurantPhotos,
                    comments: restaurantComments,
                    profiles: profilesMap,
                    favoriteUserIds
                };
            });

            setEntries(enrichedEntries);
        } catch (error) {
            console.error('Error fetching memory timeline:', error);
        } finally {
            setLoading(false);
        }
    }

    const throttledFetch = useThrottledCallback(fetchTimeline, 500);

    useEffect(() => {
        fetchTimeline();

        if (!pairId) return;

        // Subscriptions to relevant tables
        const restaurantsChannel = supabase
            .channel('timeline_restaurants')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants', filter: `pair_id=eq.${pairId}` }, () => throttledFetch())
            .subscribe();

        // For other tables, we'd need more complex filters or just refresh on any change related to these restaurants
        // Given RLS, we can just listen to changes and let the hook decide if it needs to refresh or not.
        // For simplicity and to avoid too many channels, we'll refresh when restaurants change (which usually triggers the others)
        // or we could add more listeners if real-time comments in timeline is a priority.

        return () => {
            supabase.removeChannel(restaurantsChannel);
        };
    }, [pairId]);

    return { entries, loading, refresh: fetchTimeline };
}
