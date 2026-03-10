import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FilterBar } from '../feed/FilterBar';
import { GeolocationBanner } from '../ui/GeolocationBanner';
import { RestaurantCard } from '../feed/RestaurantCard';
import { RateRestaurantDrawer } from '../restaurant/RateRestaurantDrawer';
import { Utensils, Sparkles, Shuffle } from 'lucide-react';
import type { Restaurant, Profile } from '../../types';
import { supabase } from '../../lib/supabase';
import { RecommendationDrawer } from '../recommendations/RecommendationDrawer';
import { RandomizerDrawer } from '../restaurant/RandomizerDrawer';
import { RestaurantCardSkeleton } from '../feed/RestaurantCardSkeleton';

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
    const [isRandomizerOpen, setIsRandomizerOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter restaurants based on tab
    const filteredByTab = restaurants.filter(r => {
        const matchesTab = activeTab === 'visited'
            ? (!r.visit_status || r.visit_status === 'visited')
            : r.visit_status === 'wishlist';

        const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesTab && matchesSearch;
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
        // Deliberately not calling onRefresh() here to prevent full feed re-renders. 
        // The RestaurantCard component handles the optimistic visual update locally.
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 pb-32 no-scrollbar dark:bg-zinc-950">
            <header className="mb-6 flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-zinc-100 mb-1">
                        {activeTab === 'visited' ? t('feed.title') : t('wishlist.toGo')}
                    </h2>
                    <p className="text-slate-500 dark:text-zinc-400 text-sm">
                        {activeTab === 'visited' ? t('feed.subtitle') : t('wishlist.subtitle')}
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setIsRandomizerOpen(true)}
                        className="p-3 bg-white border border-slate-200 text-slate-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200 rounded-2xl hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all flex items-center gap-2 group shadow-sm active:scale-95"
                        title={t('randomizer.title')}
                    >
                        <Shuffle size={20} className="text-pastel-blue-dark group-hover:rotate-180 transition-transform duration-500" />
                        <span className="hidden md:inline text-sm font-bold">{t('randomizer.title')}</span>
                    </button>

                    <button
                        onClick={() => setIsRecommendOpen(true)}
                        className="p-3 bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-2xl hover:bg-slate-800 dark:hover:bg-white transition-all flex items-center gap-2 group shadow-lg active:scale-95 border border-transparent"
                    >
                        <Sparkles size={20} className="text-pastel-peach-darker group-hover:scale-110 transition-transform" />
                        <span className="hidden sm:inline text-sm font-bold">{t('recommendations.getSuggestions')}</span>
                    </button>
                </div>
            </header>

            <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder={t('feed.searchPlaceholder', 'Search restaurants')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-zinc-700 rounded-xl leading-5 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pastel-mint focus:border-pastel-mint sm:text-sm transition-shadow shadow-sm"
                />
            </div>

            <FilterBar
                filters={filters}
                setFilters={setFilters}
                cuisines={cuisines}
            />

            <GeolocationBanner geoError={geoError} retryGeo={retryGeo} />

            {loading ? (
                <div className="space-y-4 mt-6">
                    {[1, 2, 3].map(i => <RestaurantCardSkeleton key={i} />)}
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
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4">
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

            <RandomizerDrawer
                isOpen={isRandomizerOpen}
                onClose={() => setIsRandomizerOpen(false)}
                restaurants={restaurants}
                onSelectRestaurant={(id) => {
                    const r = restaurants.find(res => res.id === id);
                    if (r) onViewDetails(r);
                }}
            />
        </div>
    );
}
