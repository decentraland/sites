import { memo } from 'react'
import { AnimatedBackground, DownloadModal, JumpInIcon } from 'decentraland-ui2'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { useHangOutAction } from '../../../hooks/useHangOutAction'
import { SectionViewedTrack } from '../../../modules/segment'
import { assetUrl } from '../../../utils/assetUrl'
import { AvatarsImage, ComeHangOutContainer, Content, HangOutButton, Title } from './ComeHangOut.styled'

const ComeHangOut = memo(() => {
  const l = useFormatMessage()
  const onClickHandle = useTrackClick()
  const { handleClick, isDownloadModalOpen, closeDownloadModal, downloadModalProps } = useHangOutAction()

  return (
    <ComeHangOutContainer>
      <AnimatedBackground variant="absolute" />
      <Content>
        <Title variant="h2">{l('page.home.come_hang_out.title')}</Title>
        <HangOutButton
          variant="contained"
          onClick={e => {
            onClickHandle(e)
            handleClick(e)
          }}
          data-place={SectionViewedTrack.LANDING_HERO}
          data-event="click"
          endIcon={<JumpInIcon />}
        >
          {l('page.home.hang_out_now')}
        </HangOutButton>
      </Content>
      <AvatarsImage src={assetUrl('/come_hang_out_background.webp')} alt="" aria-hidden width={1920} height={840} loading="lazy" />
      <DownloadModal open={isDownloadModalOpen} onClose={closeDownloadModal} {...downloadModalProps} />
    </ComeHangOutContainer>
  )
})

ComeHangOut.displayName = 'ComeHangOut'

export { ComeHangOut }
