function EmptyState({ onTrySample }) {
  return (
    <div className="glass flex flex-col items-center justify-center px-6 py-12 text-center sm:py-14">
      <div className="relative mb-5 flex h-16 w-16 items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-violet-400/15" />
        <div className="absolute inset-2 rounded-full border border-violet-400/10" />
        <div className="absolute inset-4 rounded-full border border-violet-400/[0.06]" />
        <div className="chrome-badge flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold text-slate-900">
          C
        </div>
      </div>
      <h2 className="text-base font-semibold text-slate-200">
        Ready when you are
      </h2>
      <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
        Pick a sample conversation, paste your chat, or upload an export to get started.
      </p>
      {onTrySample && (
        <button
          onClick={onTrySample}
          className="btn-chrome mt-5 min-h-[42px] px-6 py-2.5 text-sm font-semibold"
        >
          Try a sample chat
        </button>
      )}
    </div>
  )
}

export default EmptyState
