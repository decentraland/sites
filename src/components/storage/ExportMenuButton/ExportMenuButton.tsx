import { useCallback, useId, useState } from 'react'
import type { FC, MouseEvent } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
// eslint-disable-next-line @typescript-eslint/naming-convention
import DownloadIcon from '@mui/icons-material/Download'
import { Button, CircularProgress, Menu, MenuItem } from 'decentraland-ui2'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { ActionIconButton } from '../_shared/ActionIconButton.styled'
import { ExportMenuRoot, ExportStatus } from './ExportMenuButton.styled'

interface ExportMenuButtonProps {
  label: string
  busy?: boolean
  variant?: 'button' | 'icon'
  onSelect: (format: 'json' | 'csv') => void
}

const ExportMenuButton: FC<ExportMenuButtonProps> = props => {
  const { label, busy = false, variant = 'button', onSelect } = props
  const t = useFormatMessage()
  const menuId = useId()
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const menuOpen = Boolean(anchorEl)

  const handleOpen = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (busy) return
      setAnchorEl(event.currentTarget)
    },
    [busy]
  )

  const handleClose = useCallback(() => {
    setAnchorEl(null)
  }, [])

  const handleSelect = useCallback(
    (format: 'json' | 'csv') => () => {
      setAnchorEl(null)
      onSelect(format)
    },
    [onSelect]
  )

  return (
    <>
      <ExportMenuRoot>
        {variant === 'icon' ? (
          <ActionIconButton
            aria-label={label}
            onClick={handleOpen}
            aria-disabled={busy || undefined}
            aria-busy={busy || undefined}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-controls={menuOpen ? menuId : undefined}
          >
            {busy ? <CircularProgress size={20} aria-hidden /> : <DownloadIcon />}
          </ActionIconButton>
        ) : (
          <Button
            variant="outlined"
            size="small"
            onClick={handleOpen}
            aria-disabled={busy || undefined}
            aria-busy={busy || undefined}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-controls={menuOpen ? menuId : undefined}
            startIcon={busy ? <CircularProgress size={16} aria-hidden /> : undefined}
            endIcon={<ArrowDropDownIcon />}
          >
            {label}
          </Button>
        )}
        <ExportStatus role="status">
          {busy ? `${t('component.storage.common.exporting')} ${t('component.storage.common.keep_page_open')}` : null}
        </ExportStatus>
      </ExportMenuRoot>
      <Menu id={menuId} anchorEl={anchorEl} open={menuOpen} onClose={handleClose}>
        <MenuItem onClick={handleSelect('json')}>{t('component.storage.common.format_json')}</MenuItem>
        <MenuItem onClick={handleSelect('csv')}>{t('component.storage.common.format_csv')}</MenuItem>
      </Menu>
    </>
  )
}

export { ExportMenuButton }
export type { ExportMenuButtonProps }
