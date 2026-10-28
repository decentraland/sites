import { readDownloadClickCorrelation, recordDownloadClickCorrelation } from './downloadClickCorrelation'

const STORAGE_KEY = 'downloadFunnel:lastClick'

describe('when recording a download click correlation', () => {
  afterEach(() => {
    sessionStorage.removeItem(STORAGE_KEY)
    jest.resetAllMocks()
  })

  it('should return a uuid click_id and a numeric clicked_at timestamp', () => {
    const result = recordDownloadClickCorrelation()
    expect(result.click_id).toMatch(/^[0-9a-f-]{36}$/i)
    expect(typeof result.clicked_at).toBe('number')
  })

  it('should persist the correlation to sessionStorage', () => {
    const result = recordDownloadClickCorrelation()
    expect(JSON.parse(sessionStorage.getItem(STORAGE_KEY)!)).toEqual(result)
  })

  it('should overwrite a previous correlation so the latest click wins', () => {
    const first = recordDownloadClickCorrelation()
    const second = recordDownloadClickCorrelation()
    expect(readDownloadClickCorrelation()?.click_id).toBe(second.click_id)
    expect(readDownloadClickCorrelation()?.click_id).not.toBe(first.click_id)
  })
})

describe('when reading a download click correlation', () => {
  afterEach(() => {
    sessionStorage.removeItem(STORAGE_KEY)
    jest.resetAllMocks()
  })

  it('should return null when nothing was recorded', () => {
    expect(readDownloadClickCorrelation()).toBeNull()
  })

  it('should return the recorded correlation while it is fresh', () => {
    const recorded = recordDownloadClickCorrelation()
    expect(readDownloadClickCorrelation()).toEqual(recorded)
  })

  it('should return null when the correlation is older than maxAgeMs', () => {
    const recorded = recordDownloadClickCorrelation()
    jest.spyOn(Date, 'now').mockReturnValue(recorded.clicked_at + 31 * 60 * 1000)
    expect(readDownloadClickCorrelation()).toBeNull()
  })

  it('should return null on malformed storage content instead of throwing', () => {
    sessionStorage.setItem(STORAGE_KEY, 'not-json{')
    expect(readDownloadClickCorrelation()).toBeNull()
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ click_id: 42, clicked_at: 'nope' }))
    expect(readDownloadClickCorrelation()).toBeNull()
  })
})
