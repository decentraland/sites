import type { WalletTransaction } from '../../hooks/useWalletTransactions.types'
import {
  ERC20_PREDICATE,
  buildManaTransferFeed,
  classifyLeg,
  correlateFifo,
  decodeManaLog,
  mergeManaTransferFeeds,
  weiToMana
} from './account-wallet.helpers'
import type { DecodedManaLog, ManaSubgraphLog } from './account-wallet.types'

const USER = '0xd9b96b5dc720fc52bede1ec3b40a930e15f70ddd'
const OTHER = '0x9a6ebe7e2a7722f8200d0ffb63a1f6406a0d7dce'
const CONTRACT = '0x0ff58e235b154dd7785c4829d48948ce114248c4'
const ZERO = '0x0000000000000000000000000000000000000000'

// 1e18 as a BigInt literal — `10n ** 18n` is transpiled to Math.pow() by ts-jest, which rejects BigInt.
const WEI = 1000000000000000000n
const weiOf = (units: number): bigint => BigInt(units) * WEI
const manaWei = (units: number): string => weiOf(units).toString()

const subgraphLog = (overrides: Partial<ManaSubgraphLog> = {}): ManaSubgraphLog => ({
  txHash: '0xaaa',
  from: USER,
  to: OTHER,
  value: manaWei(100),
  time: '1000',
  ...overrides
})

const decoded = (overrides: Partial<DecodedManaLog> = {}): DecodedManaLog => ({
  network: 'ethereum',
  from: USER,
  to: OTHER,
  value: weiOf(100),
  hash: '0xaaa',
  timestamp: 1000,
  ...overrides
})

describe('weiToMana', () => {
  it('should convert wei to a MANA number', () => {
    expect(weiToMana(weiOf(306))).toBe(306)
    expect(weiToMana(9750000000000000000n)).toBe(9.75)
  })
})

describe('decodeManaLog', () => {
  it('should lowercase addresses/hash, parse value to bigint and time to ms', () => {
    const result = decodeManaLog(
      { txHash: '0xABC', from: OTHER.toUpperCase(), to: USER.toUpperCase(), value: manaWei(306), time: '1700000000' },
      'polygon'
    )
    expect(result).toEqual({
      network: 'polygon',
      from: OTHER,
      to: USER,
      value: weiOf(306),
      hash: '0xabc',
      timestamp: 1700000000000
    })
  })
})

describe('classifyLeg', () => {
  describe('on Ethereum (L1)', () => {
    it('should classify a transfer to the predicate as a deposit', () => {
      expect(classifyLeg(decoded({ from: USER, to: ERC20_PREDICATE }), USER)).toBe('deposit')
    })
    it('should classify a transfer from the predicate as an exit', () => {
      expect(classifyLeg(decoded({ from: ERC20_PREDICATE, to: USER }), USER)).toBe('exit')
    })
    it('should classify other outgoing as send and incoming as received', () => {
      expect(classifyLeg(decoded({ from: USER, to: OTHER }), USER)).toBe('send')
      expect(classifyLeg(decoded({ from: OTHER, to: USER }), USER)).toBe('received')
    })
  })

  describe('on Polygon (L2)', () => {
    it('should classify a mint from zero as a credit and a burn to zero as a burn', () => {
      expect(classifyLeg(decoded({ network: 'polygon', from: ZERO, to: USER }), USER)).toBe('credit')
      expect(classifyLeg(decoded({ network: 'polygon', from: USER, to: ZERO }), USER)).toBe('burn')
    })
    it('should classify a transfer from a contract as a received, not a credit', () => {
      expect(classifyLeg(decoded({ network: 'polygon', from: CONTRACT, to: USER }), USER)).toBe('received')
    })
    it('should classify an outgoing transfer as a send', () => {
      expect(classifyLeg(decoded({ network: 'polygon', from: USER, to: OTHER }), USER)).toBe('send')
    })
  })
})

describe('correlateFifo', () => {
  it('should match an origin with the earliest later closing of the same value', () => {
    const deposit = decoded({ value: weiOf(306), timestamp: 1000, hash: '0xdep' })
    const credit = decoded({ network: 'polygon', value: weiOf(306), timestamp: 2000, hash: '0xcre' })
    expect(correlateFifo([deposit], [credit]).size).toBe(1)
  })
  it('should not match a closing before the origin or of a different value', () => {
    const deposit = decoded({ value: weiOf(306), timestamp: 5000, hash: '0xdep' })
    expect(correlateFifo([deposit], [decoded({ network: 'polygon', value: weiOf(306), timestamp: 1000 })]).size).toBe(0)
    expect(correlateFifo([deposit], [decoded({ network: 'polygon', value: weiOf(200), timestamp: 9000 })]).size).toBe(0)
  })
  it('should pair repeated amounts FIFO and consume each closing once', () => {
    const d1 = decoded({ value: weiOf(100), timestamp: 1000, hash: '0xd1' })
    const d2 = decoded({ value: weiOf(100), timestamp: 1500, hash: '0xd2' })
    const c1 = decoded({ network: 'polygon', value: weiOf(100), timestamp: 2000, hash: '0xc1' })
    const c2 = decoded({ network: 'polygon', value: weiOf(100), timestamp: 2500, hash: '0xc2' })
    const matches = correlateFifo([d2, d1], [c2, c1])
    expect(matches.size).toBe(2)
  })
})

describe('buildManaTransferFeed', () => {
  it('should anchor a swap on the L1 deposit (confirmed) and suppress the correlated L2 mint', () => {
    const feed = buildManaTransferFeed({
      ethereumLogs: [subgraphLog({ from: USER, to: ERC20_PREDICATE, value: manaWei(306), time: '1000', txHash: '0xdep' })],
      polygonLogs: [subgraphLog({ from: ZERO, to: USER, value: manaWei(306), time: '3000', txHash: '0xcre' })],
      address: USER
    })
    expect(feed).toHaveLength(1)
    expect(feed[0]).toEqual({ hash: '0xdep', type: 'swap', network: 'ethereum', amount: 306, timestamp: 1000000, status: 'confirmed' })
    expect(feed.some(t => t.type === 'received')).toBe(false)
  })

  it('should mark a deposit without a credit as bridging', () => {
    const feed = buildManaTransferFeed({
      ethereumLogs: [subgraphLog({ from: USER, to: ERC20_PREDICATE, value: manaWei(500), txHash: '0xdep' })],
      polygonLogs: [],
      address: USER
    })
    expect(feed[0]).toMatchObject({ type: 'swap', status: 'bridging' })
  })

  it('should promote an orphan L2 mint to its own swap row', () => {
    const feed = buildManaTransferFeed({
      ethereumLogs: [],
      polygonLogs: [subgraphLog({ from: ZERO, to: USER, value: manaWei(200), txHash: '0xcre' })],
      address: USER
    })
    expect(feed).toEqual([{ hash: '0xcre', type: 'swap', network: 'polygon', amount: 200, timestamp: 1000000, status: 'confirmed' }])
  })

  it('should anchor a withdraw on the L2 burn and correlate the L1 exit', () => {
    const feed = buildManaTransferFeed({
      ethereumLogs: [subgraphLog({ from: ERC20_PREDICATE, to: USER, value: manaWei(50), time: '4000', txHash: '0xexit' })],
      polygonLogs: [subgraphLog({ from: USER, to: ZERO, value: manaWei(50), time: '1000', txHash: '0xburn' })],
      address: USER
    })
    expect(feed).toHaveLength(1)
    expect(feed[0]).toMatchObject({ hash: '0xburn', type: 'withdraw', network: 'polygon', status: 'confirmed' })
  })

  it('should pass plain sends and receiveds through, newest first', () => {
    const feed = buildManaTransferFeed({
      ethereumLogs: [subgraphLog({ from: USER, to: OTHER, value: manaWei(100), time: '2000', txHash: '0xsend' })],
      polygonLogs: [subgraphLog({ from: CONTRACT, to: USER, value: manaWei(10), time: '1000', txHash: '0xrec' })],
      address: USER
    })
    expect(feed.map(t => ({ hash: t.hash, type: t.type }))).toEqual([
      { hash: '0xsend', type: 'send' },
      { hash: '0xrec', type: 'received' }
    ])
  })

  it('should dedupe identical logs', () => {
    const log = subgraphLog({ from: USER, to: OTHER, value: manaWei(100), txHash: '0xdup' })
    const feed = buildManaTransferFeed({ ethereumLogs: [log, { ...log }], polygonLogs: [], address: USER })
    expect(feed).toHaveLength(1)
  })
})

describe('mergeManaTransferFeeds', () => {
  const tx = (hash: string, timestamp: number, status: WalletTransaction['status'] = 'confirmed'): WalletTransaction => ({
    hash,
    type: 'send',
    network: 'ethereum',
    amount: 1,
    timestamp,
    status
  })

  it('should keep local txs not yet in the history and drop the indexed ones, newest first', () => {
    const history = [tx('0xindexed', 5000), tx('0xold', 1000)]
    const local = [tx('0xindexed', 5000, 'pending'), tx('0xfresh', 9000, 'pending')]
    const merged = mergeManaTransferFeeds(history, local)
    expect(merged.map(t => t.hash)).toEqual(['0xfresh', '0xindexed', '0xold'])
    // the indexed one comes from history (confirmed), not the local pending copy
    expect(merged.find(t => t.hash === '0xindexed')?.status).toBe('confirmed')
  })

  it('should let a local in-progress withdrawal override the subgraph row while both are in flight', () => {
    // The subgraph indexes the L2 burn as 'bridging' but never learns about the checkpoint; the local
    // row carries the richer 'checkpoint' state and must win until the exit settles.
    const history = [tx('0xburn', 5000, 'bridging')]
    const local = [tx('0xburn', 5000, 'checkpoint')]
    const merged = mergeManaTransferFeeds(history, local)
    expect(merged).toHaveLength(1)
    expect(merged[0].status).toBe('checkpoint')
  })
})
