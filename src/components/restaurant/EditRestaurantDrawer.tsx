import { useState, useEffect } from 'react';
import { X, MapPin, Search, Loader2, Save, Utensils } from 'lucide-react';
import { Button } from '../ui/Button';
import { geocodeAddress } from '../../lib/geocoding';
import { supabase } from '../../lib/supabase';
import { RestaurantMap } from '../map/RestaurantMap';
import type { Restaurant } from '../../types';
import { useTranslation } from 'react-i18next';

interface EditRestaurantDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    restaurant: Restaurant;
    onSuccess: () => void;
}

export function EditRestaurantDrawer({ isOpen, onClose, restaurant, onSuccess }: EditRestaurantDrawerProps) {
    const { t } = useTranslation();
    const [name, setName] = useState(restaurant.name || '');
    const [address, setAddress] = useState(restaurant.address || '');
    const [previewLocation, setPreviewLocation] = useState<{ lat: number, lng: number } | null>({ lat: restaurant.lat, lng: restaurant.lng });
    const [isSearching, setIsSearching] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setName(restaurant.name || '');
            setAddress(restaurant.address || '');
            setPreviewLocation({ lat: restaurant.lat, lng: restaurant.lng });
            setSearchError(null);
        }
    }, [isOpen, restaurant]);

    const handleSearch = async () => {
        if (!address.trim()) return;
        setIsSearching(true);
        setSearchError(null);
        try {
            const coords = await geocodeAddress(address);
            if (coords) {
                setPreviewLocation(coords);
            } else {
                setSearchError(t('restaurant.addressNotFound'));
            }
        } catch (error) {
            setSearchError(t('restaurant.searchError'));
        } finally {
            setIsSearching(false);
        }
    };

    const handleSave = async () => {
        if (!previewLocation || !name.trim()) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('restaurants')
                .update({
                    name: name,
                    address: address,
                    lat: previewLocation.lat,
                    lng: previewLocation.lng
                })
                .eq('id', restaurant.id);

            if (error) throw error;
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error updating restaurant:', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    // Create a temporary restaurant object for the map preview
    const previewRestaurant: Restaurant = {
        ...restaurant,
        name: name,
        address: address,
        lat: previewLocation?.lat || restaurant.lat,
        lng: previewLocation?.lng || restaurant.lng
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-end justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

            {/* Drawer */}
            <div className="relative bg-white w-full max-w-lg rounded-t-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800">{t('restaurant.editDetails')}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                    {/* Name Input */}
                    <div className="space-y-1">
                        <label className="text-sm font-bold text-slate-700 ml-1">{t('restaurant.name')}</label>
                        <div className="relative">
                            <Utensils className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                className="w-full bg-slate-50 border-none rounded-2xl p-4 pl-12 focus:ring-2 focus:ring-pastel-blue outline-none"
                                placeholder={t('restaurant.namePlaceholder')}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Search Input */}
                    <div className="space-y-1">
                        <label className="text-sm font-bold text-slate-700 ml-1">{t('restaurant.location')}</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border-none rounded-2xl p-4 pl-12 focus:ring-2 focus:ring-pastel-blue outline-none"
                                    placeholder={t('restaurant.locationPlaceholder')}
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <Button
                                onClick={handleSearch}
                                disabled={isSearching || !address.trim()}
                                className="bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-2xl px-4"
                            >
                                {isSearching ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                            </Button>
                        </div>
                        {searchError && (
                            <p className="text-xs text-red-500 font-bold ml-1">{searchError}</p>
                        )}
                    </div>

                    {/* Map Preview */}
                    <div className="h-64 rounded-2xl overflow-hidden border border-slate-100 shadow-sm relative z-0">
                        {previewLocation && (
                            <RestaurantMap restaurants={[previewRestaurant]} />
                        )}
                        {!previewLocation && (
                            <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-400">
                                <p>{t('restaurant.searchToPreview')}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6">
                    <Button
                        className="w-full bg-pastel-mint text-slate-800 rounded-2xl py-4 font-bold flex items-center justify-center gap-2"
                        onClick={handleSave}
                        disabled={isSaving || !previewLocation || !name.trim()}
                    >
                        {isSaving ? <Loader2 className="animate-spin" /> : (
                            <>
                                <Save size={18} />
                                {t('restaurant.saveChanges')}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
