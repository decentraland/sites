import { getEnv } from '../../config/env'

// Lazy getters — throw only when a query/mutation actually runs, not at
// module import time (rule 16). A top-level throw would crash the entire
// DappsShell chunk even when no cast2 endpoint is invoked.
const getGatekeeperUrl = (): string => {
  const url = getEnv('GATEKEEPER_URL')
  if (!url) throw new Error('GATEKEEPER_URL environment variable is not set')
  return url
}

const getWorldsContentUrl = (): string => {
  const url = getEnv('WORLDS_CONTENT_URL')
  if (!url) throw new Error('WORLDS_CONTENT_URL environment variable is not set')
  return url
}

const getPresenterServerUrl = (): string => {
  const url = getEnv('PRESENTER_SERVER_URL')
  if (!url) throw new Error('PRESENTER_SERVER_URL environment variable is not set')
  return url
}

// Parses URL-encoded location strings into the shape gatekeeper expects.
// Cast watchers receive `:location` as either a parcel pair ("0,0") or a
// world name (`some.dcl.eth`); both formats are passed through verbatim.
const normalizeLocation = (raw: string): string => raw.trim()

export { getGatekeeperUrl, getPresenterServerUrl, getWorldsContentUrl, normalizeLocation }
