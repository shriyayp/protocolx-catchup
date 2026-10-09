import PriorityCard from './PriorityCard.jsx'

function DoFirst({ items, userName, aliases, onViewInChat }) {
  if (!items || items.length === 0) return null

  return (
    <div className="animate-fade-up">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-violet-400" />
        Needs your attention first
      </h2>
      <div className="space-y-3">
        {items.map((item) => (
          <PriorityCard
            key={item.id}
            item={item}
            userName={userName}
            aliases={aliases}
            onViewInChat={onViewInChat}
          />
        ))}
      </div>
    </div>
  )
}

export default DoFirst
