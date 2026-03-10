import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Award, Zap, Heart, Star, Compass, Sparkles, Gem, Flame } from 'lucide-react';
import type { Insight, InsightType } from '../../types';

export function InsightSlideshow({ insights }: { insights: Insight[] }) {
    const { t } = useTranslation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [shuffledInsights, setShuffledInsights] = useState<Insight[]>([]);
    const [progress, setProgress] = useState(0);

    const DURATION = 10000; // 10 seconds

    useEffect(() => {
        if (insights.length > 0) {
            // Shuffle only once on mount or when insights change significantly
            setShuffledInsights([...insights].sort(() => Math.random() - 0.5));
        }
    }, [insights]);

    useEffect(() => {
        if (shuffledInsights.length > 1) {
            let start = Date.now();
            let animationFrameId: number;

            const updateProgress = () => {
                const now = Date.now();
                const elapsed = now - start;

                if (elapsed >= DURATION) {
                    setCurrentIndex((prev) => (prev + 1) % shuffledInsights.length);
                    start = Date.now();
                    setProgress(0);
                } else {
                    setProgress((elapsed / DURATION) * 100);
                }
                animationFrameId = requestAnimationFrame(updateProgress);
            };

            animationFrameId = requestAnimationFrame(updateProgress);

            return () => cancelAnimationFrame(animationFrameId);
        }
    }, [shuffledInsights]);

    if (shuffledInsights.length === 0) return null;

    const current = shuffledInsights[currentIndex];

    // Map each slide directly to our defined pastel palettes
    const renderSlide = () => {
        switch (current.type) {
            case 'pickiest':
                return (
                    <div className="bg-pastel-yellow dark:bg-pastel-yellow-dark/20 border-b-8 border-pastel-yellow-dark dark:border-pastel-yellow-darker/50 p-8 rounded-3xl h-72 flex flex-col items-center justify-center text-center shadow-xl">
                        <div className="w-16 h-16 bg-white/80 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4 shadow-sm border border-pastel-yellow-dark/50">
                            <Award className="w-8 h-8 text-pastel-yellow-darker" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 mb-2 uppercase tracking-tight">{t('stats.pickiestTitle')}</h3>
                        <p className="text-pastel-yellow-darker font-black text-3xl mb-2">{current.data.name}</p>
                        <p className="text-slate-600 dark:text-zinc-400 text-xs italic max-w-[240px] leading-relaxed">
                            {t('stats.pickiestSubtitle')}
                        </p>
                    </div>
                );
            case 'favorite':
                return (
                    <div className="bg-pastel-peach dark:bg-pastel-peach-dark/20 border-b-8 border-pastel-peach-dark dark:border-pastel-peach-darker/50 p-8 rounded-3xl h-72 flex flex-col items-center justify-center text-center shadow-xl text-slate-800 dark:text-zinc-100">
                        <Star className="w-14 h-14 mb-4 text-pastel-peach-darker animate-pulse fill-pastel-peach" />
                        <p className="text-xl font-black leading-tight">
                            {t('stats.insightFavorite', { name: current.data.name, cuisine: current.data.cuisine })}
                        </p>
                    </div>
                );
            case 'legend':
                return (
                    <div className="bg-pastel-lavender dark:bg-pastel-lavender-dark/20 border-b-8 border-pastel-lavender-dark dark:border-pastel-lavender-darker/50 p-8 rounded-3xl h-72 flex flex-col items-center justify-center text-center shadow-xl">
                        <Compass className="w-14 h-14 text-pastel-lavender-darker mb-4" />
                        <p className="text-xl font-black text-slate-800 dark:text-zinc-100 leading-tight uppercase tracking-tighter">
                            {t('stats.insightFoodieLegend', { name: current.data.name, count: current.data.count })}
                        </p>
                        <div className="mt-6 flex gap-2">
                            {[1, 2, 3, 4, 5].map(i => <Sparkles key={i} className={`w-4 h-4 text-pastel-lavender-darker animate-bounce delay-${i * 100}`} />)}
                        </div>
                    </div>
                );
            case 'value':
                return (
                    <div className="bg-pastel-mint dark:bg-pastel-mint-dark/20 border-b-8 border-pastel-mint-dark dark:border-pastel-mint-darker/50 p-8 rounded-3xl h-72 flex flex-col items-center justify-center text-center shadow-xl">
                        <Gem className="w-14 h-14 text-pastel-mint-darker mb-4" />
                        <p className="text-slate-800 dark:text-zinc-100 font-black text-xl leading-tight">
                            {t('stats.insightValueSeeker', { name: current.data.name })}
                        </p>
                        <div className="mt-4 px-4 py-1.5 bg-white/60 dark:bg-zinc-800/50 rounded-full border border-pastel-mint-dark/20">
                            <span className="text-pastel-mint-darker text-xs font-mono font-black uppercase tracking-widest">
                                Premium Efficiency
                            </span>
                        </div>
                    </div>
                );
            case 'vibe':
                return (
                    <div className="bg-pastel-blue dark:bg-pastel-blue-dark/20 border-b-8 border-pastel-blue-dark dark:border-pastel-blue-darker/50 p-8 rounded-3xl h-72 flex flex-col items-center justify-center text-center shadow-xl">
                        <Zap className="w-14 h-14 text-pastel-blue-darker mb-4 fill-pastel-blue-dark/30" />
                        <p className="text-slate-800 dark:text-zinc-100 font-black text-2xl tracking-tighter uppercase italic">
                            {t('stats.insightVibeMaster', { name: current.data.name })}
                        </p>
                    </div>
                );
            case 'match':
                return (
                    <div className="bg-pastel-pink dark:bg-pastel-pink-dark/20 border-b-8 border-pastel-pink-dark dark:border-pastel-pink-darker/50 p-8 rounded-3xl h-72 flex flex-col items-center justify-center text-center shadow-xl">
                        <div className="flex gap-3 mb-4">
                            <Heart className="w-12 h-12 text-pastel-pink-darker fill-pastel-pink-darker animate-pulse" />
                        </div>
                        <p className="text-slate-800 dark:text-zinc-100 font-black text-2xl tracking-tight leading-tight">
                            {t('stats.insightPerfectMatch', { cuisine: current.data.cuisine })}
                        </p>
                        <p className="mt-2 text-pastel-pink-darker text-[10px] font-bold uppercase tracking-[0.2em]">{t('stats.consistencyHigh')}</p>
                    </div>
                );
            case 'disagree':
                return (
                    <div className="bg-red-50 dark:bg-red-950/20 border-b-8 border-red-200 dark:border-red-900/50 p-8 rounded-3xl h-72 flex flex-col items-center justify-center text-center shadow-xl">
                        <div className="flex gap-3 mb-4">
                            <Flame className="w-12 h-12 text-red-400 fill-red-400 animate-pulse" />
                        </div>
                        <p className="text-slate-800 dark:text-zinc-100 font-black text-2xl tracking-tight leading-tight">
                            {t('stats.insightDisagree', { cuisine: current.data.cuisine })}
                        </p>
                        <p className="mt-2 text-red-500 text-[10px] font-bold uppercase tracking-[0.2em]">{t('stats.consistencyLow')}</p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="relative group transition-all duration-700 ease-in-out">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {renderSlide()}
            </div>

            {/* Progress Bar instead of clickable dots */}
            {shuffledInsights.length > 1 && (
                <div className="mt-6 h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
                    <div
                        className="h-full bg-slate-400 dark:bg-zinc-500 rounded-full"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
        </div>
    );
}
