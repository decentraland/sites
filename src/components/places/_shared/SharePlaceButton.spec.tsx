import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { SharePlaceButton } from './SharePlaceButton'

const mockShareUrl = jest.fn()
jest.mock('../../../hooks/useShareUrl', () => ({
  useShareUrl: (target: string) => mockShareUrl(target)
}))

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id?: string | null) => id ?? ''
}))

jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/styledMock'))

const SHARE_URL = 'http://localhost/places/world/foo.dcl.eth?referrer=0x1111111111111111111111111111111111111111'

describe('SharePlaceButton', () => {
  let writeText: jest.Mock

  beforeEach(() => {
    mockShareUrl.mockReturnValue(SHARE_URL)
    writeText = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
    jest.resetAllMocks()
  })

  it('should share the credited link, not the raw target', () => {
    render(<SharePlaceButton target="/places/world/foo.dcl.eth" />)

    fireEvent.click(screen.getByRole('button', { name: 'discover.scene.share' }))

    expect(mockShareUrl).toHaveBeenCalledWith('/places/world/foo.dcl.eth')
    expect(writeText).toHaveBeenCalledWith(SHARE_URL)
  })

  describe('when the browser has a native share sheet', () => {
    let share: jest.Mock

    beforeEach(() => {
      share = jest.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'share', { configurable: true, value: share })
    })

    it('should hand off to it instead of copying', () => {
      render(<SharePlaceButton target="/places/world/foo.dcl.eth" title="Foo" />)

      fireEvent.click(screen.getByRole('button', { name: 'discover.scene.share' }))

      expect(share).toHaveBeenCalledWith({ title: 'Foo', url: SHARE_URL })
      expect(writeText).not.toHaveBeenCalled()
    })

    it('should treat a dismissed sheet as a no-op, never a silent clipboard write', async () => {
      share.mockRejectedValue(new Error('AbortError'))
      render(<SharePlaceButton target="/places/world/foo.dcl.eth" />)

      fireEvent.click(screen.getByRole('button', { name: 'discover.scene.share' }))
      await Promise.resolve()

      expect(writeText).not.toHaveBeenCalled()
      expect(screen.getByRole('status')).toBeEmptyDOMElement()
    })
  })

  describe('when there is no share sheet', () => {
    it('should confirm the copy so the click is not silent', async () => {
      render(<SharePlaceButton target="/places/world/foo.dcl.eth" />)

      fireEvent.click(screen.getByRole('button', { name: 'discover.scene.share' }))
      await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('discover.scene.copied'))
    })

    it('should stay quiet when the clipboard rejects, rather than claim a copy that did not happen', async () => {
      writeText.mockRejectedValue(new Error('denied'))
      render(<SharePlaceButton target="/places/world/foo.dcl.eth" />)

      fireEvent.click(screen.getByRole('button', { name: 'discover.scene.share' }))
      await Promise.resolve()

      expect(screen.getByRole('status')).toBeEmptyDOMElement()
    })
  })
})
