/**
 * EmptyState — Composed first-run experience with a CSS-generated motif.
 */
function EmptyState({ onTrySample }) {
  return (
    <div className="glass flex flex-col items-center justify-center px-6 py-16 text-center sm:py-20">
      {/* CSS-generated concentric ring motif */}
      <div className="relative mb-6 flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-violet-400/20" />
        <div className="absolute inset-2 rounded-full border border-violet-400/15" />
        <div className="absolute inset-4 rounded-full border border-violet-400/10" />
        <div className="chrome-badge flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-slate-900">
          C
        </div>
      </div>
      <h2 className="text-lg font-semibold text-slate-200">
        Ready when you are
      </h2>
      <p className="mt-2 max-w-sm text-sm text-slate-400">
        Pick a sample conversation or paste your own. CatchUp will analyse it
        on-device and show you exactly what matters.
      </p>
      {onTrySample && (
        <button
          onClick={onTrySample}
          className="btn-chrome mt-6 min-h-[44px] px-6 py-2.5 text-sm font-semibold"
        >
          Try a sample chat
        </button>
      )}
    </div>
  )
}

export default EmptyState
