import { useState } from 'react'

function Section({ label, children }) {
  return (
    <section className="border-t border-white/[0.08] pt-5">
      <p className="eyebrow text-[9px]">{label}</p>
      <div className="mt-3 text-sm leading-7 text-slate-300">{children}</div>
    </section>
  )
}

function EvidenceMessage({ message }) {
  const [showTranslation, setShowTranslation] = useState(Boolean(message.translation))
  return (
    <article className="rounded-xl border border-white/[0.08] bg-black/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-slate-200">{message.sender}</span>
        <span className="text-slate-500">{message.timestamp}</span>
      </div>
      <p className="mt-2 text-sm text-slate-300">{showTranslation && message.translation ? message.translation : message.original}</p>
      {message.translation && (
        <button onClick={() => setShowTranslation((visible) => !visible)} className="mt-2 text-xs font-medium text-violet-300 hover:text-violet-200">
          {showTranslation ? 'Show original' : 'Show translation'}
        </button>
      )}
      {message.reason && <p className="mt-2 text-xs text-slate-500">{message.reason}</p>}
    </article>
  )
}

function AiSummaryPanel({ summary, loading, progress, error, consent, onConsentChange, onGenerate, onCancel }) {
  if (loading) {
    return (
      <div className="glass p-5" role="status" aria-live="polite">
        <div className="flex items-center gap-3">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-300/30 border-t-violet-200" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-100">Generating your English briefing</p>
            <p className="mt-1 text-xs text-slate-400">{progress?.label || 'Preparing the conversation…'}</p>
          </div>
          {onCancel && (
            <button onClick={onCancel} className="shrink-0 rounded-lg border border-white/15 bg-white/[0.07] px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.13]">
              Cancel
            </button>
          )}
        </div>
        {progress && <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-violet-300 transition-all" style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }} /></div>}
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="glass p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Optional external processing</p>
            <h2 className="mt-1 text-xl font-medium text-slate-100">Understand the whole conversation</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Generate a context-aware English summary with translations for important messages. Your selected chat will be sent to the configured Gemini AI service only after you approve.</p>
          </div>
          <span className="hidden rounded-full border border-violet-300/25 bg-violet-300/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-violet-200 sm:block">AI ready</span>
        </div>
        {error && (
          <div className="mt-4 rounded-xl border border-red-300/20 bg-red-300/[0.07] px-3 py-3" role="alert">
            <p className="text-xs leading-5 text-red-200">{error}</p>
            <button onClick={onGenerate} disabled={!consent} className="mt-3 rounded-lg border border-white/15 bg-white/[0.07] px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-white/[0.13] disabled:cursor-not-allowed disabled:opacity-40">
              Try again
            </button>
          </div>
        )}
        <label className="mt-5 flex items-start gap-3 text-xs leading-5 text-slate-400">
          <input type="checkbox" checked={consent} onChange={(event) => onConsentChange(event.target.checked)} className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-400/40" />
          <span>I understand that this private conversation will be sent to the configured Gemini AI provider for processing. CatchUp will not send it to analytics or unrelated services. This is separate from the local on-device analysis.</span>
        </label>
        <button onClick={onGenerate} disabled={!consent} className="btn-chrome mt-5 min-h-[44px] px-5 text-sm font-semibold disabled:cursor-not-allowed">Generate AI summary</button>
      </div>
    )
  }

  return (
    <div className="glass p-5 animate-fade-up">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">AI-generated English briefing</p>
          <h2 className="mt-1 text-2xl font-medium tracking-[-0.03em] text-slate-100">Here&apos;s what you missed</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-200">Gemini summary</span>
          <button onClick={onGenerate} className="rounded-lg border border-white/15 bg-white/[0.07] px-2.5 py-1 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.13]">
            Regenerate
          </button>
        </div>
      </div>

      {summary.partialFailure && (
        <div className="mt-4 rounded-xl border border-amber-300/25 bg-amber-500/10 px-3 py-2.5" role="status">
          <p className="text-xs leading-5 text-amber-200">Parts of this conversation (chunk{summary.partialFailure.length > 1 ? 's' : ''} {summary.partialFailure.join(', ')}) could not be processed. The summary below is based on the available portions and may be incomplete.</p>
        </div>
      )}

      {summary.summary && <Section label="Conversation summary"><p>{summary.summary}</p></Section>}
      {summary.keyUpdates?.length > 0 && <Section label="Key updates"><ul className="list-disc space-y-2 pl-5">{summary.keyUpdates.map((item, index) => <li key={index}>{item}</li>)}</ul></Section>}
      {summary.decisions?.length > 0 && <Section label="Decisions"><ul className="list-disc space-y-2 pl-5">{summary.decisions.map((item, index) => <li key={index}>{item.text}{item.evidenceIds?.length > 0 && <span className="ml-2 text-xs text-slate-500">Evidence: {item.evidenceIds.join(', ')}</span>}</li>)}</ul></Section>}
      {summary.deadlines?.length > 0 && <Section label="Deadlines and events"><ul className="list-disc space-y-2 pl-5">{summary.deadlines.map((item, index) => <li key={index}>{item.text}{item.date && <span className="ml-2 text-slate-400">({item.date})</span>}</li>)}</ul></Section>}
      {summary.actionItems?.length > 0 && <Section label="Action items"><ul className="list-disc space-y-2 pl-5">{summary.actionItems.map((item, index) => <li key={index}><span>{item.task}</span>{item.owner && <span className="text-slate-400"> — {item.owner}</span>}{item.due && <span className="text-slate-500"> · {item.due}</span>}</li>)}</ul></Section>}
      {summary.mentions?.length > 0 && <Section label="Your mentions"><div className="space-y-3">{summary.mentions.map((message, index) => <EvidenceMessage key={message.messageId || index} message={message} />)}</div></Section>}
      {summary.importantMessages?.length > 0 && <Section label="Important messages"><div className="space-y-3">{summary.importantMessages.map((message, index) => <EvidenceMessage key={message.messageId || index} message={message} />)}</div></Section>}
    </div>
  )
}

export default AiSummaryPanel
