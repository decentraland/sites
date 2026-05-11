import { Outlet } from 'react-router-dom'
import { NotificationStack } from '../../components/cast/NotificationStack/NotificationStack'
import { LiveKitProvider } from '../../features/cast2/contexts/LiveKitContext'
import { NotificationProvider } from '../../features/cast2/contexts/NotificationContext'

const CastLayout = () => (
  <NotificationProvider>
    <LiveKitProvider>
      <Outlet />
      <NotificationStack />
    </LiveKitProvider>
  </NotificationProvider>
)

export { CastLayout }
