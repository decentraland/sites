/**
 * Canonical short form for Ethereum addresses across profile surfaces: first 6
 * characters (keeps the `0x` prefix readable), ellipsis, last 4.
 */
function truncateAddress(value: string): string {
  if (value.length < 12) return value
  return `${value.slice(0, 6)}…${value.slice(-4)}`
}

export { truncateAddress }
