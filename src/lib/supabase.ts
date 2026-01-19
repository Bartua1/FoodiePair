import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const setSupabaseToken = (token: string) => {
    supabase.realtime.setAuth(token);
    // @ts-ignore - access internal headers
    supabase.rest.headers['Authorization'] = `Bearer ${token}`;
}
