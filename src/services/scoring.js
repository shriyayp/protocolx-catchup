/**
 * scoring.js — Assigns points to messages based on detected cues.
 * Returns { score, reasons: [{ label, points }], level, tags: [] }
 *
 * Levels: >=70 Critical, 45-69 High, 25-44 Medium, <25 Low
 */

export function computeLevel(score) {
  if (score >= 70) return 'Critical'
  if (score >= 45) return 'High'
  if (score >= 25) return 'Medium'
  return 'Low'
}

/**
 * Computes score and reasons for a message given its detected cues.
 * @param {Object} cues - { mention, addressedToAll, actionCue, urgencyCue, decisionCue, question, lowSignal, deadline: { dueAt, label, possiblyMissed, proximityPoints } }
 * @returns { score, reasons, level, tags }
 */
export function scoreMessage(cues) {
  const reasons = []
  const tags = []
  let score = 0

  if (cues.mention) {
    score += 40
    reasons.push({ label: 'Mentions you', points: 40 })
    tags.push('Mention')
  }
  if (cues.addressedToAll) {
    score += 10
    reasons.push({ label: 'Addressed to everyone', points: 10 })
    tags.push('All')
  }
  if (cues.actionCue) {
    score += 15
    reasons.push({ label: 'Action cue', points: 15 })
    tags.push('Action')
  }
  if (cues.urgencyCue) {
    score += 10
    reasons.push({ label: 'Urgency cue', points: 10 })
    tags.push('Urgent')
  }
  if (cues.decisionCue) {
    score += 10
    reasons.push({ label: 'Decision', points: 10 })
    tags.push('Decision')
  }
  if (cues.question && cues.mention) {
    score += 10
    reasons.push({ label: 'Question that mentions you', points: 10 })
    tags.push('Question')
  }
  if (cues.deadline && cues.deadline.dueAt) {
    score += 20
    reasons.push({ label: 'Deadline present', points: 20 })
    tags.push('Deadline')

    // Proximity points
    const prox = cues.deadline.proximityPoints
    if (prox > 0) {
      score += prox
      const proxLabel = prox === 30 ? 'Due within 2h' : prox === 20 ? 'Due within 24h' : prox === 10 ? 'Due later' : 'Deadline passed'
      reasons.push({ label: proxLabel, points: prox })
    }

    if (cues.deadline.possiblyMissed) {
      tags.push('Possibly missed')
    }
  }
  if (cues.lowSignal) {
    score -= 30
    reasons.push({ label: 'Low-signal message', points: -30 })
  }

  return {
    score,
    reasons,
    level: computeLevel(score),
    tags,
  }
}

/**
 * Computes proximity points for a deadline relative to the reference time (now).
 * - Due within 2h: +30
 * - Due within 24h: +20
 * - Due later: +10
 * - Already passed: +5, and possiblyMissed = true
 */
export function computeDeadlineProximity(dueAt, referenceTime) {
  const diffMs = dueAt.getTime() - referenceTime.getTime()
  const twoHours = 2 * 60 * 60 * 1000
  const twentyFourHours = 24 * 60 * 60 * 1000

  if (diffMs < 0) {
    // Already passed
    return { proximityPoints: 5, possiblyMissed: true }
  }
  if (diffMs <= twoHours) {
    return { proximityPoints: 30, possiblyMissed: false }
  }
  if (diffMs <= twentyFourHours) {
    return { proximityPoints: 20, possiblyMissed: false }
  }
  return { proximityPoints: 10, possiblyMissed: false }
}
