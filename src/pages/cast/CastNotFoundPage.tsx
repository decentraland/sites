import { Helmet } from 'react-helmet-async'
import { NotFound } from '../../components/cast/NotFound/NotFound'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'

const CastNotFoundPage = () => {
  const t = useFormatMessage()
  return (
    <>
      <Helmet>
        <title>{t('page.cast.not_found.page_title')}</title>
      </Helmet>
      <NotFound />
    </>
  )
}

export { CastNotFoundPage }
