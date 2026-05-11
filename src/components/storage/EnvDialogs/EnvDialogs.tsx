import { useCallback, useEffect, useState } from 'react'
import type { AuthIdentity } from '@dcl/crypto'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from 'decentraland-ui2'
import { useSetEnvMutation } from '../../../features/storage'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'

interface EnvAddDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  onError: () => void
  identity: AuthIdentity | undefined
  realm: string | null
  position: string | null
}

const EnvAddDialog = ({ open, onClose, onSuccess, onError, identity, realm, position }: EnvAddDialogProps) => {
  const t = useFormatMessage()
  const [setEnv, { isLoading }] = useSetEnvMutation()
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')

  useEffect(() => {
    if (open) {
      setNewKey('')
      setNewValue('')
    }
  }, [open])

  const handleSave = useCallback(async () => {
    if (!newKey.trim() || !newValue.trim()) return
    try {
      await setEnv({ identity, realm, position, key: newKey.trim(), value: newValue.trim() }).unwrap()
      onSuccess()
      onClose()
    } catch {
      onError()
    }
  }, [newKey, newValue, setEnv, identity, realm, position, onClose, onSuccess, onError])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('component.storage.env_page.add_dialog.title')}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label={t('component.storage.env_page.add_dialog.key_label')}
          fullWidth
          variant="outlined"
          value={newKey}
          onChange={e => setNewKey(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          label={t('component.storage.env_page.add_dialog.value_label')}
          fullWidth
          variant="outlined"
          value={newValue}
          onChange={e => setNewValue(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('component.storage.common.cancel')}</Button>
        <Button onClick={handleSave} variant="contained" disabled={isLoading || !newKey.trim() || !newValue.trim()}>
          {t('component.storage.common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

interface EnvEditDialogProps {
  open: boolean
  keyName: string
  onClose: () => void
  onSuccess: () => void
  onError: () => void
  identity: AuthIdentity | undefined
  realm: string | null
  position: string | null
}

const EnvEditDialog = ({ open, keyName, onClose, onSuccess, onError, identity, realm, position }: EnvEditDialogProps) => {
  const t = useFormatMessage()
  const [setEnv, { isLoading }] = useSetEnvMutation()
  const [editValue, setEditValue] = useState('')

  useEffect(() => {
    if (open) setEditValue('')
  }, [open, keyName])

  const handleSave = useCallback(async () => {
    if (!editValue.trim()) return
    try {
      await setEnv({ identity, realm, position, key: keyName, value: editValue.trim() }).unwrap()
      onSuccess()
      onClose()
    } catch {
      onError()
    }
  }, [editValue, keyName, setEnv, identity, realm, position, onClose, onSuccess, onError])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('component.storage.env_page.edit_dialog.title')}</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          {t('component.storage.env_page.edit_dialog.helper_text')}
        </Alert>
        <TextField
          margin="dense"
          label={t('component.storage.env_page.edit_dialog.key_label')}
          fullWidth
          variant="outlined"
          value={keyName}
          disabled
          sx={{ mb: 2 }}
        />
        <TextField
          autoFocus
          margin="dense"
          label={t('component.storage.env_page.edit_dialog.value_label')}
          fullWidth
          variant="outlined"
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('component.storage.common.cancel')}</Button>
        <Button onClick={handleSave} variant="contained" disabled={isLoading || !editValue.trim()}>
          {t('component.storage.common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export { EnvAddDialog, EnvEditDialog }
