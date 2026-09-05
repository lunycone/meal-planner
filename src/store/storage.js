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
let lastSyncError = null

  // 5 sep 2026 -- setItem es async (round-trip de red); si el usuario recarga
  // la pagina para "comprobar que se guardo" ANTES de que esa promesa
  // resuelva, el navegador cancela el fetch a medio camino y ese guardado no
  // llega nunca a Supabase -- sin ningun aviso, porque no habia nada
  // avisando de que aun quedaba un guardado en vuelo. pendingWrites cuenta
  // los setItem en curso; el beforeunload de abajo avisa si se intenta salir
  // con alguno todavia pendiente.
  let pendingWrites = 0
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', (e) => {
      if (pendingWrites > 0) {
        e.preventDefault()
        e.returnValue = ''
      }
    })
  }

  return {
    // 5 sep 2026 -- INVESTIGACION "cargar semana modelo no se guarda":
    // .eq('id', 1).maybeSingle() exige que exista COMO MUCHO una fila con
    // id=1 -- si esa columna no tiene una restriccion UNIQUE/PRIMARY KEY de
    // verdad en la tabla (algo que no puedo comprobar desde aqui, solo desde
    // el dashboard de Supabase), upsert() de mas abajo no actualiza esa fila,
    // INSERTA UNA FILA NUEVA cada vez que alguien guarda. La escritura en si
    // "funciona" (no da error), pero en cuanto hay 2+ filas con id=1,
    // maybeSingle() empieza a fallar con "multiple rows returned" -- y esta
    // funcion las trata igual que un error de red: devuelve null, osea
    // estado vacio, SIEMPRE, desde ese momento en adelante. Encaja con lo
    // reportado: "cargo una semana... y al recargar esta vacio" -- no solo
    // esta vez, sino cualquier vez despues de que exista esa duplicidad.
    // Mientras se confirma/corrige la restriccion en Supabase (ver aviso al
    // usuario), pedimos la MAS RECIENTE en vez de exigir que sea unica --
    // asi la lectura se autocura aunque existan duplicados de antes.
    async getItem(_name) {
      const { data, error } = await supabase
        .from('plan_state')
        .select('data')
        .eq('id', 1)
        .order('updated_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error('[storage] getItem error', error)
        hydrated = true  // Allow writes even if initial read failed
        return null
      }

      const raw = data?.[0]?.data ?? null
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

      pendingWrites++
      try {
        // onConflict explicito: si "id" NO tiene de verdad una restriccion
        // unica en la tabla, Postgres devuelve aqui un error claro ("no unique
        // or exclusion constraint matching ON CONFLICT") en vez de insertar en
        // silencio una fila duplicada mas -- convierte la corrupcion silenciosa
        // de arriba en un error visible la PRIMERA vez que pasa.
        const { error } = await supabase
          .from('plan_state')
          .upsert({ id: 1, data: JSON.stringify(value), updated_at: new Date().toISOString() }, { onConflict: 'id' })

        if (error) {
          console.error('[storage] setItem error', error)
          lastSyncError = error
          // Emit sync error event so UI can notify user
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('syncError', { detail: error }))
          }
        } else {
          lastSyncError = null
          // Emit sync success event
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('syncSuccess'))
          }
        }
      } finally {
        pendingWrites--
      }
    },

    async removeItem(_name) {
      const { error } = await supabase.from('plan_state').delete().eq('id', 1)
      if (error) console.error('[storage] removeItem error', error)
    },
  }
}
