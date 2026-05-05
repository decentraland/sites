import { Helmet } from 'react-helmet-async'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { NotFoundContainer, NotFoundDescription, NotFoundTitle, PageContainer } from './CommunityDetailPage.styled'

function SocialNotFoundPage() {
  const t = useFormatMessage()
  return (
    <PageContainer>
      <Helmet>
        <title>{t('community.not_found.title')}</title>
      </Helmet>
      <NotFoundContainer>
        <NotFoundTitle>{t('community.not_found.title')}</NotFoundTitle>
        <NotFoundDescription>{t('community.not_found.description')}</NotFoundDescription>
      </NotFoundContainer>
    </PageContainer>
  )
}

export { SocialNotFoundPage }
