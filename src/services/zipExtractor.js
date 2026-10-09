import { unzipSync } from 'fflate'

export const MAX_ZIP_BYTES = 20 * 1024 * 1024
export const MAX_UNCOMPRESSED_BYTES = 50 * 1024 * 1024
export const MAX_ZIP_ENTRIES = 2000

const CHAT_NAME_RE = /(?:whatsapp|chat|conversation|messages)/i
const MESSAGE_LINE_RE = /(?:^|\n)\[?\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}/i

function isCandidatePath(path) {
  const normalized = path.replaceAll('\\', '/').toLowerCase()
  const basename = normalized.split('/').pop() || ''
  return normalized.endsWith('.txt') &&
    basename !== '.ds_store' &&
    !normalized.includes('__macosx/') &&
    !basename.startsWith('.')
}

function decodeText(bytes) {
  const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(bytes).replace(/^\uFEFF/, '')
  if (MESSAGE_LINE_RE.test(utf8)) return utf8
  try {
    const utf16 = new TextDecoder('utf-16le', { fatal: false }).decode(bytes).replace(/^\uFEFF/, '')
    return MESSAGE_LINE_RE.test(utf16) ? utf16 : utf8
  } catch {
    return utf8
  }
}

function scoreCandidate(path, text) {
  const name = path.split('/').pop() || path
  let score = 0
  if (CHAT_NAME_RE.test(name)) score += 4
  if (MESSAGE_LINE_RE.test(text)) score += 8
  if (text.includes(' - ')) score += 2
  return score
}

export async function extractZipTranscripts(file) {
  if (file.size > MAX_ZIP_BYTES) {
    throw new Error('ZIP file is too large. Maximum size is 20 MB.')
  }

  let archive
  try {
    archive = unzipSync(new Uint8Array(await file.arrayBuffer()))
  } catch {
    throw new Error('This ZIP could not be opened. It may be corrupted or password-protected.')
  }

  const paths = Object.keys(archive)
  if (paths.length > MAX_ZIP_ENTRIES) {
    throw new Error('This ZIP contains too many files to process safely.')
  }

  let totalBytes = 0
  const candidates = []
  for (const path of paths) {
    const bytes = archive[path]
    totalBytes += bytes.byteLength
    if (totalBytes > MAX_UNCOMPRESSED_BYTES) {
      throw new Error('This ZIP expands beyond the safe processing limit of 50 MB.')
    }
    if (!isCandidatePath(path) || bytes.byteLength === 0) continue
    const text = decodeText(bytes)
    if (!text.trim() || !MESSAGE_LINE_RE.test(text)) continue
    candidates.push({ path, text, size: bytes.byteLength, score: scoreCandidate(path, text) })
  }

  return candidates.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
}
