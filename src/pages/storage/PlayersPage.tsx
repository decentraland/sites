import { useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { PlayersManager } from '../../components/storage/managers'
import { StorageLayout } from '../../components/storage/StorageLayout'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { useBlogPageTracking } from '../../hooks/useBlogPageTracking'
import { useStorageRedirect } from '../../hooks/useStorageRedirect'
import { useStorageScope } from '../../hooks/useStorageScope'

function PlayersPage() {
  useStorageRedirect()
  const t = useFormatMessage()
  const navigate = useNavigate()
  const { identity } = useAuthIdentity()
  const { realm, position } = useStorageScope()

  const handleSelectPlayer = useCallback(
    (address: string) => {
      navigate({ pathname: `/storage/players/${address}`, search: window.location.search })
    },
    [navigate]
  )

  useBlogPageTracking({
    name: t('page.storage.players.title'),
    properties: { section: 'storage_players', realm: realm ?? undefined, position: position ?? undefined }
  })

  return (
    <StorageLayout>
      <Helmet>
        <title>{t('page.storage.players.title')}</title>
      </Helmet>
      <PlayersManager identity={identity} realm={realm} position={position} onSelectPlayer={handleSelectPlayer} />
    </StorageLayout>
  )
}

export { PlayersPage }
