import { useCallback, useMemo } from 'react'
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
import { Tab, Tabs, Typography } from 'decentraland-ui2'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useStorageScope } from '../../../hooks/useStorageScope'
import { BackButton, ScopeChip, ScopeRow, StorageHeader, StoragePageContainer, StorageTabsRoot } from './StorageLayout.styled'

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
  const { realm, position } = useStorageScope()

  const activeTab = useMemo(() => {
    if (location.pathname.startsWith('/storage/scene')) return 'scene'
    if (location.pathname.startsWith('/storage/players')) return 'players'
    return 'env'
  }, [location.pathname])

  const handleTabChange = useCallback(
    (_event: React.SyntheticEvent, newValue: 'env' | 'scene' | 'players') => {
      navigate({ pathname: `/storage/${newValue}`, search: window.location.search })
    },
    [navigate]
  )

  const handleBack = useCallback(() => {
    navigate('/storage/select')
  }, [navigate])

  const scopeLabel = realm ?? position ?? ''

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
      </StorageHeader>
      <StorageTabsRoot>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="storage sections" variant="scrollable">
          {STORAGE_TABS.map(tab => (
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
      {children}
    </StoragePageContainer>
  )
}

export { StorageLayout }
