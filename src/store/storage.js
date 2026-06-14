// ─── Persistence seam ────────────────────────────────────────────────────────
// The store talks only to this adapter — never directly to a backend.
// Swap createStorageAdapter() contents to change backend; nothing else changes.

import { createClient } from '@supabase/supabase-js'

export const STORAGE_KEY = 'meal-planner-v3'

// ── Supabase client (shared singleton) ───────────────────────────────────────
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null

// ── Adapter ───────────────────────────────────────────────────────────────────
// Zustand's newImpl persist path passes a raw JS object { state, version } to
// setItem, and expects getItem to return that same object (not a JSON string).
// We handle serialization manually so it works regardless of column type.
//
// CRITICAL: `hydrated` flag prevents the race condition where setItem fires
// with empty default state during store initialization (before getItem resolves),
// which would overwrite the real persisted data in Supabase.

export function createStorageAdapter() {
  if (!supabase) {
    console.info('[storage] Supabase not configured — using localStorage')
    return {
      getItem:    (name)        => {
        const raw = localStorage.getItem(name)
        if (!raw) return null
        try { return JSON.parse(raw) } catch { return null }
      },
      setItem:    (name, value) => localStorage.setItem(name, JSON.stringify(value)),
      removeItem: (name)        => localStorage.removeItem(name),
    }
  }

  // Gate: block all writes until after the first successful read completes.
  // This prevents empty initial state from overwriting real data.
  let hydrated = false

  return {
    async getItem(_name) {
      const { data, error } = await supabase
        .from('plan_state')
        .select('data')
        .eq('id', 1)
        .maybeSingle()

      if (error) {
        console.error('[storage] getItem error', error)
        return null
      }

      const raw = data?.data ?? null
      if (raw === null) {
        // No row yet — allow writes immediately
        hydrated = true
        return null
      }

      // data column is text → Supabase returns a JSON string; parse it.
      // data column is jsonb → Supabase returns an object; pass it through.
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
      if (!hydrated) {
        // Drop writes that fire before hydration completes.
        // Once getItem resolves and sets hydrated=true, Zustand calls setItem
        // with the correctly merged state — that write is the one we want.
        return
      }

      const { error } = await supabase
        .from('plan_state')
        .upsert({
          id:         1,
          data:       JSON.stringify(value),   // always store as JSON string
          updated_at: new Date().toISOString(),
        })

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
