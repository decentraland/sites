import { useId } from 'react'
import type { OverlaySize } from '../../../features/cast2/cast2.types'
import { useCastTranslation } from '../../../features/cast2/useCastTranslation'
import { CameraMenuDropdownProps } from './StreamingControls.types'
import { DeviceMenu, DeviceMenuDivider, DeviceMenuItem, DeviceMenuSectionLabel } from './StreamingControls.styled'

const OVERLAY_SIZES: OverlaySize[] = ['small', 'large']

const OVERLAY_CORNERS = [
  { key: 'top_left', x: 0, y: 0 },
  { key: 'top_right', x: 1, y: 0 },
  { key: 'bottom_left', x: 0, y: 1 },
  { key: 'bottom_right', x: 1, y: 1 }
] as const

/** Camera button dropdown: camera picker plus, during a presentation, the camera bubble layout. */
export function CameraMenuDropdown(props: CameraMenuDropdownProps) {
  const { devices, selectedDeviceId, overlay, onSelectDevice, onSelectOverlay } = props
  const { t } = useCastTranslation()
  const overlayLabelId = useId()
  const showDevices = devices.length > 1

  return (
    <DeviceMenu data-dropdown-menu>
      {showDevices &&
        devices.map(device => (
          <DeviceMenuItem
            key={device.deviceId}
            $active={device.deviceId === selectedDeviceId}
            onClick={() => onSelectDevice(device.deviceId)}
          >
            {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
          </DeviceMenuItem>
        ))}
      {overlay && (
        <div role="group" aria-labelledby={overlayLabelId}>
          {showDevices && <DeviceMenuDivider />}
          <DeviceMenuSectionLabel id={overlayLabelId}>{t('streaming_controls.camera_overlay.title')}</DeviceMenuSectionLabel>
          {OVERLAY_SIZES.map(size => (
            <DeviceMenuItem
              key={size}
              role="menuitemradio"
              aria-checked={overlay.size === size}
              $active={overlay.size === size}
              onClick={() => onSelectOverlay({ size })}
            >
              {t(`streaming_controls.camera_overlay.size_${size}`)}
            </DeviceMenuItem>
          ))}
          <DeviceMenuDivider />
          {OVERLAY_CORNERS.map(corner => {
            const isCurrentCorner = overlay.x === corner.x && overlay.y === corner.y
            return (
              <DeviceMenuItem
                key={corner.key}
                role="menuitemradio"
                aria-checked={isCurrentCorner}
                $active={isCurrentCorner}
                onClick={() => onSelectOverlay({ x: corner.x, y: corner.y })}
              >
                {t(`streaming_controls.camera_overlay.${corner.key}`)}
              </DeviceMenuItem>
            )
          })}
        </div>
      )}
    </DeviceMenu>
  )
}
