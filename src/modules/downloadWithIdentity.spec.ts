jest.mock('./url', () => ({
  addQueryParamsToUrlString: jest.fn((url: string, params: Record<string, string | undefined>) => {
    const u = new URL(url)
    Object.entries(params).forEach(([k, v]) => v !== undefined && u.searchParams.set(k, v))
    return u.toString()
  }),
  calculateCDNReleaseLinksWithIdentity: jest.fn(),
  extractDownloadLinkFromCDNReleaseOption: jest.fn()
}))

jest.mock('./file', () => ({
  triggerFileDownload: jest.fn()
}))

import { calculateDownloadUrl, getDownloadLinkWithIdentity } from './downloadWithIdentity'
import { triggerFileDownload } from './file'
import { addQueryParamsToUrlString, calculateCDNReleaseLinksWithIdentity, extractDownloadLinkFromCDNReleaseOption } from './url'

const mockCalculate = calculateCDNReleaseLinksWithIdentity as jest.Mock
const mockExtract = extractDownloadLinkFromCDNReleaseOption as jest.Mock
const mockAddQuery = addQueryParamsToUrlString as jest.Mock
const mockTrigger = triggerFileDownload as jest.Mock

const FALLBACK_LINKS = {
  Windows: { amd64: 'https://cdn.test/win-x64.exe' },
  macOS: { arm64: 'https://cdn.test/mac-arm.dmg', x64: 'https://cdn.test/mac-x64.dmg' }
}

describe('calculateDownloadUrl', () => {
  beforeEach(() => {
    mockCalculate.mockResolvedValue(null)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should return the resolved download URL and filename', async () => {
    mockExtract.mockReturnValue('https://cdn.test/installer-1.2.3.exe')
    const result = await calculateDownloadUrl({ os: 'Windows', arch: 'amd64', fallbackLinks: FALLBACK_LINKS })
    expect(result).toEqual({ url: 'https://cdn.test/installer-1.2.3.exe', filename: 'installer-1.2.3.exe' })
  })

  it('should fall back to the generic "launcher" filename when the URL has no extension', async () => {
    mockExtract.mockReturnValue('https://cdn.test/installer')
    const result = await calculateDownloadUrl({ os: 'Windows', arch: 'amd64', fallbackLinks: FALLBACK_LINKS })
    expect(result.filename).toBe('launcher')
  })

  it('should fall back when the URL cannot be parsed', async () => {
    mockExtract.mockReturnValue('not-a-url/installer.exe')
    const result = await calculateDownloadUrl({ os: 'Windows', arch: 'amd64', fallbackLinks: FALLBACK_LINKS })
    expect(result.filename).toBe('installer.exe')
  })

  it('should throw when no download link is available', async () => {
    mockExtract.mockReturnValue(undefined)
    await expect(calculateDownloadUrl({ os: 'Windows', arch: 'amd64', fallbackLinks: FALLBACK_LINKS })).rejects.toThrow(
      'No download link available'
    )
  })

  it('should prefer the arch-specific fallback link', async () => {
    mockExtract.mockReturnValue('https://cdn.test/win-x64.exe')
    await calculateDownloadUrl({ os: 'Windows', arch: 'amd64', fallbackLinks: FALLBACK_LINKS })
    expect(mockExtract).toHaveBeenCalledWith('Windows', 'amd64', 'https://cdn.test/win-x64.exe', null)
  })

  it('should default to macOS arm64 when arch is missing and OS is macOS', async () => {
    mockExtract.mockReturnValue('https://cdn.test/mac-arm.dmg')
    await calculateDownloadUrl({ os: 'macOS', arch: undefined, fallbackLinks: FALLBACK_LINKS })
    expect(mockExtract).toHaveBeenCalledWith('macOS', undefined, 'https://cdn.test/mac-arm.dmg', null)
  })

  it('should fall back to the first available link when no arch match is found', async () => {
    mockExtract.mockReturnValue('https://cdn.test/installer.exe')
    await calculateDownloadUrl({
      os: 'Linux',
      arch: undefined,
      fallbackLinks: { Linux: { x86: 'https://cdn.test/linux.AppImage' } }
    })
    expect(mockExtract).toHaveBeenCalledWith('Linux', undefined, 'https://cdn.test/linux.AppImage', null)
  })

  it('should return undefined fallback when os is missing from fallbackLinks', async () => {
    mockExtract.mockReturnValue('https://cdn.test/installer.exe')
    await calculateDownloadUrl({ os: 'Mystery', arch: undefined, fallbackLinks: FALLBACK_LINKS })
    expect(mockExtract).toHaveBeenCalledWith('Mystery', undefined, undefined, null)
  })
})

describe('getDownloadLinkWithIdentity', () => {
  beforeEach(() => {
    mockCalculate.mockResolvedValue(null)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should trigger the file download with the resolved link', async () => {
    mockExtract.mockReturnValue('https://cdn.test/installer.exe')
    const result = await getDownloadLinkWithIdentity({ os: 'Windows', arch: 'amd64', fallbackLinks: FALLBACK_LINKS })
    expect(result).toBe('https://cdn.test/installer.exe')
    expect(mockTrigger).toHaveBeenCalledWith('https://cdn.test/installer.exe')
  })

  it('should append query params when supplied', async () => {
    mockExtract.mockReturnValue('https://cdn.test/installer.exe')
    mockAddQuery.mockReturnValue('https://cdn.test/installer.exe?anon=abc')
    const result = await getDownloadLinkWithIdentity({
      os: 'Windows',
      arch: 'amd64',
      fallbackLinks: FALLBACK_LINKS,
      queryParams: { anon: 'abc' }
    })
    expect(result).toContain('anon=abc')
    expect(mockAddQuery).toHaveBeenCalled()
  })

  it('should return undefined when no link can be resolved', async () => {
    mockExtract.mockReturnValue(undefined)
    const result = await getDownloadLinkWithIdentity({ os: 'Windows', arch: 'amd64', fallbackLinks: FALLBACK_LINKS })
    expect(result).toBeUndefined()
    expect(mockTrigger).not.toHaveBeenCalled()
  })
})
