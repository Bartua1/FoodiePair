import { useState } from 'react';
import { ArrowLeft, MapPin, Camera, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { RateRestaurantDrawer } from '../restaurant/RateRestaurantDrawer';
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
    const { ratings, photos, profiles, refresh } = useRestaurantDetails(restaurant.id, currentUser?.pair_id || undefined);
    const [ratingDrawerOpen, setRatingDrawerOpen] = useState(false);
    const [uploading, setUploading] = useState(false);

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

    return (
        <div className="flex-1 flex flex-col bg-white h-full relative overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center gap-4 sticky top-0 bg-white z-10">
                <button onClick={onBack} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-slate-800" />
                </button>
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-800 leading-tight">{restaurant.name}</h2>
                    <p className="text-xs text-slate-500 font-medium">{restaurant.cuisine_type} • {'€'.repeat(restaurant.price_range)}</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-8 pb-32">
                {/* Map Section */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <MapPin size={16} />
                        <span>{restaurant.address}</span>
                    </div>
                    <div className="h-48 rounded-2xl overflow-hidden border border-slate-100 shadow-sm relative">
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <span className="text-xs font-bold uppercase tracking-widest">Map View</span>
                        </div>
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
                            <span className="text-xs font-bold text-slate-600 text-center line-clamp-1">{partnerProfile?.display_name || 'Partner'}</span>
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
                        {photos.map(p => (
                            <div key={p.id} className="aspect-square rounded-xl overflow-hidden relative group bg-slate-100">
                                <img src={p.url} className="w-full h-full object-cover" loading="lazy" />
                                <button
                                    onClick={() => handleDeletePhoto(p.id)}
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
        </div>
    );
}
