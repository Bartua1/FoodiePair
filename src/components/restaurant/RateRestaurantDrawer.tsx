import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types';
import { useTranslation } from 'react-i18next';

interface RateRestaurantDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    restaurantId: string;
    profile: Profile | null;
    onSuccess: () => void;
}

export function RateRestaurantDrawer({ isOpen, onClose, restaurantId, profile, onSuccess }: RateRestaurantDrawerProps) {
    const [loading, setLoading] = useState(false);
    const { t } = useTranslation();

    // Rating State
    const [scores, setScores] = useState({
        foodScore: 4,
        serviceScore: 4,
        vibeScore: 4,
        priceQualityScore: 4
    });

    const handleSubmit = async () => {
        if (!profile?.id) return;
        setLoading(true);

        const { error } = await supabase.from('ratings').insert({
            restaurant_id: restaurantId,
            user_id: profile.id,
            food_score: scores.foodScore,
            service_score: scores.serviceScore,
            vibe_score: scores.vibeScore,
            price_quality_score: scores.priceQualityScore,
            favorite_dish: ''
        });

        if (!error) {
            onSuccess();
            onClose();
        } else {
            console.error('Error submitting rating:', error);
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-end justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

            {/* Drawer */}
            <div className="relative bg-white w-full max-w-lg rounded-t-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{t('restaurant.rateSpot')}</h2>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">{t('restaurant.addYourRating')}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <div className="space-y-6 mb-8">
                    {[
                        { label: t('restaurant.food'), key: 'foodScore' },
                        { label: t('restaurant.service'), key: 'serviceScore' },
                        { label: t('restaurant.vibe'), key: 'vibeScore' },
                        { label: t('restaurant.priceQuality'), key: 'priceQualityScore' }
                    ].map((item) => (
                        <div key={item.key} className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-sm font-bold text-slate-700">{item.label}</label>
                                <span className="text-sm font-black text-pastel-mint bg-pastel-mint/10 px-2 py-0.5 rounded-lg">
                                    {scores[item.key as keyof typeof scores]}
                                </span>
                            </div>
                            <input
                                type="range" min="1" max="5" step="0.5"
                                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-pastel-mint"
                                value={scores[item.key as keyof typeof scores]}
                                onChange={e => setScores({ ...scores, [item.key]: parseFloat(e.target.value) })}
                            />
                        </div>
                    ))}
                </div>

                <Button
                    className="w-full bg-pastel-mint text-slate-800 rounded-2xl py-4 font-bold flex items-center justify-center gap-2"
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? <Loader2 className="animate-spin" /> : t('restaurant.saveRating')}
                </Button>
            </div>
        </div>
    );
}
