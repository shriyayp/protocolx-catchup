/**
 * briefExporter.js — Converts analysis results to plain text for clipboard export.
 */

export function exportBrief(result, userName) {
  if (!result || !result.stats) return ''

  const lines = []
  lines.push(`CatchUp Brief — for ${userName}`)
  lines.push('')
  lines.push(result.summarySentence)
  lines.push('')

  if (result.doFirst.length > 0) {
    lines.push('DO FIRST:')
    lines.push('')
    result.doFirst.forEach((item, i) => {
      lines.push(`${i + 1}. [${item.level}] ${item.sender} (${formatTime(item.timestamp)}): ${item.text}`)
      if (item.dueLabel) lines.push(`   ${item.dueLabel}`)
      lines.push(`   Why: ${item.reasons.map((r) => `${r.label} (+${r.points})`).join(', ')}`)
      lines.push('')
    })
  }

  if (result.items.length > 0) {
    lines.push('ALL FLAGGED ITEMS:')
    lines.push('')
    result.items.forEach((item, i) => {
      lines.push(`${i + 1}. [${item.level}] ${item.sender}: ${item.text}`)
      if (item.dueLabel) lines.push(`   ${item.dueLabel}`)
      lines.push('')
    })
  }

  if (result.lowSignal.length > 0) {
    lines.push(`Low-signal messages: ${result.lowSignal.length} (hidden in app)`)
  }

  return lines.join('\n')
}

function formatTime(date) {
  const h12 = date.getHours() > 12 ? date.getHours() - 12 : date.getHours() === 0 ? 12 : date.getHours()
  const ampm = date.getHours() >= 12 ? 'pm' : 'am'
  return `${h12}:${String(date.getMinutes()).padStart(2, '0')} ${ampm}`
}
