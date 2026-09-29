import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const SCRIPT = join(__dirname, 'build-llms-txt.mjs')
const LINKS = join(__dirname, '..', 'src', 'config', 'publicLinks.json')

const MANIFEST = {
  routes: ['/', '/download', '/events', '/help', '/places', '/places/place/:position'],
  notFoundRoutes: ['/*', '/cast', '/cast/*', '/places/*']
}

/** Runs `expression` against the generator's exports in a real Node ESM process; returns its JSON. */
const evaluate = (expression: string) => {
  const code = `import * as llms from ${JSON.stringify(pathToFileURL(SCRIPT).href)}
const input = JSON.parse(process.env.INPUT)
let output
try { output = { value: ${expression} } } catch (error) { output = { error: error.message } }
process.stdout.write(JSON.stringify(output))`
  return (input: unknown) => {
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', code], {
      encoding: 'utf8',
      env: { ...process.env, INPUT: JSON.stringify(input) }
    })
    if (result.status !== 0) throw new Error(result.stderr)
    return JSON.parse(result.stdout) as { value?: unknown; error?: string }
  }
}

const validate = evaluate('llms.validateLinks(input.text, input.manifest, new Map(input.otherSiteUrls ?? []))')
const fill = evaluate('llms.fillTemplate(input.template, input.links)')
const structure = evaluate('llms.validateStructure(input.text)')
const build = evaluate('llms.buildLlmsTxt({ template: input.template, links: {}, manifest: input.manifest })')

const buildWith = (body: string, manifest = MANIFEST) =>
  build({ template: `# T\n\n> s\n\n${body}\n\n## Links\n\n- [Events](https://decentraland.org/events): note\n`, manifest })

const errorsFor = (text: string, otherSiteUrls?: Array<[string, string]>) =>
  validate({ text, manifest: MANIFEST, otherSiteUrls }).value as string[]

describe('when validating the links of an llms.txt', () => {
  it('should accept a static route of this SPA', () => {
    expect(errorsFor('- [Events](https://decentraland.org/events)')).toEqual([])
  })

  it('should accept a trailing slash on a static route', () => {
    expect(errorsFor('- [Help](https://decentraland.org/help/)')).toEqual([])
  })

  it('should accept a Genesis City parcel detail link', () => {
    expect(errorsFor('- [Genesis Plaza](https://decentraland.org/places/place/-3,-2)')).toEqual([])
  })

  it('should reject a parcel detail link whose position is not a coordinate', () => {
    expect(errorsFor('- [Bad](https://decentraland.org/places/place/genesis)')).toHaveLength(1)
  })

  it('should reject a route the manifest marks as not-found', () => {
    expect(errorsFor('- [Cast](https://decentraland.org/cast)')[0]).toContain('/cast is not a route')
  })

  it('should reject a decentraland.org path that is not listed anywhere', () => {
    expect(errorsFor('- [Marketplace](https://decentraland.org/marketplace)')).toHaveLength(1)
  })

  it('should accept an allowlisted URL of another decentraland.org site', () => {
    const allowlist: Array<[string, string]> = [['https://decentraland.org/marketplace', 'marketplace']]
    expect(errorsFor('- [Marketplace](https://decentraland.org/marketplace)', allowlist)).toEqual([])
  })

  it('should allowlist exact URLs only, never a prefix', () => {
    const allowlist: Array<[string, string]> = [['https://decentraland.org/marketplace', 'marketplace']]
    expect(errorsFor('- [Item](https://decentraland.org/marketplace/items)', allowlist)).toHaveLength(1)
  })

  it('should reject a relative link', () => {
    expect(errorsFor('- [Events](/events)')[0]).toContain('relative link')
  })

  it('should reject an external link over http', () => {
    expect(errorsFor('- [X](http://x.com/decentraland)')[0]).toContain('https')
  })

  it('should reject an unfilled placeholder', () => {
    expect(errorsFor('- [Epic]({{download.epic}})')[0]).toContain('unfilled')
  })
})

describe('when building with link syntax other than inline links', () => {
  it('should build the plain fixture', () => {
    expect(buildWith('Prose.').error).toBeUndefined()
  })

  it('should reject a reference link and its definition before the first H2', () => {
    expect(buildWith('See [Bad][bad].\n\n[bad]: http://invalid.example/missing').error).toContain('brackets outside')
  })

  it('should reject a raw HTML anchor', () => {
    expect(buildWith('<a href="https://invalid.example">Bad</a>').error).toContain('raw HTML anchors')
  })

  it('should reject an autolink', () => {
    expect(buildWith('See <https://invalid.example>.').error).toContain('bare or autolinked URL')
  })

  it('should reject a bare URL in a note', () => {
    const template = '# T\n\n> s\n\n## Links\n\n- [Events](https://decentraland.org/events): also http://invalid.example\n'
    expect(build({ template, manifest: MANIFEST }).error).toContain('bare or autolinked URL')
  })

  it('should reject an image', () => {
    expect(buildWith('![logo](https://decentraland.org/events)').error).toContain('images are not supported')
  })

  it('should reject an inline link with a title', () => {
    expect(buildWith('[Bad](https://invalid.example "title")').error).toContain('brackets outside')
  })
})

describe('when a not-found route matches the Genesis Plaza link', () => {
  const genesis = '- [Genesis Plaza](https://decentraland.org/places/place/-3,-2)'

  it('should fail when an exact not-found entry matches the link', () => {
    const manifest = { routes: ['/places/place/:position'], notFoundRoutes: ['/places/place/-3,-2'] }
    expect(validate({ text: genesis, manifest }).value).toEqual([
      '[Genesis Plaza](https://decentraland.org/places/place/-3,-2): not-found route /places/place/-3,-2 also matches /places/place/-3,-2'
    ])
  })

  it('should pass when only the catch-all not-found routes match', () => {
    const manifest = { routes: ['/places/place/:position'], notFoundRoutes: ['/*', '/places/*'] }
    expect(validate({ text: genesis, manifest }).value).toEqual([])
  })

  it('should fail on a same-shape not-found route, a conflicting config it does not try to rank', () => {
    const manifest = { routes: ['/places/place/:position'], notFoundRoutes: ['/places/place/:other'] }
    expect(validate({ text: genesis, manifest }).value).toEqual([
      '[Genesis Plaza](https://decentraland.org/places/place/-3,-2): not-found route /places/place/:other also matches /places/place/-3,-2'
    ])
  })
})

describe('when filling the template', () => {
  it('should replace a placeholder with its link', () => {
    expect(fill({ template: '[X]({{social.x}})', links: { social: { x: 'https://x.com/decentraland' } } }).value).toBe(
      '[X](https://x.com/decentraland)\n'
    )
  })

  it('should fail on an unknown placeholder', () => {
    expect(fill({ template: '[X]({{social.nope}})', links: { social: {} } }).error).toContain('social.nope')
  })

  it('should drop HTML comments, placeholders inside them included', () => {
    expect(fill({ template: '<!-- {{nope}} -->\n# T\n', links: {} }).value).toBe('# T\n')
  })

  it('should tag the App Store link with ct=llmstxt and keep pt and mt', () => {
    const links = { download: { appStore: 'https://apps.apple.com/app/apple-store/id1?pt=2&ct=Site%20Default&mt=8' } }
    expect(fill({ template: '{{download.appStore}}', links }).value).toBe(
      'https://apps.apple.com/app/apple-store/id1?pt=2&ct=llmstxt&mt=8\n'
    )
  })

  it('should give the Play Store link the llms utm set and its referrer mirror', () => {
    const links = { download: { googlePlay: 'https://play.google.com/store/apps/details?id=pkg' } }
    expect(fill({ template: '{{download.googlePlay}}', links }).value).toBe(
      'https://play.google.com/store/apps/details?id=pkg&utm_source=llmstxt&utm_medium=referral&referrer=utm_source%3Dllmstxt%26utm_medium%3Dreferral\n'
    )
  })
})

describe('when checking the layout', () => {
  it('should require the H1 first', () => {
    expect(structure({ text: '> summary\n' }).value).toContain('the first line must be the H1 title')
  })

  it('should reject a bullet without a link under an H2', () => {
    expect(structure({ text: '# T\n\n> s\n\n## Good For\n\n- Live music\n' }).value).toHaveLength(1)
  })

  it('should accept free prose before the first H2', () => {
    expect(structure({ text: '# T\n\n> s\n\nProse.\n\n## Links\n\n- [A](https://a.org): note\n' }).value).toEqual([])
  })
})

describe('when running the generator', () => {
  let dir: string

  const run = (links = LINKS) => {
    const out = join(dir, 'llms.txt')
    const result = spawnSync(process.execPath, [SCRIPT, '--links', links, '--routes', join(dir, 'routes.json'), '--out', out], {
      encoding: 'utf8'
    })
    return { status: result.status, stderr: result.stderr, text: result.status === 0 ? readFileSync(out, 'utf8') : '' }
  }

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'llms-txt-'))
    writeFileSync(join(dir, 'routes.json'), JSON.stringify(MANIFEST))
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('should write a valid file with no placeholder left', () => {
    const { status, text } = run()
    expect(status).toBe(0)
    expect(text.startsWith('# Decentraland\n')).toBe(true)
    expect(text).not.toContain('{{')
    expect(text).not.toContain('<!--')
  })

  it('should produce identical output on every run', () => {
    expect(run().text).toBe(run().text)
  })

  it('should change the output when a source link changes', () => {
    const links = JSON.parse(readFileSync(LINKS, 'utf8'))
    links.social.x = 'https://x.com/somebody-else'
    const changed = join(dir, 'links.json')
    writeFileSync(changed, JSON.stringify(links))
    expect(run(changed).text).toContain('[X](https://x.com/somebody-else)')
  })

  it('should fail the build when a published SPA route disappears', () => {
    writeFileSync(join(dir, 'routes.json'), JSON.stringify({ ...MANIFEST, routes: MANIFEST.routes.filter(route => route !== '/events') }))
    const { status, stderr } = run()
    expect(status).toBe(1)
    expect(stderr).toContain('/events is not a route')
  })
})
