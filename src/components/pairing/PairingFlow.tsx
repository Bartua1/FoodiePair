import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../../lib/supabase';
import type { Profile, Pair } from '../../types';
import { Button } from '../ui/Button';
import { Share2, MessageSquare } from 'lucide-react';

export function PairingFlow() {
    const { user } = useUser();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [pairCode, setPairCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
            // We'll trigger joinPair automatically if we can
            // but we need to make sure the profile isn't already paired
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
            // navigator.share can be aborted by user, that's not really an error to show
            if (err instanceof Error && err.name !== 'AbortError') {
                console.error('Error sharing:', err);
                // Fallback to clipboard if share fails
                await navigator.clipboard.writeText(shareUrl);
                alert('Sharing failed. Invitation link copied to clipboard instead.');
            }
        }
    }

    function handleWhatsAppShare() {
        if (!user) return;
        // Force HTTPS for the share link
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
            // Logic Change: If the pair doesn't exist yet, we create it now
            // This happens if the inviter shared their link but never clicked "Create Pair"
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
                setError('Could not join or create pair.');
                setLoading(false);
                return;
            }

            // Link both profiles to the new pair
            await Promise.all([
                supabase.from('profiles').update({ pair_id: newPair.id }).eq('id', user.id),
                supabase.from('profiles').update({ pair_id: newPair.id }).eq('id', pairCode)
            ]);

            fetchProfile();
            setLoading(false);
            return;
        }

        // Update existing pair with user2_id (normal flow)
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

    if (loading) return <div className="p-8 text-center text-slate-400">Loading profile...</div>;

    if (profile?.pair_id) {
        return null; // Already paired
    }

    return (
        <div className="p-6 max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-pastel-mint">
            <h2 className="text-2xl font-bold mb-4 text-slate-800">Link with your Partner</h2>
            <p className="text-slate-600 mb-6">Connect with your partner to start tracking restaurants together.</p>

            <div className="space-y-6">
                <div>
                    <h3 className="font-semibold mb-2">Option 1: Start a Pair</h3>
                    <p className="text-sm text-slate-500 mb-3">Create a code to share with your partner.</p>
                    <div className="flex flex-col gap-2">
                        <Button onClick={createPair} className="w-full bg-pastel-peach hover:bg-opacity-80 text-slate-800">
                            Create Pair Code
                        </Button>
                        <div className="grid grid-cols-2 gap-2">
                            <Button onClick={handleWhatsAppShare} variant="ghost" className="flex items-center justify-center gap-2 text-[#25D366] border border-[#25D366]/20 bg-[#25D366]/5 hover:bg-[#25D366]/10">
                                <MessageSquare className="w-4 h-4" />
                                WhatsApp
                            </Button>
                            <Button onClick={handleShare} variant="ghost" className="flex items-center justify-center gap-2 text-slate-600 border border-slate-200">
                                <Share2 className="w-4 h-4" />
                                System Share
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-slate-200"></div>
                    <span className="relative bg-white px-2 text-xs text-slate-400 mx-auto block w-fit">OR</span>
                </div>

                <div>
                    <h3 className="font-semibold mb-2">Option 2: Enter Pair Code</h3>
                    <p className="text-sm text-slate-500 mb-3">Paste the code your partner shared.</p>
                    <input
                        type="text"
                        value={pairCode}
                        onChange={(e) => setPairCode(e.target.value)}
                        placeholder="Paste code here..."
                        className="w-full p-3 rounded-xl border border-slate-200 mb-3 focus:outline-none focus:ring-2 focus:ring-pastel-mint"
                    />
                    {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
                    <Button onClick={joinPair} className="w-full bg-pastel-blue hover:bg-opacity-80 text-slate-800">
                        Join Pair
                    </Button>
                </div>

                {user && !profile?.pair_id && (
                    <div className="mt-8 p-4 bg-pastel-lavender rounded-xl">
                        <p className="text-xs font-bold uppercase text-slate-500 mb-1">Your Code (share this):</p>
                        <code className="text-sm break-all text-slate-700">{user.id}</code>
                    </div>
                )}
            </div>
        </div>
    );
}
