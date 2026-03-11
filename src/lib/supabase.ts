import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
}

// Global token state for the custom fetch wrapper
let activeToken: string | null = null;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
        fetch: async (url, options = {}) => {
            const headers = new Headers(options?.headers);
            if (activeToken) {
                headers.set('Authorization', `Bearer ${activeToken}`);
            }
            return fetch(url, { ...options, headers });
        }
    }
})

export const setSupabaseToken = (token: string | null) => {
    activeToken = token;
    if (token) {
        supabase.realtime.setAuth(token);
    }
}
