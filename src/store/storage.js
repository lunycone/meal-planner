// ─── Persistence seam ────────────────────────────────────────────────────────
// The store talks only to this adapter — never directly to a backend.
// Swap createStorageAdapter() contents to change backend; nothing else changes.

import { createClient } from '@supabase/supabase-js'

export const STORAGE_KEY = 'meal-planner-v3'

// ── Supabase client (shared singleton) ───────────────────────────────────────
const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null

// ── Adapter ───────────────────────────────────────────────────────────────────
// Zustand persist calls getItem/setItem/removeItem with the storage key.
// We store the entire serialized state as a single text row (id = 1).

export function createStorageAdapter() {
  if (!supabase) {
    // Fallback: localStorage (no env vars set → local dev without Supabase)
    console.info('[storage] Supabase not configured — using localStorage')
    return {
      getItem:    (name)        => localStorage.getItem(name),
      setItem:    (name, value) => localStorage.setItem(name, value),
      removeItem: (name)        => localStorage.removeItem(name),
    }
  }

  return {
    async getItem(_name) {
      const { data, error } = await supabase
        .from('plan_state')
        .select('data')
        .eq('id', 1)
        .maybeSingle()

      if (error) { console.error('[storage] getItem error', error); return null }
      return data?.data ?? null
    },

    async setItem(_name, value) {
      const { error } = await supabase
        .from('plan_state')
        .upsert({ id: 1, data: value, updated_at: new Date().toISOString() })

      if (error) console.error('[storage] setItem error', error)
    },

    async removeItem(_name) {
      const { error } = await supabase
        .from('plan_state')
        .delete()
        .eq('id', 1)

      if (error) console.error('[storage] removeItem error', error)
    },
  }
}
