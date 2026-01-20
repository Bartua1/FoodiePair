import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Profile, Restaurant, Rating, Photo, ViewType } from '../types';

interface Filters {
    distance: string;
    price: number | null;
    favoritesOnly: boolean;
    cuisine: string;
    sort: string;
}

interface AppState {
    // User / Profile
    profile: Profile | null;
    setProfile: (profile: Profile | null) => void;

    // UI State
    isDrawerOpen: boolean;
    setIsDrawerOpen: (isOpen: boolean) => void;
    view: ViewType;
    setView: (view: ViewType) => void;
    selectedRestaurant: Restaurant | null;
    setSelectedRestaurant: (restaurant: Restaurant | null) => void;

    // Filters
    filters: Filters;
    setFilters: (filters: Filters | ((prev: Filters) => Filters)) => void;

    // Restaurants Data
    restaurants: Restaurant[];
    loadingRestaurants: boolean;
    userLocation: { lat: number; lng: number } | null;
    setUserLocation: (location: { lat: number; lng: number } | null) => void;
    fetchRestaurants: (profile: Profile | null) => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
    // User / Profile
    profile: null,
    setProfile: (profile) => set({ profile }),

    // UI State
    isDrawerOpen: false,
    setIsDrawerOpen: (isDrawerOpen) => set({ isDrawerOpen }),
    view: 'feed',
    setView: (view) => set({ view }),
    selectedRestaurant: null,
    setSelectedRestaurant: (selectedRestaurant) => set({ selectedRestaurant }),

    // Filters
    filters: {
        distance: 'any',
        price: null,
        favoritesOnly: false,
        cuisine: 'all',
        sort: 'rating'
    },
    setFilters: (filters) => set((state) => ({
        filters: typeof filters === 'function' ? filters(state.filters) : filters
    })),

    // Restaurants Data
    restaurants: [],
    loadingRestaurants: false,
    userLocation: null,
    setUserLocation: (location) => set({ userLocation: location }),
    fetchRestaurants: async (profile) => {
        if (!profile?.pair_id) {
            set({ restaurants: [], loadingRestaurants: false });
            return;
        }

        set({ loadingRestaurants: true });

        try {
            const pairId = profile.pair_id;

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
                // 3. Fetch Favorites
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

                // Enrich restaurants
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
                            if (profile.id) {
                                user_has_rated = scoreList.some(rt => rt.user_id === profile.id);
                            }
                        }

                        // Map favorites
                        const favUserIds = favoritesMap.get(r.id) || [];
                        const favProfiles = favUserIds.map(uid => profilesMap.get(uid)).filter(Boolean) as Profile[];
                        const is_favorite = profile.id ? favUserIds.includes(profile.id) : false;

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

                set({ restaurants: enriched });
            }
        } catch (error) {
            console.error('Error fetching restaurants:', error);
        } finally {
            set({ loadingRestaurants: false });
        }
    }
}));
