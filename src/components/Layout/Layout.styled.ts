import { styled } from 'decentraland-ui2'

const FooterFallback = styled('div')({
  width: '100%',
  height: 425,
  background:
    'radial-gradient(ellipse at 0% 0%, rgba(121,47,158,0.6) 0%, rgba(74,23,102,0.8) 25%, rgba(51,12,74,0.9) 50%, rgba(27,0,46,1) 75%)'
})

// Violet field behind the /create bars, so the translucent navbar + creators sub-nav
// composite to the same colors as the wemotes-builder collections app, whose whole body
// sits on this field. Only the strip the two bars cover is painted;
const CreatorsField = styled('div')({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height: 156,
  zIndex: -1,
  pointerEvents: 'none',
  backgroundImage: 'radial-gradient(61.64% 109.58% at 50% 54.49%, #952dc6 0%, #7c27a8 25%, #642089 50%, #4b1a6b 75%, #32134c 100%)',
  backgroundSize: '100% 100vh',
  backgroundRepeat: 'no-repeat',
  ['@media (max-width: 991px)']: {
    height: 128
  }
})

export { CreatorsField, FooterFallback }
