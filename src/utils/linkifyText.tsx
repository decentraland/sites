import { Fragment } from 'react'
import type { ReactNode } from 'react'
import { replaceEmojiShortcodes } from './emojiShortcodes'

const URL_REGEX = /https?:\/\/[^\s<>"]+/gi
const TRAILING_PUNCT_REGEX = /[\s<>"'.,;:!?]+$/
const EMBEDDED_PROTOCOL_REGEX = /https?:\/\//i
const OPEN_PAREN_REGEX = /\(/g
const CLOSE_PAREN_REGEX = /\)/g
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])
const MARKDOWN_LINK_REGEX = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g

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

const renderTextSegment = (raw: string, key: string): ReactNode => <Fragment key={key}>{replaceEmojiShortcodes(raw)}</Fragment>

interface MarkdownCandidate {
  kind: 'md'
  start: number
  end: number
  label: string
  url: string
}

interface UrlCandidate {
  kind: 'url'
  start: number
  end: number
  url: string
}

type LinkCandidate = MarkdownCandidate | UrlCandidate

const findNextMarkdownLink = (text: string, from: number): MarkdownCandidate | null => {
  MARKDOWN_LINK_REGEX.lastIndex = from
  let match: RegExpExecArray | null
  while ((match = MARKDOWN_LINK_REGEX.exec(text)) !== null) {
    const [full, label, url] = match
    if (isSafeUrl(url)) {
      return { kind: 'md', start: match.index, end: match.index + full.length, label, url }
    }
  }
  return null
}

const findNextUrl = (text: string, from: number): UrlCandidate | null => {
  URL_REGEX.lastIndex = from
  let match: RegExpExecArray | null
  while ((match = URL_REGEX.exec(text)) !== null) {
    const url = trimUrlTail(splitEmbeddedUrl(match[0]))
    if (url && isSafeUrl(url)) {
      return { kind: 'url', start: match.index, end: match.index + url.length, url }
    }
    URL_REGEX.lastIndex = match.index + Math.max(match[0].length, 1)
  }
  return null
}

const pickEarliest = (a: LinkCandidate | null, b: LinkCandidate | null): LinkCandidate | null => {
  if (!a) return b
  if (!b) return a
  return a.start <= b.start ? a : b
}

const linkifyText = (text: string): ReactNode => {
  const segments: ReactNode[] = []
  let cursor = 0
  let linkCount = 0

  while (cursor < text.length) {
    const next = pickEarliest(findNextMarkdownLink(text, cursor), findNextUrl(text, cursor))
    if (!next) {
      if (cursor < text.length) segments.push(renderTextSegment(text.slice(cursor), `t-${cursor}`))
      break
    }

    if (next.start > cursor) {
      segments.push(renderTextSegment(text.slice(cursor, next.start), `t-${cursor}`))
    }

    if (next.kind === 'md') {
      segments.push(
        <a key={`md-${next.start}`} href={next.url} target="_blank" rel="noopener noreferrer">
          {replaceEmojiShortcodes(next.label)}
        </a>
      )
    } else {
      segments.push(
        <a key={`l-${next.start}`} href={next.url} target="_blank" rel="noopener noreferrer">
          {next.url}
        </a>
      )
    }
    cursor = next.end
    linkCount += 1
  }

  if (linkCount === 0) return replaceEmojiShortcodes(text)
  return segments
}

export { linkifyText }
