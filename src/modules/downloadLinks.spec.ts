import { resolveInstaller } from './downloadLinks'

const WIN_AMD64 = 'https://cdn.example.com/win-amd64.exe'
const WIN_ARM64 = 'https://cdn.example.com/win-arm64.exe'
const MAC_ARM64 = 'https://cdn.example.com/mac-arm64.dmg'
const MAC_AMD64 = 'https://cdn.example.com/mac-amd64.dmg'

describe('resolveInstaller', () => {
  describe('when the OS has no links', () => {
    it('should return null for undefined links', () => {
      expect(resolveInstaller('Windows', 'amd64', undefined)).toBeNull()
    })

    it('should return null for an empty link map', () => {
      expect(resolveInstaller('Windows', 'amd64', {})).toBeNull()
    })

    it('should return null when the only link is empty', () => {
      expect(resolveInstaller('Windows', 'amd64', { amd64: '' })).toBeNull()
    })
  })

  describe('when the detected arch has a published link', () => {
    it('should return that link and arch', () => {
      expect(resolveInstaller('Windows', 'arm64', { amd64: WIN_AMD64, arm64: WIN_ARM64 })).toEqual({ link: WIN_ARM64, arch: 'arm64' })
    })
  })

  describe('when the arch is still Unknown', () => {
    it('should fall back to the amd64 link and report amd64', () => {
      expect(resolveInstaller('Windows', 'Unknown', { amd64: WIN_AMD64 })).toEqual({ link: WIN_AMD64, arch: 'amd64' })
    })

    it('should return null when there is no amd64 link either', () => {
      expect(resolveInstaller('Windows', 'Unknown', { arm64: WIN_ARM64 })).toBeNull()
    })
  })

  describe('when the arch resolved to arm64 but no arm64 build is published', () => {
    it('should fall back to the amd64 link and report amd64', () => {
      expect(resolveInstaller('Windows', 'arm64', { amd64: WIN_AMD64 })).toEqual({ link: WIN_AMD64, arch: 'amd64' })
    })
  })

  describe('when the arch cannot run the amd64 build', () => {
    it('should return null instead of serving the amd64 installer', () => {
      expect(resolveInstaller('Windows', 'ia32', { amd64: WIN_AMD64 })).toBeNull()
    })
  })

  describe('when the OS is macOS', () => {
    it('should pick arm64 and report arm64 while the arch is Unknown', () => {
      expect(resolveInstaller('macOS', 'Unknown', { arm64: MAC_ARM64, amd64: MAC_AMD64 })).toEqual({ link: MAC_ARM64, arch: 'arm64' })
    })

    it('should pick arm64 and report arm64 when the detected arch is amd64', () => {
      expect(resolveInstaller('macOS', 'amd64', { arm64: MAC_ARM64, amd64: MAC_AMD64 })).toEqual({ link: MAC_ARM64, arch: 'arm64' })
    })

    it('should fall back to amd64 and report amd64 when no arm64 build is published', () => {
      expect(resolveInstaller('macOS', 'arm64', { amd64: MAC_AMD64 })).toEqual({ link: MAC_AMD64, arch: 'amd64' })
    })

    it('should return null when neither build is published', () => {
      expect(resolveInstaller('macOS', 'arm64', { arm64: '' })).toBeNull()
    })
  })
})
