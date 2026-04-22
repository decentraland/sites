import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from '@dcl/hooks'
import { Button, Tab, Tabs } from 'decentraland-ui2'
import { useAdminPermissions } from '../../../hooks/useAdminPermissions'
import { Bar } from './AdminTabsBar.styled'

const ROUTE_WHATS_ON = '/whats-on'
const ROUTE_PENDING = '/whats-on/admin/pending-events'
const ROUTE_USERS = '/whats-on/admin/users'
const ROUTE_CREATE_EVENT = '/whats-on/new-event'

function AdminTabsBar() {
  const { isAdmin, canApproveAnyEvent, canApproveOwnEvent, canEditAnyEvent, canEditAnyProfile } = useAdminPermissions()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { t } = useTranslation()

  const canSeePending = canApproveAnyEvent || canApproveOwnEvent || canEditAnyEvent
  const canSeeUsers = canEditAnyProfile

  const activeValue = useMemo(() => {
    if (pathname.startsWith(ROUTE_PENDING)) return ROUTE_PENDING
    if (pathname.startsWith(ROUTE_USERS)) return ROUTE_USERS
    return ROUTE_WHATS_ON
  }, [pathname])

  if (!isAdmin) return null

  return (
    <Bar>
      <Tabs value={activeValue} onChange={(_, next) => navigate(next as string)} textColor="primary" indicatorColor="primary">
        <Tab label={t('whats_on_admin.tabs.whats_on')} value={ROUTE_WHATS_ON} />
        {canSeePending && <Tab label={t('whats_on_admin.tabs.pending_events')} value={ROUTE_PENDING} />}
        {canSeeUsers && <Tab label={t('whats_on_admin.tabs.users')} value={ROUTE_USERS} />}
      </Tabs>
      <Button variant="outlined" color="secondary" onClick={() => navigate(ROUTE_CREATE_EVENT)}>
        {t('whats_on_admin.cta.create_event')}
      </Button>
    </Bar>
  )
}

export { AdminTabsBar }
