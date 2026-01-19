import { useState, useRef } from 'react';
import { X, MapPin, Utensils, Star, Camera, ChevronRight, ChevronLeft, Loader2, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { geocodeAddress } from '../../lib/geocoding';
import { supabase } from '../../lib/supabase';
import type { Profile, Restaurant } from '../../types';
import { useTranslation } from 'react-i18next';

interface AddRestaurantDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    profile: Profile | null;
    onSuccess: () => void;
}

export function AddRestaurantDrawer({ isOpen, onClose, profile, onSuccess }: AddRestaurantDrawerProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Image state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        cuisine: '',
        priceRange: 2,
        isFavorite: false,
        foodScore: 4,
        serviceScore: 4,
        vibeScore: 4,
        priceQualityScore: 4,
        comment: ''
    });

    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    const handlePhotoClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removePhoto = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async () => {
        if (!profile?.pair_id || !profile.id) return;
        setLoading(true);

        // 1. Geocode address
        let lat = 0, lng = 0;
        if (formData.address) {
            const coords = await geocodeAddress(formData.address);
            if (coords) {
                lat = coords.lat;
                lng = coords.lng;
            }
        }

        // 2. Insert Restaurant
        const { data: restaurantData, error: resError } = await supabase
            .from('restaurants')
            .insert({
                pair_id: profile.pair_id,
                name: formData.name,
                address: formData.address,
                cuisine_type: formData.cuisine,
                price_range: formData.priceRange,
                lat,
                lng,
                // is_favorite: deprecated, moved to separate table
                visit_date: new Date().toISOString(),
                created_by: profile.id
            })
            .select()
            .single();

        const restaurant = restaurantData as Restaurant | null;

        if (restaurant && !resError) {
            // 2.1 Insert Favorite if selected
            if (formData.isFavorite) {
                await supabase.from('restaurant_favorites').insert({
                    user_id: profile.id,
                    restaurant_id: restaurant.id
                });
            }

            // 3. Insert Rating
            await supabase.from('ratings').insert({
                restaurant_id: restaurant.id,
                user_id: profile.id,
                food_score: formData.foodScore,
                service_score: formData.serviceScore,
                vibe_score: formData.vibeScore,
                price_quality_score: formData.priceQualityScore,
                favorite_dish: ''
            });

            // Added Comment insertion
            if (formData.comment.trim()) {
                await supabase.from('comments').insert({
                    restaurant_id: restaurant.id,
                    user_id: profile.id,
                    content: formData.comment
                });
            }

            // 4. Upload photo if selected
            if (selectedFile) {
                setUploading(true);
                const fileExt = selectedFile.name.split('.').pop();
                const fileName = `${restaurant.id}-${Math.random()}.${fileExt}`;
                const filePath = `photos/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('restaurant-photos')
                    .upload(filePath, selectedFile);

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('restaurant-photos')
                        .getPublicUrl(filePath);

                    await supabase.from('photos').insert({
                        restaurant_id: restaurant.id,
                        url: publicUrl
                    });
                }
                setUploading(false);
            }

            onSuccess();
            handleClose();
        }
        setLoading(false);
    };

    const handleClose = () => {
        setStep(1);
        setFormData({
            name: '', address: '', cuisine: '', priceRange: 2, isFavorite: false,
            foodScore: 4, serviceScore: 4, vibeScore: 4, priceQualityScore: 4, comment: ''
        });
        setSelectedFile(null);
        setImagePreview(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-end justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={handleClose} />

            {/* Drawer */}
            <div className="relative bg-white w-full max-w-lg rounded-t-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{t('restaurant.newSpot')}</h2>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">{t('restaurant.step', { current: step, total: 3 })}</p>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <div className="min-h-[300px]">
                    {step === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-700 ml-1">{t('restaurant.name')}</label>
                                <div className="relative">
                                    <Utensils className="absolute left-4 top-1/2 -translate-y-1/2 text-pastel-mint" size={18} />
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border-none rounded-2xl p-4 pl-12 focus:ring-2 focus:ring-pastel-mint outline-none"
                                        placeholder={t('restaurant.namePlaceholder')}
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-700 ml-1">{t('restaurant.location')}</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-pastel-blue" size={18} />
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border-none rounded-2xl p-4 pl-12 focus:ring-2 focus:ring-pastel-blue outline-none"
                                        placeholder={t('restaurant.locationPlaceholder')}
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-slate-700 ml-1">{t('restaurant.cuisine')}</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-pastel-peach outline-none"
                                        placeholder={t('restaurant.cuisinePlaceholder')}
                                        value={formData.cuisine}
                                        onChange={e => setFormData({ ...formData, cuisine: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-slate-700 ml-1">{t('restaurant.price')}</label>
                                    <div className="flex bg-slate-50 rounded-2xl p-1">
                                        {[1, 2, 3].map(p => (
                                            <button
                                                key={p}
                                                onClick={() => setFormData({ ...formData, priceRange: p })}
                                                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${formData.priceRange === p ? 'bg-white shadow-sm text-slate-800' : 'text-slate-300'}`}
                                            >
                                                {'€'.repeat(p)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            {[
                                { label: t('restaurant.food'), key: 'foodScore' },
                                { label: t('restaurant.service'), key: 'serviceScore' },
                                { label: t('restaurant.vibe'), key: 'vibeScore' },
                                { label: t('restaurant.priceQuality'), key: 'priceQualityScore' }
                            ].map((item) => (
                                <div key={item.key} className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-sm font-bold text-slate-700">{item.label}</label>
                                        <span className="text-sm font-black text-pastel-mint bg-pastel-mint/10 px-2 py-0.5 rounded-lg">{formData[item.key as keyof typeof formData]}</span>
                                    </div>
                                    <input
                                        type="range" min="1" max="5" step="0.5"
                                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-pastel-mint"
                                        value={formData[item.key as keyof typeof formData] as number}
                                        onChange={e => setFormData({ ...formData, [item.key]: parseFloat(e.target.value) })}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />
                            <div
                                onClick={handlePhotoClick}
                                className={`aspect-square w-full rounded-3xl border-4 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer group overflow-hidden relative ${imagePreview ? 'border-pastel-mint' : 'bg-slate-50 border-slate-100 hover:border-pastel-peach text-slate-300 hover:text-pastel-peach'}`}
                            >
                                {imagePreview ? (
                                    <>
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera size={32} className="text-white" />
                                        </div>
                                        <button
                                            onClick={removePhoto}
                                            className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md text-red-500 hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                            <Camera size={32} />
                                        </div>
                                        <span className="font-bold text-sm">{t('restaurant.addPhoto')}</span>
                                        <span className="text-[10px] uppercase tracking-widest mt-1">{t('restaurant.optional')}</span>
                                    </>
                                )}
                            </div>

                            <button
                                onClick={() => setFormData({ ...formData, isFavorite: !formData.isFavorite })}
                                className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${formData.isFavorite ? 'bg-pastel-pink/10 border-pastel-pink text-slate-800' : 'bg-white border-slate-100 text-slate-400'}`}
                            >
                                <span className="font-bold">{t('restaurant.favorite')}</span>
                                <Star fill={formData.isFavorite ? '#E91E63' : 'none'} color={formData.isFavorite ? '#E91E63' : 'currentColor'} />
                            </button>
                        </div>
                    )}
                </div>

                <div className="mt-8 flex gap-3">
                    {step > 1 && (
                        <Button
                            variant="secondary"
                            className="px-6 rounded-2xl"
                            onClick={handleBack}
                        >
                            <ChevronLeft size={20} />
                        </Button>
                    )}
                    {step < 3 ? (
                        <Button
                            className="flex-1 bg-slate-800 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2"
                            onClick={handleNext}
                            disabled={!formData.name}
                        >
                            {t('restaurant.next')} <ChevronRight size={18} />
                        </Button>
                    ) : (
                        <Button
                            className="flex-1 bg-pastel-mint text-slate-800 rounded-2xl py-4 font-bold flex items-center justify-center gap-2"
                            onClick={handleSubmit}
                            disabled={loading || uploading}
                        >
                            {(loading || uploading) ? <Loader2 className="animate-spin" /> : t('restaurant.save')}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
