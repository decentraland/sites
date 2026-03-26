import { memo, useCallback } from 'react'
import { AnimatedBackground, JumpInIcon } from 'decentraland-ui2'
import { getEnv } from '../../../config/env'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { SectionViewedTrack } from '../../../modules/segment'
import { assetUrl } from '../../../utils/assetUrl'
import { AvatarsImage, ComeHangOutContainer, Content, HangOutButton, Title } from './ComeHangOut.styled'

const ComeHangOut = memo(() => {
  const onClickHandle = useTrackClick()

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      onClickHandle(event)
      const href = getEnv('ONBOARDING_URL')!
      setTimeout(() => {
        window.location.href = href
      }, 500)
    },
    [onClickHandle]
  )

  return (
    <ComeHangOutContainer>
      <AnimatedBackground variant="absolute" />
      <Content>
        <Title variant="h2">Come Hang Out</Title>
        <HangOutButton
          variant="contained"
          onClick={handleClick}
          data-place={SectionViewedTrack.LANDING_HERO}
          data-event="click"
          endIcon={<JumpInIcon />}
        >
          HANG OUT NOW
        </HangOutButton>
      </Content>
      <AvatarsImage src={assetUrl('/come_hang_out_background.webp')} alt="" aria-hidden width={1920} height={840} loading="lazy" />
    </ComeHangOutContainer>
  )
})

ComeHangOut.displayName = 'ComeHangOut'

export { ComeHangOut }
