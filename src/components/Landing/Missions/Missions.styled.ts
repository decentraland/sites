import { Box, styled } from 'decentraland-ui2'

const MissionsSection = styled('section')(() => {
  return {
    width: '100%',
    padding: 0,
    margin: 0,
    position: 'relative'
  }
})

const MissionsContainer = styled(Box)({
  height: '100%'
})

export { MissionsSection, MissionsContainer }
