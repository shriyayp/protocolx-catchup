import { useState } from 'react'

const LEVEL_STYLES = {
  Critical: { bg: 'bg-red-500/12', text: 'text-red-300' },
  High: { bg: 'bg-amber-500/12', text: 'text-amber-300' },
  Medium: { bg: 'bg-sky-500/12', text: 'text-sky-300' },
  Low: { bg: 'bg-slate-500/12', text: 'text-slate-400' },
}

const TAG_STYLES = {
  Mention: 'bg-violet-500/12 text-violet-300',
  Deadline: 'bg-orange-500/12 text-orange-300',
  Decision: 'bg-sky-500/12 text-sky-300',
  Action: 'bg-blue-500/12 text-blue-300',
  Urgent: 'bg-red-500/12 text-red-300',
  'Possibly missed': 'bg-red-500/12 text-red-300',
  All: 'bg-white/[0.04] text-slate-400',
  Question: 'bg-indigo-500/12 text-indigo-300',
}

function formatTime(date) {
  const h12 = date.getHours() > 12 ? date.getHours() - 12 : date.getHours() === 0 ? 12 : date.getHours()
  const ampm = date.getHours() >= 12 ? 'pm' : 'am'
  return `${h12}:${String(date.getMinutes()).padStart(2, '0')} ${ampm}`
}

function highlightName(text, userName, aliases) {
  const names = [userName, ...aliases].filter(Boolean).map((n) => n.trim()).filter((n) => n.length > 0)
  if (names.length === 0) return text

  const escaped = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const splitRe = new RegExp(`(@?\\b(?:${escaped.join('|')})\\b)`, 'gi')
  const testRe = new RegExp(`^@?\\b(?:${escaped.join('|')})\\b$`, 'i')

  const parts = text.split(splitRe)
  return parts.map((part, i) => {
    if (part && testRe.test(part)) {
      return (
        <mark key={i} className="rounded bg-violet-400/20 px-0.5 font-semibold text-violet-100">
          {part}
        </mark>
      )
    }
    return part
  })
}

function PriorityCard({ item, userName, aliases, onViewInChat, onToggleHandled }) {
  const [handled, setHandled] = useState(false)
  const levelStyle = LEVEL_STYLES[item.level] || LEVEL_STYLES.Low

  const handleToggle = () => {
    const next = !handled
    setHandled(next)
    if (onToggleHandled) onToggleHandled(item.id, next)
  }

  return (
    <div className={`glass-interactive rounded-xl p-4 ${handled ? 'opacity-35' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-100">{item.sender}</span>
            <span className="text-xs text-slate-600">{formatTime(item.timestamp)}</span>
          </div>
          <p className="mt-1.5 text-sm leading-6 text-slate-300">
            {highlightName(item.text, userName, aliases)}
          </p>
        </div>
        <span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold ${levelStyle.bg} ${levelStyle.text}`}>
          {item.level}
        </span>
      </div>

      {item.tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <span key={tag} className={`rounded-full px-2 py-0.5 text-xs font-medium ${TAG_STYLES[tag] || 'bg-white/[0.04] text-slate-400'}`}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {item.dueLabel && (
        <p className="mt-2 text-xs font-medium text-orange-300/90">{item.dueLabel}</p>
      )}

      <div className="mt-3 border-t border-white/[0.04] pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-600">Why flagged</p>
        <ul className="mt-1.5 space-y-0.5">
          {item.reasons.map((r, i) => (
            <li key={i} className="flex items-center justify-between text-xs">
              <span className="text-slate-500">{r.label}</span>
              <span className={r.points > 0 ? 'font-semibold text-violet-300/80' : 'font-semibold text-red-400/80'}>
                {r.points > 0 ? `+${r.points}` : r.points}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 flex items-center gap-4">
        <button
          onClick={() => onViewInChat(item)}
          className="text-xs font-medium text-violet-300/80 transition-colors hover:text-violet-200"
        >
          View in chat
        </button>
        <label className="flex items-center gap-1.5 text-xs text-slate-500">
          <input
            type="checkbox"
            checked={handled}
            onChange={handleToggle}
            className="h-4 w-4 rounded border-white/15 bg-white/[0.04] text-violet-500 focus:ring-violet-400/30"
          />
          Mark handled
        </label>
      </div>
    </div>
  )
}

export default PriorityCard
