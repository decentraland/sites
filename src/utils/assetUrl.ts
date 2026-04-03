const baseUrl = (import.meta.env.VITE_BASE_URL ?? '').replace(/\/$/, '')

function assetUrl(path: string): string {
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

export { assetUrl }
