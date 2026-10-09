function PrivacyPanel({ onClearSaved }) {
  return (
    <div className="glass px-4 py-3.5">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-sm text-violet-300/80">&#128274;</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-300">
            Local analysis runs on your device
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Your chat text is never uploaded during local analysis. AI summaries send conversation text to the configured Gemini provider only after you approve.
          </p>
        </div>
      </div>
      {onClearSaved && (
        <button
          onClick={onClearSaved}
          className="btn-ghost mt-3 min-h-[34px] px-3 py-1.5 text-xs font-medium"
        >
          Clear saved data
        </button>
      )}
    </div>
  )
}

export default PrivacyPanel
