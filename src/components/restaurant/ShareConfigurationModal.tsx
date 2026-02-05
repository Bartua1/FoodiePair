import { useState, useEffect, useMemo } from 'react';
import { X, Copy, Share2, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import type { Restaurant, Profile } from '../../types';

interface ShareConfigurationModalProps {
    isOpen: boolean;
    onClose: () => void;
    restaurant: Restaurant;
    currentUser: Profile | null;
}

export function ShareConfigurationModal({ isOpen, onClose, restaurant, currentUser }: ShareConfigurationModalProps) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const [existingShares, setExistingShares] = useState<any[]>([]);

    // Configuration State
    const [config, setConfig] = useState({
        allow_comments: true,
        allow_photos: true,
        show_photos: true,
        show_ratings: true,
        show_comments: true,
        theme: 'light'
    });

    // For now we default to public, logic to add specific users can be added later
    // const [isPublic, setIsPublic] = useState(true);
    const isPublic = true;
    // TODO: Add user selection for restricted sharing

    useEffect(() => {
        if (isOpen && currentUser) {
            // Fetch existing shares on mount
            const fetchShares = async () => {
                const { data } = await supabase
                    .from('shared_restaurants')
                    .select('*')
                    .eq('restaurant_id', restaurant.id)
                    .eq('created_by', currentUser.id);
                if (data) {
                    setExistingShares(data);
                }
            };
            fetchShares();
        } else if (!isOpen) {
            setGeneratedLink(null);
            setCopied(false);
        }
    }, [isOpen, currentUser, restaurant.id]);

    // Live calculation of matching share
    const matchingShare = useMemo(() => {
        return existingShares.find(share => {
            const shareConfig = share.configuration;
            return (
                share.is_public === isPublic &&
                JSON.stringify(shareConfig) === JSON.stringify(config)
            );
        });
    }, [existingShares, config, isPublic]);

    const handleCreateLink = async () => {
        if (!currentUser) return;

        // If we already have a match locally, just use it (redundant check but safe)
        if (matchingShare) {
            const link = `${window.location.origin}/foodiepair/shared/${matchingShare.id}`;
            setGeneratedLink(link);
            return;
        }

        setLoading(true);

        try {
            // Create new
            const { data, error } = await supabase
                .from('shared_restaurants')
                .insert({
                    restaurant_id: restaurant.id,
                    created_by: currentUser.id,
                    configuration: config,
                    is_public: isPublic
                })
                .select()
                .single();

            if (data && !error) {
                const link = `${window.location.origin}/foodiepair/shared/${data.id}`;
                setGeneratedLink(link);
                // Update local list
                setExistingShares([...existingShares, data]);
            } else {
                console.error('Error creating share link:', error);
            }
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (text?: string) => {
        const textToCopy = text || generatedLink;
        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <Share2 size={20} className="text-pastel-blue" />
                        {t('share.title')}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {!generatedLink ? (
                        <>
                            <div className="space-y-4">
                                <h4 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">{t('share.parameters')}</h4>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">{t('share.showPhotos')}</span>
                                        <input
                                            type="checkbox"
                                            checked={config.show_photos}
                                            onChange={(e) => setConfig({ ...config, show_photos: e.target.checked })}
                                            className="w-5 h-5 accent-pastel-blue rounded"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">{t('share.showRatings')}</span>
                                        <input
                                            type="checkbox"
                                            checked={config.show_ratings}
                                            onChange={(e) => setConfig({ ...config, show_ratings: e.target.checked })}
                                            className="w-5 h-5 accent-pastel-blue rounded"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">{t('share.showComments')}</span>
                                        <input
                                            type="checkbox"
                                            checked={config.show_comments}
                                            onChange={(e) => setConfig({ ...config, show_comments: e.target.checked })}
                                            className="w-5 h-5 accent-pastel-blue rounded"
                                        />
                                    </div>
                                    <div className="h-px bg-slate-100 my-2"></div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">{t('share.allowPhotos')}</span>
                                        <input
                                            type="checkbox"
                                            checked={config.allow_photos}
                                            onChange={(e) => setConfig({ ...config, allow_photos: e.target.checked })}
                                            className="w-5 h-5 accent-pastel-blue rounded"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">{t('share.allowComments')}</span>
                                        <input
                                            type="checkbox"
                                            checked={config.allow_comments}
                                            onChange={(e) => setConfig({ ...config, allow_comments: e.target.checked })}
                                            className="w-5 h-5 accent-pastel-blue rounded"
                                        />
                                    </div>
                                </div>
                            </div>



                            {matchingShare ? (
                                <div className="space-y-2 animate-in fade-in duration-300">
                                    <div className="bg-green-50 text-green-700 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
                                        <Check size={14} />
                                        {t('share.existingLinkFound')}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={`${window.location.origin}/foodiepair/shared/${matchingShare.id}`}
                                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600 focus:outline-none"
                                        />
                                        <button
                                            onClick={() => handleCopy(`${window.location.origin}/foodiepair/shared/${matchingShare.id}`)}
                                            className={`p-3 rounded-xl transition-all ${copied ? 'bg-green-500 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                                            title="Copy Link"
                                        >
                                            {copied ? <Check size={20} /> : <Copy size={20} />}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <Button
                                    onClick={handleCreateLink}
                                    disabled={loading}
                                    className="w-full bg-pastel-blue text-slate-800 font-bold py-3 rounded-xl disabled:opacity-50"
                                >
                                    {loading ? t('share.creatingLink') : t('share.createLink')}
                                </Button>
                            )}
                        </>
                    ) : (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                            <div className="text-center space-y-2">
                                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <Check size={24} />
                                </div>
                                <h4 className="font-bold text-slate-800">{t('share.linkReady')}</h4>
                                <p className="text-sm text-slate-500">{t('share.linkReadySubtitle')}</p>
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={generatedLink}
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600 focus:outline-none"
                                />
                                <button
                                    onClick={() => handleCopy()}
                                    className={`p-3 rounded-xl transition-all ${copied ? 'bg-green-500 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                                >
                                    {copied ? <Check size={20} /> : <Copy size={20} />}
                                </button>
                            </div>

                            <Button
                                onClick={onClose}
                                variant="ghost"
                                className="w-full text-slate-500"
                            >
                                {t('share.close')}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
