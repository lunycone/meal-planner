// Mapa plato -> especie/proteina principal, y validador de la regla de bloques.
//
// REGLA DE BATCH (confirmada por el usuario, 4 sep 2026):
//   Bloque A = Lunes a Jueves INCLUIDO. Bloque B = Jueves a Domingo INCLUIDO.
//   ("Jueves" aparece en los dos porque la cena del jueves ya es la primera
//   comida de Batch B — es el patron que el propio catalogo ya seguia:
//   "Menu B empieza en la cena del jueves").
//   Dentro de un bloque: UNA sola coccion, mismo plato todos los dias.
//   Entre bloque A y B: la especie/proteina principal de comida y de cena
//   DEBE cambiar. No basta cambiar el corte o el acompañamiento (cerdo lomo
//   -> cerdo solomillo NO vale; tiene que ser cerdo -> pollo/pavo/vaca/pescado).
//   Desayuno, si no rota dia a dia, tambien sigue el patron A/B (puede
//   repetirse entre A y B o no, pero SIEMPRE en bloques de 4/3 dias, nunca
//   suelto dia a dia salvo que se declare "ROTA").

export const SPECIES = {
  // cerdo
  'lomo-cerdo':'cerdo', 'costillas-cerdo':'cerdo', 'solomillo-cerdo':'cerdo',
  'cerdo-picado':'cerdo', 'ham-hock':'cerdo', 'bacon':'cerdo', 'salchichas':'cerdo',
  // pollo
  'pollo-pierna-generic':'pollo', 'pollo-pierna':'pollo', 'pollo-muslito':'pollo',
  'pollo-muslo-air':'pollo', 'pollo-muslo-farmboy':'pollo',
  // pavo
  'turkey-drumstick':'pavo',
  // vaca
  'carne-picada':'vaca', 'higado-vaca':'vaca',
  // cordero
  'lamb':'cordero',
  // pescado/marisco
  'bacalao':'bacalao', 'sardina-media':'sardina', 'mejillones':'mejillon',
  // huevo/legumbre como proteina principal (platos "pobres")
  'huevo':'huevo', 'black-beans':'legumbre', 'garbanzos':'legumbre',
  'lentejas-verdes':'legumbre', 'romano-beans':'legumbre',
}

// Devuelve la especie dominante de un plato: la primera proteina animal/de
// peso que aparece en items, en el orden de SPECIES de arriba (cerdo > pollo
// > pavo > vaca > cordero > pescado > huevo > legumbre), que es el orden en
// que el catalogo las usa como ingrediente "titular" del plato.
export function dishSpecies(dishKey, DISHES){
  const d = DISHES[dishKey]
  if(!d) return null
  for(const it of d.items){
    if(SPECIES[it.k]) return SPECIES[it.k]
  }
  return null
}

// Valida que el bloque B no repita la especie principal del bloque A, para
// comida y cena. Devuelve [] si esta bien, o una lista de mensajes.
export function validateBlocks(week, DISHES){
  const out = []
  for(const slot of ['C','N']){
    const specA = dishSpecies(week[slot+'A'], DISHES)
    const specB = dishSpecies(week[slot+'B'], DISHES)
    if(specA && specB && specA === specB){
      out.push(`${slot==='C'?'Comida':'Cena'}: bloque A y B usan la misma especie (${specA}). Deben cambiar de animal.`)
    }
  }
  return out
}
