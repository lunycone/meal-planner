// ─── Meal stream definitions ────────────────────────────────────────────────
// One entry per meal. Every stream shares the same batch mechanism;
// what differs is schedule, kcal target, and accent color.

export const MEALS = {
  desayuno: {
    key:       'desayuno',
    label:     'Desayuno',
    iconKey:   'desayuno',
    color:     '#b07a28',
    colorBg:   '#fef9ea',
    colorBorder:'#f0d880',
    kcalTarget: [400, 500],
    // Default cadence: cook Sunday, eats all week
    defaultSchedule: {
      batches: [
        { cookDay: 'dom', covers: ['lun','mar','mie','jue','vie','sab'] },
      ],
    },
  },
  comida: {
    key:       'comida',
    label:     'Comida',
    iconKey:   'comida',
    color:     '#8a5c35',
    colorBg:   '#faf3eb',
    colorBorder:'#d4b896',
    kcalTarget: [1000, 1100],
    // Default cadence: cook Sunday → Mon-Thu, cook Thursday → Fri-Sat
    defaultSchedule: {
      batches: [
        { cookDay: 'dom', covers: ['lun','mar','mie','jue'] },
        { cookDay: 'jue', covers: ['vie','sab'] },
      ],
    },
  },
  merienda: {
    key:       'merienda',
    label:     'Merienda',
    iconKey:   'merienda',
    color:     '#7a6a52',
    colorBg:   '#f5f0e8',
    colorBorder:'#d0c4b0',
    kcalTarget: [150, 250],
    defaultSchedule: {
      batches: [
        { cookDay: 'dom', covers: ['lun','mar','mie','jue','vie','sab'] },
      ],
    },
  },
  cena: {
    key:       'cena',
    label:     'Cena',
    iconKey:   'cena',
    color:     '#3a4a7a',
    colorBg:   '#eaecf5',
    colorBorder:'#b0b8d8',
    kcalTarget: [350, 450],
    defaultSchedule: {
      batches: [
        { cookDay: 'dom', covers: ['lun','mar','mie','jue'] },
        { cookDay: 'jue', covers: ['vie','sab'] },
      ],
    },
  },
}

export const MEAL_ORDER = ['desayuno', 'comida', 'merienda', 'cena']

// ─── Day definitions (shared across all streams) ────────────────────────────
export const DAY_KEYS   = ['dom','lun','mar','mie','jue','vie','sab']
export const DAY_LABELS = { dom:'Dom', lun:'Lun', mar:'Mar', mie:'Mié', jue:'Jue', vie:'Vie', sab:'Sáb' }
