type DownloadProgress = { loaded: number; total: number }
type DownloadProgressCallback = (progress: DownloadProgress) => void

export type { DownloadProgress, DownloadProgressCallback }
