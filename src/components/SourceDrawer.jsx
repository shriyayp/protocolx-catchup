/**
 * SourceDrawer — Glass drawer showing original message with context.
 * Close via button or Esc; focus moves in and returns on close.
 */
import { useEffect, useRef } from 'react'

function formatTime(date) {
  const h12 = date.getHours() > 12 ? date.getHours() - 12 : date.getHours() === 0 ? 12 : date.getHours()
  const ampm = date.getHours() >= 12 ? 'pm' : 'am'
  return `${h12}:${String(date.getMinutes()).padStart(2, '0')} ${ampm}`
}

function formatDate(date) {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).slice(2)}`
}

function SourceDrawer({ messages, targetIndex, userName, aliases, onClose }) {
  const closeBtnRef = useRef(null)
  const previouslyFocused = useRef(null)

  useEffect(() => {
    previouslyFocused.current = document.activeElement
    if (closeBtnRef.current) closeBtnRef.current.focus()

    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('keydown', handleEsc)
      if (previouslyFocused.current && previouslyFocused.current.focus) {
        previouslyFocused.current.focus()
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (targetIndex === null || targetIndex === undefined) return null

  const start = Math.max(0, targetIndex - 3)
  const end = Math.min(messages.length - 1, targetIndex + 3)
  const thread = []
  for (let i = start; i <= end; i++) {
    thread.push({ ...messages[i], isTarget: i === targetIndex })
  }

  const allUserNames = [userName, ...aliases].filter(Boolean).map((n) => n.toLowerCase())

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Message in context"
    >
      <div
        className="glass flex max-h-[85vh] w-full flex-col rounded-t-2xl sm:max-w-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'rgba(15, 15, 25, 0.85)' }}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-200">View in chat</h2>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Close source drawer"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200"
          >
            &#10005;
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {thread.map((msg) => {
            const isUser = allUserNames.includes(msg.sender.toLowerCase())
            return (
              <div
                key={msg.id}
                className={`rounded-xl p-3 ${
                  msg.isTarget
                    ? 'border border-violet-400/40 bg-violet-500/10'
                    : isUser
                    ? 'bg-white/5'
                    : 'bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-300">{msg.sender}</span>
                  <span className="text-xs text-slate-500">
                    {formatDate(msg.timestamp)}, {formatTime(msg.timestamp)}
                  </span>
                  {msg.isTarget && (
                    <span className="rounded bg-violet-500/30 px-1.5 py-0.5 text-xs font-bold text-violet-200">
                      Source
                    </span>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-300">{msg.text}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default SourceDrawer
