// Encaje de un plato en cada fase del ciclo menstrual — heurística por el
// tipo de proteína (movida tal cual desde la HomeView antigua).

export const CYCLE_PHASES = [
  { id: 'menstrual',  name: 'Menstrual',  days: 'Días 1–5',   color: '#b85a5a', bg: 'rgba(184,90,90,0.07)',  border: 'rgba(184,90,90,0.18)' },
  { id: 'folicular',  name: 'Folicular',  days: 'Días 6–13',  color: '#9a7b43', bg: 'rgba(154,123,67,0.07)', border: 'rgba(154,123,67,0.18)' },
  { id: 'ovulatoria', name: 'Ovulatoria', days: 'Días 14–16', color: '#5a8a3a', bg: 'rgba(90,138,58,0.07)',  border: 'rgba(90,138,58,0.18)' },
  { id: 'lutea',      name: 'Lútea',      days: 'Días 17–28', color: '#7a5aaa', bg: 'rgba(122,90,170,0.07)', border: 'rgba(122,90,170,0.18)' },
]

export function getPhaseScore(proteinKey) {
  const key = (proteinKey ?? '').toLowerCase()
  if (['bacalao','salmón','sardina','caballa','calamar','mejillon','pollock','langosta','ostra'].some(k => key.includes(k)))
    return {
      menstrual:  { stars: 2, note: 'Omega-3 reduce la inflamación menstrual. Aporta hierro no-hemo.' },
      folicular:  { stars: 3, note: 'Proteína ligera y omega-3. Apoya perfectamente la energía ascendente.' },
      ovulatoria: { stars: 3, note: 'Máximo antiinflamatorio. Perfecta combinación para la ovulación.' },
      lutea:      { stars: 3, note: 'B6 y omega-3 reducen retención de líquidos y mejoran el ánimo.' },
    }
  if (['carne-picada','lamb','lomo','cerdo'].some(k => key.includes(k)))
    return {
      menstrual:  { stars: 3, note: 'Hierro hemo biodisponible. Ideal para reponer durante la menstruación.' },
      folicular:  { stars: 1, note: 'Proteína más pesada en esta fase. Mejor optar por opciones ligeras.' },
      ovulatoria: { stars: 1, note: 'Puede ser proinflamatorio. Prefiere pescado o pollo en esta fase.' },
      lutea:      { stars: 3, note: 'Zinc y B12 apoyan el sistema nervioso en la fase lútea.' },
    }
  if (key.includes('hígado') || key.includes('higado'))
    return {
      menstrual:  { stars: 3, note: 'El superalimento menstrual: hierro, folato y B12 en abundancia.' },
      folicular:  { stars: 2, note: 'Nutricionalmente denso. Una vez por semana está muy bien.' },
      ovulatoria: { stars: 1, note: 'Demasiado intenso para esta fase. Opta por algo más ligero.' },
      lutea:      { stars: 2, note: 'B12 y zinc apoyan el sistema nervioso en la fase lútea.' },
    }
  if (key.includes('huevo') || key.includes('tortilla') || key.includes('desayuno'))
    return {
      menstrual:  { stars: 2, note: 'Fáciles de digerir. Aportan colina para el bienestar mental.' },
      folicular:  { stars: 3, note: 'Colina y vitaminas B. Energía limpia para la fase activa.' },
      ovulatoria: { stars: 2, note: 'Proteína completa. Combina con vegetales para potenciar el efecto.' },
      lutea:      { stars: 3, note: 'B6 y triptófano mejoran el sueño y el ánimo en fase lútea.' },
    }
  if (['pollo','pechuga','muslo'].some(k => key.includes(k)))
    return {
      menstrual:  { stars: 2, note: 'Proteína digestiva y suave para días de menor energía.' },
      folicular:  { stars: 3, note: 'Magra y rica en B3. Perfecta para la fase de mayor actividad.' },
      ovulatoria: { stars: 2, note: 'Buena opción combinada con vegetales crucíferos.' },
      lutea:      { stars: 2, note: 'Triptófano para mejorar el sueño en la fase final del ciclo.' },
    }
  return {
    menstrual:  { stars: 2, note: 'Añade una fuente de hierro si puedes (espinacas, semillas).' },
    folicular:  { stars: 2, note: 'Buena base. Complementa con vitamina C para mayor absorción.' },
    ovulatoria: { stars: 2, note: 'Añade vegetales crudos o fermentados para potenciar el efecto.' },
    lutea:      { stars: 2, note: 'Suma magnesio (semillas de calabaza, cacao) para esta fase.' },
  }
}

