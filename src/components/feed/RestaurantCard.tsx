import { useState, useRef } from 'react';
import { Star, Heart, MapPin, Utensils, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Restaurant, Photo, Profile } from '../../types';
import { useTranslation } from 'react-i18next';

interface RestaurantCardProps {
    restaurant: Restaurant & { avg_score?: number; distance?: number; user_has_rated?: boolean; photos?: Photo[]; favorites?: Profile[] };
    onRate: (restaurant: Restaurant) => void;
    onViewDetails: (restaurant: Restaurant) => void;
    onToggleFavorite: () => void;
}

export function RestaurantCard({ restaurant, onRate, onViewDetails, onToggleFavorite }: RestaurantCardProps) {
    const { t, i18n } = useTranslation();
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const photos = restaurant.photos || [];

    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, clientWidth } = scrollContainerRef.current;
            const newIndex = Math.round(scrollLeft / clientWidth);
            if (newIndex !== currentPhotoIndex) {
                setCurrentPhotoIndex(newIndex);
            }
        }
    };

    const nextPhoto = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (scrollContainerRef.current) {
            const { clientWidth } = scrollContainerRef.current;
            const nextIndex = (currentPhotoIndex + 1) % photos.length;
            scrollContainerRef.current.scrollTo({
                left: nextIndex * clientWidth,
                behavior: 'smooth'
            });
        }
    };

    const prevPhoto = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (scrollContainerRef.current) {
            const { clientWidth } = scrollContainerRef.current;
            const prevIndex = (currentPhotoIndex - 1 + photos.length) % photos.length;
            scrollContainerRef.current.scrollTo({
                left: prevIndex * clientWidth,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="bg-white border border-pastel-mint shadow-sm rounded-2xl overflow-hidden flex flex-col transition-all hover:shadow-md">
            {/* Photo Section */}
            <div
                className="w-full aspect-video bg-pastel-lavender relative cursor-pointer group"
                onClick={() => onViewDetails(restaurant)}
            >
                {photos.length > 0 ? (
                    <>
                        <div
                            ref={scrollContainerRef}
                            onScroll={handleScroll}
                            className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {photos.map((photo, index) => (
                                <img
                                    key={index}
                                    src={photo.url}
                                    alt={`${restaurant.name} ${index + 1}`}
                                    className="w-full h-full object-cover flex-shrink-0 snap-center"
                                    loading="lazy"
                                />
                            ))}
                        </div>

                        {photos.length > 1 && (
                            <>
                                <button
                                    onClick={prevPhoto}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    onClick={nextPhoto}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                >
                                    <ChevronRight size={20} />
                                </button>
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 p-1 rounded-full bg-black/10 backdrop-blur-[2px]">
                                    {photos.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentPhotoIndex ? 'bg-white scale-125' : 'bg-white/50'}`}
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

                <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                    {/* Avatars of people who favorited (User + Partner) */}
                    {restaurant.favorites && restaurant.favorites.length > 0 && (
                        <div className="flex -space-x-2 mr-1">
                            {restaurant.favorites.map((profile) => (
                                <div key={profile.id} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden shadow-sm bg-white" title={profile.display_name || ''}>
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt={profile.display_name || ''} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-pastel-peach flex items-center justify-center text-[10px] font-bold text-slate-700">
                                            {profile.display_name?.[0]?.toUpperCase() || '?'}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Toggle Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite();
                        }}
                        className={`p-2 rounded-full shadow-sm backdrop-blur-sm transition-all ${restaurant.is_favorite
                            ? 'bg-white/90 text-red-500'
                            : 'bg-black/20 text-white hover:bg-black/30'
                            }`}
                    >
                        <Heart size={18} fill={restaurant.is_favorite ? "#E91E63" : "none"} color={restaurant.is_favorite ? "#E91E63" : "currentColor"} />
                    </button>
                </div>
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
