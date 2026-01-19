import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types';

export function UserSync({ children }: { children: React.ReactNode }) {
    const { isLoaded, isSignedIn, user } = useUser();

    useEffect(() => {
        async function syncUser() {
            if (isLoaded && isSignedIn && user) {
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
            }
        }

        syncUser();
    }, [isLoaded, isSignedIn, user]);

    return <>{children}</>;
}
