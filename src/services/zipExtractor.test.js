import { describe, expect, it } from 'vitest'
import { zipSync, strToU8 } from 'fflate'
import { extractZipTranscripts } from './zipExtractor.js'

const transcript = `09/10/26, 8:05 am - Rahul: Morning team\n09/10/26, 8:15 am - Ananya: See you soon`

function makeFile(entries) {
  const archive = zipSync(Object.fromEntries(Object.entries(entries).map(([path, text]) => [path, strToU8(text)])))
  return {
    size: archive.byteLength,
    arrayBuffer: async () => archive.buffer,
  }
}

function makeCorruptFile() {
  const bytes = new Uint8Array([1, 2, 3, 4])
  return {
    size: bytes.byteLength,
    arrayBuffer: async () => bytes.buffer,
  }
}

describe('extractZipTranscripts', () => {
  it('finds a transcript at the archive root', async () => {
    const candidates = await extractZipTranscripts(makeFile({ 'WhatsApp Chat with Team.txt': transcript }))
    expect(candidates).toHaveLength(1)
    expect(candidates[0].path).toBe('WhatsApp Chat with Team.txt')
    expect(candidates[0].text).toContain('Morning team')
  })

  it('finds nested transcripts and ignores media metadata', async () => {
    const candidates = await extractZipTranscripts(makeFile({
      '__MACOSX/._Chat.txt': transcript,
      'Team Export/WhatsApp Chat.txt': transcript,
      'Team Export/image.jpg': 'not a transcript',
    }))
    expect(candidates).toHaveLength(1)
    expect(candidates[0].path).toBe('Team Export/WhatsApp Chat.txt')
  })

  it('returns no candidates when no transcript exists', async () => {
    const candidates = await extractZipTranscripts(makeFile({ 'photos/image.jpg': 'binary', '.DS_Store': 'metadata' }))
    expect(candidates).toHaveLength(0)
  })

  it('rejects corrupted archives with a user-facing error', async () => {
    await expect(extractZipTranscripts(makeCorruptFile())).rejects.toThrow('could not be opened')
  })
})
