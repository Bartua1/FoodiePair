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
                try {
                    const token = await getToken({ template: 'supabase' });
                    if (token) {
                        setSupabaseToken(token);
                        console.log('Supabase token set from Clerk');
                    } else {
                        console.warn('No Supabase token returned from Clerk');
                    }
                } catch (e) {
                    console.error('Error fetching Supabase token from Clerk:', e);
                }

                console.log('Fetching profile for:', user.id, 'from URL:', import.meta.env.VITE_SUPABASE_URL);

                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                const profile = data as Profile | null;

                if (error && error.code === 'PGRST116') {
                    console.log('Profile missing, attempting to create...');
                    // Profile doesn't exist, create it
                    const { error: insertError } = await supabase.from('profiles').insert({
                        id: user.id,
                        display_name: user.fullName || user.username || 'User',
                        language: 'es',
                        theme: 'light',
                    });

                    if (insertError) {
                        console.error('CRITICAL: Error creating profile:', {
                            message: insertError.message,
                            code: insertError.code,
                            details: insertError.details,
                            hint: insertError.hint
                        });
                    } else {
                        console.log('Profile created successfully for:', user.id);
                    }
                } else if (error) {
                    console.error('Error fetching profile:', {
                        message: error.message,
                        code: error.code,
                        details: error.details,
                        status: error.hint
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
