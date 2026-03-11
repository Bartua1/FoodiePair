import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../../lib/supabase';
import type { Profile, Pair } from '../../types';
import { Share2, MessageSquare, ArrowRight, Sparkles, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

export function PairingFlow() {
    const { user } = useUser();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [pairCode, setPairCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
    const { t } = useTranslation();

    useEffect(() => {
        if (user) {
            fetchProfile();
            checkJoinLink();
        }
    }, [user]);

    async function checkJoinLink() {
        const params = new URLSearchParams(window.location.search);
        const joinId = params.get('join');
        if (joinId && joinId !== user?.id) {
            setPairCode(joinId);
            setActiveTab('join');
        }
    }

    // Effect to trigger auto-join when pairCode is set from URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const joinId = params.get('join');
        if (joinId && pairCode === joinId && profile && !profile.pair_id && !loading) {
            joinPair();
            // Clear URL param after trying to join
            const newUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    }, [pairCode, profile, loading]);

    async function fetchProfile() {
        if (!user) return;
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id);

        const myProfile = data?.[0] as Profile | null;
        setProfile(myProfile);
        setLoading(false);
    }

    async function createPair() {
        if (!user) return;
        setLoading(true);
        // User A creates a pair and becomes user1
        const { data: newPairData } = await supabase
            .from('pairs')
            .insert({ user1_id: user.id })
            .select();

        const newPair = newPairData?.[0] as Pair | null;

        if (newPair) {
            await supabase
                .from('profiles')
                .update({ pair_id: newPair.id })
                .eq('id', user.id);

            fetchProfile();
        }
        setLoading(false);
    }

    async function handleShare() {
        if (!user) return;

        // Force HTTPS for the share link
        const shareUrl = `${window.location.origin.replace('http:', 'https:')}${window.location.pathname}?join=${user.id}`;
        const shareData = {
            title: 'Join my FoodiePair!',
            text: 'Connect with me on FoodiePair to track our restaurant adventures together!',
            url: shareUrl,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(shareUrl);
                alert('Invitation link copied to clipboard!');
            }
        } catch (err) {
            if (err instanceof Error && err.name !== 'AbortError') {
                console.error('Error sharing:', err);
                await navigator.clipboard.writeText(shareUrl);
                alert('Sharing failed. Invitation link copied to clipboard instead.');
            }
        }
    }

    function handleWhatsAppShare() {
        if (!user) return;
        const shareUrl = `${window.location.origin.replace('http:', 'https:')}${window.location.pathname}?join=${user.id}`;
        const message = encodeURIComponent(`Connect with me on FoodiePair to track our restaurant adventures together! ${shareUrl}`);
        window.open(`https://wa.me/?text=${message}`, '_blank');
    }

    async function joinPair() {
        if (!user || !pairCode) return;
        setLoading(true);
        setError(null);

        // find the pair where user1_id is pairCode
        const { data: existingPairs, error: findError } = await supabase
            .from('pairs')
            .select('*')
            .eq('user1_id', pairCode)
            .is('user2_id', null);

        const existingPair = existingPairs?.[0] as Pair | null;

        if (findError || !existingPair) {
            const { data: newPairData, error: createError } = await supabase
                .from('pairs')
                .insert({
                    user1_id: pairCode,
                    user2_id: user.id
                })
                .select();

            const newPair = newPairData?.[0] as Pair | null;

            if (createError || !newPair) {
                console.error('Error creating pair on the fly:', createError);
                setError(t('pairing.invalidError'));
                setLoading(false);
                return;
            }

            await Promise.all([
                supabase.from('profiles').update({ pair_id: newPair.id }).eq('id', user.id),
                supabase.from('profiles').update({ pair_id: newPair.id }).eq('id', pairCode)
            ]);

            fetchProfile();
            setLoading(false);
            return;
        }

        const { error: updatePairError } = await supabase
            .from('pairs')
            .update({ user2_id: user.id })
            .eq('id', existingPair.id);

        if (!updatePairError) {
            await supabase
                .from('profiles')
                .update({ pair_id: existingPair.id })
                .eq('id', user.id);

            fetchProfile();
        }
        setLoading(false);
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-transparent">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full mb-4"
                />
                <p className="text-slate-500 font-medium tracking-wide animate-pulse">{t('pairing.loading')}</p>
            </div>
        );
    }

    if (profile?.pair_id) {
        return null;
    }

    const containerVariants = {
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        visible: { 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: { 
                type: "spring" as const,
                stiffness: 100,
                damping: 20,
                staggerChildren: 0.1,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } }
    };

    return (
        <div className="flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 w-full -mt-16 sm:-mt-24">
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="w-full max-w-lg relative group"
            >
                {/* Premium Animated Background */}
                <div className="absolute -inset-0.5 bg-gradient-to-br from-pastel-peach via-pastel-mint to-pastel-blue rounded-[2.5rem] opacity-30 group-hover:opacity-60 blur-2xl transition duration-1000"></div>
                
                <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-8 sm:p-10 border border-white/50 dark:border-slate-800/50 overflow-hidden">
                    
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-pastel-mint/20 rounded-full blur-3xl pointer-events-none"></div>

                    <motion.div variants={itemVariants} className="mb-10 text-center relative z-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-slate-900 text-white shadow-xl mb-6 shadow-slate-900/20 rotate-3 hover:rotate-6 transition-transform">
                            <Sparkles className="w-8 h-8" strokeWidth={1.5} />
                        </div>
                        <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-none mb-4 dark:text-white">
                            {t('pairing.heroTitle1', 'It takes')} <br/>
                            <span className="text-slate-800 dark:text-slate-200">{t('pairing.heroTitle2', 'two.')}</span>
                        </h2>
                        <p className="text-slate-500 text-lg sm:text-xl font-medium max-w-xs mx-auto dark:text-slate-400 leading-snug">
                            {t('pairing.heroSubtitle', 'Sync your tastes, build a shared wishlist, and map your culinary journey.')}
                        </p>
                    </motion.div>

                    <motion.div variants={itemVariants} className="flex p-1 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl mb-8 relative z-10">
                        <button
                            onClick={() => setActiveTab('create')}
                            className={`flex-1 py-3 px-4 text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'create' ? 'bg-white text-slate-900 shadow-md dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <Share2 className="w-4 h-4" /> {t('pairing.tabStart', 'Start')}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('join')}
                            className={`flex-1 py-3 px-4 text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'join' ? 'bg-white text-slate-900 shadow-md dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <UserPlus className="w-4 h-4" /> {t('pairing.tabLink', 'Link')}
                            </span>
                        </button>
                    </motion.div>

                    <div className="relative z-10 min-h-[220px]">
                        <AnimatePresence mode="wait">
                            {activeTab === 'create' ? (
                                <motion.div
                                    key="create"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-6"
                                >
                                    <div className="text-center">
                                        <h3 className="text-xl font-bold text-slate-800 mb-2 dark:text-slate-100">{t('pairing.option1Title', "Create your hub")}</h3>
                                        <p className="text-slate-500 text-sm">{t('pairing.option1Subtitle', "Generate a secure link to invite your partner.")}</p>
                                    </div>

                                    <div className="space-y-3">
                                        <button 
                                            onClick={createPair} 
                                            className="w-full group relative flex items-center justify-center gap-3 py-4 px-6 bg-slate-900 text-white rounded-2xl font-bold text-lg overflow-hidden shadow-xl shadow-slate-900/20 hover:scale-[1.02] hover:shadow-slate-900/30 transition-all active:scale-[0.98]"
                                        >
                                            <span className="relative z-10 flex items-center gap-2">
                                                {t('pairing.createButton', "Generate Link")} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </span>
                                            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        </button>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                            <button 
                                                onClick={handleWhatsAppShare} 
                                                className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#25D366]/10 text-[#25D366] font-bold text-sm hover:bg-[#25D366]/20 transition-colors"
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                                {t('pairing.whatsapp', 'WhatsApp')}
                                            </button>
                                            <button 
                                                onClick={handleShare} 
                                                className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-colors dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                            >
                                                <Share2 className="w-4 h-4" />
                                                {t('pairing.share', 'Share')}
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {user && !profile?.pair_id && (
                                        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{t('pairing.yourCode', "Manual Link Code")}</p>
                                            <div className="inline-block px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-lg selection:bg-teal-200">
                                                <code className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400 break-all">{user.id}</code>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="join"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-6"
                                >
                                    <div className="text-center">
                                        <h3 className="text-xl font-bold text-slate-800 mb-2 dark:text-slate-100">{t('pairing.option2Title', "Have an invite?")}</h3>
                                        <p className="text-slate-500 text-sm">{t('pairing.option2Subtitle', "Paste your partner's manual link code below.")}</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                value={pairCode}
                                                onChange={(e) => setPairCode(e.target.value)}
                                                placeholder={t('pairing.placeholder', "Paste partner code here...")}
                                                className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-slate-200 dark:focus:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 font-mono text-center text-sm outline-none transition-all shadow-inner"
                                            />
                                            {error && (
                                                <motion.p 
                                                    initial={{ opacity: 0, y: -10 }} 
                                                    animate={{ opacity: 1, y: 0 }} 
                                                    className="absolute -bottom-6 left-0 right-0 text-red-500 text-xs font-bold text-center"
                                                >
                                                    {error}
                                                </motion.p>
                                            )}
                                        </div>

                                        <button 
                                            onClick={joinPair} 
                                            disabled={!pairCode.trim()}
                                            className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-xl shadow-slate-900/20 disabled:opacity-50 disabled:shadow-none hover:scale-[1.02] hover:shadow-slate-900/30 transition-all active:scale-[0.98]"
                                        >
                                            {t('pairing.joinButton', "Connect Accounts")}
                                        </button>
                                    </div>
                                    
                                    <div className="flex justify-center mt-6">
                                        <div className="w-16 h-1 rounded-full bg-slate-200 dark:bg-slate-800/50"></div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

