// ─── Persistence seam ────────────────────────────────────────────────────────
// The store talks only to this adapter — never directly to a backend.
// Swap createStorageAdapter() contents to change backend; nothing else changes.
//
// HYDRATION GUARD: `hydrated` flag prevents the race condition where Zustand
// fires setItem with empty default state during store initialization (before
// getItem resolves), which would overwrite real data in Supabase.

import { createClient } from '@supabase/supabase-js'

export const STORAGE_KEY = 'meal-planner-v3'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null

export function createStorageAdapter() {
  if (!supabase) {
    console.info('[storage] Supabase not configured — using localStorage')
    return {
      getItem:    (name) => { const r = localStorage.getItem(name); return r ? JSON.parse(r) : null },
      setItem:    (name, value) => localStorage.setItem(name, JSON.stringify(value)),
      removeItem: (name) => localStorage.removeItem(name),
    }
  }

  let hydrated = false

  return {
    async getItem(_name) {
      const { data, error } = await supabase
        .from('plan_state')
        .select('data')
        .eq('id', 1)
        .maybeSingle()

      if (error) { console.error('[storage] getItem error', error); return null }

      const raw = data?.data ?? null
      if (raw === null) { hydrated = true; return null }

      let parsed
      if (typeof raw === 'string') {
        try { parsed = JSON.parse(raw) } catch { parsed = null }
      } else {
        parsed = raw
      }

      hydrated = true
      return parsed
    },

    async setItem(_name, value) {
      if (!hydrated) return

      const { error } = await supabase
        .from('plan_state')
        .upsert({ id: 1, data: JSON.stringify(value), updated_at: new Date().toISOString() })

      if (error) console.error('[storage] setItem error', error)
    },

    async removeItem(_name) {
      const { error } = await supabase.from('plan_state').delete().eq('id', 1)
      if (error) console.error('[storage] removeItem error', error)
    },
  }
}
