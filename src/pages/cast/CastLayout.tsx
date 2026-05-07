import { Outlet } from 'react-router-dom'
import { NotificationStack } from '../../components/cast/NotificationStack/NotificationStack'
import { LiveKitProvider } from '../../features/media/cast/contexts/LiveKitContext'
import { NotificationProvider } from '../../features/media/cast/contexts/NotificationContext'

const CastLayout = () => (
  <NotificationProvider>
    <LiveKitProvider>
      <Outlet />
      <NotificationStack />
    </LiveKitProvider>
  </NotificationProvider>
)

export { CastLayout }
