import { Suspense, lazy } from 'react'
import type { Block, Inline, Text } from '@contentful/rich-text-types'
import { getEnv } from '../../../config/env'
import type { ContentfulAsset } from '../../../shared/blog/types/blog.domain'
import { isSafeHyperlinkUri, parseUrl } from './RichText.helpers'
import { EmbeddedImage, Hyperlink, InstagramEmbed, InternalLink, LinkedInEmbed, TwitterContainer, YouTubeEmbed } from './RichText.styled'

// Lazy-loaded to keep Twitter widgets script off the initial post-page bundle.
const LazyTwitterEmbed = lazy(() => import('./TwitterEmbed').then(m => ({ default: m.TwitterEmbed })))

// Strict hostname allowlists — prevents `uri.includes()` bypasses (e.g. evil.com/youtube.com)
const YOUTUBE_HOSTS = new Set(['www.youtube.com', 'youtube.com', 'youtu.be'])
const TWITTER_HOSTS = new Set(['www.twitter.com', 'twitter.com', 'www.x.com', 'x.com'])
const INSTAGRAM_HOSTS = new Set(['www.instagram.com', 'instagram.com'])
const LINKEDIN_HOSTS = new Set(['www.linkedin.com', 'linkedin.com'])
// YouTube video IDs: alphanumeric, hyphens, underscores, 1-20 chars
const YOUTUBE_ID_REGEX = /^[\w-]{1,20}$/

const getYouTubeVideoId = (uri: string): string | null => {
  const url = parseUrl(uri)
  if (!url || !YOUTUBE_HOSTS.has(url.hostname)) return null
  const id = url.hostname === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v') ?? ''
  return YOUTUBE_ID_REGEX.test(id) ? id : null
}

const renderYouTubeEmbed = (videoId: string) => (
  <YouTubeEmbed
    src={`https://www.youtube.com/embed/${videoId}`}
    title="YouTube video player"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen
    loading="lazy"
  />
)

const renderTwitterEmbed = (uri: string) => {
  const url = parseUrl(uri)
  if (!url || !TWITTER_HOSTS.has(url.hostname)) return null
  const segments = url.pathname.split('/').filter(Boolean)
  // Twitter status URL: /username/status/TWEET_ID
  const statusIndex = segments.indexOf('status')
  const tweetId = statusIndex >= 0 ? segments[statusIndex + 1] : undefined
  if (!tweetId || !/^\d{1,20}$/.test(tweetId)) return null

  return (
    <TwitterContainer>
      <Suspense>
        <LazyTwitterEmbed tweetId={tweetId} theme="dark" />
      </Suspense>
    </TwitterContainer>
  )
}

const renderInstagramEmbed = (uri: string) => {
  const url = parseUrl(uri)
  if (!url || !INSTAGRAM_HOSTS.has(url.hostname)) return null

  const pathname = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`
  const embedSrc = `https://www.instagram.com${pathname}embed/`
  const title = uri.includes('/reel/') ? 'Instagram Reel' : 'Instagram Post'

  return <InstagramEmbed src={embedSrc} title={title} scrolling="no" allowFullScreen loading="lazy" />
}

const renderEmbeddedAsset = (node: Block | Inline, assets: Record<string, ContentfulAsset>) => {
  const assetId = node.data?.target?.sys?.id as string | undefined
  if (assetId && assets[assetId]) {
    const asset = assets[assetId]
    return <EmbeddedImage src={asset.url} alt="" width={asset.width} height={asset.height} loading="lazy" decoding="async" />
  }

  const url = node.data?.target?.fields?.file?.url as string | undefined
  if (url) {
    return <EmbeddedImage src={url.startsWith('//') ? `https:${url}` : url} alt="" loading="lazy" decoding="async" />
  }

  return null
}

const renderHyperlink = (node: Block | Inline) => {
  const uri = node.data.uri as string
  const content = node.content as Text[]
  const contentValue = content[0]?.value

  // Only embed when the link text IS the URL (author-paste-embed pattern)
  if (contentValue === uri) {
    const youtubeId = getYouTubeVideoId(uri)
    if (youtubeId) return renderYouTubeEmbed(youtubeId)

    const twitterEmbed = renderTwitterEmbed(uri)
    if (twitterEmbed) return twitterEmbed

    const parsedUri = parseUrl(uri)
    if (parsedUri && INSTAGRAM_HOSTS.has(parsedUri.hostname)) {
      return renderInstagramEmbed(uri)
    }

    if (parsedUri && LINKEDIN_HOSTS.has(parsedUri.hostname)) {
      return <LinkedInEmbed src={uri} title="Embedded Linkedin Post" loading="lazy" />
    }
  }

  // Check if this is an internal blog link (e.g. https://decentraland.org/blog/...)
  const blogBaseUrl = getEnv('BLOG_BASE_URL') || ''
  const isInternalBlogLink = blogBaseUrl.length > 0 && uri.startsWith(blogBaseUrl)
  const isAnchorLink = uri.startsWith('#')

  if (isInternalBlogLink) {
    // Extract the path starting from /blog/...
    const internalPath = new URL(uri, window.location.origin).pathname
    return <InternalLink to={internalPath}>{contentValue}</InternalLink>
  }

  if (isAnchorLink) {
    return (
      <Hyperlink href={uri} target="_self">
        {contentValue}
      </Hyperlink>
    )
  }

  // Strict scheme allowlist — prevents CMS-authored javascript:/data:/vbscript: links from
  // producing an exploitable <a href>. Unsafe URIs render the link text as inert content.
  if (!isSafeHyperlinkUri(uri)) {
    return <>{contentValue}</>
  }

  return (
    <Hyperlink href={uri} target="_blank" rel="noopener noreferrer">
      {contentValue}
    </Hyperlink>
  )
}

export { renderEmbeddedAsset, renderHyperlink }
