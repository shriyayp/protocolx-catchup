import { useState, useEffect } from 'react'
import { fetchBriefs, deleteBrief } from '../services/savedBriefs.js'

function formatStats(stats) {
  if (!stats) return ''
  return `${stats.unread || 0} unread · ${stats.matter || 0} matter · ${stats.mentions || 0} mentions`
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

function SavedBriefs() {
  const [briefs, setBriefs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error: fetchError } = await fetchBriefs()
      if (fetchError) {
        setError('Could not load saved briefs')
      } else {
        setBriefs(data || [])
      }
    } catch {
      setError('Could not load saved briefs')
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const handleDelete = async (id) => {
    const { error: delError } = await deleteBrief(id)
    if (delError) {
      setError('Could not delete brief')
    } else {
      setBriefs((prev) => prev.filter((b) => b.id !== id))
    }
  }

  if (loading) {
    return (
      <div className="glass p-4">
        <p className="text-xs text-slate-600">Loading saved briefs…</p>
      </div>
    )
  }

  return (
    <div className="glass p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="eyebrow">Saved briefs</h3>
        {briefs.length > 0 && (
          <button
            onClick={load}
            className="text-xs text-violet-300/80 hover:text-violet-200"
          >
            Refresh
          </button>
        )}
      </div>

      {error && (
        <p className="mb-2 text-xs text-red-400">{error}</p>
      )}

      {briefs.length === 0 && !error ? (
        <p className="text-xs leading-5 text-slate-600">
          No saved briefs yet. Click "Save brief" after analysing a chat to store the summary here.
        </p>
      ) : (
        <div className="space-y-2">
          {briefs.map((b) => (
            <div
              key={b.id}
              className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-slate-200">{b.title}</p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {formatStats(b.stats_json)} · {formatDate(b.created_at)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}
                    className="text-xs text-violet-300/80 hover:text-violet-200"
                  >
                    {expandedId === b.id ? 'Hide' : 'View'}
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="text-xs text-red-400/80 hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {expandedId === b.id && (
                <pre className="mt-3 max-h-60 overflow-y-auto whitespace-pre-wrap rounded-lg bg-black/15 p-3 text-xs leading-5 text-slate-500">
                  {b.brief_text}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SavedBriefs
