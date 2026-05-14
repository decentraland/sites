import type { CMSEntry, CMSListResponse } from '../../../src/features/cms/cms.types'

// Asset entry shape consumed by mapContentfulAsset (src/features/cms/cms.mappers.ts:29)
export type AssetEntry = CMSEntry & {
  fields: {
    file: {
      url: string
      contentType: string
      details: { image: { width: number; height: number } }
    }
  }
}

export function createAssetEntry(input: { id: string; url: string; width?: number; height?: number; contentType?: string }): AssetEntry {
  return {
    sys: { id: input.id, type: 'Asset' },
    fields: {
      file: {
        url: input.url,
        contentType: input.contentType ?? 'image/png',
        details: { image: { width: input.width ?? 1200, height: input.height ?? 630 } }
      }
    }
  }
}

export function createCategoryEntry(input: {
  id: string
  slug: string
  title: string
  description: string
  imageAsset: AssetEntry
  isShownInMenu?: boolean
}): CMSEntry {
  return {
    sys: { id: input.id, type: 'Entry' },
    fields: {
      // mappers/helpers derive the slug from fields.id (cms.mappers.ts:57, cms.helpers.ts:12)
      id: input.slug,
      title: input.title,
      description: input.description,
      isShownInMenu: input.isShownInMenu ?? true,
      // Embed asset full (already resolved) — avoids /assets/:id fetches
      image: input.imageAsset
    }
  }
}

export function createAuthorEntry(input: {
  id: string
  slug: string
  title: string
  description: string
  imageAsset: AssetEntry
}): CMSEntry {
  return {
    sys: { id: input.id, type: 'Entry' },
    fields: {
      id: input.slug,
      title: input.title,
      description: input.description,
      image: input.imageAsset
    }
  }
}

export function createBlogPostEntry(input: {
  id: string
  slug: string
  title: string
  description: string
  publishedDate?: string
  category: CMSEntry
  author: CMSEntry
  imageAsset: AssetEntry
  body?: Record<string, unknown>
}): CMSEntry {
  return {
    sys: { id: input.id, type: 'Entry' },
    fields: {
      // mapBlogPost reads slug from fields.id (cms.mappers.ts:192)
      id: input.slug,
      title: input.title,
      description: input.description,
      publishedDate: input.publishedDate ?? '2026-01-15T10:00:00.000Z',
      // Embed category/author full (already resolved) — avoids /entries/:id fetches
      category: input.category,
      author: input.author,
      image: input.imageAsset,
      body: input.body
    }
  }
}

export function createCmsListResponse(items: CMSEntry[], total = items.length, includes?: CMSListResponse['includes']): CMSListResponse {
  return { items, total, ...(includes ? { includes } : {}) }
}

// Minimal Contentful rich-text Document for post bodies
export function createDocument(paragraphs: string[]): Record<string, unknown> {
  return {
    nodeType: 'document',
    data: {},
    content: paragraphs.map(text => ({
      nodeType: 'paragraph',
      data: {},
      content: [{ nodeType: 'text', value: text, marks: [], data: {} }]
    }))
  }
}
