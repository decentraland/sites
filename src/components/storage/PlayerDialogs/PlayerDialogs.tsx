import { useCallback, useEffect, useRef, useState } from 'react'
import type { AuthIdentity } from '@dcl/crypto'
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from 'decentraland-ui2'
import { useGetPlayerValueQuery, useSetPlayerValueMutation } from '../../../features/world/storage'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { StorageValueField, type StorageValueFieldRef } from '../StorageValueField'

interface PlayerAddDialogProps {
  open: boolean
  address: string
  onClose: () => void
  onSuccess: () => void
  onError: () => void
  identity: AuthIdentity | undefined
  realm: string | null
  position: string | null
}

const PlayerAddDialog = ({ open, address, onClose, onSuccess, onError, identity, realm, position }: PlayerAddDialogProps) => {
  const t = useFormatMessage()
  const [setPlayerValue, { isLoading }] = useSetPlayerValueMutation()
  const [newKey, setNewKey] = useState('')
  const [isValueValid, setIsValueValid] = useState(false)
  const fieldRef = useRef<StorageValueFieldRef>(null)

  useEffect(() => {
    if (open) {
      setNewKey('')
      setIsValueValid(false)
      fieldRef.current?.reset()
    }
  }, [open])

  const handleSave = useCallback(async () => {
    if (!newKey.trim()) return
    const parsedValue = fieldRef.current?.getParsedValue() ?? null
    if (parsedValue === null) return
    try {
      await setPlayerValue({ identity, realm, position, address, key: newKey.trim(), value: parsedValue }).unwrap()
      onSuccess()
      onClose()
    } catch {
      onError()
    }
  }, [newKey, setPlayerValue, identity, realm, position, address, onClose, onSuccess, onError])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('component.storage.player_page.add_dialog.title')}</DialogTitle>
      <DialogContent>
        <TextField
          margin="dense"
          label={t('component.storage.player_page.add_dialog.address_label')}
          fullWidth
          variant="outlined"
          value={address}
          disabled
          sx={{ mb: 2 }}
        />
        <TextField
          autoFocus
          margin="dense"
          label={t('component.storage.player_page.add_dialog.key_label')}
          fullWidth
          variant="outlined"
          value={newKey}
          onChange={e => setNewKey(e.target.value)}
          sx={{ mb: 2 }}
        />
        <StorageValueField
          ref={fieldRef}
          onChange={e => setIsValueValid(e.isValid)}
          margin="dense"
          label={t('component.storage.player_page.add_dialog.value_label')}
          fullWidth
          variant="outlined"
          multiline
          rows={4}
          placeholder={t('component.storage.player_page.add_dialog.value_placeholder')}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('component.storage.common.cancel')}</Button>
        <Button onClick={handleSave} variant="contained" disabled={isLoading || !newKey.trim() || !isValueValid}>
          {t('component.storage.common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

interface PlayerEditDialogProps {
  open: boolean
  address: string
  keyName: string
  onClose: () => void
  onSuccess: () => void
  onError: () => void
  identity: AuthIdentity | undefined
  realm: string | null
  position: string | null
}

const PlayerEditDialog = ({ open, address, keyName, onClose, onSuccess, onError, identity, realm, position }: PlayerEditDialogProps) => {
  const t = useFormatMessage()
  const { data, isLoading } = useGetPlayerValueQuery({ identity, address, key: keyName, realm, position }, { skip: !open || !keyName })
  const [setPlayerValue] = useSetPlayerValueMutation()
  const fieldRef = useRef<StorageValueFieldRef>(null)
  const [isValid, setIsValid] = useState(false)

  const handleSave = useCallback(async () => {
    const parsedValue = fieldRef.current?.getParsedValue() ?? null
    if (parsedValue === null) return
    try {
      await setPlayerValue({ identity, realm, position, address, key: keyName, value: parsedValue }).unwrap()
      onSuccess()
      onClose()
    } catch {
      onError()
    }
  }, [keyName, setPlayerValue, identity, realm, position, address, onClose, onSuccess, onError])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('component.storage.player_page.edit_dialog.title', { key: keyName })}</DialogTitle>
      <DialogContent>
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <StorageValueField
            ref={fieldRef}
            defaultValue={data?.value}
            onChange={e => setIsValid(e.isValid)}
            autoFocus
            margin="dense"
            label={t('component.storage.player_page.edit_dialog.value_label')}
            fullWidth
            variant="outlined"
            multiline
            rows={12}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('component.storage.common.cancel')}</Button>
        <Button onClick={handleSave} variant="contained" disabled={isLoading || !isValid}>
          {t('component.storage.common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export { PlayerAddDialog, PlayerEditDialog }
