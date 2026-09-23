import { useMemo } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import { mergeManaTransferFeeds, useGetManaTransfersQuery } from '../features/account-wallet'
import { useWalletTransactions } from './useWalletTransactions'
import type { WalletTransaction } from './useWalletTransactions.types'

type UseWalletHistoryResult = {
  transactions: WalletTransaction[]
  isLoading: boolean
  isError: boolean
}

/**
 * The wallet's full MANA transfer feed: confirmed history from the `mana-graph` subgraph merged with
 * the in-page optimistic tracking (pending/bridging of just-signed Send/Swap txs). The subgraph is
 * authoritative — a local tx drops out once it is indexed (merge by hash).
 */
function useWalletHistory(address: string | undefined): UseWalletHistoryResult {
  const { data: history, isLoading, isError } = useGetManaTransfersQuery(address ? { address } : skipToken)
  const { transactions: local } = useWalletTransactions(address)
  const transactions = useMemo(() => mergeManaTransferFeeds(history ?? [], local), [history, local])
  return { transactions, isLoading, isError }
}

export { useWalletHistory }
export type { UseWalletHistoryResult }
