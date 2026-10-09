import { useRef, useState } from 'react'
import sampleChats from '../data/sampleChats.js'
import { extractZipTranscripts, MAX_ZIP_BYTES } from '../services/zipExtractor.js'

const MAX_TEXT_BYTES = 2 * 1024 * 1024
const tones = ['violet', 'blue', 'green']

function formatBytes(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function ChatSourcePanel({ onSource, selectedSampleId }) {
  const [tab, setTab] = useState('sample')
  const [pastedText, setPastedText] = useState('')
  const [uploadState, setUploadState] = useState('idle')
  const [uploadMessage, setUploadMessage] = useState('')
  const [uploadFileName, setUploadFileName] = useState('')
  const [transcriptName, setTranscriptName] = useState('')
  const [zipCandidates, setZipCandidates] = useState([])
  const [selectedZipPath, setSelectedZipPath] = useState('')
  const fileRef = useRef(null)

  const selectSample = (sample) => onSource(sample.rawText, sample.defaultUser, sample.defaultSince)
  const handlePaste = () => {
    if (pastedText.trim()) onSource(pastedText, null, null)
  }

  const handleTextFile = (file) => {
    if (file.size > MAX_TEXT_BYTES) {
      setUploadState('error')
      setUploadMessage('File is too large. Maximum size is 2 MB for plain text exports.')
      return
    }
    setUploadState('reading')
    setUploadMessage('Reading transcript…')
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target.result
      if (!text.trim()) {
        setUploadState('error')
        setUploadMessage('This text file is empty. Choose a WhatsApp chat export.')
        return
      }
      setUploadFileName(file.name)
      setTranscriptName(file.name)
      setUploadState('ready')
      setUploadMessage('Transcript ready for analysis.')
      onSource(text, null, null)
    }
    reader.onerror = () => {
      setUploadState('error')
      setUploadMessage('Could not read this text file.')
    }
    reader.readAsText(file)
  }

  const handleZipFile = async (file) => {
    if (file.size > MAX_ZIP_BYTES) {
      setUploadState('error')
      setUploadMessage('ZIP file is too large. Maximum size is 20 MB.')
      return
    }
    setUploadState('reading')
    setUploadMessage('Extracting transcript…')
    try {
      const candidates = await extractZipTranscripts(file)
      if (candidates.length === 0) {
        setUploadState('error')
        setUploadMessage('No WhatsApp conversation transcript was found in this ZIP.')
        return
      }
      setUploadFileName(file.name)
      setZipCandidates(candidates)
      setSelectedZipPath(candidates[0].path)
      if (candidates.length === 1) {
        setTranscriptName(candidates[0].path)
        setUploadState('ready')
        setUploadMessage('Transcript ready for analysis.')
        onSource(candidates[0].text, null, null)
      } else {
        setUploadState('choose')
        setUploadMessage('Multiple transcripts found. Choose the conversation to analyze.')
      }
    } catch (error) {
      setUploadState('error')
      setUploadMessage(error instanceof Error ? error.message : 'Could not extract this ZIP file.')
    }
  }

  const handleFile = (event) => {
    const file = event.target.files[0]
    event.target.value = ''
    if (!file) return
    setUploadState('idle')
    setUploadMessage('')
    setZipCandidates([])
    setSelectedZipPath('')
    const lowerName = file.name.toLowerCase()
    if (lowerName.endsWith('.txt')) {
      handleTextFile(file)
    } else if (lowerName.endsWith('.zip')) {
      handleZipFile(file)
    } else {
      setUploadState('error')
      setUploadMessage('Unsupported file type. Choose a .txt export or .zip archive.')
    }
  }

  const useSelectedTranscript = () => {
    const candidate = zipCandidates.find((item) => item.path === selectedZipPath)
    if (!candidate) return
    setTranscriptName(candidate.path)
    setUploadState('ready')
    setUploadMessage('Transcript ready for analysis.')
    onSource(candidate.text, null, null)
  }

  const tabs = [['sample', 'Samples'], ['paste', 'Paste'], ['upload', 'Upload']]

  return (
    <section className="glass p-5 sm:p-6" aria-labelledby="source-heading">
      <div className="mb-4">
        <p className="eyebrow">Step 01</p>
        <h2 id="source-heading" className="mt-1 text-lg font-medium text-slate-100">Choose a conversation</h2>
      </div>

      <div className="mb-5 flex gap-1 rounded-xl border border-white/[0.06] bg-black/20 p-1" role="tablist" aria-label="Chat source type">
        {tabs.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`min-h-[36px] flex-1 rounded-lg px-3 text-xs font-semibold transition-all ${tab === id ? 'bg-white/[0.1] text-white' : 'text-slate-500 hover:text-slate-200'}`}>
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
              <button key={sample.id} onClick={() => selectSample(sample)} data-tone={tones[index % tones.length]} className={`sample-card glass-interactive w-full p-4 text-left ${isSelected ? 'is-selected' : ''}`} aria-pressed={isSelected}>
                <div className="relative z-10 flex h-full flex-col justify-between gap-6">
                  <div className="flex items-start justify-between gap-3">
                    <span className="eyebrow text-[9px]">Conversation {String(index + 1).padStart(2, '0')}</span>
                    {isSelected && <span className="rounded-full border border-emerald-300/25 bg-emerald-300/[0.08] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-emerald-200">Loaded</span>}
                  </div>
                  <div>
                    <h3 className="text-base font-medium tracking-[-0.015em] text-slate-100">{sample.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-400">{sample.tagline}</p>
                    <p className="mt-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{msgCount} messages</p>
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
          <textarea id="paste-chat" value={pastedText} onChange={(event) => setPastedText(event.target.value)} placeholder="Paste your WhatsApp export here…" className="h-40 w-full resize-none rounded-xl border border-white/[0.08] bg-black/20 p-4 text-sm leading-6 text-slate-200 transition-colors focus:border-blue-300/40 focus:outline-none" />
          <button onClick={handlePaste} disabled={!pastedText.trim()} className="mt-3 min-h-[44px] w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-30">Use pasted text</button>
        </div>
      )}

      {tab === 'upload' && (
        <div className="animate-fade-in">
          <p className="mb-3 text-xs leading-5 text-slate-400">Upload a .txt export or a .zip archive. CatchUp will find the conversation and prepare it for analysis.</p>
          <div className="rounded-xl border border-dashed border-white/15 bg-black/15 px-4 py-7 text-center">
            <input ref={fileRef} id="file-upload" type="file" accept=".txt,.zip,text/plain,application/zip" onChange={handleFile} className="hidden" aria-label="Upload a .txt or .zip WhatsApp chat export" />
            <label htmlFor="file-upload" className="inline-flex cursor-pointer rounded-xl border border-white/15 bg-white/[0.06] px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.12]">Choose export file</label>
            <div className="mt-3 flex justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600"><span className="rounded-full border border-white/[0.08] px-2 py-1">TXT</span><span className="rounded-full border border-white/[0.08] px-2 py-1">ZIP</span></div>
            <p className="mt-3 text-xs text-slate-600">TXT up to 2 MB · ZIP up to {formatBytes(MAX_ZIP_BYTES)}</p>
          </div>

          {uploadState === 'reading' && <div className="mt-3 flex items-center gap-3 rounded-xl border border-blue-300/15 bg-blue-300/[0.05] px-3 py-2.5 text-xs text-blue-100" role="status"><span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-200/30 border-t-blue-100" />{uploadMessage}</div>}
          {uploadState === 'error' && <p className="mt-3 rounded-xl border border-red-300/15 bg-red-300/[0.05] px-3 py-2.5 text-xs leading-5 text-red-200" role="alert">{uploadMessage}</p>}
          {uploadState === 'choose' && (
            <div className="mt-3 rounded-xl border border-amber-200/15 bg-amber-200/[0.05] p-3">
              <label htmlFor="transcript-choice" className="block text-xs font-medium text-amber-100">Choose a transcript</label>
              <select id="transcript-choice" value={selectedZipPath} onChange={(event) => setSelectedZipPath(event.target.value)} className="mt-2 w-full rounded-lg border border-white/[0.08] bg-black/25 px-3 py-2 text-xs text-slate-200 focus:outline-none">
                {zipCandidates.map((candidate) => <option key={candidate.path} value={candidate.path}>{candidate.path}</option>)}
              </select>
              <button onClick={useSelectedTranscript} className="mt-3 min-h-[40px] w-full rounded-lg border border-white/12 bg-white/[0.06] px-3 text-xs font-semibold text-slate-100 transition hover:bg-white/[0.12]">Use selected transcript</button>
            </div>
          )}
          {uploadState === 'ready' && (
            <div className="mt-3 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.05] px-3 py-2.5" role="status">
              <p className="text-xs font-semibold text-emerald-100">Transcript ready</p>
              <p className="mt-0.5 truncate text-[11px] text-emerald-200/60" title={uploadFileName}>{uploadFileName}</p>
              <p className="mt-0.5 truncate text-[11px] text-slate-500" title={transcriptName}>Conversation: {transcriptName}</p>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default ChatSourcePanel
