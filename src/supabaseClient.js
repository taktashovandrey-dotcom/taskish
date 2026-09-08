import { createClient } from '@supabase/supabase-js'

let supabase = null

export function initSupabase(url, key) {
  if (!url || !key) return null
  supabase = createClient(url, key)
  return supabase
}

export function getSupabase() {
  return supabase
}

// Auto-initialize from Vite env if available (useful for deploys that inject VITE_SUPABASE_* vars)
if (!supabase && typeof import.meta !== 'undefined' && import.meta.env) {
  const url = import.meta.env.VITE_SUPABASE_URL || ''
  const key = import.meta.env.VITE_SUPABASE_KEY || ''
  if (url && key) initSupabase(url, key)
}
