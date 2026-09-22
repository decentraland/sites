import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const SCRIPT = join(__dirname, 'build-route-manifest.mjs')

const runCheck = (srcPath: string) => {
  const result = spawnSync(process.execPath, [SCRIPT, '--src', srcPath, '--check'], { encoding: 'utf8' })
  return { status: result.status, stdout: result.stdout, stderr: result.stderr }
}

const routesOf = (stdout: string) =>
  stdout
    .split('\n')
    .filter(line => line.startsWith('  /') || line.trim() === '*')
    .map(line => line.trim())

describe('when extracting the route manifest from a router', () => {
  let dir: string
  let srcPath: string

  const writeRouter = (jsx: string) => {
    writeFileSync(srcPath, `export function App() {\n  return (\n${jsx}\n  )\n}\n`)
  }

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'route-manifest-'))
    srcPath = join(dir, 'App.tsx')
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
    jest.resetAllMocks()
  })

  describe('and the routes are flat', () => {
    beforeEach(() => {
      writeRouter(`    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/events" element={<Events />} />
    </Routes>`)
    })

    it('should list each declared path', () => {
      const result = runCheck(srcPath)
      expect(result.status).toBe(0)
      expect(routesOf(result.stdout)).toEqual(['/', '/events'])
    })
  })

  describe('and a route is nested under a parent path', () => {
    beforeEach(() => {
      writeRouter(`    <Routes>
      <Route path="/account" element={<Layout />}>
        <Route path="wallets" element={<Wallets />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>
    </Routes>`)
    })

    it('should resolve the child against its parent', () => {
      expect(routesOf(runCheck(srcPath).stdout)).toEqual(['/account', '/account/notifications', '/account/wallets'])
    })
  })

  describe('and a layout route has no path of its own', () => {
    beforeEach(() => {
      writeRouter(`    <Routes>
      <Route element={<Shell />}>
        <Route path="/places" element={<Places />} />
      </Route>
    </Routes>`)
    })

    it('should not invent a path for the layout', () => {
      expect(routesOf(runCheck(srcPath).stdout)).toEqual(['/places'])
    })
  })

  describe('and a child is declared as the index route', () => {
    beforeEach(() => {
      writeRouter(`    <Routes>
      <Route path="/storage" element={<Layout />}>
        <Route index element={<StorageHome />} />
      </Route>
    </Routes>`)
    })

    it('should map it to the parent path', () => {
      expect(routesOf(runCheck(srcPath).stdout)).toEqual(['/storage'])
    })
  })

  describe('and a wildcard renders the not-found page', () => {
    beforeEach(() => {
      writeRouter(`    <Routes>
      <Route path="/events" element={<Events />} />
      {/* route-manifest: not-found */}
      <Route path="*" element={<NotFound />} />
    </Routes>`)
    })

    it('should keep it out of the valid routes', () => {
      const result = runCheck(srcPath)
      expect(result.status).toBe(0)
      expect(routesOf(result.stdout)).toEqual(['/events'])
    })
  })

  describe('and a wildcard redirects to a renamed section', () => {
    beforeEach(() => {
      writeRouter(`    <Routes>
      {/* route-manifest: redirect */}
      <Route path="/whats-on/*" element={<RenamedSectionRedirect />} />
    </Routes>`)
    })

    it('should count it as a real route', () => {
      expect(routesOf(runCheck(srcPath).stdout)).toEqual(['/whats-on/*'])
    })
  })

  describe('and a wildcard carries no marker', () => {
    beforeEach(() => {
      writeRouter(`    <Routes>
      <Route path="/events/*" element={<Something />} />
    </Routes>`)
    })

    it('should fail the build instead of guessing', () => {
      const result = runCheck(srcPath)
      expect(result.status).toBe(1)
      expect(result.stderr).toContain('needs a marker comment')
      expect(result.stderr).toContain('/events/*')
    })
  })

  describe('and a path is built from a variable instead of a literal', () => {
    beforeEach(() => {
      writeRouter(`    <Routes>
      <Route path={SOME_PATH} element={<Something />} />
    </Routes>`)
    })

    it('should fail the build rather than emit an incomplete manifest', () => {
      const result = runCheck(srcPath)
      expect(result.status).toBe(1)
      expect(result.stderr).toContain('string literal')
    })
  })

  describe('and the router declares no routes at all', () => {
    beforeEach(() => {
      writeRouter('    <div />')
    })

    it('should refuse to emit an empty manifest', () => {
      const result = runCheck(srcPath)
      expect(result.status).toBe(1)
      expect(result.stderr).toContain('empty manifest')
    })
  })
})

describe('when extracting the manifest from this repo router', () => {
  it('should include every event route the worker will enforce', () => {
    const result = runCheck(join(__dirname, '..', 'src', 'App.tsx'))
    const routes = routesOf(result.stdout)

    expect(result.status).toBe(0)
    // The aliases and the legacy deep link have to be in before the edge starts answering 404.
    expect(routes).toEqual(
      expect.arrayContaining([
        '/events',
        '/events/new-event',
        '/events/edit-event/:eventId',
        '/events/admin/users',
        '/events/admin/pending-events',
        '/events/event',
        '/events/submit',
        '/events/create',
        '/events/new'
      ])
    )
  })

  it('should not treat a not-found wildcard as a valid route', () => {
    const routes = routesOf(runCheck(join(__dirname, '..', 'src', 'App.tsx')).stdout)

    expect(routes).not.toContain('*')
    expect(routes).not.toContain('/storage/*')
  })
})
