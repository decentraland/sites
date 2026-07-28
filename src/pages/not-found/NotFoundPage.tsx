import { useLocation } from 'react-router-dom'
import { AnimatedBackground } from 'decentraland-ui2'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { usePageViewTracking } from '../../hooks/usePageViewTracking'
import avatarImage from '../../images/notfound/notfound_avatar.webp'
import {
  AvatarIllustration,
  BrandLogo,
  Content,
  CtaButton,
  Description,
  Graphic,
  HomeLink,
  PageContainer,
  TextBlock,
  Title,
  TitleRest,
  Watermark
} from './NotFoundPage.styled'

const NotFoundPage = () => {
  const l = useFormatMessage()
  const location = useLocation()

  // Outside <Layout /> the route-level page() never fires -- track explicitly,
  // carrying the missing path so broken links are measurable in Segment.
  usePageViewTracking({ name: 'Not Found', properties: { path: location.pathname } })

  return (
    <PageContainer component="main">
      <AnimatedBackground variant="absolute" />
      <HomeLink to="/" aria-label="Decentraland Home">
        <BrandLogo />
      </HomeLink>
      <Content>
        <TextBlock>
          <Title variant="h3" component="h1">
            {l('page.not_found.title_oops')} <TitleRest>{l('page.not_found.title_rest')}</TitleRest>
          </Title>
          <Description variant="h5" component="p">
            {l('page.not_found.description')}
          </Description>
        </TextBlock>
        {/* Full navigation (href) rather than a react-router Link on purpose:
            /whats-on is a heavy DappsShell route in its own lazy chunk, so a
            document load keeps this lightweight Layout-less 404 chunk from
            coupling to the shell. The logo above uses a Link because `/` is a
            lightweight route where a client transition is cheap. */}
        <CtaButton variant="contained" color="primary" size="large" href="/whats-on">
          {l('page.not_found.cta')}
        </CtaButton>
      </Content>
      <Graphic>
        <Watermark aria-hidden="true">404</Watermark>
        <AvatarIllustration src={avatarImage} alt="" />
      </Graphic>
    </PageContainer>
  )
}

export { NotFoundPage }
