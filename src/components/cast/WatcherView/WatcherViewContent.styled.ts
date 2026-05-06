import { styled } from 'decentraland-ui2'

const ContentWrapper = styled('div')({
  width: '100%',
  height: '100%',
  position: 'relative'
})

const EmptyStateWrapper = styled('div')({
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
})

export { ContentWrapper, EmptyStateWrapper }
