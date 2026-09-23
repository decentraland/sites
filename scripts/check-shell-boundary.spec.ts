import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

const SCRIPT = join(__dirname, 'check-shell-boundary.mjs')

const runCheck = (dir: string) => {
  const result = spawnSync(process.execPath, [SCRIPT, '--dir', dir], { encoding: 'utf8' })
  return { status: result.status, stdout: result.stdout, stderr: result.stderr }
}

describe('when checking the dual-shell import boundary', () => {
  let dir: string

  const write = (relativePath: string, contents: string) => {
    const full = join(dir, relativePath)
    mkdirSync(dirname(full), { recursive: true })
    writeFileSync(full, contents)
  }

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'shell-boundary-'))
    write('shells/store.ts', 'export const store = {}\n')
    write('main.tsx', "import './App'\n")
    write('App.tsx', "const Shell = lazy(() => import('./shells/store'))\nexport { Shell }\n")
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
    jest.resetAllMocks()
  })

  describe('and no lightweight route reaches the shell', () => {
    beforeEach(() => {
      write('pages/index.tsx', "import { formatDate } from '../utils/date'\nexport const Home = () => formatDate()\n")
      write('utils/date.ts', 'export const formatDate = () => new Date().toISOString()\n')
    })

    it('should exit 0', () => {
      const result = runCheck(dir)
      expect(result.status).toBe(0)
      expect(result.stdout).toContain('OK: no lightweight route reaches src/shells')
    })
  })

  describe('and a lightweight page imports the shell directly', () => {
    beforeEach(() => {
      write('pages/index.tsx', "import { store } from '../shells/store'\nexport const Home = () => store\n")
    })

    it('should exit 1 and name the page and the shell file', () => {
      const result = runCheck(dir)
      expect(result.status).toBe(1)
      expect(result.stdout).toContain('pages/index.tsx')
      expect(result.stdout).toContain('shells/store.ts')
    })
  })

  describe('and a lightweight page reaches the shell through a helper', () => {
    beforeEach(() => {
      write('pages/index.tsx', "import { readStore } from '../utils/readStore'\nexport const Home = () => readStore()\n")
      write('utils/readStore.ts', "import { store } from '../shells/store'\nexport const readStore = () => store\n")
    })

    it('should report the whole chain, not just the endpoints', () => {
      const result = runCheck(dir)
      expect(result.status).toBe(1)
      expect(result.stdout).toContain('pages/index.tsx')
      expect(result.stdout).toContain('utils/readStore.ts')
      expect(result.stdout).toContain('shells/store.ts')
    })
  })

  describe('and a lightweight page reaches the shell through a barrel', () => {
    beforeEach(() => {
      write('pages/index.tsx', "import { store } from '../features/data'\nexport const Home = () => store\n")
      write('features/data/index.ts', "export { store } from '../../shells/store'\n")
    })

    it('should follow the re-export and fail', () => {
      const result = runCheck(dir)
      expect(result.status).toBe(1)
      expect(result.stdout).toContain('features/data/index.ts')
    })
  })

  describe('and a lightweight page only imports a type from the shell', () => {
    beforeEach(() => {
      write('pages/index.tsx', "import type { RootState } from '../shells/store'\nexport const Home = (s: RootState) => s\n")
    })

    it('should exit 0 because type imports leave no runtime dependency', () => {
      const result = runCheck(dir)
      expect(result.status).toBe(0)
    })
  })

  describe('and every member of the import carries the inline type modifier', () => {
    beforeEach(() => {
      write('pages/index.tsx', "import { type RootState } from '../shells/store'\nexport const Home = (s: RootState) => s\n")
    })

    it('should exit 0 because nothing of it survives the build', () => {
      const result = runCheck(dir)
      expect(result.status).toBe(0)
    })
  })

  describe('and the import mixes an inline type member with a value member', () => {
    beforeEach(() => {
      write(
        'pages/index.tsx',
        "import { type RootState, store } from '../shells/store'\nexport const Home = (s: RootState) => [s, store]\n"
      )
    })

    it('should exit 1 because the value member is a real dependency', () => {
      const result = runCheck(dir)
      expect(result.status).toBe(1)
      expect(result.stdout).toContain('shells/store.ts')
    })
  })

  describe('and a default import is combined with an inline type member', () => {
    beforeEach(() => {
      write(
        'pages/index.tsx',
        "import Store, { type RootState } from '../shells/store'\nexport const Home = (s: RootState) => [s, Store]\n"
      )
    })

    it('should exit 1 because the default binding is a real dependency', () => {
      const result = runCheck(dir)
      expect(result.status).toBe(1)
      expect(result.stdout).toContain('shells/store.ts')
    })
  })

  describe('and a heavy route imports the shell', () => {
    beforeEach(() => {
      write('pages/account/WalletsPage.tsx', "import { store } from '../../shells/store'\nexport const Wallets = () => store\n")
      write('pages/blog/PostPage.tsx', "import { store } from '../../shells/store'\nexport const Post = () => store\n")
    })

    it('should exit 0 because heavy routes are allowed to use the shell', () => {
      const result = runCheck(dir)
      expect(result.status).toBe(0)
    })
  })

  describe('and a lightweight page imports a component that a heavy route also uses', () => {
    beforeEach(() => {
      write('pages/index.tsx', "import { Card } from '../components/Card'\nexport const Home = () => Card\n")
      write('components/Card.tsx', 'export const Card = null\n')
      write(
        'pages/account/WalletsPage.tsx',
        "import { Card } from '../../components/Card'\nimport { store } from '../../shells/store'\nexport const W = () => [Card, store]\n"
      )
    })

    it('should not blame the shared component for the heavy route import', () => {
      const result = runCheck(dir)
      expect(result.status).toBe(0)
    })
  })

  describe('and a statement before the import ends in a `from` property', () => {
    beforeEach(() => {
      write(
        'pages/index.tsx',
        "export type NavState = { from: string }\nimport { store } from '../shells/store'\nexport const Home = () => store\n"
      )
    })

    it('should still see the import that follows it', () => {
      const result = runCheck(dir)
      expect(result.status).toBe(1)
      expect(result.stdout).toContain('shells/store.ts')
    })
  })

  describe('and an import clause carries a block comment', () => {
    beforeEach(() => {
      write('pages/index.tsx', "import { /* export type noise */ store } from '../shells/store'\nexport const Home = () => store\n")
    })

    it('should not let the comment hide the import', () => {
      const result = runCheck(dir)
      expect(result.status).toBe(1)
      expect(result.stdout).toContain('shells/store.ts')
    })
  })

  describe('and a shell import is commented out', () => {
    beforeEach(() => {
      write('pages/index.tsx', "// import { store } from '../shells/store'\nexport const Home = () => null\n")
    })

    it('should exit 0 because commented code never runs', () => {
      const result = runCheck(dir)
      expect(result.status).toBe(0)
    })
  })

  describe('and a string literal looks like a comment', () => {
    beforeEach(() => {
      write(
        'pages/index.tsx',
        "const url = 'https://example.com'\nimport { store } from '../shells/store'\nexport const Home = () => [url, store]\n"
      )
    })

    it('should not treat the double slash inside the string as a comment', () => {
      const result = runCheck(dir)
      expect(result.status).toBe(1)
      expect(result.stdout).toContain('shells/store.ts')
    })
  })

  describe('and App.tsx imports the shell statically', () => {
    beforeEach(() => {
      write('App.tsx', "import { store } from './shells/store'\nexport const App = () => store\n")
    })

    it('should exit 1 because a static import lands in the initial bundle', () => {
      const result = runCheck(dir)
      expect(result.status).toBe(1)
      expect(result.stdout).toContain('App.tsx')
      expect(result.stdout).toContain('shells/store.ts')
    })
  })

  describe('and App.tsx imports the shell through lazy', () => {
    it('should exit 0 because the dynamic import is the authorized split point', () => {
      const result = runCheck(dir)
      expect(result.status).toBe(0)
    })
  })

  describe('and a heavy route group is verified against the folders on disk', () => {
    const runVerify = () => {
      const result = spawnSync(process.execPath, [SCRIPT, '--dir', dir, '--verify-heavy-dirs'], { encoding: 'utf8' })
      return { status: result.status, stderr: result.stderr }
    }

    it('should exit 2 and name the folders it could not find', () => {
      const result = runVerify()
      expect(result.status).toBe(2)
      expect(result.stderr).toContain('no longer exist')
      expect(result.stderr).toContain('events')
    })
  })

  describe('and the source directory does not exist', () => {
    it('should exit 2 with a usage error', () => {
      const result = runCheck(join(dir, 'missing'))
      expect(result.status).toBe(2)
      expect(result.stderr).toContain('source directory not found')
    })
  })
})
