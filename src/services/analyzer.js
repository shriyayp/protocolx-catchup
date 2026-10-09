/**
 * analyzer.js — Core on-device analysis engine.
 * Deterministic rule-based text analysis. No network calls, no AI/ML.
 *
 * analyzeChat({ messages, userName, aliases, since }) returns:
 *   { stats, items, doFirst, lowSignal, summarySentence }
 *
 * Reference time ("now") = timestamp of the LAST message (deterministic).
 * Unread = messages with timestamp >= since AND sender is not the user.
 */

import { extractDeadline } from './dateExtractor.js'
import { scoreMessage, computeDeadlineProximity, computeLevel } from './scoring.js'

// --- Cue word lists (case-insensitive, word-boundary matching) ---
const ADDRESSED_TO_ALL = ['everyone', 'all', 'team', 'guys', 'folks']

const ACTION_CUES = [
  'please', 'can you', 'could you', 'need to', 'needs to', 'make sure',
  "don't forget", 'bring', 'submit', 'send', 'upload', 'share', 'confirm',
  'set up', 'collect', 'remind', 'reminder', 'handle', 'complete',
]

const URGENCY_CUES = [
  'urgent', 'asap', 'immediately', 'important', 'right now',
  'last chance', 'final', 'sharp', 'no extensions', 'deadline',
]

const DECISION_CUES = [
  'decided', 'final', 'finalised', 'agreed', 'confirmed',
  "let's go with", 'we will', 'changed to', 'rescheduled',
  'postponed', 'cancelled', 'moved to', 'no longer',
]

const LOW_SIGNAL_WORDS = ['ok', 'lol', 'haha', '👍', 'gm', 'thanks', 'nice', 'same', 'sad']

// Escape regex special chars in a string
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Match any word from a list using word boundaries (case-insensitive)
function matchesAny(text, words) {
  const lower = text.toLowerCase()
  return words.some((w) => {
    const re = new RegExp('\\b' + escapeRegex(w) + '\\b', 'i')
    return re.test(lower)
  })
}

// Check if the user's name or any alias appears (word-boundary, case-insensitive, also @name)
function matchesUser(text, userName, aliases) {
  const names = [userName, ...aliases].filter(Boolean).map((n) => n.trim().toLowerCase())
  if (names.length === 0) return false
  const lower = text.toLowerCase()
  return names.some((name) => {
    // Match @name or plain name with word boundaries
    const atRe = new RegExp('@' + escapeRegex(name) + '\\b', 'i')
    const wordRe = new RegExp('\\b' + escapeRegex(name) + '\\b', 'i')
    return atRe.test(lower) || wordRe.test(lower)
  })
}

// Check if message is low-signal: <=3 words with no cue, or emoji-only, or known low-signal word
function isLowSignal(text, cues) {
  const trimmed = text.trim()
  if (trimmed === '') return true

  // Emoji-only check (no alphanumeric characters)
  if (!/[a-z0-9]/i.test(trimmed)) return true

  const words = trimmed.split(/\s+/)
  const wordCount = words.length

  // Known low-signal words (exact match, case-insensitive)
  const lower = trimmed.toLowerCase()
  if (LOW_SIGNAL_WORDS.includes(lower)) return true

  // 3 words or fewer with no meaningful cue
  if (wordCount <= 3 && !cues.mention && !cues.actionCue && !cues.urgencyCue && !cues.decisionCue && !cues.deadline) {
    return true
  }

  return false
}

// Check if user replied after a given message (to detect "possibly missed")
function userRepliedAfter(messages, msgIndex, userName, aliases) {
  const names = [userName, ...aliases].filter(Boolean).map((n) => n.trim().toLowerCase())
  for (let i = msgIndex + 1; i < messages.length; i++) {
    if (names.includes(messages[i].sender.toLowerCase())) return true
  }
  return false
}

// Format a due label relative to the reference time
export function formatDueLabel(dueAt, label, referenceTime) {
  const diffMs = dueAt.getTime() - referenceTime.getTime()
  const absDiff = Math.abs(diffMs)
  const minutes = Math.round(absDiff / (1000 * 60))
  const hours = Math.round(absDiff / (1000 * 60 * 60))

  let relStr
  if (diffMs < 0) {
    if (hours < 1) relStr = `${minutes} min before last message`
    else relStr = `${hours}h before last message`
  } else {
    if (hours < 1) relStr = `${minutes} min after last message`
    else relStr = `${hours}h after last message`
  }

  // Format the due time nicely
  const h12 = dueAt.getHours() > 12 ? dueAt.getHours() - 12 : dueAt.getHours() === 0 ? 12 : dueAt.getHours()
  const ampm = dueAt.getHours() >= 12 ? 'pm' : 'am'
  const timeStr = `${h12}:${String(dueAt.getMinutes()).padStart(2, '0')} ${ampm}`
  const dateStr = `${dueAt.getDate()}/${dueAt.getMonth() + 1}`

  const passed = diffMs < 0 ? ' — was' : ' —'
  return `Due ${timeStr} ${dateStr}${passed} ${relStr}`
}

export function analyzeChat({ messages, userName, aliases = [], since }) {
  if (!messages || messages.length === 0) {
    return emptyResult()
  }

  // Reference time = last message timestamp (deterministic)
  const referenceTime = messages[messages.length - 1].timestamp
  const aliasesArr = aliases.filter(Boolean).map((a) => a.trim()).filter((a) => a.length > 0)
  const userNameLower = (userName || '').trim().toLowerCase()
  const allUserNames = [userNameLower, ...aliasesArr.map((a) => a.toLowerCase())]

  const unreadIndices = []
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    const isUser = allUserNames.includes(msg.sender.toLowerCase())
    if (msg.timestamp.getTime() >= since.getTime() && !isUser) {
      unreadIndices.push(i)
    }
  }

  const items = []
  const lowSignal = []
  let mentionsCount = 0
  let deadlinesCount = 0
  let decisionsCount = 0
  let missedCount = 0

  for (const i of unreadIndices) {
    const msg = messages[i]
    const text = msg.text
    const isMedia = msg.isMedia

    // Detect cues
    const mention = matchesUser(text, userName, aliasesArr)
    const addressedToAll = matchesAny(text, ADDRESSED_TO_ALL)
    const actionCue = matchesAny(text, ACTION_CUES)
    const urgencyCue = matchesAny(text, URGENCY_CUES)
    const decisionCue = matchesAny(text, DECISION_CUES)
    const question = text.includes('?')

    // Extract deadline (resolves relative to message timestamp)
    const deadlineResult = extractDeadline(text, msg.timestamp)
    let deadlineInfo = null
    if (deadlineResult.dueAt) {
      const prox = computeDeadlineProximity(deadlineResult.dueAt, referenceTime)
      // Check if possibly missed: dueAt after message time but before reference time, user didn't reply
      const userReplied = userRepliedAfter(messages, i, userName, aliasesArr)
      const possiblyMissed = deadlineResult.dueAt > msg.timestamp &&
        deadlineResult.dueAt < referenceTime && !userReplied
      deadlineInfo = {
        dueAt: deadlineResult.dueAt,
        label: deadlineResult.label,
        proximityPoints: prox.proximityPoints,
        possiblyMissed,
      }
    }

    // Assemble cues for scoring
    const cues = {
      mention,
      addressedToAll,
      actionCue,
      urgencyCue,
      decisionCue,
      question,
      lowSignal: false, // computed after other cues
      deadline: deadlineInfo,
    }

    // Determine low-signal
    const lowSig = isLowSignal(text, cues) || isMedia
    cues.lowSignal = lowSig

    const scored = scoreMessage(cues)

    if (mention) mentionsCount++
    if (deadlineInfo) deadlinesCount++
    if (decisionCue) decisionsCount++
    if (deadlineInfo && deadlineInfo.possiblyMissed) missedCount++

    const item = {
      id: msg.id,
      messageIndex: i,
      sender: msg.sender,
      text: msg.text,
      timestamp: msg.timestamp,
      isMedia: msg.isMedia,
      score: scored.score,
      reasons: scored.reasons,
      level: scored.level,
      tags: scored.tags,
      deadline: deadlineInfo,
      dueLabel: deadlineInfo ? formatDueLabel(deadlineInfo.dueAt, deadlineInfo.label, referenceTime) : null,
      possiblyMissed: deadlineInfo ? deadlineInfo.possiblyMissed : false,
      mention,
      addressedToAll,
      actionCue,
      urgencyCue,
      decisionCue,
      question,
      lowSignal: lowSig,
    }

    if (lowSig && scored.score < 25 && !mention && !deadlineInfo && !decisionCue) {
      lowSignal.push(item)
    } else {
      items.push(item)
    }
  }

  // Sort by score desc, then time asc
  items.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.timestamp.getTime() - b.timestamp.getTime()
  })

  // matter = items with score >= 25 OR a decision
  const matter = items.filter((i) => i.score >= 25 || i.decisionCue)
  const noise = lowSignal.length

  // doFirst = top 3 with score >= 45 (or fewer if not enough)
  const doFirst = items.filter((i) => i.score >= 45).slice(0, 3)

  const summarySentence = buildSummarySentence(unreadIndices.length, matter.length, mentionsCount, deadlinesCount, decisionsCount)

  return {
    stats: {
      unread: unreadIndices.length,
      matter: matter.length,
      noise,
      mentions: mentionsCount,
      deadlines: deadlinesCount,
      decisions: decisionsCount,
      missed: missedCount,
    },
    items,
    doFirst,
    lowSignal,
    summarySentence,
    referenceTime,
  }
}

function buildSummarySentence(unread, matter, mentions, deadlines, decisions) {
  let parts = [`${unread} unread message${unread !== 1 ? 's' : ''}`]
  let matterParts = []
  if (mentions > 0) matterParts.push(`${mentions} mention${mentions !== 1 ? 's' : ''} you`)
  if (deadlines > 0) matterParts.push(`${deadlines} ha${deadlines !== 1 ? 've' : 's'} deadline${deadlines !== 1 ? 's' : ''}`)
  if (decisions > 0) matterParts.push(`${decisions} decision${decisions !== 1 ? 's' : ''}`)

  let sentence = parts.join('. ')
  if (matter > 0) {
    sentence += `. ${matter} matter`
    if (matterParts.length > 0) sentence += ': ' + matterParts.join(', ')
    sentence += '.'
  } else {
    sentence += '. Nothing critical found.'
  }
  return sentence
}

function emptyResult() {
  return {
    stats: { unread: 0, matter: 0, noise: 0, mentions: 0, deadlines: 0, decisions: 0, missed: 0 },
    items: [],
    doFirst: [],
    lowSignal: [],
    summarySentence: 'No messages to analyse.',
    referenceTime: null,
  }
}
