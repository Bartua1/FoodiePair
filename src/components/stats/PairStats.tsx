import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Utensils, Award, TrendingDown, Users, Pizza, Zap } from 'lucide-react';
import type { Rating, Profile, Restaurant } from '../../types';
import { useTranslation } from 'react-i18next';

interface CategoryStats {
    name: string;
    user1Avg: number;
    user2Avg: number;
    count: number;
}

interface StatsData {
    user1: { id: string; name: string; avgScore: number; count: number; topCuisines: string[] };
    user2: { id: string; name: string; avgScore: number; count: number; topCuisines: string[] } | null;
    categoryStats: CategoryStats[];
    agreementScore: number | null;
    insight: string | null;
}

export function PairStats({ pairId }: { pairId: string }) {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();

    useEffect(() => {
        async function fetchStats() {
            // 1. Get Pair Info
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

            // 2. Get All Restaurants and Ratings for the pair
            const { data: restaurantsData } = await supabase
                .from('restaurants')
                .select('id, cuisine_type, name')
                .eq('pair_id', pairId);

            const restaurants = restaurantsData as Restaurant[] | null;
            const restaurantIds = restaurants?.map(r => r.id) || [];

            const { data: ratingsData } = await supabase
                .from('ratings')
                .select('*')
                .in('restaurant_id', restaurantIds);

            const ratings = ratingsData as Rating[] | null;

            // 3. Helper to calculate average from a rating
            const getAvg = (r: Rating) => (r.food_score + r.service_score + r.vibe_score + r.price_quality_score) / 4;

            // 4. Calculate User Stats
            const calculateUserStats = (userId: string) => {
                const userRatings = ratings?.filter(r => r.user_id === userId) || [];
                if (userRatings.length === 0) return { id: userId, name: getName(userId), avgScore: 0, count: 0, topCuisines: [] };

                const total = userRatings.reduce((acc, curr) => acc + getAvg(curr), 0);
                
                // Top Cuisines
                const cuisineCounts: Record<string, number> = {};
                userRatings.forEach(r => {
                    const rest = restaurants?.find(res => res.id === r.restaurant_id);
                    if (rest?.cuisine_type) {
                        cuisineCounts[rest.cuisine_type] = (cuisineCounts[rest.cuisine_type] || 0) + 1;
                    }
                });
                const topCuisines = Object.entries(cuisineCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([name]) => name);

                return {
                    id: userId,
                    name: getName(userId),
                    avgScore: total / userRatings.length,
                    count: userRatings.length,
                    topCuisines
                };
            };

            // 5. Calculate Category Stats
            const categories: Record<string, { u1: number[], u2: number[] }> = {};
            ratings?.forEach(r => {
                const rest = restaurants?.find(res => res.id === r.restaurant_id);
                const cat = rest?.cuisine_type || 'Other';
                if (!categories[cat]) categories[cat] = { u1: [], u2: [] };
                if (r.user_id === pair.user1_id) categories[cat].u1.push(getAvg(r));
                else if (r.user_id === pair.user2_id) categories[cat].u2.push(getAvg(r));
            });

            const categoryStats: CategoryStats[] = Object.entries(categories)
                .map(([name, scores]) => ({
                    name,
                    user1Avg: scores.u1.length ? scores.u1.reduce((a, b) => a + b, 0) / scores.u1.length : 0,
                    user2Avg: scores.u2.length ? scores.u2.reduce((a, b) => a + b, 0) / scores.u2.length : 0,
                    count: scores.u1.length + scores.u2.length
                }))
                .filter(c => c.count > 0)
                .sort((a, b) => b.count - a.count);

            // 6. Agreement Score
            let totalDiff = 0;
            let sharedCount = 0;
            const restaurantRatings: Record<string, { u1?: number, u2?: number }> = {};
            
            ratings?.forEach(r => {
                if (!restaurantRatings[r.restaurant_id]) restaurantRatings[r.restaurant_id] = {};
                if (r.user_id === pair.user1_id) restaurantRatings[r.restaurant_id].u1 = getAvg(r);
                else if (r.user_id === pair.user2_id) restaurantRatings[r.restaurant_id].u2 = getAvg(r);
            });

            Object.values(restaurantRatings).forEach(rr => {
                if (rr.u1 !== undefined && rr.u2 !== undefined) {
                    totalDiff += Math.abs(rr.u1 - rr.u2);
                    sharedCount++;
                }
            });

            const agreementScore = sharedCount > 0 ? 100 - (totalDiff / sharedCount) * 20 : null; // Scale: 5 is max diff, so * 20 = 100

            // 7. Dynamic Insight
            let insight = null;
            if (categoryStats.length > 0) {
                const topCat = categoryStats[0];
                if (topCat.name.toLowerCase().includes('sushi')) insight = t('stats.insightSushi');
                else if (topCat.name.toLowerCase().includes('pizza')) insight = t('stats.insightPizza');
                
                if (!insight && sharedCount > 0) {
                    const diffs = categoryStats
                        .filter(c => c.user1Avg > 0 && c.user2Avg > 0)
                        .map(c => ({ name: c.name, diff: Math.abs(c.user1Avg - c.user2Avg) }))
                        .sort((a, b) => b.diff - a.diff);
                    
                    if (diffs.length > 0) {
                        insight = diffs[0].diff > 1 
                            ? t('stats.insightDifference', { cuisine: diffs[0].name })
                            : t('stats.insightAgreement', { cuisine: diffs[0].name });
                    }
                }
            }

            setStats({
                user1: calculateUserStats(pair.user1_id),
                user2: pair.user2_id ? calculateUserStats(pair.user2_id) : null,
                categoryStats,
                agreementScore,
                insight
            });
            setLoading(false);
        }

        fetchStats();
    }, [pairId, t]);

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

    const getConsistencyLabel = (score: number) => {
        if (score > 85) return t('stats.consistencyHigh');
        if (score > 65) return t('stats.consistencyMid');
        return t('stats.consistencyLow');
    };

    return (
        <div className="p-4 space-y-6">
            <header>
                <h2 className="text-2xl font-bold text-slate-800 mb-1">{t('stats.title')}</h2>
                <p className="text-slate-500 text-sm">{t('stats.subtitle')}</p>
            </header>

            {/* Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[stats.user1, stats.user2].filter(Boolean).map((user, i) => (
                    <div key={i} className={`p-6 rounded-2xl border ${i === 0 ? 'bg-pastel-blue border-pastel-blue/20' : 'bg-pastel-pink border-pastel-pink/20'} shadow-sm`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800 text-lg uppercase tracking-wider">{user!.name}</h3>
                            <Utensils className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="flex items-end gap-2 mb-4">
                            <span className="text-4xl font-black text-slate-800">{user!.avgScore.toFixed(2)}</span>
                            <span className="text-slate-500 font-medium mb-1">{t('stats.averageScore')}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {user!.topCuisines.map(c => (
                                <span key={c} className="px-2 py-1 bg-white/50 text-slate-600 text-[10px] font-bold uppercase rounded-full">
                                    {c}
                                </span>
                            ))}
                        </div>
                        <p className="text-slate-400 text-[10px] mt-4 font-bold uppercase">{t('stats.ratedCount', { count: user!.count })}</p>
                    </div>
                ))}
            </div>

            {/* Consistency & Agreement */}
            {stats.agreementScore !== null && (
                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-indigo-500" />
                        <h3 className="font-bold text-slate-800">{t('stats.consistencyTitle')}</h3>
                    </div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="flex-1 bg-slate-100 h-3 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-indigo-400 to-purple-500" 
                                style={{ width: `${stats.agreementScore}%` }}
                            />
                        </div>
                        <span className="font-black text-slate-700">{Math.round(stats.agreementScore)}%</span>
                    </div>
                    <p className="text-slate-500 text-sm italic">{getConsistencyLabel(stats.agreementScore)}</p>
                </div>
            )}

            {/* Category Breakdown */}
            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 mb-6">
                    <Pizza className="w-5 h-5 text-orange-500" />
                    <h3 className="font-bold text-slate-800">{t('stats.categoriesTitle')}</h3>
                </div>
                
                <div className="space-y-4">
                    {stats.categoryStats.slice(0, 5).map((cat) => (
                        <div key={cat.name} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-tighter">
                                <span>{cat.name}</span>
                                <span>{cat.count} {t('restaurant.photos').toLowerCase()}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-slate-50 h-2 rounded-full overflow-hidden">
                                        <div className="h-full bg-pastel-blue" style={{ width: `${cat.user1Avg * 20}%` }} />
                                    </div>
                                    <span className="text-[10px] font-mono font-bold w-6">{cat.user1Avg ? cat.user1Avg.toFixed(1) : '-'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-slate-50 h-2 rounded-full overflow-hidden">
                                        <div className="h-full bg-pastel-pink" style={{ width: `${cat.user2Avg * 20}%` }} />
                                    </div>
                                    <span className="text-[10px] font-mono font-bold w-6">{cat.user2Avg ? cat.user2Avg.toFixed(1) : '-'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {stats.categoryStats.length === 0 && (
                        <p className="text-slate-400 text-sm text-center py-4">{t('stats.noCategoryData')}</p>
                    )}
                </div>
            </div>

            {/* Pickiest Eater Section */}
            <div className="bg-white border border-pastel-mint/30 p-6 rounded-2xl shadow-sm text-center relative overflow-hidden">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-pastel-yellow/20 rounded-full blur-2xl" />
                <div className="w-16 h-16 bg-gradient-to-br from-pastel-yellow to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                    <Award className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{t('stats.pickiestTitle')}</h3>
                <p className="text-slate-500 text-sm mb-6 px-4 font-medium italic">{t('stats.pickiestSubtitle')}</p>

                <div className="flex items-center justify-center gap-3 py-4 bg-slate-50 rounded-xl mb-4 border border-slate-100">
                    <TrendingDown className="text-red-400 w-5 h-5" />
                    <span className="text-2xl font-black text-slate-800">{pickiest.name}</span>
                </div>

                {stats.insight && (
                    <div className="flex items-center gap-3 p-4 bg-pastel-mint/20 rounded-xl text-left border border-pastel-mint/20">
                        <Zap className="w-5 h-5 text-pastel-mint flex-shrink-0" />
                        <p className="text-xs font-bold text-slate-600 leading-snug">{stats.insight}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
