import { Outlet } from 'react-router-dom'
import { AdminTabsBar } from '../../components/whats-on/AdminTabsBar'

function WhatsOnLayout() {
  return (
    <>
      <AdminTabsBar />
      <Outlet />
    </>
  )
}

export { WhatsOnLayout }
