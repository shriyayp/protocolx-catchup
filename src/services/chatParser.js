/**
 * chatParser.js — Parses raw WhatsApp-export text into structured messages.
 * Supports Android (12h and 24h) and iOS bracket formats.
 * Dates are DD/MM/YY or DD/MM/YYYY (India convention).
 *
 * parseChat(rawText) returns:
 *   { messages: [{ id, timestamp: Date, sender, text, isMedia }], skippedLines: number }
 * On invalid input (fewer than 2 messages parsed) returns:
 *   { messages: [], skippedLines, error: true, example: "..." }
 */

// Android 12h: 09/10/26, 8:05 am - Name: text
// Android 24h: 09/10/2026, 20:05 - Name: text
const ANDROID_RE = /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s+(\d{1,2}:\d{2}(?:\s*[ap]m)?)\s+-\s+(.*)$/i

// iOS bracket: [09/10/26, 10:15:32 AM] Name: text
const IOS_RE = /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),\s+(\d{1,2}:\d{2}:\d{2}\s*[AP]M)\]\s+(.*)$/i

const EXAMPLE = `Expected WhatsApp export format. Examples:

Android:
09/10/26, 8:05 am - Ananya: Hello team
09/10/2026, 20:05 - Karthik: See you there

iOS:
[09/10/26, 10:15:32 AM] Ananya: Hello team`

// System lines that don't have a "Sender:" pattern are ignored.
// System hints — only checked when no "Sender:" pattern exists.
const SYSTEM_HINTS = [
  'messages are end-to-end encrypted',
  'changed the subject',
  'created group',
  'security code changed',
  "you'll need to",
  'tap to',
  'this message was deleted',
  'image omitted',
  'video omitted',
  'audio omitted',
  'document omitted',
  'sticker omitted',
  'gif omitted',
]

// Words like "joined", "left", "added", "removed" are only treated as system
// lines when there is no colon (no sender). This avoids skipping real messages
// like "Rahul: I left my charger at home".
function isSystemLine(rest) {
  // No colon means no sender -> system line
  if (!rest.includes(':')) return true
  // With a colon, only skip known system notices that wouldn't come from a user
  const lower = rest.toLowerCase()
  return SYSTEM_HINTS.some((h) => lower.includes(h))
}

// Parse a DD/MM/YY or DD/MM/YYYY date. 2-digit year => 2000+yy.
function parseDate(dateStr) {
  const [dd, mm, yy] = dateStr.split('/')
  const day = parseInt(dd, 10)
  const month = parseInt(mm, 10) - 1 // JS months are 0-indexed
  let year = parseInt(yy, 10)
  if (yy.length === 2) year += 2000
  return { day, month, year }
}

// Parse a time string into { hours, minutes }.
// Handles "8:05 am", "20:05", "10:15:32 AM"
function parseTime(timeStr) {
  const cleaned = timeStr.trim().toUpperCase().replace(/\s+/g, '')
  // Remove seconds if present
  const parts = cleaned.split(':')
  let hours = parseInt(parts[0], 10)
  let minutes = parseInt(parts[1], 10)
  if (parts.length === 3) {
    // Seconds present (iOS format); ignore seconds
  }
  const ampm = cleaned.match(/[AP]M$/)
  if (ampm) {
    if (ampm[0] === 'PM' && hours !== 12) hours += 12
    if (ampm[0] === 'AM' && hours === 12) hours = 0
  }
  return { hours, minutes }
}

function buildTimestamp(dateStr, timeStr) {
  const { day, month, year } = parseDate(dateStr)
  const { hours, minutes } = parseTime(timeStr)
  return new Date(year, month, day, hours, minutes, 0)
}

export function parseChat(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { messages: [], skippedLines: 0, error: true, example: EXAMPLE }
  }

  const lines = rawText.split('\n')
  const messages = []
  let skippedLines = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim() === '') {
      skippedLines++
      continue
    }

    let match = line.match(ANDROID_RE)
    let isIOS = false

    if (!match) {
      match = line.match(IOS_RE)
      if (match) isIOS = true
    }

    if (!match) {
      // Continuation line: append to previous message
      if (messages.length > 0) {
        messages[messages.length - 1].text += '\n' + line
      } else {
        skippedLines++
      }
      continue
    }

    const dateStr = match[1]
    const timeStr = match[2]
    const rest = match[3]

    // Check for system lines (no sender, or system hints)
    if (isSystemLine(rest)) {
      skippedLines++
      continue
    }

    // Extract sender and text: first colon separates sender from message
    const colonIdx = rest.indexOf(':')
    const sender = rest.substring(0, colonIdx).trim()
    const text = rest.substring(colonIdx + 1).trim()

    if (!sender) {
      skippedLines++
      continue
    }

    const isMedia = text.includes('<Media omitted>') || text.includes('<media omitted>')

    messages.push({
      id: messages.length,
      timestamp: buildTimestamp(dateStr, timeStr),
      sender,
      text,
      isMedia,
    })
  }

  if (messages.length < 2) {
    return { messages: [], skippedLines, error: true, example: EXAMPLE }
  }

  return { messages, skippedLines }
}

export { EXAMPLE }
