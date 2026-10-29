import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// The two files that make decentraland.org an app-link host for the mobile
// explorer. Nothing downstream fails loudly when one of them breaks — Apple and
// Google just stop verifying the domain and every /jump link silently reverts to
// opening the browser — so the shape is asserted here instead.
const WELL_KNOWN_DIR = join(__dirname, '..', 'public', '.well-known')

/** iOS `appID`, and the Android package it wraps. Declared in godot-explorer's `export_presets.cfg`. */
const APP_ID = '8T73XM973P.org.decentraland.godotexplorer'
const ANDROID_PACKAGE = 'org.decentraland.godotexplorer'

// Upper-case hex pairs separated by colons, as `keytool`/Play Console print them.
// Android rejects a fingerprint in any other casing or separator.
const SHA256_FINGERPRINT = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/

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

  it('should claim the jump and mobile paths', () => {
    const paths = aasa.applinks.details[0].components.map(component => component['/'])
    expect(paths).toEqual(['/jump*', '/mobile*'])
  })

  // The SPA owns these: /places/place/:position and /events have real pages, and
  // the app's router has no handler for the SPA's shapes — it would drop the user
  // in Discover. Android claims them from its manifest and we cannot scope that
  // from here, but iOS is ours to scope, so keep it scoped.
  it('should not claim the paths the website renders itself', () => {
    const paths = aasa.applinks.details[0].components.map(component => component['/'])
    expect(paths).not.toContain('/places*')
    expect(paths).not.toContain('/events*')
  })
})

describe('assetlinks.json', () => {
  let assetLinks: Array<{
    relation: string[]
    target: { namespace: string; package_name: string; sha256_cert_fingerprints: string[] }
  }>

  beforeEach(() => {
    assetLinks = readWellKnown('assetlinks.json')
  })

  it('should delegate URL handling to the mobile explorer package', () => {
    expect(assetLinks).toHaveLength(1)
    expect(assetLinks[0].relation).toEqual(['delegate_permission/common.handle_all_urls'])
    expect(assetLinks[0].target.namespace).toBe('android_app')
    expect(assetLinks[0].target.package_name).toBe(ANDROID_PACKAGE)
  })

  it('should list signing fingerprints Android can parse', () => {
    const fingerprints = assetLinks[0].target.sha256_cert_fingerprints
    expect(fingerprints.length).toBeGreaterThan(0)
    fingerprints.forEach(fingerprint => expect(fingerprint).toMatch(SHA256_FINGERPRINT))
  })
})
