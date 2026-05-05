import { Fragment } from 'react'
import type { ReactNode } from 'react'

const URL_PATTERN = 'https?:\\/\\/[^\\s<>"]+'
const TRAILING_PUNCT_REGEX = /[\s<>"'.,;:!?]+$/
const EMBEDDED_PROTOCOL_REGEX = /https?:\/\//i
const OPEN_PAREN_REGEX = /\(/g
const CLOSE_PAREN_REGEX = /\)/g
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])

const isSafeUrl = (raw: string): boolean => {
  try {
    const url = new URL(raw)
    return ALLOWED_PROTOCOLS.has(url.protocol)
  } catch {
    return false
  }
}

const splitEmbeddedUrl = (raw: string): string => {
  const innerStart = raw.slice(1).search(EMBEDDED_PROTOCOL_REGEX)
  return innerStart >= 0 ? raw.slice(0, innerStart + 1) : raw
}

const trimUrlTail = (raw: string): string => {
  let result = raw.replace(TRAILING_PUNCT_REGEX, '')
  while (result.endsWith(')')) {
    const opens = (result.match(OPEN_PAREN_REGEX) ?? []).length
    const closes = (result.match(CLOSE_PAREN_REGEX) ?? []).length
    if (closes <= opens) break
    result = result.slice(0, -1).replace(TRAILING_PUNCT_REGEX, '')
  }
  return result
}

const linkifyText = (text: string): ReactNode => {
  const urlRegex = new RegExp(URL_PATTERN, 'gi')
  const segments: ReactNode[] = []
  let lastIndex = 0
  let linkCount = 0
  let match: RegExpExecArray | null
  while ((match = urlRegex.exec(text)) !== null) {
    const rawFull = match[0]
    const start = match.index
    const url = trimUrlTail(splitEmbeddedUrl(rawFull))
    const advanceTo = start + Math.max(url.length, 1)
    if (!url || !isSafeUrl(url)) {
      urlRegex.lastIndex = advanceTo
      continue
    }
    if (start > lastIndex) {
      segments.push(<Fragment key={`t-${lastIndex}`}>{text.slice(lastIndex, start)}</Fragment>)
    }
    segments.push(
      <a key={`l-${start}`} href={url} target="_blank" rel="noopener noreferrer">
        {url}
      </a>
    )
    lastIndex = start + url.length
    urlRegex.lastIndex = lastIndex
    linkCount += 1
  }
  if (linkCount === 0) return text
  if (lastIndex < text.length) {
    segments.push(<Fragment key={`t-${lastIndex}`}>{text.slice(lastIndex)}</Fragment>)
  }
  return segments
}

export { linkifyText }
