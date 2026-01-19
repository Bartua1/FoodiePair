import { Star, Heart, MapPin, Utensils } from 'lucide-react';
import type { Restaurant } from '../../types';
import { useTranslation } from 'react-i18next';

interface RestaurantCardProps {
    restaurant: Restaurant & { avg_score?: number; distance?: number; user_has_rated?: boolean };
    onRate: (restaurant: Restaurant) => void;
}

export function RestaurantCard({ restaurant, onRate }: RestaurantCardProps) {
    const { t, i18n } = useTranslation();
    return (
        <div className="bg-white border border-pastel-mint shadow-sm rounded-2xl overflow-hidden flex flex-col transition-all hover:shadow-md">
            {/* Placeholder for Photo */}
            <div className="w-full aspect-video bg-pastel-lavender flex items-center justify-center relative">
                <Utensils className="w-12 h-12 text-white/50" />
                {restaurant.is_favorite && (
                    <div className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
                        <Heart size={18} fill="#E91E63" color="#E91E63" />
                    </div>
                )}
            </div>

            <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-slate-800 text-lg leading-tight">{restaurant.name}</h4>
                    {!restaurant.user_has_rated ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRate(restaurant);
                            }}
                            className="bg-pastel-blue text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm active:scale-95 transition-transform"
                        >
                            {t('restaurant.rateNow') || 'Rate Now'}
                        </button>
                    ) : (
                        <div className="bg-pastel-peach px-2 py-1 rounded-lg flex items-center gap-1 shrink-0">
                            <Star size={14} className="text-orange-400 fill-orange-400" />
                            <span className="font-bold text-sm text-slate-700">{restaurant.avg_score?.toFixed(1) || 'N/A'}</span>
                        </div>
                    )}
                </div>

                <p className="text-slate-500 text-sm mb-3 font-medium">
                    {restaurant.cuisine_type} • {'€'.repeat(restaurant.price_range)}
                </p>

                <div className="flex items-center gap-1 text-slate-400 text-xs mb-3">
                    <MapPin size={12} />
                    <span className="truncate">{restaurant.address}</span>
                    {restaurant.distance !== undefined && (
                        <span className="ml-auto font-bold text-pastel-mint bg-pastel-mint/10 px-2 py-0.5 rounded">
                            {restaurant.distance < 1 ? `${(restaurant.distance * 1000).toFixed(0)}m` : `${restaurant.distance.toFixed(1)}km`}
                        </span>
                    )}
                </div>

                <div className="border-t border-slate-50 pt-3 flex items-center justify-between">
                    <span className="text-[10px] text-slate-300 uppercase font-bold tracking-wider">
                        {new Date(restaurant.visit_date!).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <button className="text-xs font-bold text-pastel-blue hover:underline">{t('restaurant.viewDetails')}</button>
                </div>
            </div>
        </div>
    );
}
