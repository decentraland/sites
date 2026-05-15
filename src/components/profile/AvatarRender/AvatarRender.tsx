import { useCallback, useState } from 'react'
import { CircularProgress, WearablePreview } from 'decentraland-ui2'
import { getEnv } from '../../../config/env'
import { useProfileAvatar } from '../../../hooks/useProfileAvatar'
import { FallbackImg, FallbackLayer, RenderRoot } from './AvatarRender.styled'

interface AvatarRenderProps {
  address: string
}

function AvatarRender({ address }: AvatarRenderProps) {
  const { avatar, backgroundColor } = useProfileAvatar(address)
  const bodySnapshot = avatar?.avatar?.snapshots?.body
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = useCallback(() => {
    setIsLoading(false)
  }, [])

  const handleError = useCallback(() => {
    setHasError(true)
    setIsLoading(false)
  }, [])

  // WearablePreview compares `event.origin === baseUrl` to filter postMessage
  // traffic; iframe origins never carry a trailing slash, so leaving one here
  // silently drops the LOAD/ERROR events and the spinner never clears.
  const baseUrl = getEnv('WEARABLE_PREVIEW_URL')?.replace(/\/+$/, '')

  if (hasError) {
    return (
      <RenderRoot>
        {bodySnapshot ? (
          <FallbackLayer>
            <FallbackImg src={bodySnapshot} alt="Avatar" loading="lazy" />
          </FallbackLayer>
        ) : null}
      </RenderRoot>
    )
  }

  return (
    <RenderRoot>
      <WearablePreview
        baseUrl={baseUrl}
        profile={address.toLowerCase()}
        disableBackground
        disableDefaultWearables
        lockBeta
        panning={false}
        onLoad={handleLoad}
        onError={handleError}
      />
      {isLoading ? (
        <FallbackLayer>
          <CircularProgress size={28} sx={{ color: backgroundColor }} />
        </FallbackLayer>
      ) : null}
    </RenderRoot>
  )
}

export { AvatarRender }
export type { AvatarRenderProps }
