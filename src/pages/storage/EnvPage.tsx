import { Helmet } from 'react-helmet-async'
import { EnvManager } from '../../components/storage/managers'
import { StorageLayout } from '../../components/storage/StorageLayout'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { useBlogPageTracking } from '../../hooks/useBlogPageTracking'
import { useStorageRedirect } from '../../hooks/useStorageRedirect'
import { useStorageScope } from '../../hooks/useStorageScope'

function EnvPage() {
  useStorageRedirect()
  const t = useFormatMessage()
  const { identity } = useAuthIdentity()
  const { realm, position } = useStorageScope()

  useBlogPageTracking({
    name: t('page.storage.env.title'),
    properties: { section: 'storage_env', realm: realm ?? undefined, position: position ?? undefined }
  })

  return (
    <StorageLayout>
      <Helmet>
        <title>{t('page.storage.env.title')}</title>
      </Helmet>
      <EnvManager identity={identity} realm={realm} position={position} />
    </StorageLayout>
  )
}

export { EnvPage }
