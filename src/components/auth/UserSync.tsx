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

                        // Debugging: Decode token payload
                        try {
                            const payload = JSON.parse(atob(token.split('.')[1]));
                            console.log('JWT Identity (must match sub):', payload.sub);
                        } catch (e) {
                            console.warn('Could not decode JWT payload');
                        }
                    } else {
                        console.warn('No Supabase token returned from Clerk. Check JWT Template.');
                    }
                } catch (e) {
                    console.error('Error fetching Supabase token from Clerk:', e);
                }

                console.log('Fetching profile for:', user.id);

                // Using select instead of .single() to avoid 406 errors on 0 rows
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id);

                const profile = data?.[0] as Profile | null;

                if (error) {
                    console.error('Error fetching profile:', error);
                } else if (!profile) {
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
                    // Update display name or avatar if changed
                    const currentName = user.fullName || user.username || 'User';
                    const currentAvatar = user.imageUrl;

                    if (profile.display_name !== currentName || profile.avatar_url !== currentAvatar) {
                        await supabase
                            .from('profiles')
                            .update({
                                display_name: currentName,
                                avatar_url: currentAvatar
                            })
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
