import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { LiveBadge, UserCountBadge, dclColors } from 'decentraland-ui2'
import { buildDetailPath, placeCoordsLabel, placeCoverImage } from '../../../features/discover'
import type { DiscoverPlace } from '../../../features/discover'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { usePlaceCreator } from '../../../hooks/usePlaceCreator'
import { CloseGlyph, CopyGlyph, JumpInGlyph, PinGlyph } from '../_shared/CardIcons'
import { useDiscoverJumpIn } from '../DiscoverJumpInProvider'
import {
  About,
  AboutLabel,
  AboutText,
  Avatar,
  Backdrop,
  ByText,
  CloseCta,
  CopiedBubble,
  CopyCta,
  CreatorName,
  CreatorRow,
  CtaRow,
  Hero,
  HeroBadges,
  HeroFade,
  HeroText,
  HeroWrap,
  JumpInCta,
  LocationTag,
  MetaRow,
  Modal,
  Title
} from './SceneJumpInModal.styled'

interface SceneJumpInModalProps {
  place: DiscoverPlace
  onClose: () => void
  // Live viewer count. When > 0 the hero shows the LIVE + presence badges (the
  // mobile JUMP IN modal shown in place of the bevy watcher). Defaults to 0 —
  // the desktop empty-scene modal renders without badges.
  liveCount?: number
}

// JUMP IN modal — pitches the place (cover, creator, description) with a JUMP
// IN CTA and a copy-link shortcut, shown in place of the bevy watcher in two
// cases: (1) desktop, when the scene has nobody in it (the watcher would render
// an empty world); (2) mobile, for ANY scene, since bevy-web can't run on touch
// devices. `liveCount > 0` adds the LIVE + presence badges (the mobile case).
function SceneJumpInModalComponent({ place, onClose, liveCount = 0 }: SceneJumpInModalProps) {
  const t = useFormatMessage()

  const coords = placeCoordsLabel(place)

  const { creatorName, creatorAvatar, avatarBg } = usePlaceCreator(place)

  const { jumpIn } = useDiscoverJumpIn()

  const handleJumpIn = useCallback(() => {
    jumpIn(place, 'jump-in-modal')
  }, [jumpIn, place])

  // Copy the canonical detail URL — when the modal opens in place over the
  // grid the address bar still reads /discover, so window.location.href
  // would share a link with no place context. A transient "Copied!" bubble
  // confirms success; failures (insecure context, permission denial) leave
  // the bubble unshown so the user isn't told a lie about their clipboard.
  const [copied, setCopied] = useState(false)
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current)
    },
    []
  )
  const handleCopyLink = useCallback(() => {
    const path = buildDetailPath(place)
    const url = path ? `${window.location.origin}${path}` : window.location.href
    navigator.clipboard
      ?.writeText(url)
      .then(() => {
        setCopied(true)
        if (copiedTimer.current) clearTimeout(copiedTimer.current)
        copiedTimer.current = setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => undefined)
  }, [place])

  // Backdrop click closes; clicks inside the modal don't bubble out.
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose()
    },
    [onClose]
  )

  // Escape closes, matching the backdrop / X affordances.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <Backdrop onClick={handleBackdropClick}>
      <Modal role="dialog" aria-modal="true" aria-label={place.title}>
        <CloseCta type="button" aria-label={t('discover.scene.close')} onClick={onClose}>
          <CloseGlyph size="clamp(32px, 2.083vw, 40px)" />
        </CloseCta>
        <HeroWrap>
          <Hero $image={placeCoverImage(place)}>
            <HeroFade />
            {liveCount > 0 && (
              <HeroBadges>
                <LiveBadge />
                <UserCountBadge count={liveCount} />
              </HeroBadges>
            )}
          </Hero>
          <HeroText>
            <Title>{place.title}</Title>
            <MetaRow>
              {creatorName && (
                <CreatorRow>
                  {creatorAvatar && <Avatar src={creatorAvatar} alt="" loading="lazy" $bg={avatarBg} />}
                  <ByText>
                    {t('discover.card.by')} <CreatorName>{creatorName}</CreatorName>
                  </ByText>
                </CreatorRow>
              )}
              {coords && (
                <LocationTag>
                  <PinGlyph size="clamp(13px, 0.833vw, 16px)" color={dclColors.neutral.softWhite} />
                  {coords}
                </LocationTag>
              )}
            </MetaRow>
            <CtaRow>
              <JumpInCta type="button" onClick={handleJumpIn}>
                {t('discover.card.jump_in')}
                <JumpInGlyph size="clamp(19px, 1.25vw, 24px)" />
              </JumpInCta>
              <CopyCta type="button" aria-label={t('discover.scene.copy_link')} onClick={handleCopyLink}>
                <CopyGlyph size="clamp(16px, 1.042vw, 20px)" />
                {copied && <CopiedBubble role="status">{t('discover.scene.copied')}</CopiedBubble>}
              </CopyCta>
            </CtaRow>
          </HeroText>
        </HeroWrap>
        {place.description && (
          <About>
            <AboutLabel>{t('discover.scene.what_to_expect')}</AboutLabel>
            <AboutText>{place.description}</AboutText>
          </About>
        )}
      </Modal>
    </Backdrop>
  )
}

const SceneJumpInModal = memo(SceneJumpInModalComponent)

export { SceneJumpInModal }
