import { adminClient } from '../features/events/events.admin.client'
import { eventsClient } from '../features/events/events.client'
import { accountNotificationsClient } from '../services/accountNotificationsClient'
import { creditsClient } from '../services/creditsClient'
import { referralClient } from '../services/referralClient'
import { socialClient } from '../services/socialClient'
import { storageClient } from '../services/storageClient'
import type { AppDispatch } from './store'

// Mixed clients include role/permission-sensitive data. Resetting the whole client on account
// transitions trades a bounded refetch for removing private entries using only public RTK APIs.
// Cast/CMS/places remain intact: wallet changes must not terminate anonymous streaming sessions.
function clearPrivateCaches(dispatch: AppDispatch): void {
  for (const client of [
    accountNotificationsClient,
    referralClient,
    creditsClient,
    socialClient,
    eventsClient,
    adminClient,
    storageClient
  ]) {
    for (const request of dispatch(client.util.getRunningQueriesThunk())) request.abort()
    for (const request of dispatch(client.util.getRunningMutationsThunk())) request.abort()
    dispatch(client.util.resetApiState())
  }
}

export { clearPrivateCaches }
