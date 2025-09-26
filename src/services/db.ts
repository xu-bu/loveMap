import { createClient, SupabaseClient} from '@supabase/supabase-js'

// Singleton Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
let supabaseClient:SupabaseClient

export function getSupabaseClient(){
    if(supabaseClient) return supabaseClient
    supabaseClient=createClient(supabaseUrl, supabaseAnonKey)
    return supabaseClient
}