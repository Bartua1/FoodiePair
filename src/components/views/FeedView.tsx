import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FilterBar } from '../feed/FilterBar';
import { GeolocationBanner } from '../ui/GeolocationBanner';
import { RestaurantCard } from '../feed/RestaurantCard';
import { RateRestaurantDrawer } from '../restaurant/RateRestaurantDrawer';
import { Utensils, Sparkles } from 'lucide-react';
import type { Restaurant, Profile } from '../../types';
import { supabase } from '../../lib/supabase';
import { RecommendationDrawer } from '../recommendations/RecommendationDrawer';

interface FeedViewProps {
    restaurants: any[];
    loading: boolean;
    filters: any;
    setFilters: (filters: any) => void;
    cuisines: string[];
    geoError: { message: string } | null;
    retryGeo: () => void;
    onRefresh: () => void;
    profile: Profile | null;
    onViewDetails: (restaurant: Restaurant) => void;
    activeTab?: 'visited' | 'wishlist';
}

export function FeedView({
    restaurants,
    loading,
    filters,
    setFilters,
    cuisines,
    geoError,
    retryGeo,
    onRefresh,
    profile,
    onViewDetails,
    activeTab = 'visited'
}: FeedViewProps) {
    const { t } = useTranslation();
    const [ratingRestaurant, setRatingRestaurant] = useState<Restaurant | null>(null);
    const [isRecommendOpen, setIsRecommendOpen] = useState(false);

    // Filter restaurants based on tab
    const filteredByTab = restaurants.filter(r => {
        if (activeTab === 'visited') {
            return !r.visit_status || r.visit_status === 'visited';
        } else {
            return r.visit_status === 'wishlist';
        }
    });

    const handleToggleFavorite = async (restaurant: Restaurant) => {
        if (!profile) return;

        const isFavorite = restaurant.is_favorite;

        if (isFavorite) {
            await supabase
                .from('restaurant_favorites')
                .delete()
                .eq('user_id', profile.id)
                .eq('restaurant_id', restaurant.id);
        } else {
            await supabase
                .from('restaurant_favorites')
                .insert({
                    user_id: profile.id,
                    restaurant_id: restaurant.id
                });
        }
        onRefresh();
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 pb-32 no-scrollbar">
            <header className="mb-6 flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-1">
                        {activeTab === 'visited' ? t('feed.title') : t('wishlist.toGo')}
                    </h2>
                    <p className="text-slate-500 text-sm">
                        {activeTab === 'visited' ? t('feed.subtitle') : t('wishlist.subtitle')}
                    </p>
                </div>

                <button
                    onClick={() => setIsRecommendOpen(true)}
                    className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all flex items-center gap-2 group shadow-lg"
                >
                    <Sparkles size={20} className="text-pastel-peach-darker group-hover:scale-110 transition-transform" />
                    <span className="hidden sm:inline text-sm font-bold">{t('recommendations.getSuggestions')}</span>
                </button>
            </header>

            <FilterBar
                filters={filters}
                setFilters={setFilters}
                cuisines={cuisines}
            />

            <GeolocationBanner geoError={geoError} retryGeo={retryGeo} />

            {loading ? (
                <div className="animate-pulse space-y-4 mt-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-48 bg-slate-100 rounded-2xl w-full" />)}
                </div>
            ) : filteredByTab.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                    <div className="w-20 h-20 bg-pastel-blue rounded-full flex items-center justify-center mb-4">
                        <Utensils className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700">{t('feed.noRestaurants')}</h3>
                    <p className="text-slate-500 max-w-[240px]">
                        {activeTab === 'visited' ? t('feed.noRestaurantsSubtitle') : t('recommendations.noHistorySubtitle')}
                    </p>
                </div>
            ) : (
                <div className="space-y-4 mt-2">
                    {filteredByTab.map(r => (
                        <RestaurantCard
                            key={r.id}
                            restaurant={r}
                            onRate={(restaurant) => setRatingRestaurant(restaurant)}
                            onViewDetails={onViewDetails}
                            onToggleFavorite={() => handleToggleFavorite(r)}
                        />
                    ))}
                </div>
            )}

            {ratingRestaurant && (
                <RateRestaurantDrawer
                    isOpen={!!ratingRestaurant}
                    onClose={() => setRatingRestaurant(null)}
                    restaurantId={ratingRestaurant.id}
                    profile={profile}
                    onSuccess={onRefresh}
                />
            )}

            <RecommendationDrawer
                isOpen={isRecommendOpen}
                onClose={() => setIsRecommendOpen(false)}
                pairId={profile?.pair_id || null}
                profileId={profile?.id || null}
                onRefreshList={onRefresh}
                onSelectRestaurant={(id) => {
                    const r = restaurants.find(res => res.id === id);
                    if (r) onViewDetails(r);
                }}
            />
        </div>
    );
}
