import { useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { StreamerView } from '../../components/cast/StreamerView/StreamerView'
import { useLiveKitCredentials } from '../../features/cast2/contexts/LiveKitContext'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useBlogPageTracking } from '../../hooks/useBlogPageTracking'
import { StreamerPageRoot } from './StreamerPage.styled'

const StreamerPage = () => {
  const t = useFormatMessage()
  const { streamMetadata } = useLiveKitCredentials()
  const placeName = streamMetadata?.placeName

  const baseTitle = t('page.cast.streamer.page_title')
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
    <StreamerPageRoot>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <StreamerView />
    </StreamerPageRoot>
  )
}

export { StreamerPage }
