import type { WalletTransaction, WalletTransactionStatus, WalletTransactionType } from '../../hooks/useWalletTransactions.types'
import type { DecodedManaLog, ManaSubgraphLog } from './account-wallet.types'

// Polygon PoS bridge markers on mainnet (the mana-graph subgraphs are mainnet-only). Lowercased.
// L1 deposits (swaps) transfer MANA to the ERC20 predicate; L2 credits/burns use the zero address.
const ERC20_PREDICATE = '0x40ec5b33f54e0e8a33a975908c5ba1c14e5bbbdf'
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const WEI_PER_MANA = 1e18

// wei → MANA for display. formatMana rounds to 2 decimals and MANA amounts stay well within
// Number's safe range, so the lossy BigInt→Number is fine for rendering (never for on-chain math).
function weiToMana(value: bigint): number {
  return Number(value) / WEI_PER_MANA
}

function decodeManaLog(log: ManaSubgraphLog, network: WalletTransaction['network']): DecodedManaLog {
  return {
    network,
    from: log.from.toLowerCase(),
    to: log.to.toLowerCase(),
    value: BigInt(log.value),
    hash: log.txHash.toLowerCase(),
    timestamp: Number(log.time) * 1000
  }
}

type Leg = 'deposit' | 'credit' | 'burn' | 'exit' | 'send' | 'received' | 'other'

/**
 * Classifies a decoded log relative to `user`. Bridge legs:
 * - L1 `deposit` (swap origin): from === user, to === predicate.
 * - L1 `exit` (withdraw close): from === predicate, to === user.
 * - L2 `credit` (swap credit / mint): from === 0x0, to === user.
 * - L2 `burn` (withdraw origin): from === user, to === 0x0.
 */
function classifyLeg(log: DecodedManaLog, user: string): Leg {
  const normalizedUser = user.toLowerCase()
  const isFromUser = log.from === normalizedUser
  const isToUser = log.to === normalizedUser

  if (log.network === 'ethereum') {
    if (isFromUser && log.to === ERC20_PREDICATE) return 'deposit'
    if (isToUser && log.from === ERC20_PREDICATE) return 'exit'
    if (isFromUser) return 'send'
    if (isToUser) return 'received'
    return 'other'
  }

  if (log.from === ZERO_ADDRESS && isToUser) return 'credit'
  if (isFromUser && log.to === ZERO_ADDRESS) return 'burn'
  if (isFromUser) return 'send'
  if (isToUser) return 'received'
  return 'other'
}

function legKey(log: DecodedManaLog): string {
  return `${log.network}-${log.hash}-${log.from}-${log.to}-${log.value}`
}

function byChronology(a: DecodedManaLog, b: DecodedManaLog): number {
  return a.timestamp - b.timestamp
}

/**
 * Greedy FIFO correlation of bridge origin legs (deposits/burns) with their closing legs
 * (credits/exits). No common id exists between the chains, so origins match the earliest unused
 * closing of the exact same wei value at/after the origin. Per-value queues keep it near-linear.
 */
function correlateFifo(origins: DecodedManaLog[], closings: DecodedManaLog[]): Map<string, DecodedManaLog> {
  const sortedOrigins = [...origins].sort(byChronology)
  const queuesByValue = new Map<string, DecodedManaLog[]>()
  for (const closing of [...closings].sort(byChronology)) {
    const key = closing.value.toString()
    const queue = queuesByValue.get(key)
    if (queue) {
      queue.push(closing)
    } else {
      queuesByValue.set(key, [closing])
    }
  }

  const matches = new Map<string, DecodedManaLog>()
  for (const origin of sortedOrigins) {
    const queue = queuesByValue.get(origin.value.toString())
    if (!queue) {
      continue
    }
    const index = queue.findIndex(closing => closing.timestamp >= origin.timestamp)
    if (index !== -1) {
      matches.set(legKey(origin), queue.splice(index, 1)[0])
    }
  }
  return matches
}

function toTransfer(log: DecodedManaLog, type: WalletTransactionType, status: WalletTransactionStatus): WalletTransaction {
  return { hash: log.hash, type, network: log.network, amount: weiToMana(log.value), timestamp: log.timestamp, status }
}

/**
 * Builds the wallet's confirmed MANA transfer feed from the mana-graph `Log`s of both chains.
 *
 * One row per swap (anchored on the L1 deposit; the correlated L2 mint is suppressed — never shown
 * as a `received`). A deposit without a matched credit is `bridging`. Symmetrically for withdraws
 * (anchored on the L2 burn). Orphan credits/exits (third-party deposit, external swap) become their
 * own swap/withdraw row so bridged MANA is never lost. Plain sends/receiveds pass through.
 */
function buildManaTransferFeed(params: {
  ethereumLogs: ManaSubgraphLog[]
  polygonLogs: ManaSubgraphLog[]
  address: string
}): WalletTransaction[] {
  const user = params.address.toLowerCase()
  const decoded = [
    ...params.ethereumLogs.map(log => decodeManaLog(log, 'ethereum')),
    ...params.polygonLogs.map(log => decodeManaLog(log, 'polygon'))
  ]

  const seen = new Set<string>()
  const logs = decoded.filter(log => {
    const key = legKey(log)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const pick = (leg: Leg) => logs.filter(log => classifyLeg(log, user) === leg)
  const deposits = pick('deposit')
  const credits = pick('credit')
  const burns = pick('burn')
  const exits = pick('exit')

  const swapMatches = correlateFifo(deposits, credits)
  const withdrawMatches = correlateFifo(burns, exits)
  const consumedCredits = new Set([...swapMatches.values()].map(legKey))
  const consumedExits = new Set([...withdrawMatches.values()].map(legKey))

  const rows: WalletTransaction[] = []
  for (const deposit of deposits) {
    rows.push(toTransfer(deposit, 'swap', swapMatches.has(legKey(deposit)) ? 'confirmed' : 'bridging'))
  }
  for (const credit of credits) {
    if (!consumedCredits.has(legKey(credit))) rows.push(toTransfer(credit, 'swap', 'confirmed'))
  }
  for (const burn of burns) {
    rows.push(toTransfer(burn, 'withdraw', withdrawMatches.has(legKey(burn)) ? 'confirmed' : 'bridging'))
  }
  for (const exit of exits) {
    if (!consumedExits.has(legKey(exit))) rows.push(toTransfer(exit, 'withdraw', 'confirmed'))
  }
  for (const send of pick('send')) {
    rows.push(toTransfer(send, 'send', 'confirmed'))
  }
  for (const received of pick('received')) {
    rows.push(toTransfer(received, 'received', 'confirmed'))
  }

  return rows.sort((a, b) => b.timestamp - a.timestamp)
}

// In-flight bridge states: a local row in one of these carries state the subgraph doesn't have yet.
const IN_PROGRESS_STATUSES: ReadonlySet<WalletTransactionStatus> = new Set(['pending', 'bridging', 'checkpoint'])

/**
 * Merges the subgraph history (confirmed) with the in-page local optimistic feed (pending/bridging/
 * checkpoint of just-signed txs). The subgraph is authoritative once it settles a tx, BUT a local
 * in-progress row overrides the indexed one while the subgraph also still considers it in-flight: a
 * withdrawal is indexed as `bridging` (the L2 burn) and the subgraph never learns about the checkpoint,
 * so the local row keeps the richer checkpoint/claim state until the exit settles. Once history marks a
 * tx terminal (confirmed/failed), history wins — the optimistic local copy is stale. Newest first.
 */
function mergeManaTransferFeeds(history: WalletTransaction[], local: WalletTransaction[]): WalletTransaction[] {
  const historyByHash = new Map(history.map(transaction => [transaction.hash.toLowerCase(), transaction]))
  const merged: WalletTransaction[] = []
  const overriddenHashes = new Set<string>()

  for (const transaction of local) {
    const key = transaction.hash.toLowerCase()
    const indexed = historyByHash.get(key)
    if (!indexed) {
      merged.push(transaction)
    } else if (IN_PROGRESS_STATUSES.has(transaction.status) && IN_PROGRESS_STATUSES.has(indexed.status)) {
      merged.push(transaction)
      overriddenHashes.add(key)
    }
  }
  for (const transaction of history) {
    if (!overriddenHashes.has(transaction.hash.toLowerCase())) merged.push(transaction)
  }
  return merged.sort((a, b) => b.timestamp - a.timestamp)
}

export {
  ERC20_PREDICATE,
  ZERO_ADDRESS,
  buildManaTransferFeed,
  classifyLeg,
  correlateFifo,
  decodeManaLog,
  mergeManaTransferFeeds,
  weiToMana
}
