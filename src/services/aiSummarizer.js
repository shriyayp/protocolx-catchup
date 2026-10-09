const FUNCTION_PATH = '/functions/v1/summarize-chat'
const CHUNK_MESSAGE_LIMIT = 200
const CHUNK_CHARACTER_LIMIT = 28000
const CONCURRENCY_LIMIT = 3

function formatMessage(message) {
  return `[${message.id}] ${message.timestamp.toISOString()} — ${message.sender}: ${message.text}`
}

export function chunkMessages(messages) {
  if (messages.length === 0) return []
  const chunks = []
  let start = 0
  while (start < messages.length) {
    let end = start
    let characters = 0
    while (end < messages.length && end - start < CHUNK_MESSAGE_LIMIT) {
      const nextLength = formatMessage(messages[end]).length + 1
      if (end > start && characters + nextLength > CHUNK_CHARACTER_LIMIT) break
      characters += nextLength
      end += 1
    }
    if (end === start) end = start + 1
    chunks.push(messages.slice(start, end))
    start = end
  }
  return chunks
}

function getFunctionUrl() {
  return `${import.meta.env.VITE_SUPABASE_URL}${FUNCTION_PATH}`
}

async function callSummarizer(body, signal) {
  let response
  try {
    response = await fetch(getFunctionUrl(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new Error('Could not reach the AI service. Check your connection and try again.')
  }

  let payload
  try {
    payload = await response.json()
  } catch {
    throw new Error('The AI service returned an invalid response.')
  }
  if (!response.ok) {
    throw new Error(payload?.error || 'The AI service could not generate a summary.')
  }
  if (!payload || typeof payload !== 'object' || !payload.data) {
    throw new Error('The AI service returned an incomplete summary.')
  }
  return payload.data
}

function uniqueMessages(messages) {
  const byId = new Map()
  messages.forEach((message) => byId.set(message.id, message))
  return [...byId.values()]
}

async function processChunk({ chunk, index, total, userName, aliases, signal }) {
  if (signal?.aborted) throw new DOMException('AI summarisation was cancelled.', 'AbortError')
  const data = await callSummarizer({
    mode: 'chunk',
    userName,
    aliases,
    chunkNumber: index + 1,
    totalChunks: total,
    messages: chunk.map(formatMessage),
  }, signal)
  return { index, data }
}

async function runConcurrent(items, limit, worker, signal) {
  const results = new Array(items.length)
  let nextIndex = 0
  let completed = 0

  async function runNext() {
    while (nextIndex < items.length) {
      if (signal?.aborted) throw new DOMException('AI summarisation was cancelled.', 'AbortError')
      const myIndex = nextIndex
      nextIndex += 1
      results[myIndex] = await worker(items[myIndex], myIndex)
      completed += 1
    }
  }

  const runners = Array.from({ length: Math.min(limit, items.length) }, () => runNext())
  await Promise.all(runners)
  return results
}

export async function generateAiSummary({ messages, userName, aliases, localItems = [], onProgress, signal }) {
  const chunks = chunkMessages(messages)
  if (chunks.length === 0) throw new Error('There are no messages to summarize.')

  const totalSteps = chunks.length + 1
  let completedChunks = 0
  const failedChunks = []

  onProgress?.({ current: 0, total: totalSteps, label: `Summarising ${chunks.length} ${chunks.length === 1 ? 'batch' : 'batches'} of conversation…` })

  const chunkResults = await runConcurrent(
    chunks,
    CONCURRENCY_LIMIT,
    async (chunk, index) => {
      try {
        const result = await processChunk({ chunk, index, total: chunks.length, userName, aliases, signal })
        completedChunks += 1
        onProgress?.({ current: completedChunks, total: totalSteps, label: `Summarised ${completedChunks} of ${chunks.length} ${chunks.length === 1 ? 'batch' : 'batches'}…` })
        return result
      } catch (error) {
        if (signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
          throw new DOMException('AI summarisation was cancelled.', 'AbortError')
        }
        if (chunks.length === 1) throw error
        failedChunks.push(index + 1)
        completedChunks += 1
        onProgress?.({ current: completedChunks, total: totalSteps, label: `Summarised ${completedChunks} of ${chunks.length} ${chunks.length === 1 ? 'batch' : 'batches'}…` })
        return { index, data: null }
      }
    },
    signal
  )

  const chunkSummaries = chunkResults
    .filter((r) => r && r.data)
    .sort((a, b) => a.index - b.index)
    .map((r) => r.data)

  if (chunkSummaries.length === 0) {
    throw new Error('Could not process any part of this conversation. Please try again.')
  }

  onProgress?.({ current: chunks.length, total: totalSteps, label: 'Finalising your English briefing…' })

  const referenceMessages = uniqueMessages([
    ...localItems.map((item) => messages.find((message) => message.id === item.id)).filter(Boolean),
    ...messages.filter((message) => /\?|deadline|decided|confirmed|please|can you|due/i.test(message.text)).slice(0, 30),
  ]).slice(0, 50).map(formatMessage)

  const finalData = await callSummarizer({
    mode: 'final',
    userName,
    aliases,
    chunkSummaries,
    referenceMessages,
  }, signal)

  const messageById = new Map(messages.map((message) => [String(message.id), message]))
  const hydrateEvidence = (items = []) => items.map((item) => {
    const original = messageById.get(String(item.messageId))
    if (!original) return null
    return {
      ...item,
      sender: original.sender,
      timestamp: original.timestamp.toISOString(),
      original: original.text,
    }
  }).filter(Boolean)

  onProgress?.({ current: totalSteps, total: totalSteps, label: 'Briefing complete' })
  return {
    ...finalData,
    mentions: hydrateEvidence(finalData.mentions),
    importantMessages: hydrateEvidence(finalData.importantMessages),
    partialFailure: failedChunks.length > 0 ? failedChunks : undefined,
  }
}
