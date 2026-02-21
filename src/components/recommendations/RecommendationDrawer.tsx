import { useState } from 'react';
import { X, Sparkles, Utensils, MapPin, ChevronRight, Loader2, Info, Globe, Plus, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { useTranslation } from 'react-i18next';
import { useRecommendations } from '../../hooks/useRecommendations';

const CUISINES = ['Sushi', 'Pizza', 'Italian', 'Mexican', 'Burger', 'Asian', 'Coffee', 'Dessert'];

interface RecommendationDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    pairId: string | null;
    profileId: string | null;
    onSelectRestaurant: (id: string) => void;
    onRefreshList?: () => void;
}

export function RecommendationDrawer({
    isOpen,
    onClose,
    pairId,
    profileId,
    onSelectRestaurant,
    onRefreshList
}: RecommendationDrawerProps) {
    const { t } = useTranslation();
    const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
    const { recommendations, loading, refresh } = useRecommendations(pairId, selectedCuisine);
    const [addingId, setAddingId] = useState<string | null>(null);
    const [addedIds, setAddedIds] = useState<string[]>([]);

    const handleQuickAdd = async (e: React.MouseEvent, rec: any) => {
        e.stopPropagation();
        if (!pairId || !profileId) return;

        setAddingId(rec.restaurant.id);
        try {
            const { error } = await supabase.from('restaurants').insert({
                pair_id: pairId,
                name: rec.restaurant.name,
                address: rec.restaurant.address,
                cuisine_type: rec.restaurant.cuisine_type,
                price_range: rec.restaurant.price_range,
                lat: rec.restaurant.lat,
                lng: rec.restaurant.lng,
                visit_status: 'wishlist',
                created_by: profileId
            });

            if (!error) {
                setAddedIds(prev => [...prev, rec.restaurant.id]);
                if (onRefreshList) onRefreshList();
            }
        } catch (err) {
            console.error('Quick add failed:', err);
        } finally {
            setAddingId(null);
        }
    };

    const renderRecommendationCard = (rec: any) => {
        const isExternal = rec.restaurant.id.startsWith('osm-');
        const isAdded = addedIds.includes(rec.restaurant.id);

        return (
            <div
                key={rec.restaurant.id}
                onClick={() => {
                    if (!isExternal) {
                        onSelectRestaurant(rec.restaurant.id);
                        onClose();
                    }
                }}
                className={`bg-slate-50 rounded-2xl p-4 transition-all border border-transparent group ${!isExternal ? 'cursor-pointer hover:bg-slate-100 hover:border-pastel-mint' : ''}`}
            >
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            {isExternal && <Globe size={14} className="text-pastel-blue" />}
                            {rec.restaurant.name}
                            {rec.restaurant.price_range && (
                                <span className="text-[10px] text-pastel-mint-dark bg-pastel-mint/20 px-1.5 py-0.5 rounded">
                                    {'€'.repeat(rec.restaurant.price_range)}
                                </span>
                            )}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                            <MapPin size={12} />
                            <span className="truncate max-w-[200px]">
                                {rec.restaurant.address || t('recommendations.addressUnknown')}
                            </span>
                            {rec.distance !== undefined && (
                                <span className="ml-auto text-pastel-blue-darker font-bold">
                                    {rec.distance.toFixed(1)}km
                                </span>
                            )}
                        </div>
                    </div>

                    {isExternal ? (
                        <button
                            onClick={(e) => handleQuickAdd(e, rec)}
                            disabled={addingId === rec.restaurant.id || isAdded}
                            className={`p-2 rounded-xl transition-all flex items-center gap-2 ${isAdded ? 'bg-pastel-mint/20 text-pastel-mint-dark' : 'bg-white shadow-sm hover:bg-pastel-peach hover:text-white'}`}
                        >
                            {addingId === rec.restaurant.id ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : isAdded ? (
                                <>
                                    <Check size={18} />
                                    {t('recommendations.added')}
                                </>
                            ) : (
                                <Plus size={18} />
                            )}
                        </button>
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:bg-pastel-mint transition-colors">
                            <ChevronRight size={18} className="text-slate-400 group-hover:text-white" />
                        </div>
                    )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/50">
                    <div className="flex flex-wrap gap-2">
                        {rec.reasons.map((reason: any, i: number) => (
                            <div
                                key={i}
                                className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-white px-2.5 py-1 rounded-full border border-slate-100 shadow-sm"
                            >
                                <Info size={10} className="text-pastel-peach-darker" />
                                {t(reason.key, reason.params) as string}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-end justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="relative bg-white w-full max-w-lg rounded-t-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Sparkles className="text-pastel-peach-darker" size={24} />
                            {t('recommendations.title')}
                        </h2>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1">
                            {t('recommendations.subtitle')}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Cuisine Picker */}
                <div className="mb-6">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('recommendations.cravingPrompt')}</p>
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        <button
                            onClick={() => setSelectedCuisine(null)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${!selectedCuisine ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                        >
                            {t('recommendations.all')}
                        </button>
                        {CUISINES.map((c) => (
                            <button
                                key={c}
                                onClick={() => setSelectedCuisine(c)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${selectedCuisine === c ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                            >
                                {t(`recommendations.cuisines.${c}`)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="min-h-[300px] mb-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-[300px] space-y-4">
                            <Loader2 className="animate-spin text-pastel-mint" size={40} />
                            <p className="text-slate-400 text-sm">{t('app.loadingData')}</p>
                        </div>
                    ) : recommendations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[300px] text-center space-y-4 px-8">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                                <Utensils className="text-slate-200" size={32} />
                            </div>
                            <div>
                                <p className="text-slate-600 font-bold">{t('recommendations.noWishlist')}</p>
                                <p className="text-slate-400 text-sm mt-1">{t('recommendations.noHistory')}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {(recommendations.filter(r => r.restaurant.id.startsWith('osm-')).length > 0) && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                                        <Globe size={14} />
                                        {t('recommendations.nearbyDiscoveries')}
                                    </div>
                                    {recommendations.filter(r => r.restaurant.id.startsWith('osm-')).map((rec) => renderRecommendationCard(rec))}
                                </div>
                            )}

                            {(recommendations.filter(r => !r.restaurant.id.startsWith('osm-')).length > 0) && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 pt-2">
                                        <Utensils size={14} />
                                        {t('recommendations.fromWishlist')}
                                    </div>
                                    {recommendations.filter(r => !r.restaurant.id.startsWith('osm-')).map((rec) => renderRecommendationCard(rec))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <Button
                    onClick={refresh}
                    className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-lg"
                    disabled={loading}
                >
                    <Sparkles size={18} />
                    {t('recommendations.getSuggestions')}
                </Button>
            </div>
        </div>
    );
}
