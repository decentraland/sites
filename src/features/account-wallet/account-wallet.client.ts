import type { WalletTransaction } from '../../hooks/useWalletTransactions.types'
import { getManaEthereumSubgraph, getManaMaticSubgraph, subgraphClient } from '../../services/subgraphClient'
import { buildManaTransferFeed } from './account-wallet.helpers'
import type { GetManaTransfersArgs, ManaSubgraphLog } from './account-wallet.types'

// NOTE: the mana-graph subgraphs are MAINNET-ONLY (no sepolia/amoy deployment exists), so all three
// envs point `MANA_*_SUBGRAPH` at mainnet. This is an intentional, prod-first decision: on dev/stg
// the MANA *history* shown here reflects mainnet, while balances/burns and the proof API run on the
// testnets (sepolia/amoy). The two won't reconcile on testnet — a withdrawal burned on amoy never
// appears in this feed; it's tracked only via the in-page optimistic feed (useWalletTransactions)
// until claimed. The real history is validated on production.
//
// `involved` is "<from>-<to>" in the mana-graph Log entity, so `involved_contains: <addr>` matches
// both sent and received in a single query. 1000 is The Graph's per-query cap (see caveat in the
// analysis doc — wallets with >1000 transfers on one chain would need pagination).
const MANA_LOGS_QUERY = `query ManaLogs($involved: String!) {
  logs(first: 1000, where: { involved_contains: $involved }, orderBy: time, orderDirection: desc) {
    txHash
    from
    to
    value
    time
  }
}`

type ManaLogsResponse = { data?: { logs: ManaSubgraphLog[] }; errors?: unknown }

async function fetchManaLogs(url: string, involved: string): Promise<ManaSubgraphLog[]> {
  const response = await fetch(url, {
    method: 'POST',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: MANA_LOGS_QUERY, variables: { involved } })
  })
  if (!response.ok) {
    throw new Error(`mana subgraph responded with ${response.status}`)
  }
  const json = (await response.json()) as ManaLogsResponse
  if (json.errors || !json.data) {
    throw new Error('mana subgraph query failed')
  }
  return json.data.logs
}

const accountWalletApi = subgraphClient.injectEndpoints({
  endpoints: build => ({
    getManaTransfers: build.query<WalletTransaction[], GetManaTransfersArgs>({
      queryFn: async ({ address }) => {
        const involved = address.toLowerCase()
        try {
          const [ethereumLogs, polygonLogs] = await Promise.all([
            fetchManaLogs(getManaEthereumSubgraph(), involved),
            fetchManaLogs(getManaMaticSubgraph(), involved)
          ])
          return { data: buildManaTransferFeed({ ethereumLogs, polygonLogs, address }) }
        } catch (error) {
          return {
            error: { status: 'CUSTOM_ERROR' as const, error: error instanceof Error ? error.message : String(error) }
          }
        }
      },
      providesTags: (_result, _error, { address }) => [{ type: 'ManaTransfers' as const, id: address.toLowerCase() }]
    })
  })
})

const { useGetManaTransfersQuery } = accountWalletApi

export { accountWalletApi, useGetManaTransfersQuery }
