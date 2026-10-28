import { fireEvent, render, screen } from '@testing-library/react'
import { CameraMenuDropdown } from './CameraMenuDropdown'
import type { CameraMenuDropdownProps } from './StreamingControls.types'

jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/styledMock'))
jest.mock('../../../features/cast2/useCastTranslation', () => ({
  useCastTranslation: () => ({ t: (key: string) => key })
}))

const device = (deviceId: string, label: string) => ({ deviceId, label }) as MediaDeviceInfo
const option = (name: string) => screen.getByRole('menuitemradio', { name: `streaming_controls.camera_overlay.${name}` })

describe('when the camera menu renders', () => {
  let props: CameraMenuDropdownProps

  beforeEach(() => {
    props = {
      devices: [device('cam-1', 'Front camera'), device('abcdef123', '')],
      selectedDeviceId: 'cam-1',
      overlay: null,
      onSelectDevice: jest.fn(),
      onSelectOverlay: jest.fn()
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and there is no camera bubble to configure', () => {
    beforeEach(() => {
      render(<CameraMenuDropdown {...props} />)
    })

    it.each(['Front camera', 'Camera abcde'])('should list the camera as %s', label => {
      expect(screen.getByText(label)).toBeInTheDocument()
    })

    it('should not show the camera bubble options', () => {
      expect(screen.queryByRole('group')).not.toBeInTheDocument()
    })

    describe('and a camera is picked', () => {
      beforeEach(() => {
        fireEvent.click(screen.getByText('Camera abcde'))
      })

      it('should select that camera', () => {
        expect(props.onSelectDevice).toHaveBeenCalledWith('abcdef123')
      })
    })
  })

  describe('and the camera bubble can be configured with a single camera', () => {
    beforeEach(() => {
      props.devices = [device('cam-1', 'Front camera')]
      props.overlay = { x: 0, y: 1, size: 'small' }
      render(<CameraMenuDropdown {...props} />)
    })

    it('should not list the only camera', () => {
      expect(screen.queryByText('Front camera')).not.toBeInTheDocument()
    })

    it('should show the camera bubble options under their heading', () => {
      expect(screen.getByRole('group', { name: 'streaming_controls.camera_overlay.title' })).toBeInTheDocument()
    })

    it.each(['size_small', 'bottom_left'])('should mark %s as current', name => {
      expect(option(name)).toHaveAttribute('aria-checked', 'true')
    })

    describe.each([
      ['size_large', { size: 'large' }],
      ['top_right', { x: 1, y: 0 }]
    ])('and %s is picked', (name, layout) => {
      beforeEach(() => {
        fireEvent.click(option(name))
      })

      it('should select that layout', () => {
        expect(props.onSelectOverlay).toHaveBeenCalledWith(layout)
      })
    })
  })
})
