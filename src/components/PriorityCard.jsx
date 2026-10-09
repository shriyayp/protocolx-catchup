/**
 * PriorityCard — Glass card for one flagged message.
 * Level badge, tags, due label, why-flagged reasons, view-in-chat, mark handled.
 */
import { useState } from 'react'

const LEVEL_STYLES = {
  Critical: { bg: 'bg-red-500/15', text: 'text-red-300', border: 'border-red-400/30' },
  High: { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-400/30' },
  Medium: { bg: 'bg-sky-500/15', text: 'text-sky-300', border: 'border-sky-400/30' },
  Low: { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-400/20' },
}

const TAG_STYLES = {
  Mention: 'bg-violet-500/15 text-violet-300',
  Deadline: 'bg-orange-500/15 text-orange-300',
  Decision: 'bg-sky-500/15 text-sky-300',
  Action: 'bg-blue-500/15 text-blue-300',
  Urgent: 'bg-red-500/15 text-red-300',
  'Possibly missed': 'bg-red-500/15 text-red-300',
  All: 'bg-white/5 text-slate-400',
  Question: 'bg-indigo-500/15 text-indigo-300',
}

function formatTime(date) {
  const h12 = date.getHours() > 12 ? date.getHours() - 12 : date.getHours() === 0 ? 12 : date.getHours()
  const ampm = date.getHours() >= 12 ? 'pm' : 'am'
  return `${h12}:${String(date.getMinutes()).padStart(2, '0')} ${ampm}`
}

// Highlight the user's name within text by splitting into React nodes.
// Uses a separate non-global regex for testing to avoid the lastIndex bug.
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
        <mark key={i} className="rounded bg-violet-400/25 px-0.5 font-semibold text-violet-100">
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
    <div
      className={`glass-interactive rounded-xl p-4 ${
        handled ? 'opacity-40' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-slate-100">{item.sender}</span>
            <span className="text-xs text-slate-500">{formatTime(item.timestamp)}</span>
          </div>
          <p className="mt-1 text-sm text-slate-300">
            {highlightName(item.text, userName, aliases)}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold ${levelStyle.bg} ${levelStyle.text}`}
        >
          {item.level}
        </span>
      </div>

      {/* Tag chips */}
      {item.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${TAG_STYLES[tag] || 'bg-white/5 text-slate-400'}`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Due label */}
      {item.dueLabel && (
        <p className="mt-2 text-xs font-medium text-orange-300">{item.dueLabel}</p>
      )}

      {/* Why flagged */}
      <div className="mt-3 border-t border-white/5 pt-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Why flagged</p>
        <ul className="mt-1.5 space-y-0.5">
          {item.reasons.map((r, i) => (
            <li key={i} className="flex items-center justify-between text-xs">
              <span className="text-slate-400">{r.label}</span>
              <span className={r.points > 0 ? 'font-semibold text-violet-300' : 'font-semibold text-red-400'}>
                {r.points > 0 ? `+${r.points}` : r.points}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-4">
        <button
          onClick={() => onViewInChat(item)}
          className="text-xs font-medium text-violet-300 transition-colors hover:text-violet-200"
        >
          View in chat
        </button>
        <label className="flex items-center gap-1.5 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={handled}
            onChange={handleToggle}
            className="h-4 w-4 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-400/40"
          />
          Mark handled
        </label>
      </div>
    </div>
  )
}

export default PriorityCard
