import { useState } from 'react'
import { exportBrief } from '../services/briefExporter.js'
import { saveBrief } from '../services/savedBriefs.js'

function StatTile({ value, label }) {
  return (
    <div className="stat-tile">
      <span className="text-xl font-bold tracking-tight text-slate-100">{value}</span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</span>
    </div>
  )
}

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
    <div className="glass p-5 sm:p-6 animate-fade-up">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="eyebrow">Local analysis · on-device</span>
        <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500">Deterministic</span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatTile value={stats.unread} label="Unread" />
        <StatTile value={stats.matter} label="Matter" />
        <StatTile value={stats.mentions} label="Mentions" />
      </div>

      {/* Ratio bar */}
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500/70 to-sky-400/70 transition-all duration-300"
          style={{ width: `${matterPct}%` }}
        />
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-400">{summarySentence}</p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={handleCopy}
          className="btn-ghost min-h-[36px] px-4 py-2 text-sm font-medium"
        >
          Copy brief
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="min-h-[36px] rounded-xl border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-200 transition-all hover:bg-violet-500/20 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save brief'}
        </button>
        {copyStatus && (
          <span className={`text-xs ${copyStatus.includes('fail') ? 'text-red-400' : 'text-violet-300'}`} role="status">
            {copyStatus}
          </span>
        )}
        {saveStatus && (
          <span className={`text-xs ${saveStatus.includes('fail') ? 'text-red-400' : 'text-emerald-300'}`} role="status">
            {saveStatus}
          </span>
        )}
      </div>
    </div>
  )
}

export default BriefSummary
