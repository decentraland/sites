import { useEffect, useMemo, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CloseIcon from '@mui/icons-material/Close'
import { useTranslation } from '@dcl/hooks'
import { Box, Button, DialogContent, DialogTitle, IconButton, Switch, TextField } from 'decentraland-ui2'
import { isValidWalletAddress } from '../../../features/whats-on/admin/admin.helpers'
import { AdminPermission, UPDATEABLE_PERMISSIONS } from '../../../features/whats-on/admin/admin.types'
import { useProfileAvatar } from '../../../hooks/useProfileAvatar'
import {
  Footer,
  HeaderAddress,
  HeaderAvatar,
  HeaderName,
  HeaderText,
  ModalHeader,
  PermissionDescription,
  PermissionMeta,
  PermissionRow,
  PermissionTitle,
  StyledDialog
} from './AdminPermissionsModal.styled'

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

const truncateAddress = (value: string): string => (value.length > 12 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value)

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
  const { avatarFace, name } = useProfileAvatar(mode === 'edit' ? initialUser : undefined, { skip: mode !== 'edit' || !initialUser })

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
        <IconButton onClick={onClose} aria-label="close" sx={{ color: 'inherit' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      {mode === 'edit' && initialUser && (
        <ModalHeader>
          <HeaderAvatar src={avatarFace} />
          <HeaderText>
            <HeaderName>{name ?? truncateAddress(initialUser)}</HeaderName>
            <HeaderAddress>{initialUser}</HeaderAddress>
          </HeaderText>
        </ModalHeader>
      )}
      <DialogContent>
        {mode === 'add' && (
          <TextField
            label={t('whats_on_admin.permissions_modal.wallet_label')}
            placeholder={t('whats_on_admin.permissions_modal.wallet_placeholder')}
            value={address}
            onChange={event => setAddress(event.target.value)}
            fullWidth
            error={addressHasInvalidFormat}
            helperText={addressHasInvalidFormat ? t('whats_on_admin.permissions_modal.wallet_invalid') : ' '}
            // eslint-disable-next-line @typescript-eslint/naming-convention
            inputProps={{ 'aria-label': t('whats_on_admin.permissions_modal.wallet_label') }}
            sx={{
              marginTop: 2
            }}
          />
        )}
        <Box mt={mode === 'add' ? 1 : 0}>
          {UPDATEABLE_PERMISSIONS.map(permission => {
            const title = t(`whats_on_admin.permissions_modal.permissions.${permission}.title`)
            const description = t(`whats_on_admin.permissions_modal.permissions.${permission}.description`)
            return (
              <PermissionRow key={permission}>
                <PermissionMeta>
                  <PermissionTitle>{title}</PermissionTitle>
                  <PermissionDescription>{description}</PermissionDescription>
                </PermissionMeta>
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
