import { Button, Logo } from 'decentraland-ui2'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { PressContainer, PressDescription, PressEmailLink, PressLogoWrapper, PressTitle } from './PressPage.styled'

const PRESS_KIT_URL = 'https://dcl.gg/press'
const PRESS_EMAIL = 'press@decentraland.org'

const PressPage = () => {
  const l = useFormatMessage()

  return (
    <PressContainer>
      <PressLogoWrapper>
        <Logo size="huge" />
      </PressLogoWrapper>
      <PressTitle variant="h1">{l('page.press.title')}</PressTitle>
      <PressDescription>
        {l('page.press.page_description')}
        <PressEmailLink href={`mailto:${PRESS_EMAIL}`}>{PRESS_EMAIL}</PressEmailLink>.
      </PressDescription>
      <Button variant="contained" {...{ component: 'a', target: '_blank', rel: 'noopener noreferrer' }} href={PRESS_KIT_URL}>
        {l('page.press.download_button')}
      </Button>
    </PressContainer>
  )
}

export { PressPage }
