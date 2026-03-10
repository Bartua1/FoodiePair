import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Utensils, Users } from 'lucide-react';
import { InsightSlideshow } from './InsightSlideshow';
import type { Rating, Profile, Restaurant, Insight } from '../../types';
import { useTranslation } from 'react-i18next';

interface CategoryStats {
    name: string;
    user1Avg: number;
    user2Avg: number;
    count: number;
}

interface StatsData {
    user1: { id: string; name: string; avatarUrl: string | null; avgScore: number; count: number; topCuisines: string[]; priceQualityScore: number; vibeScore: number; cuisineCount: number };
    user2: { id: string; name: string; avatarUrl: string | null; avgScore: number; count: number; topCuisines: string[]; priceQualityScore: number; vibeScore: number; cuisineCount: number } | null;
    categoryStats: CategoryStats[];
    agreementScore: number | null;
    insight: string | null;
    insightDesc: string | null;
    slideshowInsights: Insight[];
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
                .select('id, display_name, avatar_url')
                .in('id', [pair.user1_id, pair.user2_id].filter(Boolean));

            const getName = (id: string) => (profiles as Profile[] | null)?.find(p => p.id === id)?.display_name || 'User';
            const getAvatar = (id: string) => (profiles as Profile[] | null)?.find(p => p.id === id)?.avatar_url || null;

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
                if (userRatings.length === 0) return { id: userId, name: getName(userId), avatarUrl: getAvatar(userId), avgScore: 0, count: 0, topCuisines: [], priceQualityScore: 0, vibeScore: 0, cuisineCount: 0 };

                const total = userRatings.reduce((acc, curr) => acc + getAvg(curr), 0);
                const totalPQ = userRatings.reduce((acc, curr) => acc + curr.price_quality_score, 0);
                const totalVibe = userRatings.reduce((acc, curr) => acc + curr.vibe_score, 0);

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
                    avatarUrl: getAvatar(userId),
                    avgScore: total / userRatings.length,
                    priceQualityScore: totalPQ / userRatings.length,
                    vibeScore: totalVibe / userRatings.length,
                    cuisineCount: Object.keys(cuisineCounts).length,
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

            const agreementScore = sharedCount > 0 ? Math.max(0, 100 - (totalDiff / sharedCount) * 25) : null; // Scale: 4 is max diff, so * 25 = 100

            // 7. Dynamic Insight
            let insight = null;
            let insightDesc = null;

            if (categoryStats.length > 0) {
                const topCat = categoryStats[0];
                if (topCat.name.toLowerCase().includes('sushi')) {
                    insight = t('stats.insightSushi');
                    insightDesc = t('stats.insightSushiDesc');
                }
                else if (topCat.name.toLowerCase().includes('pizza')) {
                    insight = t('stats.insightPizza');
                    insightDesc = t('stats.insightPizzaDesc');
                }

                if (!insight && sharedCount > 0) {
                    const diffs = categoryStats
                        .filter(c => c.user1Avg > 0 && c.user2Avg > 0)
                        .map(c => ({
                            name: c.name,
                            diff: Math.abs(c.user1Avg - c.user2Avg),
                            combinedAvg: (c.user1Avg + c.user2Avg) / 2
                        }))
                        .sort((a, b) => b.diff - a.diff);

                    if (diffs.length > 0) {
                        if (diffs[0].diff > 1) {
                            insight = t('stats.insightDifference', { cuisine: diffs[0].name });
                            insightDesc = t('stats.insightDifferenceDesc');
                        } else {
                            const agreements = [...diffs].sort((a, b) => b.combinedAvg - a.combinedAvg);
                            insight = t('stats.insightAgreement', { cuisine: agreements[0].name });
                            insightDesc = t('stats.insightAgreementDesc');
                        }
                    }
                }
            }

            const user1 = calculateUserStats(pair.user1_id);
            const user2 = pair.user2_id ? calculateUserStats(pair.user2_id) : null;

            // 8. Prepare Insights for Slideshow
            const slideshowInsights: Insight[] = [];

            if (user2) {
                // Pickiest
                const pickiest = user1.avgScore < user2.avgScore ? user1 : user2;
                slideshowInsights.push({ type: 'pickiest', data: { name: pickiest.name } });

                // Value Seeker
                const valueSeeker = user1.priceQualityScore > user2.priceQualityScore ? user1 : user2;
                slideshowInsights.push({ type: 'value', data: { name: valueSeeker.name, score: valueSeeker.priceQualityScore } });

                // Vibe Master
                const vibeMaster = user1.vibeScore > user2.vibeScore ? user1 : user2;
                slideshowInsights.push({ type: 'vibe', data: { name: vibeMaster.name, score: vibeMaster.vibeScore } });
            } else {
                slideshowInsights.push({ type: 'pickiest', data: { name: user1.name } });
            }

            // Favorite (User 1)
            if (user1.topCuisines.length > 0) {
                slideshowInsights.push({ type: 'favorite', data: { name: user1.name, cuisine: user1.topCuisines[0] } });
            }
            // Favorite (User 2)
            if (user2 && user2.topCuisines.length > 0) {
                slideshowInsights.push({ type: 'favorite', data: { name: user2.name, cuisine: user2.topCuisines[0] } });
            }

            // Legend
            const legend = (user2 && user2.cuisineCount > user1.cuisineCount) ? user2 : user1;
            slideshowInsights.push({ type: 'legend', data: { name: legend.name, count: legend.cuisineCount } });

            // Perfect Match and Disagreement
            if (categoryStats.length > 0) {
                const diffs = categoryStats
                    .filter(c => c.user1Avg > 0 && c.user2Avg > 0)
                    .map(c => ({
                        name: c.name,
                        diff: Math.abs(c.user1Avg - c.user2Avg),
                        combinedAvg: (c.user1Avg + c.user2Avg) / 2
                    }));

                // Match
                const agreements = [...diffs].sort((a, b) => b.combinedAvg - a.combinedAvg);
                if (agreements.length > 0 && agreements[0].diff < 1) {
                    slideshowInsights.push({ type: 'match', data: { cuisine: agreements[0].name } });
                }

                // Disagreement
                const disagreements = [...diffs].sort((a, b) => b.diff - a.diff);
                if (disagreements.length > 0 && disagreements[0].diff > 0.5) {
                    slideshowInsights.push({ type: 'disagree', data: { cuisine: disagreements[0].name } });
                }
            }

            setStats({
                user1,
                user2,
                categoryStats,
                agreementScore,
                insight,
                insightDesc,
                slideshowInsights
            });
            setLoading(false);
        }

        fetchStats();
    }, [pairId, t]);

    if (loading) return (
        <div className="p-8 animate-pulse space-y-4">
            <div className="h-40 bg-slate-100 dark:bg-zinc-800 rounded-2xl" />
            <div className="h-40 bg-slate-100 dark:bg-zinc-800 rounded-2xl" />
        </div>
    );

    if (!stats) return null;




    return (
        <div className="p-4 space-y-8 bg-[#FAFAFA] dark:bg-zinc-950 min-h-screen font-sans pb-24">
            <header className="pt-2">
                <h2 className="text-4xl font-serif text-slate-900 dark:text-zinc-100 mb-1">Couple Analytics</h2>
                <p className="text-slate-600 dark:text-zinc-400 text-sm">See who's pickier and discover your food twin!</p>
            </header>

            {/* Comparison Cards */}
            <div className="flex gap-4 justify-center items-stretch my-8">
                {[stats.user1, stats.user2].filter(Boolean).map((user, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 w-1/2 max-w-[180px]">
                        <div className={`relative p-[3px] rounded-full aspect-square w-40 h-40 ${i === 0 ? 'bg-gradient-to-br from-[#BEAAFF] via-[#E4DEFF] to-[#E9AEFF]' : 'bg-gradient-to-br from-[#A1C4FD] via-[#C2E9FB] to-[#A8EDE4]'} shadow-sm flex items-center justify-center`}>
                            <div className="bg-white dark:bg-zinc-950 rounded-full w-full h-full flex flex-col items-center justify-center relative">
                                {user!.avatarUrl ? (
                                    <img src={user!.avatarUrl} alt={user!.name} className="w-14 h-14 rounded-full object-cover mb-1 absolute -top-5 border-4 border-white dark:border-zinc-950 shadow-sm" />
                                ) : (
                                    <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center mb-1 absolute -top-5 border-4 border-white dark:border-zinc-950 shadow-sm">
                                        <Users className="w-6 h-6 text-slate-400" />
                                    </div>
                                )}
                                <h3 className="font-serif font-bold text-slate-900 dark:text-zinc-100 text-sm md:text-base text-center line-clamp-2 px-2 mt-4 leading-tight">{user!.name}</h3>
                                <span className="text-[2.5rem] font-black tracking-tight text-slate-900 dark:text-white mt-1 leading-none">{user!.avgScore.toFixed(2)}</span>
                                <span className="text-slate-500 dark:text-zinc-400 text-[10px] mt-1 text-center font-medium">Average Rating</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center gap-1.5 mt-4">
                            {user!.topCuisines.map(c => (
                                <span key={c} className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 text-[10px] font-bold uppercase rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                                    {c}
                                </span>
                            ))}
                        </div>
                        <p className="text-slate-600 dark:text-zinc-500 text-[10px] font-bold uppercase mt-2">{user!.count} {t('restaurant.photos').toLowerCase()}</p>
                    </div>
                ))}
            </div>

            {/* Consistency & Agreement */}
            {stats.agreementScore !== null && (
                <div className="bg-white/80 backdrop-blur-md dark:bg-zinc-900 border border-slate-100/50 dark:border-zinc-800 p-6 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
                    <div className="flex items-center gap-3 mb-6">
                        <Users className="w-5 h-5 text-[#BEAAFF]" />
                        <div className="flex -space-x-2">
                            {stats.user1.avatarUrl && <img src={stats.user1.avatarUrl} alt="" className="w-6 h-6 rounded-full border-2 border-white dark:border-zinc-900 object-cover" />}
                            {stats.user2?.avatarUrl && <img src={stats.user2.avatarUrl} alt="" className="w-6 h-6 rounded-full border-2 border-white dark:border-zinc-900 object-cover" />}
                        </div>
                        <h3 className="font-serif font-bold text-slate-900 dark:text-zinc-100 text-lg">Couple Effect</h3>
                    </div>
                    
                    <div className="flex flex-col md:flex-row md:items-center gap-4 relative">
                        <div className="w-full flex-1 bg-slate-100 dark:bg-zinc-800 h-3.5 rounded-full overflow-visible relative flex items-center">
                            <div
                                className="h-full bg-gradient-to-r from-[#BEAAFF] via-[#A1C4FD] to-[#A8EDE4] rounded-full"
                                style={{ width: `${stats.agreementScore}%` }}
                            />
                            <div className="absolute w-6 h-6 bg-white dark:bg-zinc-800 rounded-full shadow-md border border-slate-100 dark:border-zinc-700 flex items-center justify-center" style={{ left: `calc(${stats.agreementScore}% - 12px)` }}>
                                <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-[#BEAAFF] to-[#A1C4FD] opacity-70" />
                            </div>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white text-xl ml-auto md:ml-4">{Math.round(stats.agreementScore)}%</span>
                    </div>
                    {stats.agreementScore > 80 ? (
                        <p className="text-slate-700 dark:text-zinc-300 text-sm mt-4 font-medium">Soulmates! You almost always agree on food choices.</p>
                    ) : stats.agreementScore > 60 ? (
                        <p className="text-slate-700 dark:text-zinc-300 text-sm mt-4 font-medium">Great taste! You generally agree on where to eat.</p>
                    ) : (
                        <p className="text-slate-700 dark:text-zinc-300 text-sm mt-4 font-medium">Opposites attract! Your tastes vary quite a bit.</p>
                    )}
                </div>
            )}

            {/* Category Breakdown */}
            <div className="bg-white/80 backdrop-blur-md dark:bg-zinc-900 border border-slate-100/50 dark:border-zinc-800 p-6 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none overflow-hidden">
                <div className="flex items-center gap-3 mb-8">
                    <Utensils className="w-5 h-5 text-slate-400" />
                    <h3 className="font-serif font-bold text-slate-900 dark:text-zinc-100 text-xl">Taste Breakdown</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    {stats.categoryStats.map((cat) => (
                        <div key={cat.name} className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-widest">{cat.name}</span>
                                <span className="text-[11px] font-bold text-slate-900 dark:text-zinc-100">{cat.user1Avg ? cat.user1Avg.toFixed(2) : '-'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 flex gap-0.5 h-[6px] rounded-full overflow-hidden bg-slate-100 dark:bg-zinc-800">
                                    <div className="bg-[#BEAAFF] border-r border-white dark:border-zinc-900 last:border-0" style={{ width: `${(cat.user1Avg / 5) * 100}%` }} />
                                    <div className="bg-[#A1C4FD] opacity-70" style={{ width: `${(cat.user2Avg / 5) * 100}%` }} />
                                </div>
                                <span className="text-[11px] text-slate-500 font-medium w-6 text-right">{cat.user2Avg ? cat.user2Avg.toFixed(2) : '-'}</span>
                            </div>
                        </div>
                    ))}
                    {stats.categoryStats.length === 0 && (
                        <p className="text-slate-400 dark:text-zinc-500 text-sm text-center py-4 col-span-full">{t('stats.noCategoryData')}</p>
                    )}
                </div>
            </div>

            {/* Insights Slideshow */}
            <div className="pt-4">
                <InsightSlideshow insights={stats.slideshowInsights} />
            </div>
        </div>
    );
}
