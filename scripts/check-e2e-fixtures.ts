/* eslint-disable no-console */
// Run via `npm run e2e:check-fixtures`. Pre-step `tsc --noEmit -p e2e/tsconfig.json`
// catches shape drift between fixtures and src/features/cms/cms.types.ts. This file
// adds runtime cross-reference checks that types alone cannot enforce.

import type { CMSEntry } from '../src/features/cms/cms.types'
import { allAuthors } from '../e2e/fixtures/blog/authors'
import { allCategories } from '../e2e/fixtures/blog/categories'
import { detailPost } from '../e2e/fixtures/blog/post-detail'
import { allPostsPage1 } from '../e2e/fixtures/blog/posts-page-1'
import { postsPage2 } from '../e2e/fixtures/blog/posts-page-2'

type Issue = { post: string; field: 'category' | 'author'; ref: string }

const issues: Issue[] = []

const categoryIds = new Set(allCategories.map(c => c.sys.id))
const authorIds = new Set(allAuthors.map(a => a.sys.id))

function checkPost(post: CMSEntry) {
  const cat = post.fields.category as CMSEntry | undefined
  if (cat?.sys?.id && !categoryIds.has(cat.sys.id)) {
    issues.push({ post: post.sys.id, field: 'category', ref: cat.sys.id })
  }
  const author = post.fields.author as CMSEntry | undefined
  if (author?.sys?.id && !authorIds.has(author.sys.id)) {
    issues.push({ post: post.sys.id, field: 'author', ref: author.sys.id })
  }
}

;[...allPostsPage1, ...postsPage2, detailPost].forEach(checkPost)

if (issues.length > 0) {
  console.error('E2E fixture drift — unresolved cross-references:')
  for (const i of issues) {
    console.error(`  post=${i.post} ${i.field}=${i.ref} (no matching ${i.field} fixture)`)
  }
  process.exit(1)
}

console.log('E2E fixtures OK: cross-references resolved.')
