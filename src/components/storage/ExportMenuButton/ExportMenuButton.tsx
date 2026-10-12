import { useCallback, useId, useState } from 'react'
import type { FC, MouseEvent } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import { Button, CircularProgress, Menu, MenuItem } from 'decentraland-ui2'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'

interface ExportMenuButtonProps {
  label: string
  busy?: boolean
  disabled?: boolean
  onSelect: (format: 'json' | 'csv') => void
}

const ExportMenuButton: FC<ExportMenuButtonProps> = props => {
  const { label, busy = false, disabled = false, onSelect } = props
  const t = useFormatMessage()
  const menuId = useId()
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const menuOpen = Boolean(anchorEl)

  const handleOpen = useCallback((event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }, [])

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
      <Button
        variant="outlined"
        size="small"
        disabled={disabled || busy}
        onClick={handleOpen}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-controls={menuOpen ? menuId : undefined}
        startIcon={busy ? <CircularProgress size={16} aria-label={t('component.storage.common.exporting')} /> : undefined}
        endIcon={<ArrowDropDownIcon />}
      >
        {label}
      </Button>
      <Menu id={menuId} anchorEl={anchorEl} open={menuOpen} onClose={handleClose}>
        <MenuItem onClick={handleSelect('json')}>{t('component.storage.common.format_json')}</MenuItem>
        <MenuItem onClick={handleSelect('csv')}>{t('component.storage.common.format_csv')}</MenuItem>
      </Menu>
    </>
  )
}

export { ExportMenuButton }
export type { ExportMenuButtonProps }
