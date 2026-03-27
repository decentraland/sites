import { Button, Logo } from 'decentraland-ui2'
import { PressContainer, PressDescription, PressEmailLink, PressLogoWrapper, PressTitle } from './PressPage.styled'

const PRESS_KIT_URL = 'https://dcl.gg/press'
const PRESS_EMAIL = 'press@decentraland.org'

const PressPage = () => {
  return (
    <PressContainer>
      <PressLogoWrapper>
        <Logo size="huge" />
      </PressLogoWrapper>
      <PressTitle variant="h1">Decentraland Press Kit</PressTitle>
      <PressDescription>
        {
          "We've put together all sorts of goodies that you're welcome to use when writing and talking about our project. Please direct any questions to "
        }
        <PressEmailLink href={`mailto:${PRESS_EMAIL}`}>{PRESS_EMAIL}</PressEmailLink>.
      </PressDescription>
      <Button variant="contained" onClick={() => window.open(PRESS_KIT_URL, '_blank', 'noopener,noreferrer')}>
        Download Press Kit
      </Button>
    </PressContainer>
  )
}

export { PressPage }
