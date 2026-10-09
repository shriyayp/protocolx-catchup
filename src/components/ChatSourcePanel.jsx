import { useRef, useState } from 'react'
import sampleChats from '../data/sampleChats.js'

const MAX_BYTES = 2 * 1024 * 1024
const tones = ['violet', 'blue', 'green']

function ChatSourcePanel({ onSource, selectedSampleId }) {
  const [tab, setTab] = useState('sample')
  const [pastedText, setPastedText] = useState('')
  const [fileError, setFileError] = useState('')
  const fileRef = useRef(null)

  const selectSample = (sample) => onSource(sample.rawText, sample.defaultUser, sample.defaultSince)
  const handlePaste = () => {
    if (pastedText.trim()) onSource(pastedText, null, null)
  }
  const handleFile = (event) => {
    const file = event.target.files[0]
    if (!file) return
    setFileError('')
    if (!file.name.toLowerCase().endsWith('.txt')) {
      setFileError('Please select a .txt file.')
      return
    }
    if (file.size > MAX_BYTES) {
      setFileError('File is too large. Maximum 2 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (loadEvent) => onSource(loadEvent.target.result, null, null)
    reader.onerror = () => setFileError('Could not read the file.')
    reader.readAsText(file)
  }

  const tabs = [
    ['sample', 'Samples'],
    ['paste', 'Paste'],
    ['upload', 'Upload'],
  ]

  return (
    <section className="glass p-4 sm:p-5" aria-labelledby="source-heading">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow">01 / Choose a source</p>
          <h2 id="source-heading" className="mt-1 text-lg font-medium text-slate-100">Start with a conversation</h2>
        </div>
        <span className="hidden text-[10px] uppercase tracking-[0.16em] text-slate-500 sm:block">WhatsApp export</span>
      </div>

      <div className="mb-5 flex gap-1 rounded-xl border border-white/[0.08] bg-black/25 p-1" role="tablist" aria-label="Chat source type">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`min-h-[38px] flex-1 rounded-lg px-3 text-xs font-semibold transition-all ${tab === id ? 'bg-white/[0.13] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]' : 'text-slate-500 hover:text-slate-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'sample' && (
        <div className="grid gap-3">
          {sampleChats.map((sample, index) => {
            const msgCount = sample.rawText.split('\n').filter((line) => line.trim()).length
            const isSelected = selectedSampleId === sample.id
            return (
              <button
                key={sample.id}
                onClick={() => selectSample(sample)}
                data-tone={tones[index % tones.length]}
                className={`sample-card glass-interactive w-full p-4 text-left ${isSelected ? 'is-selected' : ''}`}
                aria-pressed={isSelected}
              >
                <div className="relative z-10 flex h-full flex-col justify-between gap-8">
                  <div className="flex items-start justify-between gap-3">
                    <span className="eyebrow text-[9px]">Conversation {String(index + 1).padStart(2, '0')}</span>
                    {isSelected && <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-200">Loaded</span>}
                  </div>
                  <div>
                    <h3 className="text-[17px] font-medium tracking-[-0.02em] text-slate-100">{sample.title}</h3>
                    <p className="mt-1 max-w-[230px] text-xs leading-5 text-slate-400">{sample.tagline}</p>
                    <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{msgCount} messages</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {tab === 'paste' && (
        <div className="animate-fade-in">
          <label htmlFor="paste-chat" className="mb-2 block text-xs text-slate-400">Paste the exported chat text below.</label>
          <textarea
            id="paste-chat"
            value={pastedText}
            onChange={(event) => setPastedText(event.target.value)}
            placeholder="Paste your WhatsApp export here…"
            className="h-44 w-full resize-none rounded-xl border border-white/[0.11] bg-black/25 p-4 text-sm leading-6 text-slate-200 transition-colors focus:border-blue-300/50 focus:outline-none"
          />
          <button onClick={handlePaste} disabled={!pastedText.trim()} className="mt-3 min-h-[44px] w-full rounded-xl border border-white/15 bg-white/[0.07] px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.13] disabled:cursor-not-allowed disabled:opacity-40">Use pasted text</button>
        </div>
      )}

      {tab === 'upload' && (
        <div className="animate-fade-in">
          <div className="rounded-xl border border-dashed border-white/20 bg-black/20 px-4 py-10 text-center">
            <input ref={fileRef} id="file-upload" type="file" accept=".txt" onChange={handleFile} className="hidden" aria-label="Upload a .txt chat export file" />
            <label htmlFor="file-upload" className="inline-flex cursor-pointer rounded-xl border border-white/20 bg-white/[0.08] px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.14]">Choose .txt file</label>
            <p className="mt-3 text-xs text-slate-500">WhatsApp export format · maximum 2 MB</p>
          </div>
          {fileError && <p className="mt-3 text-xs text-red-300" role="alert">{fileError}</p>}
        </div>
      )}
    </section>
  )
}

export default ChatSourcePanel
