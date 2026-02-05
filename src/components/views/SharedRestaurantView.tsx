import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { RestaurantDetailView } from './RestaurantDetailView';
import type { Restaurant, Profile } from '../../types';
import type { SharedRestaurant, SharedRestaurantConfig } from '../../types';

export function SharedRestaurantView({ currentUser }: { currentUser: Profile | null }) {
    const { id: sharedId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [config, setConfig] = useState<SharedRestaurantConfig | null>(null);

    useEffect(() => {
        const fetchSharedData = async () => {
            if (!sharedId) return;
            setLoading(true);

            // 1. Fetch the shared_restaurant entry
            // RLS should handle access control. If we can't select it, it means no access.
            const { data: sharedData, error: sharedError } = await supabase
                .from('shared_restaurants')
                .select('*')
                .eq('id', sharedId)
                .single();

            if (sharedError || !sharedData) {
                console.error('Error fetching shared data:', sharedError);
                setError('accessDenied');
                setLoading(false);
                return;
            }

            const shared = sharedData as SharedRestaurant;
            setConfig(shared.configuration);

            // 2. Fetch the actual restaurant data
            const { data: restData, error: restError } = await supabase
                .from('restaurants')
                .select('*')
                .eq('id', shared.restaurant_id)
                .single();

            if (restError || !restData) {
                console.error('Error fetching restaurant:', restError);
                setError('notFound');
                setLoading(false);
                return;
            }

            setRestaurant(restData as Restaurant);
            setLoading(false);
        };

        fetchSharedData();
    }, [sharedId, currentUser]); // Re-fetch if user changes (log in)

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-white">
                <Loader2 className="w-8 h-8 animate-spin text-pastel-blue" />
            </div>
        );
    }

    if (error === 'accessDenied') {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50">
                <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-400">
                    <Lock size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">{t('share.accessDenied')}</h2>
                <p className="text-slate-500 mb-6">{t('share.accessDeniedSubtitle')}</p>
                <button
                    onClick={() => navigate('/')}
                    className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
                >
                    {t('share.goHome')}
                </button>
            </div>
        );
    }

    if (!restaurant || !config) return null;

    // Apply configuration to the view
    // Since RestaurantDetailView is a complex component, we might need to pass props to hide/show stuff
    // Or we can modify RestaurantDetailView to accept a "configuration" prop override.
    // For now, let's wrap it or pass the config via a new prop if we modify RestaurantDetailView.
    // Wait, RestaurantDetailView doesn't accept config props yet.
    // I need to modify RestaurantDetailView to accept `viewConfig`.

    // Also, RestaurantDetailView uses internal hooks for comments/photos.
    // We need to ensure that if `show_comments` is false, we don't show them.
    // The easiest way is to modify RestaurantDetailView to hide sections based on props.

    return (
        <RestaurantDetailView
            restaurant={restaurant}
            currentUser={currentUser}
            onBack={() => navigate('/')}
            viewConfig={config}
        />
    );
}
