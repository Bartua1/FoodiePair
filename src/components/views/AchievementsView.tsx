import { useAchievements, AchievementBadge } from '../../hooks/useAchievements';
import { useTranslation } from 'react-i18next';
import { Trophy, Map, Utensils, Heart, Calendar, Lock } from 'lucide-react';

const iconMap: Record<string, any> = {
    Map,
    Utensils,
    Heart,
    Calendar
};

export function AchievementsView({ pairId }: { pairId: string }) {
    const { badges, loading } = useAchievements(pairId);
    const { t } = useTranslation();

    if (loading) {
        return (
            <div className="p-8 animate-pulse space-y-6">
                <div className="h-10 bg-slate-100 dark:bg-zinc-800 rounded-lg w-1/2" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-48 bg-slate-100 dark:bg-zinc-800 rounded-3xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-8 bg-[#FAFAFA] dark:bg-zinc-950 min-h-screen font-sans pb-32">
            <header className="pt-2">
                <div className="flex items-center gap-3 mb-2">
                    <Trophy className="w-8 h-8 text-pastel-peach" />
                    <h2 className="text-4xl font-serif text-slate-900 dark:text-zinc-100">{t('achievements.title')}</h2>
                </div>
                <p className="text-slate-600 dark:text-zinc-400 text-sm">{t('achievements.subtitle')}</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {badges.map((badge) => (
                    <BadgeCard key={badge.id} badge={badge} />
                ))}
            </div>

            {badges.length === 0 && (
                <div className="text-center py-20">
                    <p className="text-slate-400 dark:text-zinc-500">{t('achievements.noData')}</p>
                </div>
            )}
        </div>
    );
}

function BadgeCard({ badge }: { badge: AchievementBadge }) {
    const { t } = useTranslation();
    const Icon = iconMap[badge.icon] || Trophy;
    const progressPercent = Math.min(100, (badge.current / badge.total) * 100);

    return (
        <div className={`relative overflow-hidden p-6 rounded-[32px] border transition-all duration-500 ${badge.unlocked
            ? 'bg-white dark:bg-zinc-900 border-pastel-peach/30 shadow-[0_20px_40px_rgba(255,199,165,0.15)] dark:shadow-none scale-100'
            : 'bg-white/50 dark:bg-zinc-900/50 border-slate-100 dark:border-zinc-800 opacity-80'
            }`}>
            {/* Background Decorative Element */}
            <div className={`absolute -right-8 -bottom-8 w-32 h-32 rounded-full blur-3xl opacity-20 transition-all duration-700 ${badge.unlocked ? 'bg-pastel-peach scale-150' : 'bg-slate-400'}`} />

            <div className="flex items-start gap-4 relative z-10">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 ${badge.unlocked
                    ? 'bg-gradient-to-br from-pastel-peach to-orange-200 text-white shadow-lg rotate-0'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 -rotate-3'
                    }`}>
                    {badge.unlocked ? <Icon className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                        <h3 className={`text-lg font-bold font-serif truncate ${badge.unlocked ? 'text-slate-900 dark:text-zinc-100' : 'text-slate-500 dark:text-zinc-400'}`}>
                            {t(badge.titleKey)}
                        </h3>
                        {badge.unlocked && (
                            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase rounded-full">
                                {t('achievements.unlocked')}
                            </span>
                        )}
                    </div>
                    <p className="text-slate-500 dark:text-zinc-500 text-xs mb-4 line-clamp-2">
                        {t(badge.descKey)}
                    </p>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                            <span>{t('achievements.progress', { current: badge.current, total: badge.total })}</span>
                            <span>{Math.round(progressPercent)}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-1000 ease-out rounded-full ${badge.unlocked
                                    ? 'bg-pastel-peach'
                                    : 'bg-slate-300 dark:bg-zinc-600'
                                    }`}
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
