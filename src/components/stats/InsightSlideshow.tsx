import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Award, Zap, Heart, Star, Compass, Sparkles, Gem } from 'lucide-react';

export type InsightType = 'pickiest' | 'favorite' | 'legend' | 'value' | 'vibe' | 'match';

export interface Insight {
    type: InsightType;
    data: any;
}

export function InsightSlideshow({ insights }: { insights: Insight[] }) {
    const { t } = useTranslation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [shuffledInsights, setShuffledInsights] = useState<Insight[]>([]);

    useEffect(() => {
        if (insights.length > 0) {
            // Shuffle only once on mount or when insights change significantly
            setShuffledInsights([...insights].sort(() => Math.random() - 0.5));
        }
    }, [insights]);

    useEffect(() => {
        if (shuffledInsights.length > 1) {
            const timer = setInterval(() => {
                setCurrentIndex((prev) => (prev + 1) % shuffledInsights.length);
            }, 6000); // 6 seconds per slide
            return () => clearInterval(timer);
        }
    }, [shuffledInsights]);

    if (shuffledInsights.length === 0) return null;

    const current = shuffledInsights[currentIndex];

    const renderSlide = () => {
        switch (current.type) {
            case 'pickiest':
                return (
                    <div className="relative overflow-hidden bg-white/10 dark:bg-zinc-900/10 backdrop-blur-xl border border-white/20 dark:border-zinc-700/30 p-8 rounded-3xl h-72 flex flex-col items-center justify-center text-center shadow-2xl transition-all duration-500">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-400/10 to-transparent pointer-events-none" />
                        <div className="w-16 h-16 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4 shadow-lg ring-4 ring-slate-50 dark:ring-zinc-900 transition-transform hover:scale-110">
                            <Award className="w-8 h-8 text-slate-700 dark:text-zinc-200" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 mb-2 uppercase tracking-tight">{t('stats.pickiestTitle')}</h3>
                        <p className="text-slate-600 dark:text-zinc-300 font-bold text-3xl mb-2">{current.data.name}</p>
                        <p className="text-slate-400 dark:text-zinc-500 text-xs italic max-w-[240px] leading-relaxed">
                            {t('stats.pickiestSubtitle')}
                        </p>
                    </div>
                );
            case 'favorite':
                return (
                    <div className="bg-gradient-to-br from-orange-400 via-rose-500 to-purple-600 p-8 rounded-3xl h-72 flex flex-col items-center justify-center text-center shadow-2xl text-white relative group overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
                        <Star className="w-14 h-14 mb-4 animate-pulse fill-white/20" />
                        <p className="text-xl font-black leading-tight drop-shadow-md">
                            {t('stats.insightFavorite', { name: current.data.name, cuisine: current.data.cuisine })}
                        </p>
                    </div>
                );
            case 'legend':
                return (
                    <div className="bg-zinc-950 p-8 rounded-3xl h-72 flex flex-col items-center justify-center text-center shadow-2xl relative border border-zinc-800/50 overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.2),transparent)] pointer-events-none animate-pulse" />
                        <Compass className="w-14 h-14 text-purple-500 mb-4 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                        <p className="text-xl font-black text-zinc-100 leading-tight uppercase tracking-tighter">
                            {t('stats.insightFoodieLegend', { name: current.data.name, count: current.data.count })}
                        </p>
                        <div className="mt-6 flex gap-2">
                            {[1, 2, 3, 4, 5].map(i => <Sparkles key={i} className={`w-4 h-4 text-purple-400/40 animate-bounce delay-${i * 100}`} />)}
                        </div>
                    </div>
                );
            case 'value':
                return (
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 border-b-8 border-emerald-200 dark:border-emerald-900/50 p-8 rounded-3xl h-72 flex flex-col items-center justify-center text-center shadow-xl">
                        <Gem className="w-14 h-14 text-emerald-500 mb-4 drop-shadow-md" />
                        <p className="text-emerald-900 dark:text-emerald-50 font-black text-xl leading-tight">
                            {t('stats.insightValueSeeker', { name: current.data.name })}
                        </p>
                        <div className="mt-4 px-4 py-1.5 bg-emerald-500/10 rounded-full">
                            <span className="text-emerald-600 dark:text-emerald-400 text-xs font-mono font-black uppercase tracking-widest">
                                Premium Efficiency
                            </span>
                        </div>
                    </div>
                );
            case 'vibe':
                return (
                    <div className="bg-slate-900 p-8 rounded-3xl h-72 flex flex-col items-center justify-center text-center shadow-2xl relative group overflow-hidden">
                        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-purple-600 to-pink-500 rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-gradient-x"></div>
                        <div className="relative flex flex-col items-center bg-slate-900 w-full h-full rounded-2xl flex items-center justify-center">
                            <Zap className="w-14 h-14 text-indigo-400 mb-4 fill-indigo-400/20" />
                            <p className="text-white font-black text-2xl tracking-tighter uppercase italic">
                                {t('stats.insightVibeMaster', { name: current.data.name })}
                            </p>
                            <div className="mt-2 h-1 w-24 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
                        </div>
                    </div>
                );
            case 'match':
                return (
                    <div className="bg-rose-50 dark:bg-rose-950/10 p-8 rounded-3xl h-72 flex flex-col items-center justify-center text-center border-2 border-rose-200 dark:border-rose-900/30 relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-200/20 dark:bg-rose-800/10 rounded-full blur-3xl text-rose-500" />
                        <div className="flex gap-3 mb-4">
                            <Heart className="w-12 h-12 text-rose-500 fill-rose-500 animate-pulse" />
                            <Heart className="w-12 h-12 text-rose-400 fill-rose-400 animate-ping absolute opacity-20" />
                        </div>
                        <p className="text-rose-900 dark:text-rose-100 font-black text-2xl tracking-tight leading-tight">
                            {t('stats.insightPerfectMatch', { cuisine: current.data.cuisine })}
                        </p>
                        <p className="mt-2 text-rose-400 text-[10px] font-bold uppercase tracking-[0.2em]">{t('stats.consistencyHigh')}</p>
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

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-6">
                {shuffledInsights.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        className={`h-2 rounded-full transition-all duration-300 ${i === currentIndex
                                ? 'w-8 bg-slate-800 dark:bg-white'
                                : 'w-2 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700'
                            }`}
                        aria-label={`Go to slide ${i + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
