/**
 * FilterChips — Keyboard-operable filter buttons with counts.
 */

const FILTERS = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'mentions', label: 'Mentions', match: (i) => i.mention },
  { id: 'deadlines', label: 'Deadlines', match: (i) => i.deadline },
  { id: 'decisions', label: 'Decisions', match: (i) => i.decisionCue },
  { id: 'actions', label: 'Action items', match: (i) => i.actionCue },
  { id: 'missed', label: 'Possibly missed', match: (i) => i.possiblyMissed },
]

function FilterChips({ items, active, onChange }) {
  const counts = FILTERS.map((f) => ({
    ...f,
    count: items.filter(f.match).length,
  }))

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter messages">
      {counts.map((f) => (
        <button
          key={f.id}
          onClick={() => onChange(f.id)}
          aria-pressed={active === f.id}
          className={`min-h-[36px] rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200 ${
            active === f.id
              ? 'bg-violet-500/20 text-violet-200 ring-1 ring-violet-400/30'
              : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
          }`}
        >
          {f.label}
          {f.count > 0 && (
            <span className={`ml-1.5 ${active === f.id ? 'text-violet-300/70' : 'text-slate-500'}`}>
              ({f.count})
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

export { FILTERS }
export default FilterChips
