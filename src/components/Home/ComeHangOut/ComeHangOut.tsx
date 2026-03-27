import { memo } from 'react'
import { AnimatedBackground, DownloadModal, JumpInIcon } from 'decentraland-ui2'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { useHangOutAction } from '../../../hooks/useHangOutAction'
import { SectionViewedTrack } from '../../../modules/segment'
import { assetUrl } from '../../../utils/assetUrl'
import { AvatarsImage, ComeHangOutContainer, Content, HangOutButton, Title } from './ComeHangOut.styled'

const ComeHangOut = memo(() => {
  const onClickHandle = useTrackClick()
  const { handleClick, isDownloadModalOpen, closeDownloadModal } = useHangOutAction()

  return (
    <ComeHangOutContainer>
      <AnimatedBackground variant="absolute" />
      <Content>
        <Title variant="h2">Come Hang Out</Title>
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
          HANG OUT NOW
        </HangOutButton>
      </Content>
      <AvatarsImage src={assetUrl('/come_hang_out_background.webp')} alt="" aria-hidden width={1920} height={840} loading="lazy" />
      <DownloadModal
        open={isDownloadModalOpen}
        onClose={closeDownloadModal}
        title="Download Decentraland"
        description="Get the desktop app to explore Decentraland."
        buttonLabel="Download"
        onDownloadClick={() => {
          window.open('https://decentraland.org/download', '_blank')
          closeDownloadModal()
        }}
      />
    </ComeHangOutContainer>
  )
})

ComeHangOut.displayName = 'ComeHangOut'

export { ComeHangOut }
