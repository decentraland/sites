import { locations } from '../../shared/blog/utils/locations'
import type { CMSCategoriesResponse, CMSPostItem, LatestPost } from './cms.discovery.types'

// Contentful serves asset files behind protocol-relative URLs.
const normalizeAssetUrl = (url: string): string => (url.startsWith('//') ? `https:${url}` : url)

const buildCategoryIndex = (categories: CMSCategoriesResponse | null): Map<string, { id: string; title: string }> => {
  const index = new Map<string, { id: string; title: string }>()
  for (const category of categories?.items ?? []) {
    if (category.sys?.id && category.fields?.id) {
      index.set(category.sys.id, { id: category.fields.id, title: category.fields.title })
    }
  }
  return index
}

const buildLatestPosts = (
  posts: CMSPostItem[],
  categories: CMSCategoriesResponse | null,
  assetUrlById: Map<string, string>
): LatestPost[] => {
  const categoryIndex = buildCategoryIndex(categories)
  const built: LatestPost[] = []
  for (const post of posts) {
    const slug = post.fields?.id
    if (!post.sys?.id || !slug || !post.fields.title) continue
    const category = post.fields.category?.sys.id ? categoryIndex.get(post.fields.category.sys.id) : undefined
    // Category pages 404 without a real category slug, so fall back to the search page.
    const url = category ? locations.blog(category.id, slug) : locations.search(post.fields.title)
    const assetId = post.fields.image?.sys.id
    const rawImageUrl = assetId ? assetUrlById.get(assetId) : undefined
    built.push({
      id: post.sys.id,
      title: post.fields.title,
      publishedDate: post.fields.publishedDate ?? null,
      categoryTitle: category?.title ?? null,
      imageUrl: rawImageUrl ? normalizeAssetUrl(rawImageUrl) : null,
      url
    })
  }
  return built
}

const formatPostDate = (publishedDate: string | null): string => {
  if (!publishedDate) return ''
  const parsed = new Date(publishedDate)
  if (isNaN(parsed.getTime())) return ''
  return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export { buildLatestPosts, formatPostDate, normalizeAssetUrl }
