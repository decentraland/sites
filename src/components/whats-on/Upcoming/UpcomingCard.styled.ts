import { Box, styled } from 'decentraland-ui2'

const MobileActionButton = styled('button')(({ theme }) => ({
  display: 'none',
  [theme.breakpoints.down('md')]: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    flexShrink: 0,
    borderRadius: 6,
    border: 'none',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    cursor: 'pointer',
    padding: 0,
    color: '#FCFCFC',
    ['&:active']: {
      backgroundColor: 'rgba(255, 255, 255, 0.3)'
    }
  }
}))

// Wraps decentraland-ui2's EventSmallCard. On mobile, vertically center the
// card's text block (the second flex child of the card root). EventSmallCard's
// TextBlock defaults to `space-between`, which leaves the title pinned to the
// top when the body is short — visually misaligned with the thumbnail.
const EventSmallCardWrapper = styled(Box)(({ theme }) => ({
  width: '100%',
  [theme.breakpoints.down('md')]: {
    ['& > * > *:nth-of-type(2)']: {
      justifyContent: 'center'
    }
  }
}))

export { EventSmallCardWrapper, MobileActionButton }
