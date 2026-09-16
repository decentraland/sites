import { MemoryRouter } from 'react-router-dom'
import { render } from '@testing-library/react'
import { DownloadPage } from './download'

const mockPage = jest.fn()
let isAnalyticsInitialized = true

// Only useAnalytics is stubbed: usePageView runs for real so this asserts the
// actual page() call and its path, not just that the hook was referenced.
jest.mock('@dcl/hooks', () => ({
  useAnalytics: () => ({ isInitialized: isAnalyticsInitialized, page: mockPage })
}))

jest.mock('../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

// DownloadLayout pulls in the whole download experience (ui2, CDN releases,
// images); this page's only own behavior is the pageview.
jest.mock('../components/Layout/DownloadLayout', () => ({
  DownloadLayout: () => null
}))

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <DownloadPage />
    </MemoryRouter>
  )

describe('DownloadPage', () => {
  beforeEach(() => {
    isAnalyticsInitialized = true
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the page mounts and analytics is ready', () => {
    it('should emit a pageview for the /download path', () => {
      renderAt('/download')
      expect(mockPage).toHaveBeenCalledWith('/download')
    })
  })

  describe('when analytics has not initialized yet', () => {
    beforeEach(() => {
      isAnalyticsInitialized = false
    })

    it('should not emit a pageview', () => {
      renderAt('/download')
      expect(mockPage).not.toHaveBeenCalled()
    })
  })
})
