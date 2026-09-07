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
