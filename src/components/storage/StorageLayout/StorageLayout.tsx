import { useCallback, useEffect, useMemo } from 'react'
import type { FC, ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
// eslint-disable-next-line @typescript-eslint/naming-convention
import FmdGoodIcon from '@mui/icons-material/FmdGood'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PeopleIcon from '@mui/icons-material/People'
// eslint-disable-next-line @typescript-eslint/naming-convention
import SettingsIcon from '@mui/icons-material/Settings'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ViewInArIcon from '@mui/icons-material/ViewInAr'
import { Alert, Box, CircularProgress, Tab, Tabs, Typography } from 'decentraland-ui2'
import type { ExportFormat } from '../../../features/storage'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import { useLeaveGuard, useLeavePrompt } from '../../../hooks/useLeaveGuard'
import { useStorageExport } from '../../../hooks/useStorageExport'
import { useStorageScope } from '../../../hooks/useStorageScope'
import { ConfirmDialog } from '../ConfirmDialog'
import { ExportMenuButton } from '../ExportMenuButton'
import {
  BackButton,
  HeaderActions,
  LoaderBox,
  ScopeChip,
  ScopeRow,
  StorageHeader,
  StoragePageContainer,
  StorageTabsRoot
} from './StorageLayout.styled'

interface StorageLayoutProps {
  children: ReactNode
}

const STORAGE_TABS = [
  { value: 'env', label: 'environment', icon: <SettingsIcon fontSize="small" /> },
  { value: 'scene', label: 'scene', icon: <ViewInArIcon fontSize="small" /> },
  { value: 'players', label: 'player', icon: <PeopleIcon fontSize="small" /> }
] as const

const StorageLayout: FC<StorageLayoutProps> = ({ children }) => {
  const t = useFormatMessage()
  const navigate = useNavigate()
  const location = useLocation()
  const { realm, position, isResolving, unresolved } = useStorageScope()
  const { identity } = useAuthIdentity()
  const { startExport, busy, errorKey, clearError } = useStorageExport()
  const confirmLeave = useLeaveGuard(busy)
  const leavePrompt = useLeavePrompt()

  const activeTab = useMemo(() => {
    if (location.pathname.startsWith('/storage/scene')) return 'scene'
    if (location.pathname.startsWith('/storage/players')) return 'players'
    return 'env'
  }, [location.pathname])

  const isCollaborator = useMemo(() => new URLSearchParams(location.search).get('access') === 'collaborator', [location.search])
  const tabs = useMemo(() => (isCollaborator ? STORAGE_TABS.filter(tab => tab.value !== 'env') : STORAGE_TABS), [isCollaborator])
  const selectedTab = tabs.some(tab => tab.value === activeTab) ? activeTab : tabs[0].value

  useEffect(() => {
    if (isCollaborator && activeTab === 'env') {
      navigate({ pathname: '/storage/scene', search: location.search }, { replace: true })
    }
  }, [isCollaborator, activeTab, navigate, location.search])

  const handleTabChange = useCallback(
    (_event: React.SyntheticEvent, newValue: 'env' | 'scene' | 'players') => {
      confirmLeave(() => navigate({ pathname: `/storage/${newValue}`, search: window.location.search }))
    },
    [confirmLeave, navigate]
  )

  const handleBack = useCallback(() => {
    confirmLeave(() => navigate('/storage/select'))
  }, [confirmLeave, navigate])

  const handleDownloadAll = useCallback((format: ExportFormat) => startExport({}, format), [startExport])

  const scopeLabel = realm ?? position ?? ''
  const canDownloadAll = Boolean(identity) && !isResolving && !unresolved && activeTab !== 'env'

  return (
    <StoragePageContainer>
      <StorageHeader>
        <BackButton onClick={handleBack} aria-label={t('component.storage.sidebar.back')}>
          <ArrowBackIcon fontSize="small" />
          <Typography variant="body2">{t('component.storage.sidebar.back')}</Typography>
        </BackButton>
        {scopeLabel ? (
          <ScopeRow>
            <ScopeChip>
              <FmdGoodIcon fontSize="small" />
              <Typography variant="body2" fontWeight={600}>
                {scopeLabel}
              </Typography>
            </ScopeChip>
            {realm && position ? (
              <Typography variant="caption" color="text.secondary">
                {t('component.storage.sidebar.position')}: {position}
              </Typography>
            ) : null}
          </ScopeRow>
        ) : null}
        {canDownloadAll ? (
          <HeaderActions>
            <ExportMenuButton label={t('component.storage.common.download_all')} busy={busy} onSelect={handleDownloadAll} />
          </HeaderActions>
        ) : null}
      </StorageHeader>
      {errorKey ? (
        <Alert severity="error" onClose={clearError}>
          {t(errorKey)}
        </Alert>
      ) : null}
      <StorageTabsRoot>
        <Tabs value={selectedTab} onChange={handleTabChange} aria-label="storage sections" variant="scrollable">
          {tabs.map(tab => (
            <Tab
              key={tab.value}
              value={tab.value}
              icon={tab.icon}
              iconPosition="start"
              label={t(`component.storage.sidebar.${tab.label}`)}
            />
          ))}
        </Tabs>
      </StorageTabsRoot>
      {isResolving ? (
        <LoaderBox>
          <CircularProgress aria-label={t('component.storage.common.loading')} />
        </LoaderBox>
      ) : unresolved ? (
        <Box sx={{ mt: 3 }}>
          <Typography color="error">{t('component.storage.errors.world_scene_unresolved')}</Typography>
        </Box>
      ) : (
        children
      )}
      <ConfirmDialog
        open={leavePrompt.open}
        title={t('component.storage.leave_dialog.title')}
        message={t('component.storage.leave_dialog.message')}
        confirmLabel={t('component.storage.leave_dialog.leave')}
        cancelLabel={t('component.storage.leave_dialog.stay')}
        onConfirm={leavePrompt.leave}
        onCancel={leavePrompt.stay}
      />
    </StoragePageContainer>
  )
}

export { StorageLayout }
