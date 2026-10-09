/**
 * BriefSummary — Glass panel showing big "N unread -> M matter" with ratio bar,
 * summary sentence, "Copy brief" button, and "Save brief" button.
 */
import { useState } from 'react'
import { exportBrief } from '../services/briefExporter.js'
import { saveBrief } from '../services/savedBriefs.js'

function BriefSummary({ result, userName }) {
  const [copyStatus, setCopyStatus] = useState('')
  const [saveStatus, setSaveStatus] = useState('')
  const [saving, setSaving] = useState(false)

  if (!result) return null
  const { stats, summarySentence } = result
  const matterPct = stats.unread > 0 ? Math.round((stats.matter / stats.unread) * 100) : 0

  const handleCopy = async () => {
    const text = exportBrief(result, userName)
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
        setCopyStatus('Copied to clipboard')
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        const ok = document.execCommand('copy')
        document.body.removeChild(textarea)
        setCopyStatus(ok ? 'Copied to clipboard' : 'Copy failed — please select and copy manually')
      }
    } catch {
      setCopyStatus('Copy failed — please try again')
    }
    setTimeout(() => setCopyStatus(''), 3000)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveStatus('')
    try {
      const title = `${userName} — ${stats.unread} unread, ${stats.matter} matter`
      const briefText = exportBrief(result, userName)
      const { error } = await saveBrief(title, userName, briefText, stats)
      if (error) {
        setSaveStatus('Save failed — please try again')
      } else {
        setSaveStatus('Brief saved')
      }
    } catch {
      setSaveStatus('Save failed — please try again')
    }
    setSaving(false)
    setTimeout(() => setSaveStatus(''), 3000)
  }

  return (
    <div className="glass p-5 animate-fade-up">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="eyebrow text-[9px]">Local analysis · on-device</span>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">Deterministic</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold tracking-tight text-slate-100">
          {stats.unread}
        </span>
        <span className="text-base text-slate-500">unread</span>
        <span className="text-xl text-slate-600">&rarr;</span>
        <span className="text-4xl font-bold tracking-tight chrome-text">
          {stats.matter}
        </span>
        <span className="text-base text-slate-500">matter</span>
      </div>

      {/* CSS-only ratio bar */}
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-400 transition-all duration-200"
          style={{ width: `${matterPct}%` }}
        />
      </div>

      <p className="mt-4 text-sm text-slate-400">{summarySentence}</p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={handleCopy}
          className="min-h-[36px] rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition-all hover:bg-white/10"
        >
          Copy brief
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="min-h-[36px] rounded-lg border border-violet-400/30 bg-violet-500/15 px-4 py-2 text-sm font-medium text-violet-200 transition-all hover:bg-violet-500/25 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save brief'}
        </button>
        {copyStatus && (
          <span
            className={`text-xs ${copyStatus.includes('fail') ? 'text-red-400' : 'text-violet-300'}`}
            role="status"
          >
            {copyStatus}
          </span>
        )}
        {saveStatus && (
          <span
            className={`text-xs ${saveStatus.includes('fail') ? 'text-red-400' : 'text-emerald-300'}`}
            role="status"
          >
            {saveStatus}
          </span>
        )}
      </div>
    </div>
  )
}

export default BriefSummary
