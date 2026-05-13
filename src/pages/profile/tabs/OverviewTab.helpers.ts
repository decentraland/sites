import { Network, Rarity } from '@dcl/schemas'
import type { CollectibleDetail } from '../../../features/profile/profile.wearables.client'
import type { AvatarSnapshot } from './OverviewTab.types'

const MAX_BADGES = 5

const RARITY_SET = new Set<string>([
  Rarity.UNIQUE,
  Rarity.MYTHIC,
  Rarity.EXOTIC,
  Rarity.LEGENDARY,
  Rarity.EPIC,
  Rarity.RARE,
  Rarity.UNCOMMON,
  Rarity.COMMON
])

function toRarity(value: string | undefined): Rarity {
  return value && RARITY_SET.has(value) ? (value as Rarity) : Rarity.COMMON
}

function toItemNetwork(value: string | undefined): Network.ETHEREUM | Network.MATIC {
  return value === Network.ETHEREUM ? Network.ETHEREUM : Network.MATIC
}

function toCatalogAsset(item: CollectibleDetail) {
  return {
    id: item.urn,
    url: item.marketplaceUrl,
    name: item.name,
    rarity: toRarity(item.rarity),
    network: toItemNetwork(item.network),
    creator: item.creator
  }
}

function getEquippedWearables(avatar: AvatarSnapshot | undefined): string[] {
  return avatar?.avatar?.wearables ?? []
}

function readField(avatar: AvatarSnapshot | undefined, key: string): string | undefined {
  if (!avatar) return undefined
  const record = avatar as unknown as Record<string, unknown>
  const raw = record[key]
  return typeof raw === 'string' && raw.length > 0 ? raw : undefined
}

function formatBadgeDate(timestamp: number | undefined): string | undefined {
  if (!timestamp) return undefined
  try {
    return new Date(timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return undefined
  }
}

function detectLinkProvider(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    const first = host.split('.')[0]
    return first.charAt(0).toUpperCase() + first.slice(1)
  } catch {
    return url
  }
}

const MANA_DECIMALS = 18n

// El marketplace API devuelve `price` en wei (string entero, p.ej. "5000000000000000000").
// 0 wei = item sin listings, lo tratamos como "sin precio" (no mostramos Mana ni BUY).
function formatPriceMana(wei: string | undefined): string | undefined {
  if (!wei) return undefined
  try {
    const value = BigInt(wei)
    if (value === 0n) return undefined
    const base = 10n ** MANA_DECIMALS
    const whole = value / base
    const remainder = value % base
    if (remainder === 0n) return whole.toLocaleString('en-US')
    const fractional = remainder.toString().padStart(Number(MANA_DECIMALS), '0').slice(0, 2).replace(/0+$/, '')
    const wholePart = whole.toLocaleString('en-US')
    return fractional.length > 0 ? `${wholePart}.${fractional}` : wholePart
  } catch {
    return undefined
  }
}

export {
  MAX_BADGES,
  detectLinkProvider,
  formatBadgeDate,
  formatPriceMana,
  getEquippedWearables,
  readField,
  toCatalogAsset,
  toItemNetwork,
  toRarity
}
