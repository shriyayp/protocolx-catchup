function formatTime(date) {
  const h12 = date.getHours() > 12 ? date.getHours() - 12 : date.getHours() === 0 ? 12 : date.getHours()
  const ampm = date.getHours() >= 12 ? 'pm' : 'am'
  return `${h12}:${String(date.getMinutes()).padStart(2, '0')} ${ampm}`
}

function LowSignalList({ items }) {
  if (!items || items.length === 0) return null

  return (
    <details className="glass px-4 py-3">
      <summary className="cursor-pointer text-sm font-medium text-slate-500">
        Low-signal messages ({items.length})
      </summary>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-baseline gap-2 text-xs text-slate-600">
            <span className="font-medium text-slate-500">{item.sender}</span>
            <span>{formatTime(item.timestamp)}</span>
            <span className="truncate">{item.text}</span>
          </div>
        ))}
      </div>
    </details>
  )
}

export default LowSignalList
