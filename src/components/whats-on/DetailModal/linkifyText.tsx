import { Fragment } from 'react'
import type { ReactNode } from 'react'

const URL_REGEX = /https?:\/\/[^\s<>"]+/gi
const TRAILING_PUNCT_REGEX = /[\s<>"'.,;:!?)]+$/
const EMBEDDED_PROTOCOL_REGEX = /https?:\/\//i
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

const trimTrailingPunctuation = (raw: string): string => raw.replace(TRAILING_PUNCT_REGEX, '')

const linkifyText = (text: string): ReactNode => {
  const segments: ReactNode[] = []
  let lastIndex = 0
  let linkCount = 0
  let match: RegExpExecArray | null
  URL_REGEX.lastIndex = 0
  while ((match = URL_REGEX.exec(text)) !== null) {
    const rawFull = match[0]
    const start = match.index
    const url = trimTrailingPunctuation(splitEmbeddedUrl(rawFull))
    const advanceTo = start + Math.max(url.length, 1)
    if (!url || !isSafeUrl(url)) {
      URL_REGEX.lastIndex = advanceTo
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
    URL_REGEX.lastIndex = lastIndex
    linkCount += 1
  }
  if (linkCount === 0) return text
  if (lastIndex < text.length) {
    segments.push(<Fragment key={`t-${lastIndex}`}>{text.slice(lastIndex)}</Fragment>)
  }
  return segments
}

export { linkifyText }
