import { useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { supabase, setSupabaseToken } from '../../lib/supabase';
import type { Profile } from '../../types';

export function UserSync({ children }: { children: React.ReactNode }) {
    const { isLoaded, isSignedIn, user } = useUser();
    const { getToken } = useAuth();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        async function syncUser() {
            if (isLoaded && isSignedIn && user) {
                // Get Clerk token for Supabase
                const token = await getToken({ template: 'supabase' });
                if (token) {
                    setSupabaseToken(token);
                }

                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                const profile = data as Profile | null;

                if (error && error.code === 'PGRST116') {
                    // Profile doesn't exist, create it
                    await supabase.from('profiles').insert({
                        id: user.id,
                        display_name: user.fullName || user.username || 'User',
                        language: 'es',
                        theme: 'light',
                    });
                } else if (profile) {
                    // Update display name if changed
                    const currentName = user.fullName || user.username || 'User';
                    if (profile.display_name !== currentName) {
                        await supabase
                            .from('profiles')
                            .update({ display_name: currentName })
                            .eq('id', user.id);
                    }
                }
                setReady(true);
            }
        }

        syncUser();
    }, [isLoaded, isSignedIn, user]);

    if (!ready) return <div className="flex-1 flex items-center justify-center font-medium text-slate-400">Syncing with server...</div>;

    return <>{children}</>;
}
