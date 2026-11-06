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

export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null

export let syncError = null
function report(error) {
  syncError = error
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(error ? 'syncError' : 'syncSuccess', { detail: error }))
}

export function createStorageAdapter(client = supabase) {
  if (!client) {
    console.info('[storage] Supabase not configured — using localStorage')
    return {
      getItem:    (name) => { const r = localStorage.getItem(name); return r ? JSON.parse(r) : null },
      setItem:    (name, value) => localStorage.setItem(name, JSON.stringify(value)),
      removeItem: (name) => localStorage.removeItem(name),
    }
  }

  let hydrated = false
  let exists = false
  let version = null
  let lastRaw = null
  let pending = null
  let writing = false
  let conflict = false
  let writeSeq = 0
  let readSeq = 0

  if (typeof window !== 'undefined') window.addEventListener('beforeunload', e => {
    if (pending || writing) { e.preventDefault(); e.returnValue = '' }
  })

  async function flush() {
    if (writing || conflict || !hydrated) return
    writing = true
    try {
      while (pending) {
        const raw = pending
        const updated_at = new Date(Math.max(Date.now(), (Date.parse(version) || 0) + 1)).toISOString()
        const table = client.from('plan_state')
        let request
        if (exists) {
          const update = table.update({ data: raw, updated_at }).eq('id', 1)
          request = version == null ? update.is('updated_at', null) : update.eq('updated_at', version)
        } else {
          request = table.insert({ id: 1, data: raw, updated_at })
        }
        const { data, error } = await request.select('updated_at')
        if (error?.code === '23505' || (!error && data?.length !== 1)) {
          conflict = true
          throw new Error('Another device changed this plan. Download your local copy before reloading.')
        }
        if (error) throw error
        exists = true
        version = data[0].updated_at
        lastRaw = raw
        if (pending === raw) pending = null
        report(null)
      }
    } catch (error) {
      report(error)
    } finally {
      writing = false
    }
  }

  return {
    async getItem() {
      if (writing || conflict) return null
      if (hydrated && pending) { await flush(); return null }
      const start = writeSeq, read = ++readSeq
      try {
        const { data, error } = await client.from('plan_state').select('data,updated_at').eq('id', 1).limit(1)
        if (read !== readSeq || start !== writeSeq || writing) return null
        if (error) throw error
        const row = data?.[0]
        const raw = row && (typeof row.data === 'string' ? row.data : JSON.stringify(row.data))
        const parsed = row ? JSON.parse(raw) : null
        if (row && !parsed?.state) throw new Error('Shared plan could not be read.')
        if (pending) {
          conflict = true
          throw new Error('Local edits preceded the first successful read. Download your copy before reloading.')
        }
        exists = !!row
        version = row?.updated_at ?? null
        hydrated = true
        report(null)
        if (raw === lastRaw) return null
        lastRaw = raw
        return parsed
      } catch (error) { report(error); return null }
    },

    async setItem(_name, value) {
      const raw = JSON.stringify(value)
      if (!pending && raw === lastRaw) return
      ++writeSeq
      pending = raw
      if (!hydrated) { report(new Error('Waiting for a successful read before saving local changes.')); return }
      await flush()
    },

    async removeItem() {
      if (!hydrated || !exists || writing || pending || conflict) return
      const query = client.from('plan_state').delete().eq('id', 1)
      const { data, error } = await (version == null ? query.is('updated_at', null) : query.eq('updated_at', version)).select('id')
      if (error || data?.length !== 1) { report(error ?? new Error('The shared plan changed before deletion.')); return }
      exists = false
      lastRaw = version = null
    },
  }
}
