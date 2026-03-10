import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MapPin, Camera, Trash2, Send, Pencil, Heart, X, ChevronLeft, ChevronRight, Share2, Bookmark, Check, Calendar, CalendarPlus, Download, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import { Button } from '../ui/Button';
import { RateRestaurantDrawer } from '../restaurant/RateRestaurantDrawer';
import { EditRestaurantDrawer } from '../restaurant/EditRestaurantDrawer';
import { RestaurantMap } from '../map/RestaurantMap';
import { ShareConfigurationModal } from '../restaurant/ShareConfigurationModal';
import { useRestaurantDetails } from '../../hooks/useRestaurantDetails';
import { supabase } from '../../lib/supabase';
import { getOptimizedImageUrl, compressImage } from '../../utils/imageUtils';
import { CommentItem } from '../restaurant/CommentItem';
import type { Restaurant, Profile, SharedRestaurantConfig, Rating } from '../../types';
import { JoinUsPrompt } from '../common/JoinUsPrompt';
import { RestaurantDetailSkeleton } from '../restaurant/RestaurantDetailSkeleton';
import { generateICS, generateGoogleCalendarUrl, downloadICS } from '../../utils/calendarUtils';

interface RestaurantDetailViewProps {
    restaurant?: Restaurant;
    currentUser: Profile | null;
    onBack?: () => void;
    viewConfig?: SharedRestaurantConfig;
}

export function RestaurantDetailView({ restaurant: initialRestaurant, currentUser, onBack, viewConfig }: RestaurantDetailViewProps) {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { openSignIn } = useClerk();

    const [restaurant, setRestaurant] = useState<Restaurant | null>(initialRestaurant || null);
    const [fetchingRestaurant, setFetchingRestaurant] = useState(!initialRestaurant);

    const { ratings, photos, profiles, comments, favoriteUserIds, refresh, addComment } = useRestaurantDetails(
        restaurant?.id || id,
        currentUser?.pair_id || undefined
    );

    const [ratingDrawerOpen, setRatingDrawerOpen] = useState(false);
    const [editRestaurantDrawerOpen, setEditRestaurantDrawerOpen] = useState(false);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentLightboxIndex, setCurrentLightboxIndex] = useState(0);
    const heroScrollRef = useRef<HTMLDivElement>(null);
    const [heroIndex, setHeroIndex] = useState(0);
    const [isScrolled, setIsScrolled] = useState(false);
    const [showScores, setShowScores] = useState(false);

    const handleMainScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setIsScrolled(e.currentTarget.scrollTop > 50);
    };

    // Wishlist State
    const [addingToWishlist, setAddingToWishlist] = useState(false);
    const [addedToWishlist, setAddedToWishlist] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);

    // Plan Date State
    const [plannedDate, setPlannedDate] = useState('');
    const [savingDate, setSavingDate] = useState(false);

    // Visit Date State
    const [visitDate, setVisitDate] = useState('');
    const [savingVisitDate, setSavingVisitDate] = useState(false);

    useEffect(() => {
        if (restaurant?.planned_date) {
            setPlannedDate(restaurant.planned_date);
        }
        if (restaurant?.visit_date) {
            setVisitDate(restaurant.visit_date.split('T')[0]);
        }
    }, [restaurant?.planned_date, restaurant?.visit_date]);

    // Fetch restaurant if missing (deep link case)
    useEffect(() => {
        if (!restaurant && id) {
            const fetchRest = async () => {
                setFetchingRestaurant(true);
                const { data, error } = await supabase
                    .from('restaurants')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (!error && data) {
                    setRestaurant(data as Restaurant);
                }
                setFetchingRestaurant(false);
            };
            fetchRest();
        }
    }, [id, restaurant]);

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
        if (!currentUser) {
            openSignIn();
            return;
        }
        if (!restaurant) return;

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
        if (!file || !restaurant) return;

        setUploading(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${restaurant.id}-${Math.random()}.${fileExt}`;
        const filePath = `photos/${fileName}`;

        // Compress image before upload
        const compressedBlob = await compressImage(file, 1200, 0.7);
        const fileToUpload = new File([compressedBlob], fileName, { type: 'image/jpeg' });

        const { error: uploadError } = await supabase.storage
            .from('restaurant-photos')
            .upload(filePath, fileToUpload, {
                cacheControl: '31536000',
                upsert: false
            });

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

    const handleMarkAsVisited = async () => {
        if (!restaurant) return;

        const { error } = await supabase
            .from('restaurants')
            .update({
                visit_status: 'visited',
                visit_date: new Date().toISOString()
            })
            .eq('id', restaurant.id);

        if (!error) {
            setRestaurant(prev => prev ? ({ ...prev, visit_status: 'visited', visit_date: new Date().toISOString() }) : null);
            // Optionally open rate drawer immediately?
            // setRatingDrawerOpen(true);
        }
    };

    const handleAddToWishlist = async () => {
        if (!currentUser) {
            openSignIn();
            return;
        }
        if (!restaurant) return;
        setAddingToWishlist(true);

        try {
            const { error } = await supabase.from('restaurants').insert({
                pair_id: currentUser.pair_id,
                name: restaurant.name,
                address: restaurant.address,
                cuisine_type: restaurant.cuisine_type,
                price_range: restaurant.price_range,
                lat: restaurant.lat,
                lng: restaurant.lng,
                visit_status: 'wishlist',
                // We don't copy photos/ratings/comments as this is a fresh start for the pair
            });

            if (!error) {
                setAddedToWishlist(true);
                setTimeout(() => {
                    navigate('/'); // Navigate to feed (where wishlist tab will be)
                }, 1500);
            } else {
                console.error('Error adding to wishlist:', error);
            }
        } catch (e) {
            console.error('Error:', e);
        } finally {
            setAddingToWishlist(false);
        }
    };

    const handleSavePlannedDate = async () => {
        if (!restaurant || !plannedDate) return;
        setSavingDate(true);
        const { error } = await supabase
            .from('restaurants')
            .update({ planned_date: plannedDate })
            .eq('id', restaurant.id);

        if (!error) {
            setRestaurant(prev => prev ? ({ ...prev, planned_date: plannedDate }) : null);
        } else {
            console.error('Error saving planned date:', error);
        }
        setSavingDate(false);
    };

    const handleSaveVisitDate = async () => {
        if (!restaurant || !visitDate) return;
        setSavingVisitDate(true);
        const { error } = await supabase
            .from('restaurants')
            .update({ visit_date: visitDate })
            .eq('id', restaurant.id);

        if (!error) {
            setRestaurant(prev => prev ? ({ ...prev, visit_date: visitDate }) : null);
        } else {
            console.error('Error saving visit date:', error);
        }
        setSavingVisitDate(false);
    };

    const handleAddToGoogleCalendar = () => {
        if (!restaurant || !restaurant.planned_date) return;
        const address = restaurant.address || `${restaurant.lat},${restaurant.lng}`;
        const url = generateGoogleCalendarUrl(
            t('calendar.eventTitle', { name: restaurant.name }),
            restaurant.planned_date,
            address,
            t('calendar.eventDescription', { name: restaurant.name })
        );
        window.open(url, '_blank');
    };

    const handleAddToAppleCalendar = () => {
        if (!restaurant || !restaurant.planned_date) return;
        const address = restaurant.address || `${restaurant.lat},${restaurant.lng}`;
        const icsContent = generateICS(
            t('calendar.eventTitle', { name: restaurant.name }),
            restaurant.planned_date,
            address,
            t('calendar.eventDescription', { name: restaurant.name })
        );
        downloadICS(icsContent, `foodiepair-${restaurant.name.replace(/\s+/g, '-').toLowerCase()}`);
    };

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    }

    if (fetchingRestaurant) {
        return <RestaurantDetailSkeleton />;
    }

    if (!restaurant) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-white p-6 text-center">
                <p className="text-slate-500 mb-4">{t('restaurant.notFound')}</p>
                <Button onClick={() => navigate('/')} className="bg-pastel-peach text-slate-800 rounded-full px-6">
                    {t('restaurant.backToFeed')}
                </Button>
            </div>
        );
    }

    const myRating = ratings.find(r => r.user_id === currentUser?.id);
    const partnerRating = ratings.find(r => r.user_id !== currentUser?.id);
    const partnerProfile = partnerRating ? profiles[partnerRating.user_id] : null;

    const avgScore = ratings.length > 0
        ? ratings.reduce((acc, r) => acc + (r.food_score + r.service_score + r.vibe_score + r.price_quality_score) / 4, 0) / ratings.length
        : undefined;

    // Get favorite profiles
    const favoriteProfiles = (favoriteUserIds || []).map(id => profiles[id]).filter(Boolean);

    return (
        <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 h-full relative overflow-hidden">
            {/* Header */}
            <div className={`absolute top-0 left-0 right-0 p-4 pt-4 flex items-center gap-4 z-50 transition-all duration-300 ${isScrolled || photos.length === 0
                ? 'bg-white/85 dark:bg-zinc-950/85 backdrop-blur-xl border-b border-slate-100 dark:border-zinc-800 shadow-sm'
                : 'bg-gradient-to-b from-black/70 via-black/30 to-transparent'
                }`}>
                <button onClick={handleBack} className={`p-2 rounded-full transition-all shadow-sm backdrop-blur-md ${isScrolled || photos.length === 0
                    ? 'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 hover:scale-105 active:scale-95'
                    : 'bg-white/20 text-white hover:bg-white/30 hover:scale-105 active:scale-95'
                    }`}>
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1 overflow-hidden">
                    <h2 className={`text-xl font-bold leading-tight truncate transition-colors ${isScrolled || photos.length === 0
                        ? 'text-slate-800 dark:text-zinc-100'
                        : 'text-white drop-shadow-md'
                        }`}>{restaurant.name}</h2>
                    <div className="flex items-start gap-2 text-sm mt-0.5">
                        <p className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${isScrolled || photos.length === 0
                            ? 'text-slate-500 dark:text-zinc-400'
                            : 'text-white/90 drop-shadow-md'
                            }`}>{restaurant.cuisine_type} • {'€'.repeat(restaurant.price_range)}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {viewConfig && currentUser ? (
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={handleAddToWishlist}
                                disabled={addingToWishlist || addedToWishlist}
                                className={`rounded-full px-4 py-2 font-bold transition-all flex items-center gap-2 shadow-sm ${addedToWishlist ? 'bg-green-500 text-white' : 'bg-pastel-blue text-slate-800'
                                    }`}
                            >
                                {addedToWishlist ? (
                                    <><Check size={18} />{t('wishlist.addedToWishlist')}</>
                                ) : (
                                    <><Bookmark size={18} />{t('wishlist.addToWishlist')}</>
                                )}
                            </Button>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.href);
                                    setLinkCopied(true);
                                    setTimeout(() => setLinkCopied(false), 2000);
                                }}
                                className={`p-2 rounded-full transition-colors backdrop-blur-md ${isScrolled || photos.length === 0
                                    ? 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200'
                                    : 'bg-white/20 text-white hover:bg-white/30'
                                    }`}
                                title={t('share.createLink')}
                            >
                                {linkCopied ? <Check size={20} className="text-green-500" /> : <Share2 size={20} />}
                            </button>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={() => setShareModalOpen(true)}
                                className={`p-2 rounded-full transition-colors backdrop-blur-md ${isScrolled || photos.length === 0
                                    ? 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200'
                                    : 'bg-white/20 text-white hover:bg-white/30'
                                    }`}
                                title="Share"
                            >
                                <Share2 size={20} />
                            </button>
                            {favoriteProfiles.length > 0 && (
                                <div className="flex -space-x-2">
                                    {favoriteProfiles.map(p => (
                                        <div key={p.id} className="w-8 h-8 rounded-full border-2 border-white/50 dark:border-zinc-800 overflow-hidden shadow-sm" title={p.display_name || ''}>
                                            {p.avatar_url ? (
                                                <img src={getOptimizedImageUrl(p.avatar_url, { width: 64, height: 64 })} className="w-full h-full object-cover" loading="lazy" />
                                            ) : (
                                                <div className="w-full h-full bg-pastel-peach flex items-center justify-center text-[10px] font-bold text-slate-700">{p.display_name?.[0]}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            <button
                                onClick={handleToggleFavorite}
                                className={`p-2 rounded-full transition-colors backdrop-blur-md ${isScrolled || photos.length === 0
                                    ? (isFavorite ? 'bg-red-50 text-red-500' : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 hover:bg-slate-200 dark:hover:bg-zinc-700')
                                    : (isFavorite ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30')
                                    }`}
                            >
                                <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className={`flex-1 overflow-y-auto pb-32 relative`} onScroll={handleMainScroll}>

                {/* Hero Carousel */}
                {(photos.length > 0 && (!viewConfig || viewConfig.show_photos)) ? (
                    <div className="relative w-full h-[45vh] min-h-[350px] mb-8 group bg-slate-100 dark:bg-zinc-900">
                        <div
                            ref={heroScrollRef}
                            onScroll={handleHeroScroll}
                            className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                        >
                            {photos.map((photo, index) => (
                                <img
                                    key={index}
                                    src={getOptimizedImageUrl(photo.url, { width: 1200, height: 800 })}
                                    alt={`Hero ${index + 1}`}
                                    className="w-full h-full object-cover flex-shrink-0 snap-center cursor-pointer"
                                    onClick={() => openLightbox(index)}
                                    loading="lazy"
                                />
                            ))}
                        </div>

                        {/* Elegant bottom gradient for seamless transition to content */}
                        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white dark:from-zinc-950 to-transparent pointer-events-none" />

                        {/* Hero Controls */}
                        {photos.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); scrollToHero((heroIndex - 1 + photos.length) % photos.length); }}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 bg-black/20 hover:bg-black/40 backdrop-blur-md text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); scrollToHero((heroIndex + 1) % photos.length); }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-black/20 hover:bg-black/40 backdrop-blur-md text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <ChevronRight size={24} />
                                </button>
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 p-1.5 rounded-full bg-black/30 backdrop-blur-md">
                                    {photos.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === heroIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="pt-24" />
                )}

                <div className="px-4 space-y-8">
                    {/* Plan Visit Section (Wishlist Only) */}
                    {!viewConfig && restaurant.visit_status === 'wishlist' && (
                        <div className="bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl border border-slate-100/80 dark:border-zinc-800/60 p-5 rounded-3xl shadow-sm relative overflow-hidden">
                            <h3 className="font-bold text-slate-800 dark:text-zinc-100 mb-4 text-lg flex items-center gap-2">
                                <Calendar size={20} className="text-pastel-blue-darker" />
                                {t('restaurant.planVisit')}
                            </h3>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="date"
                                        value={plannedDate}
                                        onChange={(e) => setPlannedDate(e.target.value)}
                                        className="flex-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pastel-blue dark:text-zinc-100 min-w-0"
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                    {plannedDate !== (restaurant.planned_date || '') && (
                                        <Button
                                            onClick={handleSavePlannedDate}
                                            disabled={savingDate || !plannedDate}
                                            className="bg-pastel-blue-darker text-white rounded-xl px-4 py-3 font-semibold whitespace-nowrap"
                                        >
                                            {savingDate ? '...' : (t('common.save') || 'Save')}
                                        </Button>
                                    )}
                                </div>

                                {restaurant.planned_date && plannedDate === restaurant.planned_date && (
                                    <div className="flex gap-2 pt-2">
                                        <button
                                            onClick={handleAddToGoogleCalendar}
                                            className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 py-2 rounded-xl text-sm font-medium transition-colors"
                                        >
                                            <CalendarPlus size={16} />
                                            {t('calendar.google')}
                                        </button>
                                        <button
                                            onClick={handleAddToAppleCalendar}
                                            className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 py-2 rounded-xl text-sm font-medium transition-colors"
                                        >
                                            <Download size={16} />
                                            {t('calendar.apple')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Visit History Section (Visited Only) */}
                    {!viewConfig && restaurant.visit_status === 'visited' && (
                        <div className="bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl border border-slate-100/80 dark:border-zinc-800/60 p-5 rounded-3xl shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-pastel-mint/10 dark:bg-emerald-500/5 rounded-full -translate-y-16 translate-x-16 blur-3xl pointer-events-none" />
                            <h3 className="font-bold text-slate-800 dark:text-zinc-100 mb-1 text-lg flex items-center gap-2">
                                <Check size={20} className="text-emerald-500" />
                                {t('restaurant.visitDate')}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4 font-medium italic opacity-80">
                                {t('restaurant.visitDateHint')}
                            </p>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                <div className="relative flex-1">
                                    <input
                                        type="date"
                                        value={visitDate}
                                        onChange={(e) => setVisitDate(e.target.value)}
                                        className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 dark:text-zinc-100 transition-all appearance-none"
                                        max={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                                {visitDate !== (restaurant.visit_date?.split('T')[0] || '') && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="w-full sm:w-auto"
                                    >
                                        <Button
                                            onClick={handleSaveVisitDate}
                                            disabled={savingVisitDate || !visitDate}
                                            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-6 py-3 font-bold shadow-sm flex items-center gap-2 min-w-[100px] justify-center"
                                        >
                                            {savingVisitDate ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t('common.save')}
                                        </Button>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Comparative Ratings */}
                    {(!viewConfig || viewConfig.show_ratings) && restaurant.visit_status !== 'wishlist' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl border border-slate-100/80 dark:border-zinc-800/60 p-6 rounded-3xl shadow-sm overflow-hidden"
                        >
                            <h3 className="font-extrabold text-slate-800 dark:text-zinc-100 mb-6 text-xl tracking-tight flex items-center gap-2">
                                {t('stats.averageScore')}
                            </h3>

                            <div
                                className="flex justify-center items-start gap-4 mb-8 cursor-pointer group"
                                onClick={() => setShowScores(!showScores)}
                            >
                                {/* Me */}
                                <motion.div whileHover={{ scale: 1.05 }} className="flex flex-col items-center flex-1">
                                    <div className="w-14 h-14 rounded-full bg-pastel-blue-darker flex items-center justify-center text-white font-bold text-xl mb-3 shadow-[0_4px_14px_rgba(0,0,0,0.15)] ring-4 ring-white/50 dark:ring-zinc-900/50">
                                        {myRating ? ((myRating.food_score + myRating.service_score + myRating.vibe_score + myRating.price_quality_score) / 4).toFixed(1) : '-'}
                                        {showScores && myRating && <span className="text-[10px] ml-0.5 opacity-70">/5</span>}
                                    </div>
                                    <span className="text-xs font-bold text-slate-600 dark:text-zinc-300 tracking-wide uppercase text-center">{currentUser?.display_name || 'Me'}</span>
                                </motion.div>

                                {/* VS logo */}
                                <div className="mt-3 shrink-0 w-8 h-8 rounded-full bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center z-20 text-[10px] font-black italic text-slate-400 dark:text-zinc-500 ring-1 ring-slate-100 dark:ring-zinc-700 group-hover:bg-slate-50 transition-colors">
                                    VS
                                </div>

                                {/* Partner */}
                                <motion.div whileHover={{ scale: 1.05 }} className="flex flex-col items-center flex-1">
                                    <div className={`relative w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl mb-3 shadow-[0_4px_14px_rgba(0,0,0,0.15)] ring-4 ring-white/50 dark:ring-zinc-900/50 transition-all duration-700 ${partnerRating ? 'bg-pastel-peach !text-slate-800' : 'bg-slate-200 dark:bg-zinc-700 text-slate-400'}`}>
                                        <motion.div
                                            animate={{
                                                filter: !myRating && partnerRating ? 'blur(4px)' : 'blur(0px)',
                                                scale: !myRating && partnerRating ? 0.9 : 1
                                            }}
                                            className="select-none pointer-events-none flex items-baseline"
                                        >
                                            {partnerRating ? ((partnerRating.food_score + partnerRating.service_score + partnerRating.vibe_score + partnerRating.price_quality_score) / 4).toFixed(1) : '?'}
                                            {showScores && partnerRating && myRating && <span className="text-[10px] ml-0.5 opacity-70">/5</span>}
                                        </motion.div>
                                        {!myRating && partnerRating && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-xl text-slate-800 font-black drop-shadow-md">?</span>
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-xs font-bold text-slate-600 dark:text-zinc-300 tracking-wide uppercase text-center">{partnerProfile?.display_name || t('restaurant.partner')}</span>
                                </motion.div>
                            </div>

                            <AnimatePresence>
                                {!myRating && partnerRating && (
                                    <motion.p
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="text-xs text-center text-amber-500 font-bold uppercase tracking-widest mb-6 animate-pulse"
                                    >
                                        {t('restaurant.rateToSeePartnerScore') || 'Rate to reveal partner\'s score!'}
                                    </motion.p>
                                )}
                            </AnimatePresence>

                            <div className="space-y-4">
                                {[
                                    { label: t('restaurant.food'), key: 'food_score' },
                                    { label: t('restaurant.service'), key: 'service_score' },
                                    { label: t('restaurant.vibe'), key: 'vibe_score' },
                                    { label: t('restaurant.priceQuality'), key: 'price_quality_score' }
                                ].map((cat) => (
                                    <div key={cat.key} className="flex flex-col gap-1.5 cursor-pointer group" onClick={() => setShowScores(!showScores)}>
                                        <div className="flex justify-between items-end relative">
                                            {showScores && myRating && (
                                                <span className="text-[10px] font-bold text-pastel-blue-darker w-6 leading-none">
                                                    {(myRating[cat.key as keyof Rating] as number).toFixed(1)}
                                                </span>
                                            )}
                                            {!showScores && <span className="w-6" />}

                                            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 tracking-wider uppercase text-center flex-1">{cat.label}</span>

                                            {showScores && partnerRating && myRating && (
                                                <span className="text-[10px] font-bold text-orange-400 w-6 text-right leading-none">
                                                    {(partnerRating[cat.key as keyof Rating] as number).toFixed(1)}
                                                </span>
                                            )}
                                            {!showScores && <span className="w-6" />}
                                        </div>
                                        <div className="w-full h-3 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden flex shadow-inner relative">
                                            {/* Center divider */}
                                            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/50 dark:bg-zinc-700/50 z-10" />

                                            <div className="flex-1 flex justify-end">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${myRating ? ((myRating[cat.key as keyof Rating] as number) / 5) * 100 : 0}%` }}
                                                    transition={{ type: "spring", damping: 20, stiffness: 100 }}
                                                    className="h-full bg-pastel-blue-darker opacity-90"
                                                />
                                            </div>
                                            <div className="flex-1 flex justify-start">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{
                                                        width: `${partnerRating ? ((partnerRating[cat.key as keyof Rating] as number) / 5) * 100 : 0}%`,
                                                        filter: !myRating ? 'blur(1px)' : 'blur(0px)'
                                                    }}
                                                    transition={{ type: "spring", damping: 20, stiffness: 100, delay: 0.1 }}
                                                    className="h-full bg-pastel-peach opacity-90"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Comments Section */}
                    {(!viewConfig || viewConfig.show_comments) && (
                        <div className="bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl border border-slate-100/80 dark:border-zinc-800/60 p-5 rounded-3xl shadow-sm relative overflow-hidden">
                            <h3 className="font-extrabold text-slate-800 dark:text-zinc-100 mb-4 text-xl tracking-tight">{t('restaurant.chat')}</h3>

                            <div className={`space-y-4 mb-4 max-h-60 overflow-y-auto pr-2 ${!currentUser ? 'blur-sm select-none' : ''}`}>
                                {(comments || []).map((comment) => {
                                    const isMe = comment.user_id === currentUser?.id;
                                    const profile = profiles[comment.user_id];
                                    return (
                                        <CommentItem
                                            key={comment.id}
                                            comment={comment}
                                            isMe={isMe}
                                            profile={profile}
                                        />
                                    );
                                })}
                                {(!comments || comments.length === 0) && (
                                    <div className="text-center text-slate-400 text-xs py-4">
                                        {t('restaurant.noComments')}
                                    </div>
                                )}
                            </div>

                            {!currentUser && (
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/30 backdrop-blur-[1px]">
                                    <Button
                                        onClick={() => openSignIn()}
                                        className="bg-slate-800 text-white rounded-full px-6 py-2 font-bold shadow-lg hover:bg-slate-700 transition-colors"
                                    >
                                        {t('nav.loginToView')}
                                    </Button>
                                </div>
                            )}

                            {currentUser && (!viewConfig || viewConfig.allow_comments) && (
                                <form onSubmit={handleSendComment} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder={t('restaurant.addCommentPlaceholder')}
                                        className="flex-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-pastel-blue dark:text-zinc-100"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newComment.trim()}
                                        className="bg-pastel-blue-darker text-white p-2 rounded-xl disabled:opacity-50"
                                    >
                                        <Send size={18} />
                                    </button>
                                </form>
                            )}
                        </div>
                    )}

                    {/* Map Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-4 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl border border-slate-100/80 dark:border-zinc-800/60 p-5 rounded-3xl shadow-sm"
                    >
                        <div className="flex items-start gap-3 text-slate-600 dark:text-zinc-300 text-sm">
                            <div className="p-2.5 bg-pastel-blue/20 dark:bg-pastel-blue/10 rounded-full text-pastel-blue-darker dark:text-pastel-blue shadow-sm">
                                <MapPin size={18} />
                            </div>
                            <span className="flex-1 font-medium leading-relaxed mt-1">{restaurant.address}</span>
                            {!viewConfig && (
                                <button
                                    onClick={() => setEditRestaurantDrawerOpen(true)}
                                    className="p-2 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-full text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors shadow-sm"
                                    title={t('restaurant.editDetails')}
                                >
                                    <Pencil size={14} />
                                </button>
                            )}
                        </div>
                        <div className="h-56 rounded-2xl overflow-hidden shadow-inner border border-slate-200 dark:border-zinc-700 relative z-0">
                            <RestaurantMap restaurants={[{ ...restaurant, avg_score: avgScore }]} />
                        </div>
                    </motion.div>

                    {/* Photos */}
                    {(!viewConfig || viewConfig.show_photos) && (
                        <div>
                            <div className="flex justify-between items-end mb-4">
                                <h3 className="font-extrabold text-slate-800 dark:text-zinc-100 text-xl tracking-tight">{t('restaurant.photos') || 'Photos'}</h3>
                                {(!viewConfig || viewConfig.allow_photos) && (
                                    <div className="flex items-center gap-3">
                                        {uploading && (
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-pastel-peach-dark animate-pulse">
                                                <Loader2 size={12} className="animate-spin" />
                                                <span>{t('common.uploading') || 'UPLOADING...'}</span>
                                            </div>
                                        )}
                                        <label className={`text-xs font-bold text-pastel-blue-darker cursor-pointer hover:underline flex items-center gap-1 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <Camera size={14} />
                                            {t('restaurant.addPhoto')}
                                            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} />
                                        </label>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {photos.map((p, index) => (
                                    <div key={p.id} className="aspect-square rounded-2xl overflow-hidden shadow-sm relative group bg-slate-100 cursor-pointer" onClick={() => openLightbox(index)}>
                                        <img
                                            src={getOptimizedImageUrl(p.url, { width: 400, height: 400 })}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                        {(!viewConfig || viewConfig.allow_photos) && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeletePhoto(p.id); }}
                                                className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {photos.length === 0 && (
                                    <div className="col-span-2 aspect-video bg-slate-50 dark:bg-zinc-900/30 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl flex flex-col items-center justify-center text-slate-300 dark:text-zinc-700 gap-2">
                                        <Camera size={24} />
                                        <span className="text-xs font-medium">No photos yet</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* Bottom Action */}
            {!viewConfig && currentUser && (
                <div className="absolute bottom-6 left-6 right-6 z-20">
                    <div className="backdrop-blur-2xl bg-white/70 dark:bg-zinc-900/80 p-2.5 rounded-[2rem] border border-white/50 dark:border-zinc-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
                        <Button
                            className={`w-full rounded-[1.5rem] py-4 font-extrabold text-lg shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-300 ${restaurant.visit_status === 'wishlist'
                                ? 'bg-slate-800 text-white hover:bg-slate-700'
                                : 'bg-gradient-to-r from-pastel-mint to-emerald-300 dark:from-teal-500 dark:to-emerald-400 text-slate-900 border border-white/20'
                                }`}
                            onClick={() => {
                                if (restaurant.visit_status === 'wishlist') {
                                    handleMarkAsVisited();
                                } else {
                                    setRatingDrawerOpen(true);
                                }
                            }}
                        >
                            {restaurant.visit_status === 'wishlist'
                                ? t('wishlist.markAsVisited')
                                : (myRating ? t('restaurant.updateRating') : t('restaurant.rateNow'))
                            }
                        </Button>
                    </div>
                </div>
            )}

            {!currentUser && <JoinUsPrompt />}

            <RateRestaurantDrawer
                isOpen={ratingDrawerOpen}
                onClose={() => setRatingDrawerOpen(false)}
                restaurantId={restaurant.id}
                profile={currentUser}
                onSuccess={refresh}
            />

            <EditRestaurantDrawer
                isOpen={editRestaurantDrawerOpen}
                onClose={() => setEditRestaurantDrawerOpen(false)}
                restaurant={restaurant}
                onSuccess={() => { refresh(); handleBack(); }}
            />

            <ShareConfigurationModal
                isOpen={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
                restaurant={restaurant}
                currentUser={currentUser}
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
                            src={getOptimizedImageUrl(photos[currentLightboxIndex].url, { width: 1920, quality: 90, format: 'origin' })}
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
