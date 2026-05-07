import fs from 'node:fs'
import path from 'node:path'

const repoRoot = path.resolve(__dirname, '../..')

const scanRoots = ['src/components', 'src/hooks', 'src/pages', 'src/shells', 'src/__test-utils__']

const legacySegments = [
  'features/events',
  'features/whats-on-events',
  'features/whats-on/admin',
  'features/jump',
  'features/blog',
  'features/search',
  'features/communities',
  'features/profile',
  'features/cast2',
  'features/reels',
  'features/storage',
  'features/report',
  'features/notifications'
]

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(fullPath) : [fullPath]
  })
}

// Match each legacy segment only when it appears as an actual module specifier
// (after `from '...'`, `jest.mock('...')`, `jest.requireActual('...')`, etc.) so
// JSDoc, comments, and unrelated string literals can't false-positive.
const moduleSpecifierContext = /(?:from\s+|require\(\s*|jest\.\w+\(\s*)['"]([^'"]+)['"]/g

function getOffenders(): string[] {
  const offenders: string[] = []
  for (const root of scanRoots) {
    for (const file of walk(path.join(repoRoot, root)).filter(item => /\.(ts|tsx)$/.test(item))) {
      const content = fs.readFileSync(file, 'utf8')
      for (const match of content.matchAll(moduleSpecifierContext)) {
        const specifier = match[1]
        for (const segment of legacySegments) {
          if (specifier === segment || specifier.endsWith(`/${segment}`) || specifier.includes(`${segment}/`)) {
            offenders.push(`${path.relative(repoRoot, file)} imports ${specifier}`)
            break
          }
        }
      }
    }
  }
  return offenders.sort()
}

describe('feature import boundaries', () => {
  it('keeps app consumers on grouped feature paths instead of legacy feature paths', () => {
    expect(getOffenders()).toEqual([])
  })
})
