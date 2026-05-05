import { Fragment } from 'react'
import type { ReactNode } from 'react'

const URL_REGEX = /https?:\/\/[^\s<>"]+[^\s<>"'.,;:!?)]/gi
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])

const isSafeUrl = (raw: string): boolean => {
  try {
    const url = new URL(raw)
    return ALLOWED_PROTOCOLS.has(url.protocol)
  } catch {
    return false
  }
}

const linkifyText = (text: string): ReactNode => {
  const segments: ReactNode[] = []
  let lastIndex = 0
  let linkCount = 0
  let match: RegExpExecArray | null
  URL_REGEX.lastIndex = 0
  while ((match = URL_REGEX.exec(text)) !== null) {
    const [raw] = match
    const start = match.index
    if (!isSafeUrl(raw)) continue
    if (start > lastIndex) {
      segments.push(<Fragment key={`t-${lastIndex}`}>{text.slice(lastIndex, start)}</Fragment>)
    }
    segments.push(
      <a key={`l-${start}`} href={raw} target="_blank" rel="noopener noreferrer">
        {raw}
      </a>
    )
    lastIndex = start + raw.length
    linkCount += 1
  }
  if (linkCount === 0) return text
  if (lastIndex < text.length) {
    segments.push(<Fragment key={`t-${lastIndex}`}>{text.slice(lastIndex)}</Fragment>)
  }
  return segments
}

export { linkifyText }
