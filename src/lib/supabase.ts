import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
}

// Global variable to store the token
let supabaseAccessToken: string | null = null;

const customFetch = async (url: RequestInfo | URL, options: RequestInit = {}) => {
    const headers = new Headers(options.headers);

    if (supabaseAccessToken) {
        headers.set('Authorization', `Bearer ${supabaseAccessToken}`);
    }

    return fetch(url, { ...options, headers });
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
        fetch: customFetch
    }
})

export const setSupabaseToken = (token: string) => {
    supabaseAccessToken = token;

    // Keep this for realtime, as it might use websockets which don't use the fetch wrapper
    supabase.realtime.setAuth(token);
}
