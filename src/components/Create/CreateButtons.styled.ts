import type { ElementType } from 'react'
import { Button, dclColors, styled } from 'decentraland-ui2'

// styled(Button) drops Button's polymorphic `component` typing; re-declare the
// anchor props the Learn/Earn callers pass.
type LightCtaButtonProps = {
  component?: ElementType
  href?: string
  target?: string
  rel?: string
}

const LightCtaButton = styled(Button)<LightCtaButtonProps>({
  backgroundColor: dclColors.neutral.white,
  color: dclColors.neutral.gray0,
  ['&:hover']: {
    backgroundColor: dclColors.neutral.gray5
  }
})

export { LightCtaButton }
