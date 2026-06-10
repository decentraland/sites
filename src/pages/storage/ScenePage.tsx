import { Helmet } from 'react-helmet-async'
import { SceneManager } from '../../components/storage/managers'
import { StorageLayout } from '../../components/storage/StorageLayout'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { useBlogPageTracking } from '../../hooks/useBlogPageTracking'
import { useStorageRedirect } from '../../hooks/useStorageRedirect'
import { useStorageScope } from '../../hooks/useStorageScope'

function ScenePage() {
  useStorageRedirect()
  const t = useFormatMessage()
  const { identity } = useAuthIdentity()
  const { realm, position } = useStorageScope()

  useBlogPageTracking({
    name: t('page.storage.scene.title'),
    properties: { section: 'storage_scene', realm: realm ?? undefined, position: position ?? undefined }
  })

  return (
    <StorageLayout>
      <Helmet>
        <title>{t('page.storage.scene.title')}</title>
      </Helmet>
      <SceneManager identity={identity} realm={realm} position={position} />
    </StorageLayout>
  )
}

export { ScenePage }
