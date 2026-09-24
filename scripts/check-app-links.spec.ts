import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Guard the iOS association and keep Android delegation disabled until the app
// can safely handle every path its manifest claims. See docs/domains/jump.md.
const WELL_KNOWN_DIR = join(__dirname, '..', 'public', '.well-known')

/** iOS `appID`, declared in godot-explorer's `export_presets.cfg`. */
const APP_ID = '8T73XM973P.org.decentraland.godotexplorer'
const readWellKnown = (name: string) => JSON.parse(readFileSync(join(WELL_KNOWN_DIR, name), 'utf8'))

describe('apple-app-site-association', () => {
  let aasa: {
    applinks: { details: Array<{ appIDs: string[]; components: Array<{ '/': string }> }> }
  }

  beforeEach(() => {
    aasa = readWellKnown('apple-app-site-association')
  })

  it('should declare the mobile explorer app ID', () => {
    expect(aasa.applinks.details).toHaveLength(1)
    expect(aasa.applinks.details[0].appIDs).toEqual([APP_ID])
  })

  it('should claim only exact jump paths and the mobile prefix', () => {
    const paths = aasa.applinks.details[0].components.map(component => component['/'])
    expect(paths).toEqual(['/jump', '/jump/', '/mobile*'])
    expect(paths).not.toContain('/jump*')
  })

  it('should leave query and fragment matching unrestricted for jump links', () => {
    expect(aasa.applinks.details[0].components).toEqual([
      { '/': '/jump', comment: expect.any(String) },
      { '/': '/jump/', comment: expect.any(String) },
      { '/': '/mobile*', comment: expect.any(String) }
    ])
  })

  // The SPA owns these: /places/place/:position and /events have real pages, and
  // the app's router has no handler for the SPA's shapes — it would drop the user
  // in Discover. Keep them out of the iOS association; Android delegation is
  // disabled below because older Android versions only use the manifest paths.
  it('should not claim the paths the website renders itself', () => {
    const paths = aasa.applinks.details[0].components.map(component => component['/'])
    expect(paths).not.toContain('/places*')
    expect(paths).not.toContain('/events*')
  })
})

describe('when Android app-link delegation is deferred', () => {
  let assetLinks: unknown

  beforeEach(() => {
    assetLinks = readWellKnown('assetlinks.json')
  })

  it('should publish an empty statement list so unsupported web routes stay in the browser', () => {
    expect(assetLinks).toEqual([])
  })
})
