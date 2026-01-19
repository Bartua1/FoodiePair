import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Rating, Photo, Profile } from '../types';

interface DetailData {
    ratings: Rating[];
    photos: Photo[];
    profiles: Record<string, Profile>;
}

export function useRestaurantDetails(restaurantId: string | undefined, pairId: string | undefined) {
    const [data, setData] = useState<DetailData>({ ratings: [], photos: [], profiles: {} });
    const [loading, setLoading] = useState(true);

    async function fetchData() {
        if (!restaurantId || !pairId) return;
        setLoading(true);

        try {
            // 1. Fetch Ratings
            const { data: ratingsData } = await supabase
                .from('ratings')
                .select('*')
                .eq('restaurant_id', restaurantId);

            // 2. Fetch Photos
            const { data: photosData } = await supabase
                .from('photos')
                .select('*')
                .eq('restaurant_id', restaurantId);

            // 3. Fetch Profiles for the pair (to map user_id to name)
            // We fetch profiles linked to the pair_id
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('*')
                .eq('pair_id', pairId);

            const profilesMap: Record<string, Profile> = {};
            if (profilesData) {
                profilesData.forEach(p => {
                    profilesMap[p.id] = p as Profile;
                });
            }

            setData({
                ratings: (ratingsData as Rating[]) || [],
                photos: (photosData as Photo[]) || [],
                profiles: profilesMap
            });
        } catch (e) {
            console.error('Error fetching details:', e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, [restaurantId, pairId]);

    return { ...data, loading, refresh: fetchData };
}
