import { getEnv } from '../../config/env'
import { ContentfulEntryKey } from './contentful.types'
import type { CMSQueryParams, ContentfulEntry, ContentfulLink } from './contentful.types'

const spaceId = getEnv('CONTENTFUL_SPACE_ID') || 'ea2ybdmmn1kv'
const environment = getEnv('CONTENTFUL_ENVIRONMENT') || 'master'

const CMS_BASE_URL = import.meta.env.DEV
  ? `/api/cms/spaces/${spaceId}/environments/${environment}`
  : `https://cms.decentraland.org/spaces/${spaceId}/environments/${environment}`

const entryCache = new Map<string, Promise<unknown>>()
const assetCache = new Map<string, Promise<unknown>>()

const clearContentfulCache = (): void => {
  entryCache.clear()
  assetCache.clear()
}

const FETCH_TIMEOUT = 10000
const MAX_CONCURRENT = 6

let activeRequests = 0
const requestQueue: Array<{
  execute: () => Promise<unknown>
  resolve: (value: unknown) => void
  reject: (reason: unknown) => void
}> = []

const processQueue = (): void => {
  while (requestQueue.length > 0 && activeRequests < MAX_CONCURRENT) {
    const next = requestQueue.shift()
    if (next) {
      activeRequests++
      next
        .execute()
        .then(next.resolve)
        .catch(next.reject)
        .finally(() => {
          activeRequests--
          processQueue()
        })
    }
  }
}

const enqueueRequest = (execute: () => Promise<unknown>): Promise<unknown> => {
  if (activeRequests < MAX_CONCURRENT) {
    activeRequests++
    return execute().finally(() => {
      activeRequests--
      processQueue()
    })
  }

  return new Promise((resolve, reject) => {
    requestQueue.push({ execute, resolve, reject })
  })
}

const fetchWithTimeout = (url: string, timeout: number): Promise<Response> => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timeoutId))
}

const fetchFromCMS = async (endpoint: string, params?: CMSQueryParams): Promise<unknown> => {
  const baseUrl = CMS_BASE_URL.startsWith('/') ? `${window.location.origin}${CMS_BASE_URL}` : CMS_BASE_URL
  const url = new URL(`${baseUrl}${endpoint}`)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })
  }

  return enqueueRequest(async () => {
    const response = await fetchWithTimeout(url.toString(), FETCH_TIMEOUT)

    if (!response.ok) {
      throw new Error(`CMS API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  })
}

const fetchEntry = async (id: string) => fetchFromCMS(`/entries/${id}`)

const resolveLinksInFields = async (entry: unknown): Promise<ContentfulEntry> => {
  const contentfulEntry = entry as ContentfulEntry
  if (!contentfulEntry || !contentfulEntry.fields) {
    return contentfulEntry
  }

  const resolved: ContentfulEntry = { ...contentfulEntry }
  resolved.fields = { ...contentfulEntry.fields }

  const fieldPromises = Object.entries(contentfulEntry.fields).map(async ([key, value]) => {
    let resolvedValue: unknown
    if (Array.isArray(value)) {
      resolvedValue = await Promise.all(value.map(item => resolveLink(item)))
    } else {
      resolvedValue = await resolveLink(value)
    }
    return [key, resolvedValue]
  })

  const resolvedFields = await Promise.all(fieldPromises)
  resolved.fields = Object.fromEntries(resolvedFields)

  return resolved
}

const resolveLink = async (link: unknown): Promise<unknown> => {
  const contentfulLink = link as ContentfulLink
  if (!contentfulLink?.sys?.type || contentfulLink.sys.type !== 'Link') {
    return link
  }

  try {
    let resolved: unknown
    if (contentfulLink.sys.linkType === 'Asset') {
      const cacheKey = contentfulLink.sys.id
      if (!assetCache.has(cacheKey)) {
        assetCache.set(cacheKey, fetchFromCMS(`/assets/${cacheKey}`))
      }
      resolved = await assetCache.get(cacheKey)!
    } else if (contentfulLink.sys.linkType === 'Entry') {
      const cacheKey = contentfulLink.sys.id
      if (!entryCache.has(cacheKey)) {
        const entryPromise = fetchEntry(cacheKey).then(entry => resolveLinksInFields(entry))
        entryCache.set(cacheKey, entryPromise)
      }
      resolved = await entryCache.get(cacheKey)!
    } else {
      resolved = link
    }

    return resolved
  } catch (error) {
    console.warn('[CMS] Failed to resolve link:', contentfulLink.sys?.id, error)
    return link
  }
}

const resolveLinks = async (entry: unknown): Promise<ContentfulEntry> => resolveLinksInFields(entry)

const mapContentfulAsset = (asset: ContentfulEntry | null | undefined) => {
  if (!asset || !asset.fields || !asset.fields.file) {
    return null
  }

  const file = asset.fields.file as {
    url?: string
    contentType?: string
    details?: { image?: { width?: number; height?: number } }
  }

  return {
    url: file.url || '',
    mimeType: file.contentType || '',
    width: file.details?.image?.width || 0,
    height: file.details?.image?.height || 0
  }
}

const mapRichTextToRaw = (field: unknown): { raw: string } => {
  if (!field) {
    return { raw: '' }
  }

  const parsedField = field as { raw?: string; nodeType?: string }

  if (typeof parsedField.raw === 'string') {
    return { raw: parsedField.raw }
  }

  if (parsedField.nodeType) {
    return { raw: JSON.stringify(field) }
  }

  return { raw: '' }
}

const mapFaq = (entry: ContentfulEntry) => {
  if (!entry || !entry.fields || !entry.fields.list) {
    return { list: [] }
  }

  const list = (entry.fields.list as ContentfulEntry[]).map((item: ContentfulEntry) => {
    const fields = item.fields as {
      question?: { text?: string } | string
      answer?: { raw?: string } | string
    }

    const questionText =
      (typeof fields?.question === 'object' && fields.question?.text) || (typeof fields?.question === 'string' ? fields.question : '') || ''

    const answerField = fields?.answer
    let answerRaw = ''

    if (typeof answerField === 'string') {
      answerRaw = answerField
    } else if (answerField && typeof answerField === 'object') {
      const parsedAnswerField = answerField as { raw?: string; nodeType?: string }

      if (typeof parsedAnswerField.raw === 'string') {
        answerRaw = parsedAnswerField.raw
      } else if (parsedAnswerField.nodeType) {
        answerRaw = JSON.stringify(answerField)
      }
    }

    return {
      question: { text: questionText },
      answer: { raw: answerRaw }
    }
  })

  return { list }
}

// TIn: mapper return type, TOut: final endpoint result type (defaults to TIn).
// Pass `transform` to validate/narrow when mapper may return null.
function contentfulEndpoint<TIn, TOut = TIn>(
  envKey: ContentfulEntryKey,
  mapper: (entry: ContentfulEntry) => TIn,
  transform?: (result: TIn) => TOut
) {
  return {
    query: () => ({ url: `/entries/${getEnv(envKey)!}` }),
    transformResponse: async (entry: unknown): Promise<TOut> => {
      try {
        const resolved = await resolveLinks(entry)
        const result = mapper(resolved)
        return transform ? transform(result) : (result as unknown as TOut)
      } catch (error) {
        throw {
          status: 'CUSTOM_ERROR',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    },
    providesTags: ['LandingContent' as const]
  }
}

export { clearContentfulCache, contentfulEndpoint, mapContentfulAsset, mapFaq, mapRichTextToRaw, resolveLinks }
export { ContentfulEntryKey } from './contentful.types'
