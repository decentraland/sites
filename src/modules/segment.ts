import { DownloadPlace } from './segment.types'

const KNOWN_DOWNLOAD_PLACES = new Set<string>(Object.values(DownloadPlace))

const resolveDownloadPlace = (value: string | null | undefined): DownloadPlace =>
  value && KNOWN_DOWNLOAD_PLACES.has(value) ? (value as DownloadPlace) : DownloadPlace.UNKNOWN

export * from './segment.types'
export { resolveDownloadPlace }
