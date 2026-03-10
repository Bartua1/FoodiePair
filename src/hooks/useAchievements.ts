import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { Restaurant, Rating } from '../types';

export interface AchievementBadge {
    id: string;
    unlocked: boolean;
    current: number;
    total: number;
    titleKey: string;
    descKey: string;
    icon: string;
}

export function useAchievements(pairId: string | null) {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [ratings, setRatings] = useState<Rating[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!pairId) {
            setLoading(false);
            return;
        }

        async function fetchData() {
            setLoading(true);
            try {
                // Fetch restaurants
                const { data: resData } = await supabase
                    .from('restaurants')
                    .select('*')
                    .eq('pair_id', pairId);

                // Fetch ratings for these restaurants
                const resIds = resData?.map(r => r.id) || [];
                const { data: ratData } = await supabase
                    .from('ratings')
                    .select('*')
                    .in('restaurant_id', resIds);

                setRestaurants((resData as Restaurant[]) || []);
                setRatings((ratData as Rating[]) || []);
            } catch (err) {
                console.error('Error fetching achievements data:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [pairId]);

    const badges = useMemo(() => {
        const visitedRestaurants = restaurants.filter(r => r.visit_status === 'visited' || r.visit_date);
        const plannedRestaurants = restaurants.filter(r => r.planned_date);

        // 1. Cuisine Explorer: 5 different cuisines
        const cuisines = new Set(visitedRestaurants.map(r => r.cuisine_type).filter(Boolean));
        const cuisineExplorer: AchievementBadge = {
            id: 'cuisine_explorer',
            unlocked: cuisines.size >= 5,
            current: cuisines.size,
            total: 5,
            titleKey: 'achievements.badges.cuisine_explorer.title',
            descKey: 'achievements.badges.cuisine_explorer.description',
            icon: 'Map'
        };

        // 2. Restaurant Regulars: 10 visited
        const restaurantRegulars: AchievementBadge = {
            id: 'restaurant_regulars',
            unlocked: visitedRestaurants.length >= 10,
            current: visitedRestaurants.length,
            total: 10,
            titleKey: 'achievements.badges.restaurant_regulars.title',
            descKey: 'achievements.badges.restaurant_regulars.description',
            icon: 'Utensils'
        };

        // 3. Perfect Match: Matching 5-star ratings
        // A matching 5-star means both gave 5 stars to the same restaurant (avg or any specific score?)
        // Let's say matching 5-star avg score (all categories avg to 5)
        const getAvg = (r: Rating) => (r.food_score + r.service_score + r.vibe_score + r.price_quality_score) / 4;
        const matchingFives = new Set<string>();

        // Group ratings by restaurant
        const ratingsByRes: Record<string, Rating[]> = {};
        ratings.forEach(r => {
            if (!ratingsByRes[r.restaurant_id]) ratingsByRes[r.restaurant_id] = [];
            ratingsByRes[r.restaurant_id].push(r);
        });

        Object.entries(ratingsByRes).forEach(([resId, resRatings]) => {
            if (resRatings.length >= 2) {
                const isAllFive = resRatings.every(r => getAvg(r) === 5);
                if (isAllFive) matchingFives.add(resId);
            }
        });

        const perfectMatch: AchievementBadge = {
            id: 'perfect_match',
            unlocked: matchingFives.size >= 1,
            current: matchingFives.size,
            total: 1,
            titleKey: 'achievements.badges.perfect_match.title',
            descKey: 'achievements.badges.perfect_match.description',
            icon: 'Heart'
        };

        // 4. Date Night Pro: 3 planned date nights
        const dateNightPro: AchievementBadge = {
            id: 'date_night_pro',
            unlocked: plannedRestaurants.length >= 3,
            current: plannedRestaurants.length,
            total: 3,
            titleKey: 'achievements.badges.date_night_pro.title',
            descKey: 'achievements.badges.date_night_pro.description',
            icon: 'Calendar'
        };

        return [cuisineExplorer, restaurantRegulars, perfectMatch, dateNightPro];
    }, [restaurants, ratings]);

    return { badges, loading };
}
