import { getWalletAddress, subscribeWalletAddress } from '../hooks/useWalletAddress'
import { advanceAuthSession } from '../utils/authSession'

/** Subscribe for the lifetime of the store, including navigation outside DappsShell. */
function watchAuthCache(clear: () => void): () => void {
  let account = getWalletAddress()?.toLowerCase() ?? null
  return subscribeWalletAddress(() => {
    const next = getWalletAddress()?.toLowerCase() ?? null
    if (next === account) return
    account = next
    advanceAuthSession()
    clear()
  })
}

export { watchAuthCache }
