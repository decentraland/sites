// `config/env` reads `import.meta.env`, which Jest's transform can't parse.
// Stub it so the helper file only exercises its own logic.
const mockGetEnv = jest.fn()
jest.mock('../../config/env', () => ({
  getEnv: (...args: unknown[]) => mockGetEnv(...args)
}))

import {
  buildBevyHrefs,
  buildCreatorWorldPath,
  getWorldsContentServerUrl,
  mergeCreatorWorlds,
  resolveThumbnailUrl,
  sdkVersionLabel
} from './creators.helpers'

describe('creators.helpers', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getWorldsContentServerUrl', () => {
    it('should use the env value when set', () => {
      mockGetEnv.mockReturnValue('https://wcs.example')
      expect(getWorldsContentServerUrl()).toBe('https://wcs.example')
    })

    it('should fall back to prod when the env value is empty', () => {
      mockGetEnv.mockReturnValue('')
      expect(getWorldsContentServerUrl()).toBe('https://worlds-content-server.decentraland.org')
    })
  })

  describe('buildBevyHrefs', () => {
    it('should build a scene-viewer iframe url and a plain external url', () => {
      const { iframe, external } = buildBevyHrefs('my-world.dcl.eth')
      expect(external).toBe('https://decentraland.zone/bevy-web/?realm=my-world.dcl.eth')
      expect(iframe).toBe('https://decentraland.zone/bevy-web/?realm=my-world.dcl.eth&systemScene=sceneviewer.dcl.eth&portables=none')
    })

    it('should encode special characters in the world name', () => {
      const { external } = buildBevyHrefs('a b.dcl.eth')
      expect(external).toContain('realm=a%20b.dcl.eth')
    })
  })

  describe('sdkVersionLabel', () => {
    it('should label SDK 7 for "7" and for unset', () => {
      expect(sdkVersionLabel('7')).toBe('SDK 7')
      expect(sdkVersionLabel(undefined)).toBe('SDK 7')
    })

    it('should label SDK 6 for any other value', () => {
      expect(sdkVersionLabel('6')).toBe('SDK 6')
    })
  })

  describe('buildCreatorWorldPath', () => {
    it('should lower-case and encode the world name', () => {
      expect(buildCreatorWorldPath('My-World.dcl.eth')).toBe('/creators/world/my-world.dcl.eth')
    })
  })

  describe('mergeCreatorWorlds', () => {
    it('should return an empty list when both sources are empty', () => {
      expect(mergeCreatorWorlds(undefined, undefined)).toEqual([])
    })

    it('should mark owned names as owner and dedupe collaborator overlaps', () => {
      const result = mergeCreatorWorlds(['Alpha.dcl.eth'], [{ name: 'alpha.dcl.eth' }, { name: 'beta.dcl.eth' }])
      expect(result).toEqual([
        { name: 'alpha.dcl.eth', role: 'owner' },
        { name: 'beta.dcl.eth', role: 'collaborator' }
      ])
    })

    it('should sort the merged worlds alphabetically', () => {
      const result = mergeCreatorWorlds(['zed.dcl.eth', 'amy.dcl.eth'], undefined)
      expect(result.map(world => world.name)).toEqual(['amy.dcl.eth', 'zed.dcl.eth'])
    })
  })

  describe('resolveThumbnailUrl', () => {
    it('should return undefined when there is no thumbnail or content', () => {
      expect(resolveThumbnailUrl(undefined, [])).toBeUndefined()
      expect(resolveThumbnailUrl('thumb.png', undefined)).toBeUndefined()
    })

    it('should return undefined when the thumbnail file is not in the manifest', () => {
      expect(resolveThumbnailUrl('thumb.png', [{ file: 'other.png', hash: 'abc' }])).toBeUndefined()
    })

    it('should resolve the content url when the file matches', () => {
      mockGetEnv.mockReturnValue('https://wcs.example')
      expect(resolveThumbnailUrl('thumb.png', [{ file: 'thumb.png', hash: 'hash123' }])).toBe('https://wcs.example/contents/hash123')
    })
  })
})
