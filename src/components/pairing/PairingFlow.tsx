import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../../lib/supabase';
import type { Profile, Pair } from '../../types';
import { Button } from '../ui/Button';

export function PairingFlow() {
    const { user } = useUser();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [pairCode, setPairCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    async function fetchProfile() {
        if (!user) return;
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        setProfile(data as Profile | null);
        setLoading(false);
    }

    async function createPair() {
        if (!user) return;
        setLoading(true);
        // User A creates a pair and becomes user1
        const { data: newPairData } = await supabase
            .from('pairs')
            .insert({ user1_id: user.id })
            .select()
            .single();

        const newPair = newPairData as Pair | null;

        if (newPair) {
            await supabase
                .from('profiles')
                .update({ pair_id: newPair.id })
                .eq('id', user.id);

            fetchProfile();
        }
        setLoading(false);
    }

    async function joinPair() {
        if (!user || !pairCode) return;
        setLoading(true);
        setError(null);

        // find the pair where user1_id is pairCode
        const { data: existingPairData, error: findError } = await supabase
            .from('pairs')
            .select('*')
            .eq('user1_id', pairCode)
            .is('user2_id', null)
            .single();

        const existingPair = existingPairData as Pair | null;

        if (findError || !existingPair) {
            setError('Invalid pair code or pair is full.');
            setLoading(false);
            return;
        }

        // Update pair with user2_id
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
                    <Button onClick={createPair} className="w-full bg-pastel-peach hover:bg-opacity-80 text-slate-800">
                        Create Pair Code
                    </Button>
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
