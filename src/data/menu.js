// Menú mensual — 4 semanas
// Batch domingo → lun/mar/mié/jue (4 días)
// Batch jueves  → vie/sáb/dom    (3 días)
// Hígado de vaca: semanas 1 y 3 como día especial el domingo

export const MENU = [
  {
    week: 1,
    label: 'Semana 1',
    sundaySpecial: {
      protein: 'Hígado de vaca',
      combo: 'Puré patata + puerro/zanahoria',
      note: 'Recién hecho el domingo antes del batch. 1 ración cada uno.',
      kcalEst: 920,
      costEst: 3.80,
    },
    batches: [
      {
        day: 'Domingo', covers: 'Lun · Mar · Mié · Jue', days: 4,
        protein: 'Carne picada', prep: 'Tomate + cebolla', combo: 'Burrito bowl',
        batchNote: 'Cocinar black beans + maíz en batch. Yogur de cabra y apio al momento.',
        kcalEst: 1040, costEst: 4.60,
        batchItems: ['Carne picada 400g (4×100g)','Black beans 320g seco','Maíz congelado 240g','Cebolla 360g','Passata 360ml','Apio → al momento','Yogur de cabra → al momento','Taco seasoning'],
      },
      {
        day: 'Jueves', covers: 'Vie · Sáb · Dom', days: 3,
        protein: 'Pollo', prep: '—', combo: 'Ensalada garbanzos',
        batchNote: 'Pollo al horno o plancha. Garbanzos cocidos en batch. Aguacate, tomate y feta AL MOMENTO.',
        kcalEst: 1010, costEst: 4.20,
        batchItems: ['Pollo ~450g (3×150g)','Garbanzos 240g seco','Cebolla morada 150g','Feta → al momento','Aguacate → al momento','Tomate → al momento'],
      },
    ],
  },
  {
    week: 2,
    label: 'Semana 2',
    sundaySpecial: null,
    batches: [
      {
        day: 'Domingo', covers: 'Lun · Mar · Mié · Jue', days: 4,
        protein: 'Bacalao', prep: '—', combo: 'Taco bell',
        batchNote: 'Bacalao en salsa de tomate en batch. Nachos, cheddar, sour cream, aguacate y lechuga AL MOMENTO.',
        kcalEst: 1010, costEst: 4.80,
        batchItems: ['Bacalao 600g (4×150g)','Passata 360ml','Cebolla 360g','Nachos → al momento','Cheddar → al momento','Sour cream → al momento','Aguacate → al momento','Lechuga → al momento'],
      },
      {
        day: 'Jueves', covers: 'Vie · Sáb · Dom', days: 3,
        protein: 'Lamb', prep: '—', combo: 'Alcachofa + patata',
        batchNote: 'Lamb al horno. Alcachofa y patata asadas en la misma bandeja.',
        kcalEst: 1050, costEst: 5.50,
        batchItems: ['Lamb ~360g (3×120g)','Patata 600g','Alcachofa 3 ud','Cebolla 270g'],
      },
    ],
  },
  {
    week: 3,
    label: 'Semana 3',
    sundaySpecial: {
      protein: 'Hígado de vaca',
      combo: 'Lentejas (por separado)',
      note: 'Hígado al horno + cebolla. Lentejas cocidas aparte. Juntar al emplatar.',
      kcalEst: 970,
      costEst: 3.60,
    },
    batches: [
      {
        day: 'Domingo', covers: 'Lun · Mar · Mié · Jue', days: 4,
        protein: 'Calamares', prep: '—', combo: 'Burger bowl',
        batchNote: 'Calamares a la plancha. Patatas asadas en batch. Lechuga, aguacate, cheddar, sour cream AL MOMENTO.',
        kcalEst: 1060, costEst: 5.30,
        batchItems: ['Calamares 600g (4×150g)','Patata 800g','Cebolla 360g','Lechuga → al momento','Aguacate → al momento','Cheddar → al momento','Sour cream → al momento'],
      },
      {
        day: 'Jueves', covers: 'Vie · Sáb · Dom', days: 3,
        protein: 'Sardinas / Caballa', prep: '—', combo: 'Pasta con tomate',
        batchNote: 'Salsa de tomate + cebolla en batch. Pasta se cuece al momento (10 min). Lata encima en frío.',
        kcalEst: 1020, costEst: 4.40,
        batchItems: ['Sardinas ×3 latas o caballa ×3 latas','Passata 360ml','Cebolla 270g','Pasta → cocer al momento'],
      },
    ],
  },
  {
    week: 4,
    label: 'Semana 4',
    sundaySpecial: null,
    batches: [
      {
        day: 'Domingo', covers: 'Lun · Mar · Mié · Jue', days: 4,
        protein: 'Huevos', prep: '—', combo: 'Taco dip',
        batchNote: 'Black beans cocidos + salsa en batch. Huevos al momento (5 min). Aguacate, sour cream, lechuga AL MOMENTO.',
        kcalEst: 1030, costEst: 3.80,
        batchItems: ['Huevos (al momento, 3 ud/ración)','Black beans 320g seco','Cebolla morada 200g','Passata 180ml','Sour cream → al momento','Aguacate → al momento','Lechuga → al momento','Lima → al momento'],
      },
      {
        day: 'Jueves', covers: 'Vie · Sáb · Dom', days: 3,
        protein: 'Lomo', prep: '—', combo: 'Salsa zanahoria + arroz',
        batchNote: 'Lomo asado. Zanahoria cocida y triturada como salsa. Arroz en batch.',
        kcalEst: 1000, costEst: 3.90,
        batchItems: ['Lomo ~450g (3×150g)','Zanahoria 300g','Arroz 225g seco','Cebolla 270g'],
      },
    ],
  },
]

export const SHOPPING = [
  {
    cat: 'Proteínas',
    items: ['Carne picada ×5 packs (2.27kg total)','Pollo entero ×1 (~1.5kg)','Bacalao 1 pack (1.32kg)','Lamb ×1 pieza (~2.28kg)','Hígado de vaca ×4 packs (~2.2kg)','Sardinas ×4 latas o caballa ×4 latas','Calamares ×1 pack (454g)'],
  },
  {
    cat: 'Legumbres y bases',
    items: ['Black beans ~320g seco','Lentejas verdes ~240g seco','Garbanzos ~320g seco','Patata ~2.4kg','Pasta ~400g','Arroz (stock)','Maíz congelado ~240g'],
  },
  {
    cat: 'Frescos batch',
    items: ['Cebolla amarilla ~3kg','Lima ×8 ud','Puerro ×2 ud','Zanahoria ×2 ud','Passata ×2 botes (720ml)','Alcachofa ×3 ud'],
  },
  {
    cat: 'Toppings (al momento)',
    items: ['Aguacate ×~16 ud (mes)','Tomate fresco según uso','Lechuga ×~4 ud','Feta Krinos (3kg dura meses)','Cheddar ×1 pack','Sour cream ×2 botes','Nachos ×1 pack','Yogur de cabra ×1-2 botes'],
  },
]
