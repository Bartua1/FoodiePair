import { useState, useRef, useEffect } from 'react';
import { Star, Heart, MapPin, Utensils, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Restaurant, Photo, Profile } from '../../types';
import { useTranslation } from 'react-i18next';
import { getOptimizedImageUrl } from '../../utils/imageUtils';

interface RestaurantCardProps {
    restaurant: Restaurant & { avg_score?: number; distance?: number; user_has_rated?: boolean; photos?: Photo[]; favorites?: Profile[] };
    onRate: (restaurant: Restaurant) => void;
    onViewDetails: (restaurant: Restaurant) => void;
    onToggleFavorite: () => void;
}

export function RestaurantCard({ restaurant, onRate, onViewDetails, onToggleFavorite }: RestaurantCardProps) {
    const { t, i18n } = useTranslation();
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [isFavorite, setIsFavorite] = useState(restaurant.is_favorite);
    const [isAnimating, setIsAnimating] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const photos = restaurant.photos || [];

    // Sync local state if the prop changes externally
    useEffect(() => {
        setIsFavorite(restaurant.is_favorite);
    }, [restaurant.is_favorite]);

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
        <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-sm rounded-3xl overflow-hidden flex flex-col transition-all hover:shadow-md">
            {/* Photo Section */}
            <div
                className="w-full aspect-[4/5] bg-slate-100 dark:bg-zinc-800 relative cursor-pointer group"
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
                                    src={getOptimizedImageUrl(photo.url, { width: 600, height: 338, resize: 'cover' })}
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

                <div className="absolute top-0 right-0 z-10 flex flex-col items-end">
                    {/* Toggle Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsFavorite(!isFavorite);
                            setIsAnimating(true);
                            setTimeout(() => setIsAnimating(false), 400); // Reset animation state
                            onToggleFavorite();
                        }}
                        className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm px-4 pt-3 pb-4 rounded-bl-[24px] shadow-sm"
                    >
                        <Heart
                            size={26}
                            className={`transition-all duration-300 ${isFavorite ? 'text-red-500 fill-current' : 'text-slate-300 dark:text-zinc-500 fill-transparent'
                                } ${isAnimating && isFavorite ? 'scale-125' : 'scale-100'} hover:scale-110 active:scale-90`}
                            strokeWidth={isFavorite ? 0 : 2}
                        />
                    </button>
                </div>

                {/* Avatars overlapping bottom lip of image */}
                {restaurant.favorites && restaurant.favorites.length > 0 && (
                    <div className="absolute -bottom-4 left-3 flex -space-x-2 z-10">
                        {restaurant.favorites.map((profile) => (
                            <div key={profile.id} className="w-8 h-8 rounded-full border-[2.5px] border-white dark:border-zinc-900 overflow-hidden shadow-sm bg-white" title={profile.display_name || ''}>
                                {profile.avatar_url ? (
                                    <img
                                        src={getOptimizedImageUrl(profile.avatar_url, { width: 64, height: 64, resize: 'cover' })}
                                        alt={profile.display_name || ''}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-pastel-peach flex items-center justify-center text-[10px] font-bold text-slate-700">
                                        {profile.display_name?.[0]?.toUpperCase() || '?'}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-4 pt-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-0.5">
                    <h4 className="font-bold text-slate-900 dark:text-zinc-100 text-lg leading-tight cursor-pointer line-clamp-1" onClick={() => onViewDetails(restaurant)}>{restaurant.name}</h4>
                    {restaurant.visit_status !== 'wishlist' && (
                        !restaurant.user_has_rated ? (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRate(restaurant);
                                }}
                                className="text-orange-400 p-1 shrink-0 active:scale-95 transition-transform"
                                title={t('restaurant.rateNow')}
                            >
                                <Star size={16} />
                            </button>
                        ) : (
                            <div className="flex items-center gap-1 shrink-0 pt-0.5">
                                <Star size={14} className="text-yellow-400 fill-yellow-400" />
                                <span className="font-bold text-sm text-slate-700 dark:text-zinc-300">{restaurant.avg_score?.toFixed(1) || 'N/A'}</span>
                            </div>
                        )
                    )}
                </div>

                <p className="text-slate-500 text-xs mb-2">
                    {restaurant.cuisine_type} • {'€'.repeat(restaurant.price_range)}
                </p>

                <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400 text-xs mt-auto">
                    <MapPin size={12} className="shrink-0" />
                    <span className="truncate flex-1">{restaurant.address.split(',')[0]}</span>
                    {restaurant.distance !== undefined && (
                        <span className="shrink-0 text-slate-700 dark:text-zinc-300">
                            {restaurant.distance < 1 ? `${(restaurant.distance * 1000).toFixed(0)}m` : `${restaurant.distance.toFixed(1)} km`}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400 text-xs mt-1 pl-[18px]">
                    <span className="uppercase text-[10px] font-bold tracking-wider">
                        {restaurant.visit_date ? new Date(restaurant.visit_date).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase() : t('restaurant.notVisited').toUpperCase()}
                    </span>
                </div>
            </div>

            <div className="px-4 pb-4">
                <button
                    onClick={() => onViewDetails(restaurant)}
                    className="w-full py-3 bg-slate-50 dark:bg-zinc-800/80 rounded-xl text-sm font-bold text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
                >
                    {t('restaurant.viewDetails', 'View Details')}
                </button>
            </div>
        </div>
    );
}
