import { useState, useEffect, useMemo } from 'react'
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

import { parseChat } from './services/chatParser.js'
import { analyzeChat } from './services/analyzer.js'
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

  // Load saved name from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('catchup_profile')
      if (saved) setProfile(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [])

  // Save name to localStorage
  useEffect(() => {
    if (profile.name || profile.aliases) {
      try { localStorage.setItem('catchup_profile', JSON.stringify(profile)) } catch { /* ignore */ }
    }
  }, [profile])

  const handleSource = (text, user, sinceStr, sampleId) => {
    setError('')
    setInfo('')
    setResult(null)
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

  // Wrapper to pass sampleId from ChatSourcePanel
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
      if (analysis.stats.unread === 0) {
        setInfo('No unread messages in the selected time window. Try widening the range.')
      } else if (analysis.stats.mentions === 0 && analysis.stats.deadlines === 0) {
        setInfo(`No messages mention "${name}". Check the spelling or add aliases.`)
      }
    }, 300)
  }

  const handleAnalyze = () => {
    setError('')
    setInfo('')
    setResult(null)

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

  const handleReset = () => {
    setResult(null)
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

  return (
    <div className="bg-midnight min-h-screen text-slate-200">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-violet-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>

      <Header />

      <main id="main" className="relative z-10 mx-auto max-w-6xl px-4 py-6 sm:py-8">
        {/* Hero */}
        <div className="mb-8 sm:mb-10">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            <span className="chrome-text">What did I miss?</span>
          </h2>
          <p className="mt-2 max-w-lg text-sm text-slate-400 sm:text-base">
            Load a group chat, enter your name, and get a ranked brief of what
            matters — analysed entirely on your device.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
          {/* Setup column */}
          <aside className="space-y-4">
            <ChatSourcePanel onSource={handleSampleSource} selectedSampleId={selectedSampleId} />
            <ProfileForm value={profile} onChange={setProfile} presetUser={presetUser} />
            <CatchUpControls
              value={since}
              onChange={setSince}
              lastMessageTime={lastMessageTime}
              presetSince={presetSince}
            />
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="btn-chrome min-h-[48px] w-full px-6 py-3 text-base font-semibold"
            >
              {loading ? 'Analysing…' : 'Catch me up'}
            </button>
            {result && (
              <button
                onClick={handleReset}
                className="min-h-[40px] w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-white/10"
              >
                Analyse another conversation
              </button>
            )}
            <PrivacyPanel onClearSaved={handleClearSaved} />
          </aside>

          {/* Brief column */}
          <section aria-live="polite" aria-label="Analysis results" className="space-y-4">
            {error && <ErrorBanner message={error} />}

            {info && !error && (
              <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-300 backdrop-blur-md">
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

            {!loading && !result && !error && (
              <EmptyState onTrySample={handleTrySample} />
            )}

            {!loading && result && (
              <div className="space-y-6">
                <div className="animate-fade-up">
                  <BriefSummary result={result} userName={profile.name} />
                </div>

                {result.doFirst.length > 0 && (
                  <div className="animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
                      <DoFirst
                      items={result.doFirst}
                      userName={profile.name}
                      aliases={aliasesArray}
                      onViewInChat={(item) => setSourceTarget(item.messageIndex)}
                    />
                  </div>
                )}

                <div className="space-y-3 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
                  <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-300">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-400" />
                    All flagged messages
                  </h2>
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

                <div className="animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
                  <LowSignalList items={result.lowSignal} />
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/[0.04] py-6">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-center text-xs text-slate-600">
            CatchUp runs entirely on your device. No data leaves your browser.
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
