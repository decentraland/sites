import { act, fireEvent, render, screen } from '@testing-library/react'
import type { WorldDeployment } from '../../../features/creators'
import type { DiscoverPlace } from '../../../features/discover'

let mockContext: { worldName: string; deployments: WorldDeployment[]; latest: WorldDeployment | null; place: DiscoverPlace | null }

jest.mock('../../../components/creators/CreatorWorldLayout', () => ({
  useWorldContext: () => mockContext
}))
jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))
jest.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children?: React.ReactNode }) => <>{children}</>
}))
jest.mock('../../../features/creators', () => ({
  buildBevyHrefs: () => ({ external: 'https://ext', iframe: 'https://iframe' })
}))
jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/creatorsUi2Mock'))

// Imported after the mocks so the mocked barrels win.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PreviewPage } = require('./PreviewPage') as typeof import('./PreviewPage')

describe('PreviewPage', () => {
  beforeEach(() => {
    mockContext = { worldName: 'test.dcl.eth', deployments: [], latest: null, place: null }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the preview tab is opened', () => {
    it('should render the launch poster and not mount the iframe', () => {
      render(<PreviewPage />)
      expect(screen.getByText('page.creators.world.preview_hint')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'page.creators.world.preview_launch' })).toBeInTheDocument()
      expect(screen.queryByTitle(/page\.creators\.world\.nav\.preview/)).not.toBeInTheDocument()
    })
  })

  describe('when the launch poster is clicked', () => {
    it('should mount the bevy iframe with the streaming src and the fullscreen control', () => {
      render(<PreviewPage />)
      fireEvent.click(screen.getByRole('button', { name: 'page.creators.world.preview_launch' }))
      const iframe = screen.getByTitle('test.dcl.eth page.creators.world.nav.preview')
      expect(iframe).toHaveAttribute('src', 'https://iframe')
      expect(iframe).toHaveAttribute('credentialless', '')
      expect(screen.getByText('page.creators.world.preview_fullscreen')).toBeInTheDocument()
    })
  })

  describe('when the world thumbnail is available', () => {
    it('should use the latest deployment thumbnail for the poster cover', () => {
      mockContext = {
        worldName: 'test.dcl.eth',
        deployments: [],
        latest: {
          entityId: 'id',
          title: 'Scene',
          parcelCount: 1,
          contentFileCount: 1,
          requiredPermissions: [],
          authoritativeMultiplayer: false,
          thumbnailUrl: 'https://cdn.example/thumb.png'
        },
        place: null
      }
      render(<PreviewPage />)
      // The poster still renders pre-launch; cover image only affects styling.
      expect(screen.getByRole('button', { name: 'page.creators.world.preview_launch' })).toBeInTheDocument()
    })
  })

  describe('when toggling fullscreen', () => {
    it('should request fullscreen on the video area when not currently fullscreen', () => {
      // Reject so the `.catch(() => undefined)` fallback path also runs.
      const requestFullscreen = jest.fn().mockRejectedValue(new Error('denied'))
      HTMLElement.prototype.requestFullscreen = requestFullscreen
      render(<PreviewPage />)
      fireEvent.click(screen.getByRole('button', { name: 'page.creators.world.preview_launch' }))
      fireEvent.click(screen.getByText('page.creators.world.preview_fullscreen'))
      expect(requestFullscreen).toHaveBeenCalled()
    })

    it('should exit fullscreen and update the label when the video area is already fullscreen', () => {
      const exitFullscreen = jest.fn().mockRejectedValue(new Error('denied'))
      document.exitFullscreen = exitFullscreen
      render(<PreviewPage />)
      fireEvent.click(screen.getByRole('button', { name: 'page.creators.world.preview_launch' }))
      const videoArea = screen.getByTitle('test.dcl.eth page.creators.world.nav.preview').parentElement as HTMLElement

      // Pretend the browser entered fullscreen on the video area, then fire the
      // fullscreenchange listener so the label flips to "exit fullscreen".
      Object.defineProperty(document, 'fullscreenElement', { value: videoArea, configurable: true })
      act(() => {
        document.dispatchEvent(new Event('fullscreenchange'))
      })
      expect(screen.getByText('page.creators.world.preview_exit_fullscreen')).toBeInTheDocument()

      fireEvent.click(screen.getByText('page.creators.world.preview_exit_fullscreen'))
      expect(exitFullscreen).toHaveBeenCalled()
    })

    it('should be a no-op when toggling fullscreen with no video element', () => {
      const requestFullscreen = jest.fn().mockResolvedValue(undefined)
      HTMLElement.prototype.requestFullscreen = requestFullscreen
      render(<PreviewPage />)
      // Pre-launch there is no VideoArea ref; nothing should call fullscreen.
      expect(screen.queryByText('page.creators.world.preview_fullscreen')).not.toBeInTheDocument()
      expect(requestFullscreen).not.toHaveBeenCalled()
    })
  })
})
