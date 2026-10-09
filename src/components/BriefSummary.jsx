/**
 * BriefSummary — Glass panel showing big "N unread -> M matter" with ratio bar,
 * summary sentence, and "Copy brief" button.
 */
import { useState } from 'react'
import { exportBrief } from '../services/briefExporter.js'

function BriefSummary({ result, userName }) {
  const [copyStatus, setCopyStatus] = useState('')

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

  return (
    <div className="glass p-5 animate-fade-up">
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

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleCopy}
          className="min-h-[36px] rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition-all hover:bg-white/10"
        >
          Copy brief
        </button>
        {copyStatus && (
          <span
            className={`text-xs ${copyStatus.includes('fail') ? 'text-red-400' : 'text-violet-300'}`}
            role="status"
          >
            {copyStatus}
          </span>
        )}
      </div>
    </div>
  )
}

export default BriefSummary
