import React from 'react';
import { SignInButton } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Map, Star, Calendar, BarChart3, ChevronRight } from 'lucide-react';
import { LanguageSelector } from '../common/LanguageSelector';
import { ThemeToggle } from '../common/ThemeToggle';

export const LandingView: React.FC = () => {
    const { t } = useTranslation();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.3
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: "spring", stiffness: 100, damping: 15 } as any
        }
    };

    const features = [
        {
            icon: <Map className="w-6 h-6 text-pastel-blue-darker" />,
            title: t('app.features.sharedMap'),
            desc: t('app.features.sharedMapDesc')
        },
        {
            icon: <Star className="w-6 h-6 text-pastel-peach-darker" />,
            title: t('app.features.blindRatings'),
            desc: t('app.features.blindRatingsDesc')
        },
        {
            icon: <Calendar className="w-6 h-6 text-pastel-mint-darker" />,
            title: t('app.features.datePlanner'),
            desc: t('app.features.datePlannerDesc')
        },
        {
            icon: <BarChart3 className="w-6 h-6 text-pastel-lavender-darker" />,
            title: t('app.features.analytics'),
            desc: t('app.features.analyticsDesc')
        }
    ];

    return (
        <div className="flex-1 overflow-y-auto no-scrollbar bg-background dark:bg-zinc-950 font-['Outfit']">
            {/* Nav Overlays */}
            <div className="fixed top-6 left-6 z-50 flex gap-3">
                <LanguageSelector />
                <ThemeToggle />
            </div>

            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 pt-20 pb-12 overflow-hidden">
                {/* Background Decorations */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-pastel-peach/10 blur-[120px] dark:bg-amber-900/5" />
                    <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] rounded-full bg-pastel-blue/10 blur-[100px] dark:bg-blue-900/5" />
                    <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-pastel-mint/10 blur-[100px] dark:bg-emerald-900/5" />
                </div>

                {/* Background Image with Gradient Overlay */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/hero.png"
                        alt="Fine dining"
                        className="w-full h-full object-cover opacity-60 dark:opacity-20 grayscale-[20%] transition-opacity duration-1000"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/90 to-background dark:from-zinc-950/40 dark:via-zinc-950/90 dark:to-zinc-950" />
                </div>

                <motion.div
                    className="relative z-10 max-w-4xl text-center"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div variants={itemVariants} className="mb-8">
                        <span className="px-5 py-2 rounded-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 text-[10px] font-black uppercase tracking-[0.3em] shadow-sm">
                            The Culinary Diary for Couples
                        </span>
                    </motion.div>

                    <motion.h1
                        variants={itemVariants}
                        className="text-7xl md:text-9xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter leading-[0.85]"
                    >
                        <span className="font-['Playfair_Display'] italic font-black">Foodie</span>
                        <span className="text-[#f97316]">.</span>
                    </motion.h1>

                    <motion.p
                        variants={itemVariants}
                        className="text-xl md:text-2xl text-slate-500 dark:text-zinc-500 mb-12 max-w-2xl mx-auto font-medium leading-relaxed"
                    >
                        {t('app.heroSubtitle')}
                    </motion.p>

                    <motion.div variants={itemVariants}>
                        <SignInButton mode="modal">
                            <button className="group relative px-12 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-3xl font-black text-xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_50px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-95 transition-all overflow-hidden border border-white/10 dark:border-black/5">
                                <span className="relative z-10 flex items-center gap-3">
                                    {t('app.getStarted')}
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-[#f97316] to-[#fb923c] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            </button>
                        </SignInButton>
                    </motion.div>
                </motion.div>

                {/* Floating Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="mt-20 flex flex-wrap justify-center gap-8 md:gap-16 relative z-10"
                >
                    {[
                        { label: t('app.stats.restaurantsTracked'), value: '12K+' },
                        { label: t('app.stats.cuisinesExplored'), value: '45+' },
                        { label: t('app.stats.memoriesMade'), value: '150K+' }
                    ].map((stat, i) => (
                        <div key={i} className="text-center">
                            <div className="text-3xl font-black text-slate-900 dark:text-white mb-1 font-['Playfair_Display'] italic">
                                {stat.value}
                            </div>
                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 dark:text-zinc-500">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </motion.div>
            </section>

            {/* Features Grid */}
            <section className="px-6 py-24 max-w-7xl mx-auto relative overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((f, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="p-8 rounded-[2rem] bg-white dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all group"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-zinc-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                {f.icon}
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                                {f.title}
                            </h3>
                            <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium leading-relaxed">
                                {f.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="px-6 py-12 border-t border-slate-100 dark:border-zinc-900 text-center">
                <div className="font-['Playfair_Display'] italic font-black text-2xl text-slate-400 dark:text-zinc-700 mb-4">
                    FoodiePair<span className="text-pastel-peach-darker/50">.</span>
                </div>
                <p className="text-xs font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-[0.2em]">
                    &copy; {new Date().getFullYear()} Crafted for shared experiences
                </p>
            </footer>
        </div>
    );
};
