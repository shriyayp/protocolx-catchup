/**
 * CatchUpControls — Glass datetime input with presets relative to last message.
 */
import { useState, useEffect } from 'react'

function formatLocalDateTime(date) {
  if (!date) return ''
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`
}

function CatchUpControls({ value, onChange, lastMessageTime, presetSince }) {
  const [preset, setPreset] = useState('')

  // Prefill from sample selection
  useEffect(() => {
    if (presetSince) {
      const d = new Date(presetSince)
      onChange(d)
      setPreset('custom')
    }
  }, [presetSince]) // eslint-disable-line react-hooks/exhaustive-deps

  const applyPreset = (p) => {
    setPreset(p)
    if (!lastMessageTime) return
    const ref = lastMessageTime
    let d
    switch (p) {
      case '3h':
        d = new Date(ref.getTime() - 3 * 60 * 60 * 1000)
        break
      case '12h':
        d = new Date(ref.getTime() - 12 * 60 * 60 * 1000)
        break
      case '24h':
        d = new Date(ref.getTime() - 24 * 60 * 60 * 1000)
        break
      case 'whole':
        d = new Date(ref.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        return
    }
    onChange(d)
  }

  const presets = [
    { id: '3h', label: 'Last 3h' },
    { id: '12h', label: 'Last 12h' },
    { id: '24h', label: 'Last 24h' },
    { id: 'whole', label: 'Whole chat' },
  ]

  return (
    <div className="glass p-4">
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
        I last read at
      </label>
      <input
        type="datetime-local"
        value={value ? formatLocalDateTime(value) : ''}
        onChange={(e) => {
          const d = e.target.value ? new Date(e.target.value) : null
          onChange(d)
          setPreset('custom')
        }}
        aria-label="Date and time you last read the chat"
        className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-slate-100 focus:border-violet-400/40 focus:outline-none [color-scheme:dark]"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => applyPreset(p.id)}
            aria-pressed={preset === p.id}
            className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
              preset === p.id
                ? 'bg-violet-500/20 text-violet-200 ring-1 ring-violet-400/30'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {!lastMessageTime && (
        <p className="mt-2 text-xs text-slate-500">
          Load a chat first to enable presets.
        </p>
      )}
    </div>
  )
}

export default CatchUpControls
