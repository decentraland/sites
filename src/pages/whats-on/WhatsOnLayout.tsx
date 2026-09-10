import { Helmet } from 'react-helmet-async'
import { Outlet } from 'react-router-dom'
import { AdminTabsBar } from '../../components/whats-on/AdminTabsBar'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'

function WhatsOnLayout() {
  const t = useFormatMessage()

  return (
    <>
      {/* The section has to title itself. The served <head> is written by the sites-deployer
          worker for whatever URL was requested, and the /whats-on → /events redirect happens
          client-side, so without this the tab keeps the old section's title. */}
      <Helmet>
        <title>{t('page.events.page_title')}</title>
      </Helmet>
      <AdminTabsBar />
      <Outlet />
    </>
  )
}

export { WhatsOnLayout }
