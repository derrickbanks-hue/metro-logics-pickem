import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill in your project values.',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Current season this app is scoring. Bump this each year.
export const SEASON = Number(import.meta.env.VITE_SEASON ?? new Date().getFullYear())
