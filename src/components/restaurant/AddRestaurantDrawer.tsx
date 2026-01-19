import { useState } from 'react';
import { X, MapPin, Utensils, Star, Camera, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { geocodeAddress } from '../../lib/geocoding';
import { supabase } from '../../lib/supabase';
import type { Profile, Restaurant } from '../../types';

interface AddRestaurantDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    profile: Profile | null;
    onSuccess: () => void;
}

export function AddRestaurantDrawer({ isOpen, onClose, profile, onSuccess }: AddRestaurantDrawerProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

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
                is_favorite: formData.isFavorite,
                visit_date: new Date().toISOString()
            })
            .select()
            .single();

        const restaurant = restaurantData as Restaurant | null;

        if (restaurant && !resError) {
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
                        <h2 className="text-xl font-bold text-slate-800">New Spot</h2>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Step {step} of 3</p>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <div className="min-h-[300px]">
                    {step === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-700 ml-1">Restaurant Name</label>
                                <div className="relative">
                                    <Utensils className="absolute left-4 top-1/2 -translate-y-1/2 text-pastel-mint" size={18} />
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border-none rounded-2xl p-4 pl-12 focus:ring-2 focus:ring-pastel-mint outline-none"
                                        placeholder="e.g. Pasta Kingdom"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-700 ml-1">Location</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-pastel-blue" size={18} />
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border-none rounded-2xl p-4 pl-12 focus:ring-2 focus:ring-pastel-blue outline-none"
                                        placeholder="Address or neighborhood"
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Cuisine</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-pastel-peach outline-none"
                                        placeholder="Italian, Sushi..."
                                        value={formData.cuisine}
                                        onChange={e => setFormData({ ...formData, cuisine: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Price</label>
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
                                { label: 'Food', key: 'foodScore' },
                                { label: 'Service', key: 'serviceScore' },
                                { label: 'Vibe', key: 'vibeScore' },
                                { label: 'Price/Quality', key: 'priceQualityScore' }
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
                            <div className="aspect-square w-full bg-slate-50 rounded-3xl border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300 hover:border-pastel-peach hover:text-pastel-peach transition-all cursor-pointer group">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                    <Camera size={32} />
                                </div>
                                <span className="font-bold text-sm">Add a photo of the food!</span>
                                <span className="text-[10px] uppercase tracking-widest mt-1">Optional but recommended</span>
                            </div>

                            <button
                                onClick={() => setFormData({ ...formData, isFavorite: !formData.isFavorite })}
                                className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${formData.isFavorite ? 'bg-pastel-pink/10 border-pastel-pink text-slate-800' : 'bg-white border-slate-100 text-slate-400'}`}
                            >
                                <span className="font-bold">Mark as absolute favorite?</span>
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
                            Next Step <ChevronRight size={18} />
                        </Button>
                    ) : (
                        <Button
                            className="flex-1 bg-pastel-mint text-slate-800 rounded-2xl py-4 font-bold flex items-center justify-center gap-2"
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'Save Restaurant'}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
