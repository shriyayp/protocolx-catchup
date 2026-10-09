/**
 * ChatSourcePanel — Glass tabs for samples, paste, upload.
 * Calls onSource(rawText, presetUser, presetSince) when a source is provided.
 */
import { useState, useRef } from 'react'
import sampleChats from '../data/sampleChats.js'

const MAX_BYTES = 2 * 1024 * 1024 // 2 MB

function ChatSourcePanel({ onSource, selectedSampleId }) {
  const [tab, setTab] = useState('sample')
  const [pastedText, setPastedText] = useState('')
  const [fileError, setFileError] = useState('')
  const fileRef = useRef(null)

  const selectSample = (sample) => {
    onSource(sample.rawText, sample.defaultUser, sample.defaultSince)
  }

  const handlePaste = () => {
    if (pastedText.trim().length === 0) return
    onSource(pastedText, null, null)
  }

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFileError('')

    if (!file.name.endsWith('.txt')) {
      setFileError('Please select a .txt file.')
      return
    }
    if (file.size > MAX_BYTES) {
      setFileError('File is too large. Maximum 2 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      onSource(ev.target.result, null, null)
    }
    reader.onerror = () => setFileError('Could not read the file.')
    reader.readAsText(file)
  }

  const tabBtn = (id, label) => (
    <button
      role="tab"
      aria-selected={tab === id}
      onClick={() => setTab(id)}
      className={`min-h-[40px] flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
        tab === id
          ? 'bg-white/10 text-slate-100 shadow-sm ring-1 ring-white/15'
          : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="glass p-4">
      <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-slate-400">
        Chat source
      </label>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-xl bg-black/20 p-1" role="tablist">
        {tabBtn('sample', 'Samples')}
        {tabBtn('paste', 'Paste')}
        {tabBtn('upload', 'Upload')}
      </div>

      {/* Sample chats tab */}
      {tab === 'sample' && (
        <div className="space-y-2">
          {sampleChats.map((s) => {
            const msgCount = s.rawText.split('\n').filter((l) => l.trim()).length
            const isSelected = selectedSampleId === s.id
            return (
              <button
                key={s.id}
                onClick={() => selectSample(s)}
                className={`glass-interactive w-full rounded-xl px-4 py-3 text-left ${
                  isSelected ? 'ring-1 ring-violet-400/40' : ''
                }`}
              >
                <div className="font-semibold text-sm text-slate-100">{s.title}</div>
                <div className="mt-0.5 text-xs text-slate-400">{s.tagline}</div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                    {msgCount} messages
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Paste tab */}
      {tab === 'paste' && (
        <div>
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste your WhatsApp export text here…"
            aria-label="Paste chat text"
            className="h-40 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-slate-200 placeholder-slate-500 focus:border-violet-400/40 focus:outline-none"
          />
          <button
            onClick={handlePaste}
            disabled={pastedText.trim().length === 0}
            className="mt-2 min-h-[44px] w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Use pasted text
          </button>
        </div>
      )}

      {/* Upload tab */}
      {tab === 'upload' && (
        <div>
          <div className="rounded-xl border border-dashed border-white/15 bg-black/20 px-4 py-6 text-center">
            <input
              ref={fileRef}
              type="file"
              accept=".txt"
              onChange={handleFile}
              aria-label="Upload a .txt chat export file"
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-block cursor-pointer rounded-lg border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-200 transition-all hover:bg-white/10"
            >
              Choose .txt file
            </label>
            <p className="mt-3 text-xs text-slate-500">
              WhatsApp export format. Max 2 MB.
            </p>
          </div>
          {fileError && (
            <p className="mt-2 text-xs text-red-400">{fileError}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default ChatSourcePanel
