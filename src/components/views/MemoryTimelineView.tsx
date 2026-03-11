import { ArrowLeft, Clock, MessageCircle, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useMemoryTimeline } from '../../hooks/useMemoryTimeline';
import { getOptimizedImageUrl } from '../../utils/imageUtils';
import { Button } from '../ui/Button';

interface MemoryTimelineViewProps {
    pairId: string;
}

export function MemoryTimelineView({ pairId }: MemoryTimelineViewProps) {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { entries, loading } = useMemoryTimeline(pairId);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 12 } }
    };

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-background dark:bg-zinc-950 p-6 text-center">
                <div className="w-12 h-12 border-4 border-pastel-peach/30 border-t-pastel-peach rounded-full animate-spin mb-4" />
                <p className="text-slate-500 dark:text-zinc-400 font-medium">{t('timeline.loading')}</p>
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <div className="flex-1 flex flex-col bg-background dark:bg-zinc-950 p-6 overflow-hidden">
                <div className="pt-6 pb-8">
                    <button onClick={() => navigate(-1)} className="p-2 mb-6 bg-white dark:bg-zinc-900 shadow-sm border border-slate-100 dark:border-zinc-800 rounded-full text-slate-600 dark:text-zinc-400 hover:scale-105 active:scale-95 transition-all">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-4xl font-extrabold text-slate-800 dark:text-zinc-100 mb-2 tracking-tight">
                        {t('timeline.title')}
                    </h1>
                    <p className="text-slate-500 dark:text-zinc-400">
                        {t('timeline.subtitle')}
                    </p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-center max-w-xs mx-auto">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-zinc-900 rounded-3xl flex items-center justify-center text-slate-300 dark:text-zinc-700 mb-6 border border-slate-100 dark:border-zinc-800">
                        <Clock size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-100 mb-2">{t('timeline.noVisits')}</h3>
                    <p className="text-slate-500 dark:text-zinc-400 text-sm mb-8 leading-relaxed">
                        {t('timeline.noVisitsSubtitle')}
                    </p>
                    <Button onClick={() => navigate('/')} className="bg-pastel-peach text-slate-800 rounded-full px-8 py-3 font-bold shadow-lg hover:shadow-xl transition-all">
                        {t('restaurant.backToFeed')}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-background dark:bg-zinc-950 h-full relative overflow-hidden">
            {/* Main scrollable container for both header and feed */}
            <div className="flex-1 overflow-y-auto relative no-scrollbar">
                {/* Header Area - Now part of normal flow to scroll away */}
                <header className="px-6 pt-10 pb-8 bg-gradient-to-b from-white dark:from-zinc-950 via-white/80 dark:via-zinc-950/80 to-transparent relative z-20">
                    <div className="flex items-center justify-between mb-8">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2.5 bg-white dark:bg-zinc-900 shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-zinc-800 rounded-2xl text-slate-600 dark:text-zinc-400 hover:scale-105 active:scale-95 transition-all"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl shadow-sm">
                            <span className="text-xs font-black text-amber-700 dark:text-amber-500 tracking-wider uppercase">
                                {t('timeline.memoriesCount', { count: entries.length })}
                            </span>
                        </div>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <h1 className="text-5xl font-black text-slate-900 dark:text-zinc-100 mb-3 tracking-tighter">
                            {t('timeline.title')}
                        </h1>
                        <p className="text-slate-500 dark:text-zinc-400 font-semibold text-lg max-w-sm leading-snug">
                            {t('timeline.subtitle')}
                        </p>
                    </motion.div>
                </header>

                {/* Timeline Feed Container */}
                <div className="px-6 pb-24 relative">
                    {/* Vertical Timeline Line */}
                    <div className="absolute left-10 top-0 bottom-0 w-1.5 bg-gradient-to-b from-pastel-peach via-pastel-blue to-pastel-mint dark:from-amber-900/30 dark:via-zinc-800 dark:to-zinc-800 rounded-full z-0 opacity-40 blur-[1px]" />

                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="relative z-10 space-y-16 py-8"
                    >
                        {entries.map((entry, idx) => (
                            <motion.div
                                key={entry.id}
                                variants={item}
                                className="relative flex flex-col gap-6"
                            >
                                {/* Date Bubble */}
                                <div className="absolute left-4 top-0 -translate-x-1/2 flex items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-white dark:bg-zinc-900 shadow-[0_8px_20px_rgba(0,0,0,0.12)] border border-slate-100 dark:border-zinc-800 flex items-center justify-center z-20">
                                        <div className="w-4 h-4 rounded-full bg-pastel-peach animate-pulse" />
                                    </div>
                                </div>

                                {/* Memory Card */}
                                <div className="ml-12 pl-4">
                                    <div className="mb-4">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-zinc-900 rounded-full text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest mb-3">
                                            <Calendar size={12} />
                                            {new Date(entry.visit_date!).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </div>
                                        <h2
                                            onClick={() => navigate(`/restaurant/${entry.id}`)}
                                            className="text-2xl font-black text-slate-800 dark:text-zinc-100 cursor-pointer hover:text-pastel-peach transition-colors leading-tight"
                                        >
                                            {entry.name}
                                        </h2>
                                        <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-1">
                                            {entry.cuisine_type} • {'€'.repeat(entry.price_range)}
                                        </p>
                                    </div>

                                    {/* Content Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Photo Stack / Reveal */}
                                        <div className="relative group cursor-pointer" onClick={() => navigate(`/restaurant/${entry.id}`)}>
                                            {entry.photos.length > 0 ? (
                                                <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-xl ring-4 ring-white dark:ring-zinc-900 relative">
                                                    <img
                                                        src={getOptimizedImageUrl(entry.photos[0].url, { width: 600, height: 450 })}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                        alt={entry.name}
                                                    />
                                                    {entry.photos.length > 1 && (
                                                        <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-bold">
                                                            {t('timeline.morePhotos', { count: entry.photos.length - 1 })}
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                                </div>
                                            ) : (
                                                <div className="aspect-[4/3] rounded-3xl bg-slate-50 dark:bg-zinc-900/50 border-2 border-dashed border-slate-200 dark:border-zinc-800 flex flex-col items-center justify-center text-slate-300 dark:text-zinc-700 gap-2">
                                                    <Clock size={24} />
                                                    <span className="text-[10px] uppercase font-bold tracking-widest">{t('timeline.noPhotos')}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Interaction Details (Ratings & Comments) */}
                                        <div className="flex flex-col gap-4">
                                            {/* Score Badges */}
                                            <div className="flex items-center gap-3">
                                                {/* Avg Score */}
                                                <div className="flex items-center gap-2 bg-pastel-mint/20 dark:bg-emerald-500/10 px-4 py-2 rounded-2xl border border-pastel-mint/30">
                                                    <div className="w-8 h-8 rounded-full bg-pastel-mint-darker dark:bg-emerald-500 flex items-center justify-center text-white font-black">
                                                        {entry.avg_score?.toFixed(1) || '-'}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-pastel-mint-darker dark:text-emerald-400 uppercase leading-none">{t('timeline.global')}</span>
                                                        <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase leading-none mt-0.5">{t('timeline.score')}</span>
                                                    </div>
                                                </div>

                                                {/* Partner Avatars (Favorites Only) */}
                                                <div className="flex -space-x-3">
                                                    {entry.favoriteUserIds.map((userId, i) => {
                                                        const prof = entry.profiles[userId];
                                                        return (
                                                            <div
                                                                key={userId}
                                                                className={`w-10 h-10 rounded-full border-4 border-white dark:border-zinc-900 overflow-hidden shadow-md ring-1 ${i === 0 ? 'ring-pastel-peach/50' : 'ring-pastel-blue/50'}`}
                                                                title={prof?.display_name || ''}
                                                            >
                                                                {prof?.avatar_url ? (
                                                                    <img src={getOptimizedImageUrl(prof.avatar_url, { width: 64, height: 64 })} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className={`w-full h-full flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-pastel-peach text-white' : 'bg-pastel-blue text-white'}`}>
                                                                        {prof?.display_name?.[0] || 'U'}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Highlight Comment */}
                                            {entry.comments.length > 0 ? (
                                                <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-white/50 dark:border-zinc-800/50 p-4 rounded-3xl shadow-sm relative group overflow-hidden">
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-pastel-peach/50" />
                                                    <MessageCircle size={14} className="text-pastel-peach mb-2 opacity-50" />
                                                    <p className="text-sm font-medium text-slate-700 dark:text-zinc-300 italic line-clamp-3">
                                                        "{entry.comments[entry.comments.length - 1].content}"
                                                    </p>
                                                    <div className="flex justify-between items-center mt-3">
                                                        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                                                            {entry.profiles[entry.comments[entry.comments.length - 1].user_id]?.display_name || t('restaurant.partner')}
                                                        </span>
                                                        {entry.comments.length > 1 && (
                                                            <span className="text-[10px] font-black text-pastel-blue uppercase hover:underline cursor-pointer">
                                                                {t('timeline.moreComments', { count: entry.comments.length - 1 })}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-slate-50/50 dark:bg-zinc-900/20 border border-dashed border-slate-200 dark:border-zinc-800 p-4 rounded-3xl flex items-center justify-center">
                                                    <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest">{t('timeline.noChat')}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Connector between entries (asymmetric logic) */}
                                {idx < entries.length - 1 && (
                                    <div className="absolute left-10 bottom-[-64px] h-[32px] w-1 bg-gradient-to-b from-transparent via-slate-100 dark:via-zinc-800/50 to-transparent" />
                                )}
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
