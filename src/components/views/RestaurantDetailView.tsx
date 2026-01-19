import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MapPin, Camera, Trash2, Send, Pencil, Heart, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { RateRestaurantDrawer } from '../restaurant/RateRestaurantDrawer';
import { EditLocationDrawer } from '../restaurant/EditLocationDrawer';
import { RestaurantMap } from '../map/RestaurantMap';
import { useRestaurantDetails } from '../../hooks/useRestaurantDetails';
import { supabase } from '../../lib/supabase';
import type { Restaurant, Profile, Rating } from '../../types';

interface RestaurantDetailViewProps {
    restaurant: Restaurant;
    currentUser: Profile | null;
    onBack: () => void;
}

export function RestaurantDetailView({ restaurant, currentUser, onBack }: RestaurantDetailViewProps) {
    const { t } = useTranslation();
    const { ratings, photos, profiles, comments, favoriteUserIds, refresh, addComment } = useRestaurantDetails(restaurant.id, currentUser?.pair_id || undefined);
    const [ratingDrawerOpen, setRatingDrawerOpen] = useState(false);
    const [editLocationDrawerOpen, setEditLocationDrawerOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentLightboxIndex, setCurrentLightboxIndex] = useState(0);
    const heroScrollRef = useRef<HTMLDivElement>(null);
    const [heroIndex, setHeroIndex] = useState(0);

    const handleHeroScroll = () => {
        if (heroScrollRef.current) {
            const { scrollLeft, clientWidth } = heroScrollRef.current;
            const newIndex = Math.round(scrollLeft / clientWidth);
            if (newIndex !== heroIndex) {
                setHeroIndex(newIndex);
            }
        }
    };

    const scrollToHero = (index: number) => {
        if (heroScrollRef.current) {
            const { clientWidth } = heroScrollRef.current;
            heroScrollRef.current.scrollTo({
                left: index * clientWidth,
                behavior: 'smooth'
            });
        }
    };

    const openLightbox = (index: number) => {
        setCurrentLightboxIndex(index);
        setLightboxOpen(true);
    };

    const nextLightbox = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentLightboxIndex((prev) => (prev + 1) % photos.length);
    };

    const prevLightbox = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentLightboxIndex((prev) => (prev - 1 + photos.length) % photos.length);
    };

    // Local state for favorite status to respond immediately
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        if (currentUser && favoriteUserIds) {
            setIsFavorite(favoriteUserIds.includes(currentUser.id));
        }
    }, [favoriteUserIds, currentUser]);

    const handleToggleFavorite = async () => {
        if (!currentUser) return;

        if (isFavorite) {
            await supabase.from('restaurant_favorites').delete().eq('user_id', currentUser.id).eq('restaurant_id', restaurant.id);
            setIsFavorite(false);
        } else {
            await supabase.from('restaurant_favorites').insert({ user_id: currentUser.id, restaurant_id: restaurant.id });
            setIsFavorite(true);
        }
        refresh(); // Refresh details to update avatars
    };

    const handleSendComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUser) return;

        await addComment(currentUser.id, newComment);
        setNewComment('');
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${restaurant.id}-${Math.random()}.${fileExt}`;
        const filePath = `photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('restaurant-photos')
            .upload(filePath, file);

        if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
                .from('restaurant-photos')
                .getPublicUrl(filePath);

            await supabase.from('photos').insert({
                restaurant_id: restaurant.id,
                url: publicUrl
            });
            refresh();
        }
        setUploading(false);
    };

    const handleDeletePhoto = async (photoId: string) => {
        // Simple delete for now, ideally check ownership or allow both to delete
        await supabase.from('photos').delete().eq('id', photoId);
        refresh();
    };

    const myRating = ratings.find(r => r.user_id === currentUser?.id);
    const partnerRating = ratings.find(r => r.user_id !== currentUser?.id);
    const partnerProfile = partnerRating ? profiles[partnerRating.user_id] : null;

    const avgScore = ratings.length > 0
        ? ratings.reduce((acc, r) => acc + (r.food_score + r.service_score + r.vibe_score + r.price_quality_score) / 4, 0) / ratings.length
        : undefined;

    // Get favorite profiles
    const favoriteProfiles = (favoriteUserIds || []).map(id => profiles[id]).filter(Boolean);

    return (
        <div className="flex-1 flex flex-col bg-white h-full relative overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center gap-4 sticky top-0 bg-white z-10">
                <button onClick={onBack} className="p-2 bg-pastel-peach rounded-full hover:scale-105 active:scale-95 transition-all shadow-sm">
                    <ArrowLeft size={24} className="text-slate-800" />
                </button>
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-800 leading-tight">{restaurant.name}</h2>
                    <p className="text-xs text-slate-500 font-medium">{restaurant.cuisine_type} • {'€'.repeat(restaurant.price_range)}</p>
                </div>

                {/* Favorites Section in Header */}
                <div className="flex items-center gap-2">
                    {favoriteProfiles.length > 0 && (
                        <div className="flex -space-x-2">
                            {favoriteProfiles.map(p => (
                                <div key={p.id} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden shadow-sm" title={p.display_name || ''}>
                                    {p.avatar_url ? (
                                        <img src={p.avatar_url} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-pastel-peach flex items-center justify-center text-[10px] font-bold text-slate-700">
                                            {p.display_name?.[0]}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    <button
                        onClick={handleToggleFavorite}
                        className={`p-2 rounded-full transition-colors ${isFavorite ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-300 hover:bg-slate-100'}`}
                    >
                        <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-8 pb-32">
                {/* Hero Carousel */}
                {photos.length > 0 && (
                    <div className="rounded-2xl overflow-hidden relative group aspect-video shadow-sm">
                        <div
                            ref={heroScrollRef}
                            onScroll={handleHeroScroll}
                            className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                        >
                            {photos.map((photo, index) => (
                                <img
                                    key={index}
                                    src={photo.url}
                                    alt={`Hero ${index + 1}`}
                                    className="w-full h-full object-cover flex-shrink-0 snap-center cursor-pointer"
                                    onClick={() => openLightbox(index)}
                                    loading="lazy"
                                />
                            ))}
                        </div>

                        {/* Hero Controls */}
                        {photos.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); scrollToHero((heroIndex - 1 + photos.length) % photos.length); }}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full transition-colors"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); scrollToHero((heroIndex + 1) % photos.length); }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full transition-colors"
                                >
                                    <ChevronRight size={20} />
                                </button>
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 p-1 rounded-full bg-black/20 backdrop-blur-sm">
                                    {photos.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === heroIndex ? 'bg-white scale-125' : 'bg-white/50'}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
                {/* Map Section */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <MapPin size={16} />
                        <span className="flex-1">{restaurant.address}</span>
                        <button
                            onClick={() => setEditLocationDrawerOpen(true)}
                            className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                            title={t('restaurant.editLocation')}
                        >
                            <Pencil size={14} />
                        </button>
                    </div>
                    <div className="h-48 rounded-2xl overflow-hidden border border-slate-100 shadow-sm relative z-0">
                        <RestaurantMap restaurants={[{ ...restaurant, avg_score: avgScore }]} />
                    </div>
                </div>

                {/* Comparative Ratings */}
                <div>
                    <h3 className="font-bold text-slate-800 mb-4 text-lg">{t('stats.averageScore')}</h3>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                        {/* Me */}
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-pastel-blue flex items-center justify-center text-white font-bold text-xl mb-2 shadow-sm">
                                {myRating ? ((myRating.food_score + myRating.service_score + myRating.vibe_score + myRating.price_quality_score) / 4).toFixed(1) : '-'}
                            </div>
                            <span className="text-xs font-bold text-slate-600 text-center line-clamp-1">{currentUser?.display_name || 'Me'}</span>
                        </div>

                        {/* VS */}
                        <div className="flex flex-col items-center justify-center pt-2">
                            <span className="text-xs font-black text-slate-300 uppercase tracking-widest">VS</span>
                        </div>

                        {/* Partner */}
                        <div className="flex flex-col items-center">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl mb-2 shadow-sm ${partnerRating ? 'bg-pastel-peach text-slate-800' : 'bg-slate-100 text-slate-300'}`}>
                                {partnerRating ? ((partnerRating.food_score + partnerRating.service_score + partnerRating.vibe_score + partnerRating.price_quality_score) / 4).toFixed(1) : '?'}
                            </div>
                            <span className="text-xs font-bold text-slate-600 text-center line-clamp-1">{partnerProfile?.display_name || t('restaurant.partner')}</span>
                        </div>
                    </div>

                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl">
                        {[
                            { label: t('restaurant.food'), key: 'food_score' },
                            { label: t('restaurant.service'), key: 'service_score' },
                            { label: t('restaurant.vibe'), key: 'vibe_score' },
                            { label: t('restaurant.priceQuality'), key: 'price_quality_score' }
                        ].map((cat) => (
                            <div key={cat.key} className="flex items-center gap-3">
                                <span className="text-xs font-bold text-slate-500 w-24">{cat.label}</span>
                                <div className="flex-1 h-2 bg-white rounded-full overflow-hidden flex">
                                    {/* Comparative Bar */}
                                    <div
                                        className="h-full bg-pastel-blue opacity-80"
                                        style={{ width: `${myRating ? (myRating[cat.key as keyof Rating] as number / 5) * 50 : 0}%` }}
                                    />
                                    <div
                                        className="h-full bg-pastel-peach opacity-80"
                                        style={{ width: `${partnerRating ? (partnerRating[cat.key as keyof Rating] as number / 5) * 50 : 0}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Comments Section */}
                <div className="bg-slate-50 p-4 rounded-2xl">
                    <h3 className="font-bold text-slate-800 mb-4 text-lg">{t('restaurant.chat')}</h3>

                    <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2">
                        {(comments || []).map((comment) => {
                            const isMe = comment.user_id === currentUser?.id;
                            const profile = profiles[comment.user_id];
                            return (
                                <div key={comment.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className={`p-3 rounded-2xl max-w-[80%] text-sm ${isMe ? 'bg-pastel-blue text-slate-800 rounded-br-none' : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none'}`}>
                                        {comment.content}
                                    </div>
                                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                                        {profile?.display_name || t('restaurant.user')} • {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            );
                        })}
                        {(!comments || comments.length === 0) && (
                            <div className="text-center text-slate-400 text-xs py-4">
                                {t('restaurant.noComments')}
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSendComment} className="flex gap-2">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={t('restaurant.addCommentPlaceholder')}
                            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-pastel-blue"
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim()}
                            className="bg-pastel-blue text-white p-2 rounded-xl disabled:opacity-50"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>

                {/* Photos */}
                <div>
                    <div className="flex justify-between items-end mb-4">
                        <h3 className="font-bold text-slate-800 text-lg">{t('restaurant.photos') || 'Photos'}</h3>
                        <label className="text-xs font-bold text-pastel-blue cursor-pointer hover:underline flex items-center gap-1">
                            <Camera size={14} />
                            {t('restaurant.addPhoto')}
                            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} />
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {photos.map((p, index) => (
                            <div key={p.id} className="aspect-square rounded-xl overflow-hidden relative group bg-slate-100 cursor-pointer" onClick={() => openLightbox(index)}>
                                <img src={p.url} className="w-full h-full object-cover" loading="lazy" />
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeletePhoto(p.id); }}
                                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                        {photos.length === 0 && (
                            <div className="col-span-2 aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-300 gap-2">
                                <Camera size={24} />
                                <span className="text-xs font-medium">No photos yet</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Action */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 pb-8 z-20">
                <Button
                    className="w-full bg-pastel-mint text-slate-800 rounded-2xl py-4 font-bold text-lg shadow-lg active:scale-[0.98] transition-transform"
                    onClick={() => setRatingDrawerOpen(true)}
                >
                    {myRating ? t('restaurant.saveRating') : t('restaurant.rateNow')}
                </Button>
            </div>

            <RateRestaurantDrawer
                isOpen={ratingDrawerOpen}
                onClose={() => setRatingDrawerOpen(false)}
                restaurantId={restaurant.id}
                profile={currentUser}
                onSuccess={refresh}
            />

            <EditLocationDrawer
                isOpen={editLocationDrawerOpen}
                onClose={() => setEditLocationDrawerOpen(false)}
                restaurant={restaurant}
                onSuccess={refresh}
            />

            {/* Lightbox */}
            {lightboxOpen && photos.length > 0 && (
                <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center animate-in fade-in duration-200">
                    <button
                        onClick={() => setLightboxOpen(false)}
                        className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-white/20 transition-colors z-20"
                    >
                        <X size={24} />
                    </button>

                    <div className="relative w-full h-full flex items-center justify-center">
                        <img
                            src={photos[currentLightboxIndex].url}
                            alt="Full screen"
                            className="max-w-full max-h-full object-contain"
                        />

                        {photos.length > 1 && (
                            <>
                                <button
                                    onClick={prevLightbox}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                                >
                                    <ChevronLeft size={32} />
                                </button>
                                <button
                                    onClick={nextLightbox}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                                >
                                    <ChevronRight size={32} />
                                </button>
                                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white font-medium bg-black/30 px-3 py-1 rounded-full text-sm">
                                    {currentLightboxIndex + 1} / {photos.length}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
