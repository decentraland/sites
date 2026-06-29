import { createAssetEntry } from './cms-entry.factory'

// Stable fake CDN host — never resolved over the network; image elements
// just render a broken img which is fine for E2E. Real assets are mocked
// individually via /assets/:id when a test cares about asset behavior.
const CDN = 'https://fake-cdn.test/blog'

export const heroAsset = createAssetEntry({
  id: 'asset-hero',
  url: `${CDN}/hero.png`,
  width: 1600,
  height: 900
})

export const categoryAsset = createAssetEntry({
  id: 'asset-category',
  url: `${CDN}/category.png`,
  width: 800,
  height: 400
})

export const authorAvatarAsset = createAssetEntry({
  id: 'asset-author',
  url: `${CDN}/author.png`,
  width: 200,
  height: 200
})

export const post1Asset = createAssetEntry({ id: 'asset-post-1', url: `${CDN}/post-1.png` })
export const post2Asset = createAssetEntry({ id: 'asset-post-2', url: `${CDN}/post-2.png` })
export const post3Asset = createAssetEntry({ id: 'asset-post-3', url: `${CDN}/post-3.png` })
export const post4Asset = createAssetEntry({ id: 'asset-post-4', url: `${CDN}/post-4.png` })
export const post5Asset = createAssetEntry({ id: 'asset-post-5', url: `${CDN}/post-5.png` })
export const post6Asset = createAssetEntry({ id: 'asset-post-6', url: `${CDN}/post-6.png` })
export const post7Asset = createAssetEntry({ id: 'asset-post-7', url: `${CDN}/post-7.png` })

export const postsPage2Assets = [
  createAssetEntry({ id: 'asset-post-8', url: `${CDN}/post-8.png` }),
  createAssetEntry({ id: 'asset-post-9', url: `${CDN}/post-9.png` }),
  createAssetEntry({ id: 'asset-post-10', url: `${CDN}/post-10.png` }),
  createAssetEntry({ id: 'asset-post-11', url: `${CDN}/post-11.png` }),
  createAssetEntry({ id: 'asset-post-12', url: `${CDN}/post-12.png` }),
  createAssetEntry({ id: 'asset-post-13', url: `${CDN}/post-13.png` })
]
