export function diverseBreakfasts(ideas, seen = [], count = 3) {
  const seenNames = new Set(ideas.filter(r => seen.includes(r.id)).map(r => r.name))
  const available = ideas.filter(r => !seen.includes(r.id)).sort((a, b) => a.issues - b.issues || Number(seenNames.has(a.name)) - Number(seenNames.has(b.name))), chosen = []
  while (chosen.length < count && available.length) {
    const bestIssues = available[0].issues
    const index = available.findIndex(r => r.issues === bestIssues && !chosen.some(c => c.family === r.family || (c.main && c.main === r.main)))
    chosen.push(available.splice(index < 0 ? 0 : index, 1)[0])
  }
  return chosen
}
