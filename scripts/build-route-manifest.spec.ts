import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
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

  describe('and a route is spread from an object', () => {
    beforeEach(() => {
      writeRouter(`    <Routes>
      <Route path="/events" element={<Something />} />
      <Route {...someRoute} />
    </Routes>`)
    })

    it('should fail rather than omit the route it cannot read', () => {
      const result = runCheck(srcPath)
      expect(result.status).toBe(1)
      expect(result.stderr).toContain('spread attribute')
    })
  })

  describe('and routes are injected as an expression', () => {
    beforeEach(() => {
      writeRouter(`    <Routes>
      <Route path="/events" element={<Something />} />
      {extraRoutes}
    </Routes>`)
    })

    it('should fail rather than emit a manifest missing them', () => {
      const result = runCheck(srcPath)
      expect(result.status).toBe(1)
      expect(result.stderr).toContain('computed child')
    })
  })

  describe('and a marker comment is the only expression child', () => {
    beforeEach(() => {
      writeRouter(`    <Routes>
      {/* route-manifest: not-found */}
      <Route path="*" element={<Something />} />
      <Route path="/events" element={<Something />} />
    </Routes>`)
    })

    it('should not mistake it for a computed child', () => {
      const result = runCheck(srcPath)
      expect(result.status).toBe(0)
    })
  })

  describe('and an expression is nested inside a Route', () => {
    beforeEach(() => {
      writeRouter(`    <Routes>
      <Route path="/events">{extraRoutes}</Route>
    </Routes>`)
    })

    it('should fail, since a nested route composed elsewhere would be omitted', () => {
      const result = runCheck(srcPath)
      expect(result.status).toBe(1)
      expect(result.stderr).toContain('computed child')
    })
  })

  describe('and routes are grouped in a fragment with an expression', () => {
    beforeEach(() => {
      writeRouter(`    <Routes>
      <><Route path="/events" />{extraRoutes}</>
    </Routes>`)
    })

    it('should look through the fragment rather than trust the direct children', () => {
      const result = runCheck(srcPath)
      expect(result.status).toBe(1)
      expect(result.stderr).toContain('computed child')
    })
  })

  describe('and routes are grouped in a fragment with no expression', () => {
    beforeEach(() => {
      writeRouter(`    <Routes>
      <><Route path="/events" /><Route path="/blog" /></>
    </Routes>`)
    })

    it('should collect them all', () => {
      const result = runCheck(srcPath)
      expect(result.status).toBe(0)
      expect(routesOf(result.stdout)).toEqual(['/blog', '/events'])
    })
  })

  describe('and an index route is the section not-found screen', () => {
    beforeEach(() => {
      writeRouter(`    <Routes>
      <Route path="/cast" element={<Layout />}>
        {/* route-manifest: not-found */}
        <Route index element={<CastNotFoundPage />} />
        <Route path="s/:token" element={<Streamer />} />
      </Route>
    </Routes>`)
    })

    it('should not record the parent as a live route, which would answer 200 for it', () => {
      const result = runCheck(srcPath)

      expect(result.status).toBe(0)
      expect(routesOf(result.stdout)).toEqual(['/cast/s/:token'])
    })
  })

  describe('and an index route is a real page', () => {
    beforeEach(() => {
      writeRouter(`    <Routes>
      <Route path="/account" element={<Layout />}>
        <Route index element={<Wallets />} />
      </Route>
    </Routes>`)
    })

    it('should keep the parent path, since that is what renders', () => {
      const result = runCheck(srcPath)

      expect(result.status).toBe(0)
      expect(routesOf(result.stdout)).toEqual(['/account'])
    })
  })

  describe('and a route opts into case-sensitive matching', () => {
    beforeEach(() => {
      writeRouter(`    <Routes>
      <Route path="/events/X" caseSensitive element={<Something />} />
    </Routes>`)
    })

    it('should fail rather than flatten a flag the manifest cannot carry', () => {
      const result = runCheck(srcPath)
      expect(result.status).toBe(1)
      expect(result.stderr).toContain('caseSensitive')
    })
  })

  describe('and a wildcard sits mid-path next to a trailing one', () => {
    beforeEach(() => {
      writeRouter(`    <Routes>
      {/* route-manifest: redirect */}
      <Route path="/events/*/x/*" element={<Something />} />
    </Routes>`)
    })

    it('should reject it by position, not by comparing it to the last segment', () => {
      const result = runCheck(srcPath)
      expect(result.status).toBe(1)
      expect(result.stderr).toContain('does not implement')
    })
  })

  describe('and a route uses syntax the edge matcher does not implement', () => {
    beforeEach(() => {
      writeRouter(`    <Routes>
      <Route path="/events/:id?" element={<Something />} />
    </Routes>`)
    })

    it('should fail rather than ship a pattern the worker reads differently', () => {
      const result = runCheck(srcPath)
      expect(result.status).toBe(1)
      expect(result.stderr).toContain('does not implement')
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

describe('when routing is declared outside the router file', () => {
  it('should refuse to emit, since the manifest would omit those routes', () => {
    const dir = mkdtempSync(join(tmpdir(), 'route-manifest-repo-'))
    const srcDir = join(dir, 'src')
    mkdirSync(srcDir)
    writeFileSync(
      join(srcDir, 'App.tsx'),
      `export function App() {\n  return (\n    <Routes>\n      <Route path="/events" element={<X />} />\n    </Routes>\n  )\n}\n`
    )
    writeFileSync(join(srcDir, 'Other.tsx'), `export const Other = () => <Route path="/sneaky" element={<X />} />\n`)

    const result = runCheck(join(srcDir, 'App.tsx'))

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('routing is declared outside')
    expect(result.stderr).toContain('Other.tsx')

    rmSync(dir, { recursive: true, force: true })
  })
})

describe('when a file merely looks like it declares routing', () => {
  let dir: string
  let srcDir: string

  const writeSibling = (contents: string) => {
    writeFileSync(join(srcDir, 'Other.tsx'), contents)
    return runCheck(join(srcDir, 'App.tsx'))
  }

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'route-manifest-ast-'))
    srcDir = join(dir, 'src')
    mkdirSync(srcDir)
    writeFileSync(
      join(srcDir, 'App.tsx'),
      `export function App() {\n  return (\n    <Routes>\n      <Route path="/events" element={<X />} />\n    </Routes>\n  )\n}\n`
    )
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('should not flag a component whose name merely starts with Route', () => {
    expect(writeSibling(`export const X = () => <RouteCard path="/a" />\n`).status).toBe(0)
  })

  it('should not flag a commented-out route', () => {
    expect(writeSibling(`// <Route path="/sneaky" />\nexport const X = () => <div />\n`).status).toBe(0)
  })

  it('should not flag the API name inside a string', () => {
    expect(writeSibling(`export const doc = 'use createBrowserRouter here'\n`).status).toBe(0)
  })

  it('should flag a route reached through a namespace import', () => {
    const result = writeSibling(`export const X = () => <RR.Route path="/sneaky" element={<Y />} />\n`)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('<Route>')
  })

  it('should flag a router built from a factory', () => {
    const result = writeSibling(`export const r = createBrowserRouter([{ path: '/sneaky' }])\n`)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('createBrowserRouter()')
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
