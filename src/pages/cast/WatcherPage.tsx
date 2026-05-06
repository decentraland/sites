import { useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { WatcherView } from '../../components/cast/WatcherView/WatcherView'
import { useLiveKitCredentials } from '../../features/cast2/contexts/LiveKitContext'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useBlogPageTracking } from '../../hooks/useBlogPageTracking'
import { WatcherPageRoot } from './WatcherPage.styled'

const WatcherPage = () => {
  const t = useFormatMessage()
  const { streamMetadata } = useLiveKitCredentials()
  const placeName = streamMetadata?.placeName

  const baseTitle = t('page.cast.watcher.page_title')
  const title = placeName ? `${placeName} — ${baseTitle}` : baseTitle

  const trackingProperties = useMemo(
    () =>
      streamMetadata
        ? { placeName: streamMetadata.placeName, location: streamMetadata.location, isWorld: streamMetadata.isWorld }
        : undefined,
    [streamMetadata]
  )

  useBlogPageTracking({ name: title, properties: trackingProperties })

  return (
    <WatcherPageRoot>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <WatcherView />
    </WatcherPageRoot>
  )
}

export { WatcherPage }
