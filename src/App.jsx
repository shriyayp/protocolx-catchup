import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import './App.css'

import Header from './components/Header.jsx'
import ChatSourcePanel from './components/ChatSourcePanel.jsx'
import ProfileForm from './components/ProfileForm.jsx'
import CatchUpControls from './components/CatchUpControls.jsx'
import BriefSummary from './components/BriefSummary.jsx'
import DoFirst from './components/DoFirst.jsx'
import FilterChips, { FILTERS } from './components/FilterChips.jsx'
import PriorityList from './components/PriorityList.jsx'
import SourceDrawer from './components/SourceDrawer.jsx'
import LowSignalList from './components/LowSignalList.jsx'
import PrivacyPanel from './components/PrivacyPanel.jsx'
import EmptyState from './components/EmptyState.jsx'
import ErrorBanner from './components/ErrorBanner.jsx'
import SavedBriefs from './components/SavedBriefs.jsx'
import AiSummaryPanel from './components/AiSummaryPanel.jsx'
import CinematicIntro from './components/CinematicIntro.jsx'

import { parseChat } from './services/chatParser.js'
import { analyzeChat } from './services/analyzer.js'
import { generateAiSummary } from './services/aiSummarizer.js'
import sampleChats from './data/sampleChats.js'

const MAX_MESSAGES = 5000

function App() {
  const [messages, setMessages] = useState([])
  const [lastMessageTime, setLastMessageTime] = useState(null)
  const [profile, setProfile] = useState({ name: '', aliases: '' })
  const [since, setSince] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [sourceTarget, setSourceTarget] = useState(null)
  const [presetUser, setPresetUser] = useState('')
  const [presetSince, setPresetSince] = useState('')
  const [selectedSampleId, setSelectedSampleId] = useState('')
  const [aiSummary, setAiSummary] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiProgress, setAiProgress] = useState(null)
  const [aiError, setAiError] = useState('')
  const [aiConsent, setAiConsent] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const completeIntro = useCallback(() => setShowIntro(false), [])
  const aiAbortRef = useRef(null)
  const aiJobIdRef = useRef(0)
  const topRef = useRef(null)
  const resultsRef = useRef(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('catchup_profile')
      if (saved) setProfile(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (profile.name || profile.aliases) {
      try { localStorage.setItem('catchup_profile', JSON.stringify(profile)) } catch { /* ignore */ }
    }
  }, [profile])

  const handleSource = (text, user, sinceStr, sampleId) => {
    setError('')
    setInfo('')
    setResult(null)
    setAiSummary(null)
    setAiError('')
    setAiProgress(null)
    setActiveFilter('all')
    if (sampleId) setSelectedSampleId(sampleId)
    if (user) {
      setPresetUser(user)
      setProfile((prev) => ({ ...prev, name: user }))
    }
    if (sinceStr) {
      setPresetSince(sinceStr)
      setSince(new Date(sinceStr))
    }

    const parsed = parseChat(text)
    if (parsed.error) {
      setError('Could not parse this chat. ' + parsed.example)
      setMessages([])
      setLastMessageTime(null)
      return
    }
    if (parsed.messages.length > MAX_MESSAGES) {
      setError(`Chat is too large: ${parsed.messages.length} messages. Maximum is ${MAX_MESSAGES}.`)
      setMessages([])
      setLastMessageTime(null)
      return
    }
    setMessages(parsed.messages)
    setLastMessageTime(parsed.messages[parsed.messages.length - 1].timestamp)
  }

  const handleSampleSource = (text, user, sinceStr) => {
    const sample = sampleChats.find((s) => s.rawText === text)
    handleSource(text, user, sinceStr, sample?.id)
  }

  const runAnalysis = (msgs, name, als, sinceDate) => {
    setLoading(true)
    setError('')
    setInfo('')
    setResult(null)
    setTimeout(() => {
      const analysis = analyzeChat({ messages: msgs, userName: name, aliases: als, since: sinceDate })
      setResult(analysis)
      setLoading(false)
      requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
      if (analysis.stats.unread === 0) {
        setInfo('No unread messages in the selected time window. Try widening the range.')
      } else if (analysis.stats.mentions === 0 && analysis.stats.deadlines === 0) {
        setInfo(`No messages mention "${name}". Check the spelling or add aliases.`)
      }
    }, 300)
  }

  const handleGenerateAi = async () => {
    if (!aiConsent || messages.length === 0 || aiLoading) return
    if (aiAbortRef.current) aiAbortRef.current.abort()
    const jobId = ++aiJobIdRef.current
    const controller = new AbortController()
    aiAbortRef.current = controller
    setAiLoading(true)
    setAiError('')
    setAiSummary(null)
    setAiProgress({ current: 0, total: 1, label: 'Preparing the conversation…' })
    try {
      const aliases = profile.aliases.split(',').map((alias) => alias.trim()).filter(Boolean)
      const summary = await generateAiSummary({
        messages,
        userName: profile.name.trim(),
        aliases,
        localItems: result?.items || [],
        onProgress: setAiProgress,
        signal: controller.signal,
      })
      if (jobId !== aiJobIdRef.current) return
      setAiSummary(summary)
    } catch (error) {
      if (jobId !== aiJobIdRef.current) return
      if (error instanceof DOMException && error.name === 'AbortError') {
        setAiError('AI summarisation was cancelled. Your local analysis is still available.')
      } else {
        setAiError(error instanceof Error ? error.message : 'AI summarisation failed. Your local analysis is still available.')
      }
    } finally {
      if (jobId === aiJobIdRef.current) {
        setAiLoading(false)
        aiAbortRef.current = null
      }
    }
  }

  const handleCancelAi = () => {
    if (aiAbortRef.current) aiAbortRef.current.abort()
  }

  const handleAnalyze = () => {
    setError('')
    setInfo('')
    setResult(null)
    setAiSummary(null)
    setAiError('')
    setAiProgress(null)

    if (messages.length === 0) {
      setError('Please load a chat first (sample, paste, or upload).')
      return
    }
    if (!profile.name.trim()) {
      setError('Please enter your name as it appears in the chat.')
      return
    }
    if (!since) {
      setError('Please set when you last read the chat.')
      return
    }

    const aliases = profile.aliases.split(',').map((a) => a.trim()).filter((a) => a.length > 0)
    runAnalysis(messages, profile.name.trim(), aliases, since)
  }

  const handleClearSaved = () => {
    try { localStorage.removeItem('catchup_profile') } catch { /* ignore */ }
    setProfile({ name: '', aliases: '' })
  }

  const handleTrySample = () => {
    const s = sampleChats[0]
    setProfile((prev) => ({ ...prev, name: s.defaultUser }))
    setPresetUser(s.defaultUser)
    setPresetSince(s.defaultSince)
    setSelectedSampleId(s.id)
    const sinceDate = new Date(s.defaultSince)
    setSince(sinceDate)

    const parsed = parseChat(s.rawText)
    if (parsed.error) {
      setError('Could not parse sample chat. ' + parsed.example)
      return
    }
    setMessages(parsed.messages)
    setLastMessageTime(parsed.messages[parsed.messages.length - 1].timestamp)
    runAnalysis(parsed.messages, s.defaultUser, [], sinceDate)
  }

  const goToStep = (step) => {
    if (step === 1) {
      setResult(null)
      setAiSummary(null)
      setAiError('')
      setAiProgress(null)
      setError('')
      setInfo('')
      setActiveFilter('all')
      setSourceTarget(null)
    }
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const handleChangeConversation = () => {
    handleReset()
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const handleNewAnalysis = () => {
    setResult(null)
    setAiSummary(null)
    setAiError('')
    setAiProgress(null)
    setError('')
    setInfo('')
    setActiveFilter('all')
    setSourceTarget(null)
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const handleReset = () => {
    setResult(null)
    setAiSummary(null)
    setAiError('')
    setAiProgress(null)
    setError('')
    setInfo('')
    setMessages([])
    setLastMessageTime(null)
    setSelectedSampleId('')
    setActiveFilter('all')
  }

  const filteredItems = useMemo(() => {
    if (!result) return []
    const filter = FILTERS.find((f) => f.id === activeFilter)
    if (!filter || filter.id === 'all') return result.items
    return result.items.filter(filter.match)
  }, [result, activeFilter])

  const aliasesArray = profile.aliases.split(',').map((a) => a.trim()).filter((a) => a.length > 0)
  const hasConversation = messages.length > 0
  const hasDetails = profile.name.trim().length > 0 && Boolean(since)
  const activeStep = result || loading ? 3 : hasConversation ? 2 : 1
  const steps = [
    { number: '01', label: 'Conversation', complete: hasConversation },
    { number: '02', label: 'Your details', complete: hasDetails },
    { number: '03', label: 'Your brief', complete: Boolean(result) },
  ]

  const showStep1 = activeStep === 1
  const showStep2 = activeStep === 2
  const showStep3 = activeStep === 3

  return (
    <div className="bg-midnight min-h-screen text-slate-200">
      {showIntro && <CinematicIntro onComplete={completeIntro} />}

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-violet-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>

      <Header />

      <main id="main" ref={topRef} className="relative z-10 mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12 lg:py-16">
        {/* Hero — compact, only on step 1 */}
        {showStep1 && (
          <section className="mb-10 text-center">
            <p className="eyebrow mb-4">A clearer view of the conversations behind you</p>
            <h1 className="hero-title text-slate-100">Catch up on <em>what matters.</em></h1>
            <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-slate-400">
              Find the decisions, deadlines, and conversations you missed — without reading every message.
            </p>
          </section>
        )}

        {/* Step indicator */}
        <div className="mb-8 rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-3 sm:px-5">
          <div className="step-bar">
            {steps.map((step, index) => (
              <div key={step.number} className="flex flex-1 items-center gap-2">
                <div className="step-item">
                  <span className={`step-dot ${step.complete ? 'is-complete' : activeStep === index + 1 ? 'is-active' : ''}`}>{step.number}</span>
                  <span className={`step-label ${activeStep === index + 1 ? 'is-active' : step.complete ? 'is-complete' : 'is-default'}`}>{step.label}</span>
                </div>
                {index < steps.length - 1 && <span className={`step-connector ${step.complete ? 'is-complete' : ''}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* STEP 1 — Choose conversation */}
        {showStep1 && (
          <div className="space-y-4 animate-fade-up">
            <ChatSourcePanel onSource={handleSampleSource} selectedSampleId={selectedSampleId} />
            <div className="flex items-center justify-between gap-3 pt-2">
              <p className="text-xs text-slate-500">Supported: WhatsApp .txt and .zip exports</p>
              <button
                onClick={() => goToStep(2)}
                disabled={!hasConversation}
                className="btn-ghost min-h-[40px] px-5 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-30"
              >
                Continue
              </button>
            </div>
            {error && <ErrorBanner message={error} />}
            {!hasConversation && <EmptyState onTrySample={handleTrySample} />}
          </div>
        )}

        {/* STEP 2 — Your details */}
        {showStep2 && (
          <div className="space-y-4 animate-fade-up">
            <div className="glass p-5 sm:p-6">
              <p className="eyebrow mb-1">Step 02</p>
              <h2 className="text-lg font-medium text-slate-100">Tell CatchUp who you are</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Your name and aliases help CatchUp find messages that mention you. This stays on your device.
              </p>
            </div>
            <ProfileForm value={profile} onChange={setProfile} presetUser={presetUser} />
            <CatchUpControls
              value={since}
              onChange={setSince}
              lastMessageTime={lastMessageTime}
              presetSince={presetSince}
            />
            {error && <ErrorBanner message={error} />}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => goToStep(1)}
                className="btn-ghost min-h-[44px] px-5 py-2 text-sm font-medium"
              >
                Back
              </button>
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="btn-chrome min-h-[44px] px-7 py-2.5 text-sm font-semibold"
              >
                {loading ? 'Analysing…' : 'Catch me up'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Results */}
        {showStep3 && (
          <div ref={resultsRef} aria-live="polite" aria-label="Analysis results" className="space-y-5 animate-fade-up">
            {/* Results header */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow">Your brief</p>
                <h2 className="mt-1 text-xl font-medium tracking-[-0.02em] text-slate-100">Here's what you missed</h2>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleNewAnalysis} className="btn-ghost min-h-[36px] px-3 py-1.5 text-xs font-semibold">
                  New analysis
                </button>
                <button onClick={handleChangeConversation} className="btn-ghost min-h-[36px] px-3 py-1.5 text-xs font-semibold">
                  Change conversation
                </button>
              </div>
            </div>

            {error && <ErrorBanner message={error} />}

            {info && !error && (
              <div className="rounded-xl border border-amber-400/20 bg-amber-500/[0.08] px-4 py-3 text-sm text-amber-300">
                {info}
              </div>
            )}

            {loading && (
              <div className="glass flex items-center justify-center py-16">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-400/30 border-t-violet-400" />
                  <span className="text-sm text-slate-400">Analysing…</span>
                </div>
              </div>
            )}

            {!loading && result && (
              <div className="space-y-5">
                <BriefSummary result={result} userName={profile.name} />

                <AiSummaryPanel
                  summary={aiSummary}
                  loading={aiLoading}
                  progress={aiProgress}
                  error={aiError}
                  consent={aiConsent}
                  onConsentChange={setAiConsent}
                  onGenerate={handleGenerateAi}
                  onCancel={handleCancelAi}
                />

                {result.doFirst.length > 0 && (
                  <DoFirst
                    items={result.doFirst}
                    userName={profile.name}
                    aliases={aliasesArray}
                    onViewInChat={(item) => setSourceTarget(item.messageIndex)}
                  />
                )}

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="eyebrow">All flagged messages</span>
                    <div className="hero-rule flex-1" />
                  </div>
                  <FilterChips
                    items={result.items}
                    active={activeFilter}
                    onChange={setActiveFilter}
                  />
                  <PriorityList
                    items={filteredItems}
                    userName={profile.name}
                    aliases={aliasesArray}
                    onViewInChat={(item) => setSourceTarget(item.messageIndex)}
                  />
                </div>

                <LowSignalList items={result.lowSignal} />

                {/* Secondary panels */}
                <div className="space-y-4 pt-4">
                  <div className="hero-rule" />
                  <SavedBriefs />
                  <PrivacyPanel onClearSaved={handleClearSaved} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Persistent saved briefs + privacy on step 1 */}
        {showStep1 && (
          <div className="mt-8 space-y-4">
            <div className="hero-rule" />
            <SavedBriefs />
            <PrivacyPanel onClearSaved={handleClearSaved} />
          </div>
        )}
      </main>

      <footer className="relative z-10 border-t border-white/[0.04] py-5">
        <div className="mx-auto max-w-3xl px-4">
          <p className="text-center text-xs text-slate-600">
            Local analysis runs on your device. AI summaries send conversation text to the configured Gemini provider. Only saved brief summaries are stored.
          </p>
        </div>
      </footer>

      {sourceTarget !== null && (
        <SourceDrawer
          messages={messages}
          targetIndex={sourceTarget}
          userName={profile.name}
          aliases={aliasesArray}
          onClose={() => setSourceTarget(null)}
        />
      )}
    </div>
  )
}

export default App
