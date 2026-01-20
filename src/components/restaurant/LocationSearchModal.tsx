import { useState, useEffect } from 'react';
import { X, Search, MapPin, Loader2, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { searchLocations, type GeocodingResult } from '../../lib/geocoding';
import { Button } from '../ui/Button';

interface LocationSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (location: { address: string; lat: number; lng: number }) => void;
}

export function LocationSearchModal({ isOpen, onClose, onSelect }: LocationSearchModalProps) {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<GeocodingResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<GeocodingResult | null>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim().length > 2) {
                setLoading(true);
                const data = await searchLocations(query);
                setResults(data);
                setLoading(false);
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = (result: GeocodingResult) => {
        setSelectedLocation(result);
    };

    const handleConfirm = () => {
        if (selectedLocation) {
            onSelect({
                address: selectedLocation.display_name,
                lat: parseFloat(selectedLocation.lat),
                lng: parseFloat(selectedLocation.lon)
            });
            onClose();
        }
    };

    const handleClose = () => {
        setQuery('');
        setResults([]);
        setSelectedLocation(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2100] flex items-end justify-center sm:items-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={handleClose} />

            {/* Modal */}
            <div className="relative bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 sm:zoom-in-95 max-h-[85vh] flex flex-col">
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{t('restaurant.searchLocation')}</h2>
                        <p className="text-sm text-slate-400">{t('restaurant.searchLocationDesc', 'Search and select a location')}</p>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Search Input */}
                <div className="relative mb-4 flex-shrink-0">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        className="w-full bg-slate-50 border-none rounded-2xl p-4 pl-12 focus:ring-2 focus:ring-pastel-blue outline-none text-slate-800 placeholder:text-slate-400"
                        placeholder={t('restaurant.searchPlaceholder', 'Search address, city, place...')}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                    {loading && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <Loader2 className="animate-spin text-pastel-blue" size={18} />
                        </div>
                    )}
                </div>

                {/* Results List */}
                <div className="flex-1 overflow-y-auto min-h-[200px] -mx-2 px-2 space-y-2 mb-4">
                    {results.length === 0 && query.length > 2 && !loading && (
                        <div className="text-center py-8 text-slate-400">
                            <MapPin className="mx-auto mb-2 opacity-50" size={32} />
                            <p>{t('restaurant.noResults', 'No locations found')}</p>
                        </div>
                    )}

                    {results.map((result) => (
                        <button
                            key={result.place_id}
                            onClick={() => handleSelect(result)}
                            className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 border ${selectedLocation?.place_id === result.place_id
                                ? 'bg-pastel-blue/10 border-pastel-blue shadow-sm'
                                : 'bg-white border-transparent hover:bg-slate-50'
                                }`}
                        >
                            <MapPin
                                size={20}
                                className={`mt-0.5 flex-shrink-0 ${selectedLocation?.place_id === result.place_id ? 'text-pastel-blue' : 'text-slate-400'
                                    }`}
                            />
                            <div className="flex-1">
                                <p className={`text-sm font-medium ${selectedLocation?.place_id === result.place_id ? 'text-slate-800' : 'text-slate-700'
                                    }`}>
                                    {result.display_name.split(',')[0]}
                                </p>
                                <p className="text-xs text-slate-400 line-clamp-2">
                                    {result.display_name}
                                </p>
                            </div>
                            {selectedLocation?.place_id === result.place_id && (
                                <Check size={18} className="text-pastel-blue mt-0.5" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-slate-100 flex-shrink-0">
                    <Button
                        variant="ghost"
                        className="flex-1"
                        onClick={handleClose}
                    >
                        {t('common.cancel', 'Cancel')}
                    </Button>
                    <Button
                        className="flex-[2] bg-slate-800 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleConfirm}
                        disabled={!selectedLocation}
                    >
                        {t('common.confirm', 'Confirm Location')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
