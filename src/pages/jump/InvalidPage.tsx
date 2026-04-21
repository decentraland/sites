// eslint-disable-next-line @typescript-eslint/naming-convention
import HomeIcon from '@mui/icons-material/Home'
import { Button, Typography, useMobileMediaQuery } from 'decentraland-ui2'
import { JumpInButton } from '../../components/jump/JumpInButton'
import { getEnv } from '../../config/env'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { ContentBox, InvalidPageContainer, MobileActionsContainer } from './InvalidPage.styled'

interface InvalidPageProps {
  kind: 'event' | 'place'
}

const InvalidPage = ({ kind }: InvalidPageProps) => {
  const formatMessage = useFormatMessage()
  const isMobile = useMobileMediaQuery()
  const isEventPage = kind === 'event'
  const homeUrl = getEnv('HOME_URL') ?? 'https://decentraland.org'
  const eventsUrl = getEnv('EVENTS_URL') ?? 'https://decentraland.org/events/'

  return (
    <InvalidPageContainer isEventPage={isEventPage} isMobile={isMobile}>
      <ContentBox>
        <Typography variant="h3" mb="24px">
          {formatMessage('component.jump.invalid_page.title')}
        </Typography>
        <Typography variant="h6" mb="24px">
          {isMobile ? formatMessage('component.jump.invalid_page.message_mobile') : formatMessage('component.jump.invalid_page.message')}
        </Typography>
        {!isMobile && (
          <JumpInButton position="0,0" size="large" fullWidth>
            {formatMessage('component.jump.invalid_page.jump_in_button')}
          </JumpInButton>
        )}
        {isEventPage && (
          <Button variant="contained" color="secondary" href={eventsUrl} size="large" fullWidth sx={{ color: '#161518' }}>
            {formatMessage('component.jump.events_page.explore_events_button')}
          </Button>
        )}
      </ContentBox>
      {isMobile && (
        <MobileActionsContainer>
          <Button variant="contained" color="primary" href={homeUrl} size="large" fullWidth startIcon={<HomeIcon />}>
            {formatMessage('component.jump.invalid_page.go_home_button')}
          </Button>
        </MobileActionsContainer>
      )}
    </InvalidPageContainer>
  )
}

export { InvalidPage }
