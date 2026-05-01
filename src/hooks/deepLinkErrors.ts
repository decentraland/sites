function isClientError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const status = (error as { status?: unknown }).status
  return typeof status === 'number' && status >= 400 && status < 500
}

export { isClientError }
