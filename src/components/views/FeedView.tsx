import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FilterBar } from '../feed/FilterBar';
import { GeolocationBanner } from '../ui/GeolocationBanner';
import { RestaurantCard } from '../feed/RestaurantCard';
import { RateRestaurantDrawer } from '../restaurant/RateRestaurantDrawer';
import { Utensils } from 'lucide-react';
import type { Restaurant, Profile } from '../../types';

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
    profile
}: FeedViewProps) {
    const { t } = useTranslation();
    const [ratingRestaurant, setRatingRestaurant] = useState<Restaurant | null>(null);

    return (
        <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
            <header className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-1">{t('feed.title')}</h2>
                <p className="text-slate-500 text-sm">{t('feed.subtitle')}</p>
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
            ) : restaurants.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                    <div className="w-20 h-20 bg-pastel-blue rounded-full flex items-center justify-center mb-4">
                        <Utensils className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700">{t('feed.noRestaurants')}</h3>
                    <p className="text-slate-500 max-w-[240px]">{t('feed.noRestaurantsSubtitle')}</p>
                </div>
            ) : (
                <div className="space-y-4 mt-2">
                    {restaurants.map(r => (
                        <RestaurantCard
                            key={r.id}
                            restaurant={r}
                            onRate={(restaurant) => setRatingRestaurant(restaurant)}
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
        </div>
    );
}
