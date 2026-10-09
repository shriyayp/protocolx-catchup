import { describe, it, expect } from 'vitest'
import { analyzeChat } from './analyzer.js'
import { parseChat } from './chatParser.js'
import sampleChats from '../data/sampleChats.js'

describe('analyzer — mention detection', () => {
  it('detects whole-word mention (+alias, no match inside a longer word)', () => {
    const raw = '09/10/26, 8:00 am - Ananya: Rahul please confirm\n09/10/26, 8:01 am - Karthik: Rahuldas is here too\n09/10/26, 8:02 am - Meera: ok'
    const { messages } = parseChat(raw)
    const result = analyzeChat({ messages, userName: 'Rahul', aliases: ['Rah'], since: new Date('2026-10-09T07:00') })
    const mentionItems = result.items.filter((i) => i.mention)
    // "Rahul" should match, "Rahuldas" should NOT match (word boundary)
    // Only Ananya's message mentions Rahul properly
    expect(mentionItems.length).toBe(1)
    expect(mentionItems[0].sender).toBe('Ananya')
  })

  it('detects alias mention', () => {
    const raw = '09/10/26, 8:00 am - Ananya: @Rah please share the poster\n09/10/26, 8:01 am - Karthik: ok'
    const { messages } = parseChat(raw)
    const result = analyzeChat({ messages, userName: 'Rahul', aliases: ['Rah'], since: new Date('2026-10-09T07:00') })
    const mentionItems = result.items.filter((i) => i.mention)
    expect(mentionItems.length).toBe(1)
  })
})

describe('analyzer — deadline extraction', () => {
  it('"by 10 am today" resolves to 10:00 on the message date', () => {
    const raw = '09/10/26, 8:00 am - Ananya: Submit by 10 am today\n09/10/26, 9:00 am - Karthik: ok'
    const { messages } = parseChat(raw)
    const result = analyzeChat({ messages, userName: 'Rahul', aliases: [], since: new Date('2026-10-09T07:00') })
    const deadlineItem = result.items.find((i) => i.deadline)
    expect(deadlineItem).toBeDefined()
    expect(deadlineItem.deadline.dueAt.getHours()).toBe(10)
    expect(deadlineItem.deadline.dueAt.getMinutes()).toBe(0)
  })

  it('"tomorrow 5 pm" resolves to next day 17:00', () => {
    const raw = '08/10/26, 2:00 pm - Divya: Assignment due by tomorrow 5 pm\n08/10/26, 2:30 pm - Arjun: ok'
    const { messages } = parseChat(raw)
    const result = analyzeChat({ messages, userName: 'Rahul', aliases: [], since: new Date('2026-10-08T13:00') })
    const deadlineItem = result.items.find((i) => i.deadline)
    expect(deadlineItem).toBeDefined()
    expect(deadlineItem.deadline.dueAt.getHours()).toBe(17)
    // Should be the next day (Oct 9)
    expect(deadlineItem.deadline.dueAt.getDate()).toBe(9)
  })

  it('"12 noon" resolves to 12:00', () => {
    const raw = '09/10/26, 9:00 am - Meera: Mentor wants the link at 12 noon sharp\n09/10/26, 9:30 am - Karthik: ok'
    const { messages } = parseChat(raw)
    const result = analyzeChat({ messages, userName: 'Rahul', aliases: [], since: new Date('2026-10-09T07:00') })
    const deadlineItem = result.items.find((i) => i.deadline)
    expect(deadlineItem).toBeDefined()
    expect(deadlineItem.deadline.dueAt.getHours()).toBe(12)
    expect(deadlineItem.deadline.dueAt.getMinutes()).toBe(0)
  })
})

describe('analyzer — scoring', () => {
  it('an urgent mention + near deadline reaches Critical (>=70)', () => {
    // Message at 9:40 am, deadline at 12 noon, reference time ~9:40 am (last message)
    const raw = '09/10/26, 9:40 am - Meera: @Rahul urgent - mentor wants to see the repo link at 12 noon sharp\n09/10/26, 9:41 am - Karthik: ok'
    const { messages } = parseChat(raw)
    const result = analyzeChat({ messages, userName: 'Rahul', aliases: [], since: new Date('2026-10-09T07:00') })
    const item = result.items.find((i) => i.mention)
    expect(item).toBeDefined()
    expect(item.score).toBeGreaterThanOrEqual(70)
    expect(item.level).toBe('Critical')
  })

  it('"lol" is low-signal', () => {
    const raw = '09/10/26, 8:00 am - Ananya: Rahul please submit by 10 am today\n09/10/26, 8:01 am - Karthik: lol'
    const { messages } = parseChat(raw)
    const result = analyzeChat({ messages, userName: 'Rahul', aliases: [], since: new Date('2026-10-09T07:00') })
    const lolItem = result.lowSignal.find((i) => i.sender === 'Karthik')
    expect(lolItem).toBeDefined()
    expect(lolItem.lowSignal).toBe(true)
  })

  it('a past deadline is tagged "Possibly missed"', () => {
    // Message at 5:15 pm, deadline at 6 pm today, reference time (last msg) at 8:00 pm
    // dueAt (6pm) is after msg time (5:15pm) but before reference (8pm) -> possibly missed
    const raw = '[08/10/26, 5:15:00 PM] Priya: @Rahul can you share the poster by 6 pm today? Urgent\n[08/10/26, 8:00:00 PM] Vikram: lol'
    const { messages } = parseChat(raw)
    const result = analyzeChat({ messages, userName: 'Rahul', aliases: [], since: new Date('2026-10-08T17:00') })
    const deadlineItem = result.items.find((i) => i.deadline)
    expect(deadlineItem).toBeDefined()
    expect(deadlineItem.possiblyMissed).toBe(true)
    expect(deadlineItem.tags).toContain('Possibly missed')
  })
})

describe('analyzer — Sample Chat 1', () => {
  it("puts Meera's 9:40 am message in the top 3", () => {
    const sample = sampleChats[0]
    const { messages } = parseChat(sample.rawText)
    const result = analyzeChat({
      messages,
      userName: sample.defaultUser,
      aliases: [],
      since: new Date(sample.defaultSince),
    })
    const top3Texts = result.doFirst.map((i) => i.text)
    const hasMeera940 = top3Texts.some((t) => t.includes('@Rahul urgent') && t.includes('12 noon'))
    expect(hasMeera940).toBe(true)
  })
})
