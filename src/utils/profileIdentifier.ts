function isProfileAddress(value: unknown): value is `0x${string}` {
  return typeof value === 'string' && /^0x[0-9a-fA-F]{40}$/.test(value)
}

function getProfileName(value: string | undefined): string | undefined {
  return /^([a-z0-9]+)(?:\.dcl\.eth)?$/i.exec(value ?? '')?.[1].toLowerCase()
}

export { getProfileName, isProfileAddress }
