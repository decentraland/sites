import { Navigate, useSearchParams } from 'react-router-dom'

function StorageRedirectPage() {
  const [searchParams] = useSearchParams()
  const realm = searchParams.get('realm')
  const position = searchParams.get('position')

  if (!realm && !position) {
    return <Navigate to="/storage/select" replace />
  }

  return <Navigate to={`/storage/env${window.location.search}`} replace />
}

export { StorageRedirectPage }
