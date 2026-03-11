import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, MapPin, RotateCcw, Utensils } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import type { Restaurant } from '../../types';

interface RandomizerDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    restaurants: Restaurant[];
    onSelectRestaurant: (id: string) => void;
}

export function RandomizerDrawer({
    isOpen,
    onClose,
    restaurants,
    onSelectRestaurant
}: RandomizerDrawerProps) {
    const { t } = useTranslation();
    const [statusFilter, setStatusFilter] = useState<'both' | 'visited' | 'wishlist'>('both');
    const [distanceFilter, setDistanceFilter] = useState<'any' | '1' | '5' | '10'>('any');
    const [isSpinning, setIsSpinning] = useState(false);
    const [winner, setWinner] = useState<Restaurant | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setWinner(null);
            setIsSpinning(false);
        }
    }, [isOpen]);

    // Filter restaurants based on user selection
    const pool = useMemo(() => {
        return restaurants.filter(r => {
            const matchesStatus = statusFilter === 'both'
                ? true
                : statusFilter === 'visited'
                    ? (!r.visit_status || r.visit_status === 'visited')
                    : r.visit_status === 'wishlist';

            const matchesDistance = distanceFilter === 'any'
                ? true
                : r.distance !== undefined && r.distance <= parseFloat(distanceFilter);

            return matchesStatus && matchesDistance;
        });
    }, [restaurants, statusFilter, distanceFilter]);

    const handleSpin = () => {
        if (pool.length === 0) return;

        setIsSpinning(true);
        setWinner(null);

        // Roulette animation simulation
        let count = 0;
        const totalSteps = 15 + Math.floor(Math.random() * 10);
        let speed = 50;

        const animate = () => {
            setCurrentIndex(prev => (prev + 1) % pool.length);
            count++;

            if (count < totalSteps) {
                // Increase interval as it reaches the end for a "slowing down" effect
                if (count > totalSteps * 0.7) speed += 30;
                setTimeout(animate, speed);
            } else {
                const finalWinner = pool[Math.floor(Math.random() * pool.length)];
                setWinner(finalWinner);
                setIsSpinning(false);
            }
        };

        setTimeout(animate, speed);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[3000] flex items-end justify-center">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Drawer */}
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="relative bg-white dark:bg-zinc-900 w-full max-w-lg rounded-t-[32px] p-6 shadow-2xl overflow-hidden"
            >
                {/* Decorative bar */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-slate-200 dark:bg-zinc-800 rounded-full" />

                {/* Header */}
                <div className="flex justify-between items-center mb-6 mt-2">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                            <Sparkles className="text-pastel-peach-darker" size={24} />
                            {t('randomizer.title')}
                        </h2>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1">
                            {t('randomizer.subtitle')}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {!winner && !isSpinning ? (
                        <motion.div
                            key="filters"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-6"
                        >
                            {/* Status Filter */}
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                                    {t('randomizer.filterStatus')}
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['both', 'visited', 'wishlist'] as const).map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setStatusFilter(s)}
                                            className={`py-3 px-1 rounded-2xl text-xs font-bold transition-all border ${statusFilter === s
                                                ? 'bg-slate-900 text-white border-slate-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100 shadow-lg scale-[1.02]'
                                                : 'bg-white dark:bg-zinc-800 text-slate-400 border-slate-100 dark:border-zinc-700 hover:border-slate-200 dark:hover:border-zinc-600'}`}
                                        >
                                            {t(`randomizer.status${s.charAt(0).toUpperCase() + s.slice(1)}`)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Distance Filter */}
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                                    {t('randomizer.filterDistance')}
                                </p>
                                <div className="grid grid-cols-4 gap-2">
                                    {(['any', '1', '5', '10'] as const).map((d) => (
                                        <button
                                            key={d}
                                            onClick={() => setDistanceFilter(d)}
                                            className={`py-3 px-1 rounded-2xl text-[10px] font-bold transition-all border ${distanceFilter === d
                                                ? 'bg-pastel-blue-dark text-white border-pastel-blue-dark shadow-lg scale-[1.02]'
                                                : 'bg-white dark:bg-zinc-800 text-slate-400 border-slate-100 dark:border-zinc-700 hover:border-slate-200 dark:hover:border-zinc-600'}`}
                                        >
                                            {d === 'any' ? t('filters.anyDistance') : `< ${d}km`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 pb-2">
                                <Button
                                    onClick={handleSpin}
                                    disabled={pool.length === 0}
                                    className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 group shadow-xl"
                                >
                                    <Sparkles size={18} className="text-white group-hover:scale-110 transition-transform" />
                                    {t('randomizer.spin')}
                                </Button>
                                {pool.length === 0 && (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="mt-4 text-center text-xs text-red-400 font-medium bg-red-50 dark:bg-red-900/10 py-2 rounded-xl border border-red-100 dark:border-red-900/20"
                                    >
                                        {t('randomizer.noRestaurants')}
                                    </motion.p>
                                )}
                            </div>
                        </motion.div>
                    ) : isSpinning ? (
                        <motion.div
                            key="spinning"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-[280px] flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-800/50 rounded-3xl relative overflow-hidden"
                        >
                            {/* Decorative particles */}
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                {[...Array(6)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{
                                            y: [-10, 10, -10],
                                            opacity: [0.1, 0.3, 0.1]
                                        }}
                                        transition={{
                                            duration: 2 + i,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                        className="absolute bg-pastel-mint-dark/20 rounded-full w-8 h-8"
                                        style={{
                                            left: `${Math.random() * 100}%`,
                                            top: `${Math.random() * 100}%`
                                        }}
                                    />
                                ))}
                            </div>

                            <div className="relative w-full overflow-hidden h-24 flex items-center justify-center">
                                <motion.div
                                    key={currentIndex}
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -20, opacity: 0 }}
                                    transition={{ duration: 0.05 }}
                                    className="text-2xl font-black text-slate-800 dark:text-zinc-100 text-center px-6"
                                >
                                    {pool[currentIndex]?.name}
                                </motion.div>
                                <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-slate-50 dark:from-zinc-800/50 to-transparent pointer-events-none" />
                                <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-slate-50 dark:from-zinc-800/50 to-transparent pointer-events-none" />
                            </div>

                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="mt-6 flex flex-col items-center"
                            >
                                <div className="w-12 h-1 bg-pastel-mint rounded-full mb-3" />
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t('randomizer.spinning')}</p>
                            </motion.div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="winner"
                            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', bounce: 0.5 }}
                            className="py-4"
                        >
                            <div className="bg-gradient-to-br from-pastel-peach/20 to-pastel-blue/20 dark:from-zinc-800 dark:to-zinc-800/50 rounded-[40px] p-8 border-2 border-dashed border-pastel-peach/50 dark:border-zinc-700 text-center relative overflow-hidden shadow-2xl shadow-pastel-peach/10">
                                {/* Success animations */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: 'spring' }}
                                    className="w-16 h-16 bg-white dark:bg-zinc-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                                >
                                    <Sparkles className="text-pastel-peach-darker" size={32} />
                                </motion.div>

                                <motion.span
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="inline-block py-1 px-4 bg-pastel-peach text-slate-800 text-[10px] font-black rounded-full uppercase tracking-widest mb-4 shadow-sm"
                                >
                                    {t('randomizer.winner')}
                                </motion.span>

                                <motion.h3
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-3xl font-black text-slate-800 dark:text-zinc-100 mb-3 leading-tight"
                                >
                                    {winner?.name}
                                </motion.h3>

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-zinc-400 mb-8"
                                >
                                    <MapPin size={14} className="text-pastel-blue-dark" />
                                    <span className="truncate max-w-[180px]">{winner?.address || t('recommendations.addressUnknown')}</span>
                                    {winner?.distance !== undefined && (
                                        <span className="font-bold text-slate-900 dark:text-zinc-200">
                                            · {winner.distance.toFixed(1)}km
                                        </span>
                                    )}
                                </motion.div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Button
                                        onClick={() => winner && onSelectRestaurant(winner.id)}
                                        className="py-4 text-sm flex items-center justify-center gap-2 shadow-lg"
                                    >
                                        <Utensils size={18} />
                                        {t('randomizer.viewWinner')}
                                    </Button>
                                    <button
                                        onClick={handleSpin}
                                        className="py-4 text-sm font-black text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100 transition-all flex items-center justify-center gap-2 rounded-2xl bg-white/50 dark:bg-zinc-700/50 hover:bg-white dark:hover:bg-zinc-700 border border-slate-100 dark:border-zinc-700 shadow-sm"
                                    >
                                        <RotateCcw size={18} />
                                        {t('randomizer.tryAgain')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
