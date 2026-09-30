import { fireEvent, render, screen } from '@testing-library/react'
import type { OverlayLayout } from '../../../features/cast2/cast2.types'
import { CameraMenuDropdown } from './CameraMenuDropdown'

jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/styledMock'))
jest.mock('../../../features/cast2/useCastTranslation', () => ({
  useCastTranslation: () => ({ t: (key: string) => key })
}))

const device = (deviceId: string, label: string) => ({ deviceId, label }) as MediaDeviceInfo

describe('CameraMenuDropdown', () => {
  let devices: MediaDeviceInfo[]
  let overlay: OverlayLayout | null
  let onSelectDevice: jest.Mock
  let onSelectOverlay: jest.Mock

  const renderMenu = () =>
    render(
      <CameraMenuDropdown
        devices={devices}
        selectedDeviceId="cam-1"
        overlay={overlay}
        onSelectDevice={onSelectDevice}
        onSelectOverlay={onSelectOverlay}
      />
    )

  beforeEach(() => {
    devices = [device('cam-1', 'Front camera'), device('cam-2', 'Back camera')]
    overlay = null
    onSelectDevice = jest.fn()
    onSelectOverlay = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when there is no camera bubble to configure', () => {
    it('should list the cameras', () => {
      renderMenu()
      expect(screen.getByText('Back camera')).toBeInTheDocument()
    })

    it('should not show the camera bubble options', () => {
      renderMenu()
      expect(screen.queryByRole('group', { name: 'streaming_controls.camera_overlay.title' })).not.toBeInTheDocument()
    })

    describe('and a camera is picked', () => {
      it('should select that camera', () => {
        renderMenu()
        fireEvent.click(screen.getByText('Back camera'))
        expect(onSelectDevice).toHaveBeenCalledWith('cam-2')
      })
    })
  })

  describe('when the camera bubble can be configured', () => {
    beforeEach(() => {
      overlay = { x: 0, y: 1, size: 'small' }
    })

    it('should show the camera bubble options under their heading', () => {
      renderMenu()
      expect(screen.getByRole('group', { name: 'streaming_controls.camera_overlay.title' })).toBeInTheDocument()
    })

    it('should mark the current size', () => {
      renderMenu()
      expect(screen.getByRole('menuitemradio', { name: 'streaming_controls.camera_overlay.size_small' })).toHaveAttribute(
        'aria-checked',
        'true'
      )
    })

    it('should mark the current corner', () => {
      renderMenu()
      expect(screen.getByRole('menuitemradio', { name: 'streaming_controls.camera_overlay.bottom_left' })).toHaveAttribute(
        'aria-checked',
        'true'
      )
    })

    describe('and a size is picked', () => {
      it('should select that size', () => {
        renderMenu()
        fireEvent.click(screen.getByRole('menuitemradio', { name: 'streaming_controls.camera_overlay.size_large' }))
        expect(onSelectOverlay).toHaveBeenCalledWith({ size: 'large' })
      })
    })

    describe('and a corner is picked', () => {
      it('should select that corner', () => {
        renderMenu()
        fireEvent.click(screen.getByRole('menuitemradio', { name: 'streaming_controls.camera_overlay.top_right' }))
        expect(onSelectOverlay).toHaveBeenCalledWith({ x: 1, y: 0 })
      })
    })

    describe('and there is a single camera', () => {
      beforeEach(() => {
        devices = [device('cam-1', 'Front camera')]
      })

      it('should not list the camera', () => {
        renderMenu()
        expect(screen.queryByText('Front camera')).not.toBeInTheDocument()
      })
    })
  })

  describe('when a camera has no label', () => {
    beforeEach(() => {
      devices = [device('abcdef123', ''), device('cam-2', 'Back camera')]
    })

    it('should name it after its device id', () => {
      renderMenu()
      expect(screen.getByText('Camera abcde')).toBeInTheDocument()
    })
  })
})
