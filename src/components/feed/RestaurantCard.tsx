import { useState } from 'react';
import { Star, Heart, MapPin, Utensils, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Restaurant, Photo } from '../../types';
import { useTranslation } from 'react-i18next';

interface RestaurantCardProps {
    restaurant: Restaurant & { avg_score?: number; distance?: number; user_has_rated?: boolean; photos?: Photo[] };
    onRate: (restaurant: Restaurant) => void;
    onViewDetails: (restaurant: Restaurant) => void;
}

export function RestaurantCard({ restaurant, onRate, onViewDetails }: RestaurantCardProps) {
    const { t, i18n } = useTranslation();
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const photos = restaurant.photos || [];

    const nextPhoto = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
    };

    const prevPhoto = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
    };

    return (
        <div className="bg-white border border-pastel-mint shadow-sm rounded-2xl overflow-hidden flex flex-col transition-all hover:shadow-md">
            {/* Photo Section */}
            <div
                className="w-full aspect-video bg-pastel-lavender flex items-center justify-center relative cursor-pointer group"
                onClick={() => onViewDetails(restaurant)}
            >
                {photos.length > 0 ? (
                    <>
                        <img
                            src={photos[currentPhotoIndex].url}
                            alt={restaurant.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                        {photos.length > 1 && (
                            <>
                                <button
                                    onClick={prevPhoto}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    onClick={nextPhoto}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <ChevronRight size={20} />
                                </button>
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                                    {photos.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentPhotoIndex ? 'bg-white' : 'bg-white/40'}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center text-white/50 gap-2">
                        <Utensils className="w-12 h-12" />
                        <span className="text-xs font-bold uppercase tracking-widest opacity-70">No Photos</span>
                    </div>
                )}

                {restaurant.is_favorite && (
                    <div className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm z-10">
                        <Heart size={18} fill="#E91E63" color="#E91E63" />
                    </div>
                )}
            </div>

            <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-slate-800 text-lg leading-tight cursor-pointer" onClick={() => onViewDetails(restaurant)}>{restaurant.name}</h4>
                    {!restaurant.user_has_rated ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRate(restaurant);
                            }}
                            className="bg-pastel-mint text-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm active:scale-95 transition-transform"
                        >
                            {t('restaurant.rateNow')}
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
                    <button
                        onClick={() => onViewDetails(restaurant)}
                        className="text-xs font-bold text-pastel-blue hover:underline"
                    >
                        {t('restaurant.viewDetails')}
                    </button>
                </div>
            </div>
        </div>
    );
}
