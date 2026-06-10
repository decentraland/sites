import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
// eslint-disable-next-line @typescript-eslint/naming-convention
import FullscreenIcon from '@mui/icons-material/Fullscreen'
// eslint-disable-next-line @typescript-eslint/naming-convention
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import { useWorldContext } from '../../../components/creators/CreatorWorldLayout'
import { buildBevyHrefs } from '../../../features/creators'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { FullscreenButton, PlayCircle, Poster, PosterHint, PosterTitle, SceneIframe, VideoArea } from './PreviewPage.styled'
import { Helper, SectionCard, SectionHeaderRow, SectionTitle } from './world.styled'

// `<iframe credentialless>` opts the bevy frame into credentialless loading so
// it inherits the parent's COEP credentialless context and becomes
// cross-origin-isolated (bevy's SharedArrayBuffer worker errors otherwise).
// React strips the boolean attribute in some build paths, so set it via a ref.
function useCredentiallessIframeRef() {
  return useCallback((node: HTMLIFrameElement | null) => {
    if (node && !node.hasAttribute('credentialless')) node.setAttribute('credentialless', '')
  }, [])
}

function PreviewPage() {
  const t = useFormatMessage()
  const { worldName, latest, place } = useWorldContext()
  // The bevy iframe only mounts on click — entering this tab loads nothing.
  const [launched, setLaunched] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const videoRef = useRef<HTMLDivElement | null>(null)
  const iframeRef = useCredentiallessIframeRef()

  // Scene-viewer bevy URL (no launcher / portables) — the same target /discover
  // embeds. The single Launch click mounts it directly; bevy connects to the
  // world's comms itself, so the creator preview needs no LiveKit room.
  const streamingHref = useMemo(() => buildBevyHrefs(worldName).iframe, [worldName])
  const coverImage = (latest?.thumbnailUrl || place?.image) ?? undefined

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === videoRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = useCallback(() => {
    const el = videoRef.current
    if (!el) return
    if (document.fullscreenElement === el) {
      document.exitFullscreen().catch(() => undefined)
    } else {
      el.requestFullscreen().catch(() => undefined)
    }
  }, [])

  return (
    <SectionCard>
      <Helmet>
        <title>{`${t('page.creators.world.nav.preview')} · ${worldName}`}</title>
      </Helmet>
      <SectionHeaderRow>
        <SectionTitle>{t('page.creators.world.nav.preview')}</SectionTitle>
      </SectionHeaderRow>
      <Helper>{t('page.creators.world.preview_hint')}</Helper>
      {launched ? (
        <VideoArea ref={videoRef}>
          <SceneIframe
            ref={iframeRef}
            src={streamingHref}
            title={`${worldName} ${t('page.creators.world.nav.preview')}`}
            sandbox="allow-scripts allow-same-origin allow-popups allow-pointer-lock allow-forms allow-modals"
            allow="camera; microphone; clipboard-read; clipboard-write; fullscreen; xr-spatial-tracking; cross-origin-isolated"
          />
          <FullscreenButton type="button" onClick={toggleFullscreen}>
            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            {isFullscreen ? t('page.creators.world.preview_exit_fullscreen') : t('page.creators.world.preview_fullscreen')}
          </FullscreenButton>
        </VideoArea>
      ) : (
        <Poster $cover={coverImage} type="button" onClick={() => setLaunched(true)} aria-label={t('page.creators.world.preview_launch')}>
          <PlayCircle>
            <PlayArrowRoundedIcon />
          </PlayCircle>
          <PosterTitle>{t('page.creators.world.preview_launch')}</PosterTitle>
          <PosterHint>{t('page.creators.world.preview_launch_hint')}</PosterHint>
        </Poster>
      )}
    </SectionCard>
  )
}

export { PreviewPage }
