import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { chunkMessages, generateAiSummary } from './aiSummarizer.js'

function message(id, text, sender = 'Sender', minutes = 0) {
  return { id, sender, text, timestamp: new Date(`2026-10-09T10:${String(minutes).padStart(2, '0')}:00Z`) }
}

describe('chunkMessages', () => {
  it('groups messages into large chunks, not one-per-message', () => {
    const messages = Array.from({ length: 500 }, (_, index) => message(index, `Message ${index}`))
    const chunks = chunkMessages(messages)
    expect(chunks.length).toBeLessThan(10)
    expect(chunks[0].length).toBeGreaterThanOrEqual(100)
  })

  it('preserves message order with no gaps or overlaps', () => {
    const messages = Array.from({ length: 500 }, (_, index) => message(index, `Message ${index}`))
    const chunks = chunkMessages(messages)
    const allIds = chunks.flat().map((item) => item.id)
    expect(allIds[0]).toBe(0)
    expect(allIds.at(-1)).toBe(499)
    expect(allIds).toHaveLength(500)
    for (let i = 1; i < allIds.length; i++) {
      expect(allIds[i]).toBe(allIds[i - 1] + 1)
    }
  })

  it('returns an empty list for an empty conversation', () => {
    expect(chunkMessages([])).toEqual([])
  })

  it('produces a single chunk for small conversations', () => {
    const messages = Array.from({ length: 30 }, (_, index) => message(index, `Msg ${index}`))
    const chunks = chunkMessages(messages)
    expect(chunks).toHaveLength(1)
    expect(chunks[0]).toHaveLength(30)
  })

  it('splits by character limit when messages are long', () => {
    const longText = 'x'.repeat(500)
    const messages = Array.from({ length: 100 }, (_, index) => message(index, longText))
    const chunks = chunkMessages(messages)
    expect(chunks.length).toBeGreaterThan(1)
    for (const chunk of chunks) {
      const totalChars = chunk.map((m) => `[${m.id}] ${m.timestamp.toISOString()} — ${m.sender}: ${m.text}`).join('\n').length
      expect(totalChars).toBeLessThanOrEqual(30000)
    }
  })
})

describe('generateAiSummary', () => {
  let originalFetch

  beforeEach(() => {
    originalFetch = global.fetch
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('throws on empty messages', async () => {
    await expect(generateAiSummary({ messages: [], userName: 'Alice', aliases: [] })).rejects.toThrow('no messages to summarize')
  })

  it('rejects when the server returns a non-ok response with error message', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: 'AI summarisation is not configured yet.' }),
    })
    global.fetch = mockFetch

    await expect(
      generateAiSummary({ messages: [message(0, 'Hello')], userName: 'Alice', aliases: [] })
    ).rejects.toThrow('AI summarisation is not configured yet.')
  })

  it('rejects on network failure with a user-friendly message', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    global.fetch = mockFetch

    await expect(
      generateAiSummary({ messages: [message(0, 'Hello')], userName: 'Alice', aliases: [] })
    ).rejects.toThrow('Could not reach the AI service')
  })

  it('rejects on invalid JSON response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => { throw new SyntaxError('Unexpected token') },
    })
    global.fetch = mockFetch

    await expect(
      generateAiSummary({ messages: [message(0, 'Hello')], userName: 'Alice', aliases: [] })
    ).rejects.toThrow('invalid response')
  })

  it('rejects when response has no data field', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ somethingElse: true }),
    })
    global.fetch = mockFetch

    await expect(
      generateAiSummary({ messages: [message(0, 'Hello')], userName: 'Alice', aliases: [] })
    ).rejects.toThrow('incomplete summary')
  })

  it('produces a summary with hydrated evidence messages', async () => {
    const chunkData = { overview: 'Test', updates: [], decisions: [], deadlines: [], actions: [], mentions: [], importantMessageIds: ['0'] }
    const finalData = {
      summary: 'The team discussed the project.',
      keyUpdates: ['Budget approved'],
      decisions: [{ text: 'Use React', evidenceIds: ['1'] }],
      deadlines: [{ text: 'Submit report', date: '2026-10-15', evidenceIds: ['2'] }],
      actionItems: [{ task: 'Send email', owner: 'Alice', due: 'Friday' }],
      mentions: [{ messageId: '0', original: '', translation: '', reason: 'Mentions Alice' }],
      importantMessages: [{ messageId: '0', original: '', translation: 'Hello in English', reason: 'Greeting' }],
    }
    let callCount = 0
    const mockFetch = vi.fn().mockImplementation(() => {
      callCount += 1
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ data: callCount === 1 ? chunkData : finalData }),
      })
    })
    global.fetch = mockFetch

    const result = await generateAiSummary({
      messages: [message(0, 'Namaste Alice', 'Bob')],
      userName: 'Alice',
      aliases: [],
    })
    expect(result.summary).toBe('The team discussed the project.')
    expect(result.mentions).toHaveLength(1)
    expect(result.mentions[0].sender).toBe('Bob')
    expect(result.mentions[0].original).toBe('Namaste Alice')
    expect(result.importantMessages).toHaveLength(1)
    expect(result.importantMessages[0].translation).toBe('Hello in English')
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('reports partial failure when some chunks fail but others succeed', async () => {
    const chunkData = { overview: 'Test', updates: [], decisions: [], deadlines: [], actions: [], mentions: [], importantMessageIds: [] }
    const finalData = { summary: 'Partial summary', keyUpdates: [], decisions: [], deadlines: [], actionItems: [], mentions: [], importantMessages: [] }
    let callCount = 0
    const mockFetch = vi.fn().mockImplementation(() => {
      callCount += 1
      if (callCount === 1) {
        return Promise.resolve({ ok: false, status: 500, json: async () => ({ error: 'Server error' }) })
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ data: callCount === 2 ? chunkData : finalData }),
      })
    })
    global.fetch = mockFetch

    const messages = Array.from({ length: 250 }, (_, i) => message(i, `Message ${i} with some text to fill`))
    const result = await generateAiSummary({ messages, userName: 'Alice', aliases: [] })
    expect(result.summary).toBe('Partial summary')
    expect(result.partialFailure).toBeDefined()
  })

  it('throws if all chunks fail', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' }),
    })
    global.fetch = mockFetch

    const messages = Array.from({ length: 250 }, (_, i) => message(i, `Message ${i} with some text`))
    await expect(generateAiSummary({ messages, userName: 'Alice', aliases: [] })).rejects.toThrow('Could not process any part')
  })

  it('can be cancelled via AbortSignal', async () => {
    const mockFetch = vi.fn().mockImplementation((_url, opts) => {
      return new Promise((_resolve, reject) => {
        if (opts?.signal) {
          opts.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
        }
      })
    })
    global.fetch = mockFetch

    const controller = new AbortController()
    const promise = generateAiSummary({
      messages: [message(0, 'Hello')],
      userName: 'Alice',
      aliases: [],
      signal: controller.signal,
    })
    controller.abort()
    await expect(promise).rejects.toThrow('cancelled')
  })

  it('processes multiple chunks concurrently (not sequentially)', async () => {
    const callTimestamps = []
    const mockFetch = vi.fn().mockImplementation(() => {
      callTimestamps.push(Date.now())
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: { overview: 'ok', updates: [], decisions: [], deadlines: [], actions: [], mentions: [], importantMessageIds: [] } }),
        }), 100)
      })
    })
    global.fetch = mockFetch

    const messages = Array.from({ length: 500 }, (_, i) => message(i, `Message ${i} with some text to ensure multiple chunks`))
    const start = Date.now()
    await generateAiSummary({ messages, userName: 'Alice', aliases: [] })
    const elapsed = Date.now() - start

    const chunkCalls = callTimestamps.length - 1
    expect(chunkCalls).toBeGreaterThan(1)
    expect(elapsed).toBeLessThan(chunkCalls * 100)
  })

  it('makes only one chunk request plus one final request for small conversations', async () => {
    let callCount = 0
    const mockFetch = vi.fn().mockImplementation(() => {
      callCount += 1
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ data: callCount === 1
          ? { overview: 'ok', updates: [], decisions: [], deadlines: [], actions: [], mentions: [], importantMessageIds: [] }
          : { summary: 'Done', keyUpdates: [], decisions: [], deadlines: [], actionItems: [], mentions: [], importantMessages: [] }
        }),
      })
    })
    global.fetch = mockFetch

    const messages = Array.from({ length: 10 }, (_, i) => message(i, `Hi ${i}`))
    await generateAiSummary({ messages, userName: 'Alice', aliases: [] })
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})
