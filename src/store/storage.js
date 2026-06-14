// ─── Persistence seam ────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js'

export const STORAGE_KEY = 'meal-planner-v3'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null

export function createStorageAdapter() {
  if (!supabase) {
    console.warn('[storage] ⚠️ No Supabase env vars — falling back to localStorage')
    return {
      getItem:    (name) => { const r = localStorage.getItem(name); return r ? JSON.parse(r) : null },
      setItem:    (name, value) => localStorage.setItem(name, JSON.stringify(value)),
      removeItem: (name) => localStorage.removeItem(name),
    }
  }

  console.log('[storage] ✅ Supabase adapter active —', supabaseUrl)

  let hydrated = false

  return {
    async getItem(_name) {
      console.log('[storage] getItem called, hydrated=', hydrated)
      const { data, error } = await supabase
        .from('plan_state')
        .select('data')
        .eq('id', 1)
        .maybeSingle()

      if (error) {
        console.error('[storage] getItem ERROR:', error)
        return null
      }

      const raw = data?.data ?? null
      console.log('[storage] getItem raw type:', typeof raw, '| value snippet:', String(raw).slice(0, 80))

      if (raw === null) {
        console.log('[storage] getItem → no row yet, returning null')
        hydrated = true
        return null
      }

      let parsed
      if (typeof raw === 'string') {
        try { parsed = JSON.parse(raw) } catch (e) { console.error('[storage] JSON.parse failed:', e); return null }
      } else {
        parsed = raw   // jsonb column returns object directly
      }

      console.log('[storage] getItem → parsed OK, keys:', Object.keys(parsed?.state ?? {}))
      hydrated = true
      return parsed
    },

    async setItem(_name, value) {
      console.log('[storage] setItem called, hydrated=', hydrated, '| customIngredients keys:', Object.keys(value?.state?.customIngredients ?? {}))
      if (!hydrated) {
        console.log('[storage] setItem SKIPPED (not hydrated yet)')
        return
      }

      const { error } = await supabase
        .from('plan_state')
        .upsert({
          id:         1,
          data:       JSON.stringify(value),
          updated_at: new Date().toISOString(),
        })

      if (error) {
        console.error('[storage] setItem ERROR:', error)
      } else {
        console.log('[storage] setItem ✅ saved to Supabase')
      }
    },

    async removeItem(_name) {
      const { error } = await supabase.from('plan_state').delete().eq('id', 1)
      if (error) console.error('[storage] removeItem ERROR:', error)
    },
  }
}
