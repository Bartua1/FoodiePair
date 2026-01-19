import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Utensils, Award, TrendingDown } from 'lucide-react';
import type { Rating, Profile } from '../../types';
import { useTranslation } from 'react-i18next';

interface StatsData {
    user1: { name: string; avgScore: number; count: number };
    user2: { name: string; avgScore: number; count: number } | null;
}

export function PairStats({ pairId }: { pairId: string }) {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();

    useEffect(() => {
        async function fetchStats() {
            // 1. Get Pair Info (for names)
            const { data: pair } = await supabase
                .from('pairs')
                .select('user1_id, user2_id')
                .eq('id', pairId)
                .single();

            if (!pair) return;

            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, display_name')
                .in('id', [pair.user1_id, pair.user2_id].filter(Boolean));

            const getName = (id: string) => (profiles as Profile[] | null)?.find(p => p.id === id)?.display_name || 'User';

            // 2. Get All Ratings for the pair
            const { data: restaurants } = await supabase
                .from('restaurants')
                .select('id')
                .eq('pair_id', pairId);

            const restaurantIds = (restaurants as { id: string }[] | null)?.map(r => r.id) || [];

            const { data: ratingsData } = await supabase
                .from('ratings')
                .select('*')
                .in('restaurant_id', restaurantIds);

            const ratings = ratingsData as Rating[] | null;

            const calculateUserStats = (userId: string) => {
                const userRatings = ratings?.filter(r => r.user_id === userId) || [];
                if (userRatings.length === 0) return { name: getName(userId), avgScore: 0, count: 0 };

                const total = userRatings.reduce((acc, curr) => {
                    return acc + (curr.food_score + curr.service_score + curr.vibe_score + curr.price_quality_score) / 4;
                }, 0);

                return {
                    name: getName(userId),
                    avgScore: total / userRatings.length,
                    count: userRatings.length,
                };
            };

            setStats({
                user1: calculateUserStats(pair.user1_id),
                user2: pair.user2_id ? calculateUserStats(pair.user2_id) : null,
            });
            setLoading(false);
        }

        fetchStats();
    }, [pairId]);

    if (loading) return (
        <div className="p-8 animate-pulse space-y-4">
            <div className="h-40 bg-slate-100 rounded-2xl" />
            <div className="h-40 bg-slate-100 rounded-2xl" />
        </div>
    );

    if (!stats) return null;

    const pickiest = stats.user2
        ? (stats.user1.avgScore < stats.user2.avgScore ? stats.user1 : stats.user2)
        : stats.user1;

    return (
        <div className="p-4 space-y-6">
            <header>
                <h2 className="text-2xl font-bold text-slate-800 mb-1">{t('stats.title')}</h2>
                <p className="text-slate-500 text-sm">{t('stats.subtitle')}</p>
            </header>

            {/* Comparison Cards */}
            <div className="grid grid-cols-1 gap-4">
                {[stats.user1, stats.user2].filter(Boolean).map((user, i) => (
                    <div key={i} className={`p-6 rounded-2xl border ${i === 0 ? 'bg-pastel-blue border-pastel-blue' : 'bg-pastel-pink border-pastel-pink'} shadow-sm`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800 text-lg uppercase tracking-wider">{user!.name}</h3>
                            <Utensils className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-black text-slate-800">{user!.avgScore.toFixed(1)}</span>
                            <span className="text-slate-500 font-medium mb-1">{t('stats.averageScore')}</span>
                        </div>
                        <p className="text-slate-400 text-xs mt-2 font-bold uppercase">{t('stats.ratedCount', { count: user!.count })}</p>
                    </div>
                ))}
            </div>

            {/* Pickiest Eater Section */}
            <div className="bg-white border border-pastel-mint p-6 rounded-2xl shadow-sm text-center">
                <div className="w-16 h-16 bg-pastel-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{t('stats.pickiestTitle')}</h3>
                <p className="text-slate-500 mb-4 px-4 font-medium italic">{t('stats.pickiestSubtitle')}</p>

                <div className="flex items-center justify-center gap-3 py-4 bg-slate-50 rounded-xl">
                    <TrendingDown className="text-red-400" />
                    <span className="text-2xl font-black text-slate-800">{pickiest.name}</span>
                </div>
                <p className="text-slate-400 text-xs mt-4">{t('stats.reviewsCount', { count: pickiest.count })}</p>
            </div>
        </div>
    );
}
