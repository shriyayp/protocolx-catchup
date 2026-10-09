/**
 * dateExtractor.js — Extracts deadlines from message text.
 * Resolves relative times/days against the MESSAGE's own timestamp.
 *
 * extractDeadline(text, messageTimestamp) returns { dueAt: Date|null, label: string|null }
 * A deadline exists only if a time or day reference is found AND a temporal cue word is present.
 */

const TEMPORAL_CUES = [
  'by', 'before', 'due', 'until', 'till', 'closes', 'last date',
  'at', 'on', 'sharp', 'starts', 'reporting', 'meeting', 'submit',
  'changed to',
]

// Words that indicate something is addressed to everyone
const TIME_WORDS = {
  noon: 12,
  midnight: 23.983, // 23:59
  eod: 18,
  'end of day': 18,
  tonight: 21,
}

const WEEKDAYS = [
  'sunday', 'monday', 'tuesday', 'wednesday',
  'thursday', 'friday', 'saturday',
]

const WEEKDAY_ABBR = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

// Find next occurrence of a weekday after the message date (inclusive of same day)
function nextWeekdayOccurrence(targetDay, fromDate) {
  const result = new Date(fromDate)
  result.setHours(0, 0, 0, 0)
  let currentDay = result.getDay()
  let diff = (targetDay - currentDay + 7) % 7
  // If today is that weekday, use today
  if (diff === 0) diff = 0
  result.setDate(result.getDate() + diff)
  return result
}

// Parse "15 Oct" or "15/10" relative to the message year
function parseDayMonth(text, msgDate) {
  // "15 Oct" pattern
  let m = text.match(/\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i)
  if (m) {
    const day = parseInt(m[1], 10)
    const monthMap = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 }
    const month = monthMap[m[2].toLowerCase()]
    const year = msgDate.getFullYear()
    const date = new Date(year, month, day, 23, 59, 0)
    // If the date has already passed relative to message, move to next year
    if (date < msgDate) date.setFullYear(year + 1)
    return date
  }

  // "15/10" pattern (DD/MM)
  m = text.match(/\b(\d{1,2})\/(\d{1,2})\b/)
  if (m) {
    const day = parseInt(m[1], 10)
    const month = parseInt(m[2], 10) - 1
    const year = msgDate.getFullYear()
    const date = new Date(year, month, day, 23, 59, 0)
    if (date < msgDate) date.setFullYear(year + 1)
    return date
  }

  return null
}

// Parse a time like "5 pm", "5:30pm", "17:00"
function parseTimeInText(text) {
  // "5:30 pm" or "5:30pm"
  let m = text.match(/\b(\d{1,2}):(\d{2})\s*([ap]m)?\b/i)
  if (m) {
    let hours = parseInt(m[1], 10)
    const minutes = parseInt(m[2], 10)
    const ampm = m[3] ? m[3].toUpperCase() : null
    if (ampm === 'PM' && hours !== 12) hours += 12
    if (ampm === 'AM' && hours === 12) hours = 0
    return { hours, minutes }
  }

  // "5 pm" or "5pm"
  m = text.match(/\b(\d{1,2})\s*([ap]m)\b/i)
  if (m) {
    let hours = parseInt(m[1], 10)
    const ampm = m[2].toUpperCase()
    if (ampm === 'PM' && hours !== 12) hours += 12
    if (ampm === 'AM' && hours === 12) hours = 0
    return { hours, minutes: 0 }
  }

  // "17:00" (24h)
  m = text.match(/\b(\d{1,2}):(\d{2})\b/)
  if (m) {
    return { hours: parseInt(m[1], 10), minutes: parseInt(m[2], 10) }
  }

  return null
}

// Check if any temporal cue word is present (word-boundary, case-insensitive)
function hasTemporalCue(text) {
  const lower = ' ' + text.toLowerCase() + ' '
  return TEMPORAL_CUES.some((cue) => {
    // Match word-boundary for each cue
    const re = new RegExp('\\b' + cue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b')
    return re.test(lower)
  })
}

export function extractDeadline(text, msgTimestamp) {
  const lower = text.toLowerCase()

  // Must have a temporal cue to count as a deadline
  if (!hasTemporalCue(text)) return { dueAt: null, label: null }

  let dayRef = null
  let dayLabel = ''
  let timeRef = null
  let timeLabel = ''

  // Check for explicit day references
  // "today"
  if (/\btoday\b/.test(lower)) {
    dayRef = new Date(msgTimestamp)
    dayRef.setHours(0, 0, 0, 0)
    dayLabel = 'today'
  }
  // "tomorrow" or "tmrw"
  if (/\btomorrow\b/.test(lower) || /\btmrw\b/.test(lower)) {
    dayRef = new Date(msgTimestamp)
    dayRef.setDate(dayRef.getDate() + 1)
    dayRef.setHours(0, 0, 0, 0)
    dayLabel = 'tomorrow'
  }

  // Weekday names
  for (let i = 0; i < WEEKDAYS.length; i++) {
    if (new RegExp('\\b' + WEEKDAYS[i] + '\\b').test(lower)) {
      dayRef = nextWeekdayOccurrence(i, msgTimestamp)
      dayLabel = WEEKDAYS[i]
      break
    }
    if (new RegExp('\\b' + WEEKDAY_ABBR[i] + '\\b').test(lower)) {
      dayRef = nextWeekdayOccurrence(i, msgTimestamp)
      dayLabel = WEEKDAYS[i]
      break
    }
  }

  // "15 Oct" or "15/10"
  if (!dayRef) {
    const dm = parseDayMonth(text, msgTimestamp)
    if (dm) {
      dayRef = dm
      dayLabel = `${dm.getDate()}/${dm.getMonth() + 1}`
    }
  }

  // Check for time references
  // First check special time words
  for (const [word, hour] of Object.entries(TIME_WORDS)) {
    if (new RegExp('\\b' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(lower)) {
      const h = Math.floor(hour)
      const min = hour === 23.983 ? 59 : 0
      timeRef = { hours: h, minutes: min }
      timeLabel = word === 'eod' || word === 'end of day' ? 'end of day' : word
      break
    }
  }

  // Then check numeric time patterns
  if (!timeRef) {
    const t = parseTimeInText(text)
    if (t) {
      timeRef = t
      const ampm = t.hours >= 12 ? 'pm' : 'am'
      const h12 = t.hours > 12 ? t.hours - 12 : t.hours === 0 ? 12 : t.hours
      timeLabel = `${h12}:${String(t.minutes).padStart(2, '0')} ${ampm}`
    }
  }

  // Need at least a day or a time to form a deadline
  if (!dayRef && !timeRef) return { dueAt: null, label: null }

  let dueAt
  let label

  if (dayRef && timeRef) {
    // Both day and time
    dueAt = new Date(dayRef)
    dueAt.setHours(timeRef.hours, timeRef.minutes, 0, 0)
    label = `${timeLabel} ${dayLabel}`
  } else if (dayRef) {
    // Day only => 23:59 that day
    dueAt = new Date(dayRef)
    dueAt.setHours(23, 59, 0, 0)
    label = `end of ${dayLabel}`
  } else {
    // Time only => that time on message date; next day if already passed
    dueAt = new Date(msgTimestamp)
    dueAt.setHours(timeRef.hours, timeRef.minutes, 0, 0)
    if (dueAt <= msgTimestamp) {
      dueAt.setDate(dueAt.getDate() + 1)
    }
    label = `${timeLabel}`
  }

  return { dueAt, label }
}
