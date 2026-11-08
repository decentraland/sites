import { Provider } from 'react-redux'
import { HomeDetailModal } from './HomeDetailModal'
import type { HomeDetailModalProps } from './HomeDetailModal'
import { store } from './store'

// The homepage has no Redux store; EventDetailModal needs one at runtime (remind me, edit permission,
// profile surfaces). Same singleton as DappsShell, mounted only after a homepage card is clicked.
function HomeDetailModalShell(props: HomeDetailModalProps) {
  return (
    <Provider store={store}>
      <HomeDetailModal {...props} />
    </Provider>
  )
}

export { HomeDetailModalShell }
