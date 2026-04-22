import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from '@dcl/hooks'
import { Button } from 'decentraland-ui2'
import { useAdminPermissions } from '../../../hooks/useAdminPermissions'
import { Bar, BarTab, BarTabs, CreateEventButtonWrapper } from './AdminTabsBar.styled'

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
      <BarTabs
        value={activeValue}
        onChange={(_, next) => navigate(next as string)}
        textColor="primary"
        indicatorColor="primary"
        variant="scrollable"
        scrollButtons={false}
      >
        <BarTab label={t('whats_on_admin.tabs.whats_on')} value={ROUTE_WHATS_ON} />
        {canSeePending && <BarTab label={t('whats_on_admin.tabs.pending_events')} value={ROUTE_PENDING} />}
        {canSeeUsers && <BarTab label={t('whats_on_admin.tabs.users')} value={ROUTE_USERS} />}
      </BarTabs>
      <CreateEventButtonWrapper>
        <Button variant="outlined" color="secondary" onClick={() => navigate(ROUTE_CREATE_EVENT)}>
          {t('whats_on_admin.cta.create_event')}
        </Button>
      </CreateEventButtonWrapper>
    </Bar>
  )
}

export { AdminTabsBar }
