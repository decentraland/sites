import { useEffect, useMemo, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CloseIcon from '@mui/icons-material/Close'
import { useTranslation } from '@dcl/hooks'
import { Box, Button, DialogContent, DialogTitle, IconButton, Switch, TextField, Typography } from 'decentraland-ui2'
import { isValidWalletAddress } from '../../../features/whats-on/admin/admin.helpers'
import { AdminPermission, UPDATEABLE_PERMISSIONS } from '../../../features/whats-on/admin/admin.types'
import { Footer, PermissionRow, StyledDialog } from './AdminPermissionsModal.styled'

type SubmitPayload = { address: string; permissions: AdminPermission[] }

type AdminPermissionsModalProps = {
  open: boolean
  mode: 'add' | 'edit'
  initialUser?: string
  initialPermissions: AdminPermission[]
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (payload: SubmitPayload) => void
}

function AdminPermissionsModal({
  open,
  mode,
  initialUser,
  initialPermissions,
  isSubmitting,
  onClose,
  onSubmit
}: AdminPermissionsModalProps) {
  const { t } = useTranslation()
  const [address, setAddress] = useState(initialUser ?? '')
  const [permissions, setPermissions] = useState<AdminPermission[]>(initialPermissions)

  useEffect(() => {
    if (open) {
      setAddress(initialUser ?? '')
      setPermissions(initialPermissions)
    }
  }, [initialUser, initialPermissions, open])

  const addressIsValid = useMemo(() => isValidWalletAddress(address), [address])
  const addressHasInvalidFormat = address.length > 0 && !addressIsValid
  const canSave = addressIsValid && !isSubmitting

  const toggle = (permission: AdminPermission) =>
    setPermissions(prev => (prev.includes(permission) ? prev.filter(value => value !== permission) : [...prev, permission]))

  const handleSubmit = () => onSubmit({ address: address.trim(), permissions })

  return (
    <StyledDialog open={open} onClose={onClose} fullWidth>
      <DialogTitle sx={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        {t(`whats_on_admin.permissions_modal.${mode}_title`)}
        <IconButton onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <TextField
          label={t('whats_on_admin.permissions_modal.wallet_label')}
          placeholder={t('whats_on_admin.permissions_modal.wallet_placeholder')}
          value={address}
          disabled={mode === 'edit'}
          onChange={event => setAddress(event.target.value)}
          fullWidth
          error={addressHasInvalidFormat}
          helperText={addressHasInvalidFormat ? t('whats_on_admin.permissions_modal.wallet_invalid') : ' '}
          // eslint-disable-next-line @typescript-eslint/naming-convention
          inputProps={{ 'aria-label': t('whats_on_admin.permissions_modal.wallet_label') }}
        />
        <Box mt={2}>
          {UPDATEABLE_PERMISSIONS.map(permission => {
            const title = t(`whats_on_admin.permissions_modal.permissions.${permission}.title`)
            const description = t(`whats_on_admin.permissions_modal.permissions.${permission}.description`)
            return (
              <PermissionRow key={permission}>
                <Box>
                  <Typography variant="h6">{title}</Typography>
                  <Typography variant="body2">{description}</Typography>
                </Box>
                <Switch
                  checked={permissions.includes(permission)}
                  onChange={() => toggle(permission)}
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  inputProps={{ 'aria-label': title }}
                />
              </PermissionRow>
            )
          })}
        </Box>
      </DialogContent>
      <Footer>
        <Button variant="contained" color="secondary" onClick={onClose} disabled={isSubmitting}>
          {t('whats_on_admin.permissions_modal.cancel')}
        </Button>
        <Button variant="contained" color="primary" onClick={handleSubmit} disabled={!canSave}>
          {t('whats_on_admin.permissions_modal.save')}
        </Button>
      </Footer>
    </StyledDialog>
  )
}

export { AdminPermissionsModal }
export type { AdminPermissionsModalProps, SubmitPayload }
