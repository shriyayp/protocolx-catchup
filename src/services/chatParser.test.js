import { describe, it, expect } from 'vitest'
import { parseChat } from './chatParser.js'

describe('chatParser', () => {
  it('parses an Android 12h line', () => {
    const result = parseChat('09/10/26, 8:05 am - Ananya: Hello team\n09/10/26, 8:10 am - Karthik: Hi')
    expect(result.messages).toHaveLength(2)
    expect(result.messages[0].sender).toBe('Ananya')
    expect(result.messages[0].text).toBe('Hello team')
    expect(result.messages[0].timestamp.getHours()).toBe(8)
    expect(result.messages[0].timestamp.getMinutes()).toBe(5)
  })

  it('parses an iOS bracket line', () => {
    const result = parseChat('[09/10/26, 10:15:32 AM] Priya: Meeting now\n[09/10/26, 10:20:00 AM] Vikram: On my way')
    expect(result.messages).toHaveLength(2)
    expect(result.messages[0].sender).toBe('Priya')
    expect(result.messages[0].text).toBe('Meeting now')
    expect(result.messages[0].timestamp.getHours()).toBe(10)
  })

  it('appends continuation lines to previous message', () => {
    const raw = '09/10/26, 2:00 pm - Divya: Important update:\nThe assignment is due tomorrow.\n09/10/26, 2:05 pm - Arjun: ok'
    const result = parseChat(raw)
    expect(result.messages).toHaveLength(2)
    expect(result.messages[0].text).toBe('Important update:\nThe assignment is due tomorrow.')
  })

  it('ignores system lines', () => {
    const raw = 'Messages are end-to-end encrypted.\n09/10/26, 8:00 am - Ananya: Hi\n09/10/26, 8:01 am - Karthik: Hey'
    const result = parseChat(raw)
    expect(result.messages).toHaveLength(2)
    expect(result.messages[0].sender).toBe('Ananya')
  })

  it('returns error for invalid input (fewer than 2 messages)', () => {
    const result = parseChat('this is not a chat export')
    expect(result.error).toBe(true)
    expect(result.messages).toHaveLength(0)
    expect(result.example).toBeDefined()
  })
})
