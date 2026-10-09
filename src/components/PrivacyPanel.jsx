/**
 * PrivacyPanel — Glass privacy notice with "Clear saved data" button.
 */
function PrivacyPanel({ onClearSaved }) {
  return (
    <div className="glass px-4 py-3">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-sm text-violet-300">&#128274;</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-200">
            Everything runs in your browser. Your chat is never uploaded.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            To verify: open DevTools &rarr; Network, click "Catch me up",
            and watch for zero requests.
          </p>
        </div>
      </div>
      {onClearSaved && (
        <button
          onClick={onClearSaved}
          className="mt-3 min-h-[36px] rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10"
        >
          Clear saved data
        </button>
      )}
    </div>
  )
}

export default PrivacyPanel
