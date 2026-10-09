/**
 * PriorityList — Renders PriorityCards; handled items move to bottom.
 */
import { useState } from 'react'
import PriorityCard from './PriorityCard.jsx'

function PriorityList({ items, userName, aliases, onViewInChat }) {
  const [handledIds, setHandledIds] = useState(new Set())

  const toggleHandled = (id, isHandled) => {
    setHandledIds((prev) => {
      const next = new Set(prev)
      if (isHandled) next.add(id)
      else next.delete(id)
      return next
    })
  }

  // Move handled items to the bottom
  const sorted = [...items].sort((a, b) => {
    const aHandled = handledIds.has(a.id)
    const bHandled = handledIds.has(b.id)
    if (aHandled !== bHandled) return aHandled ? 1 : -1
    if (b.score !== a.score) return b.score - a.score
    return a.timestamp.getTime() - b.timestamp.getTime()
  })

  if (sorted.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        No flagged messages in this filter.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {sorted.map((item) => (
        <PriorityCard
          key={item.id}
          item={item}
          userName={userName}
          aliases={aliases}
          onViewInChat={onViewInChat}
          onToggleHandled={toggleHandled}
        />
      ))}
    </div>
  )
}

export default PriorityList
