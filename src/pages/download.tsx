import { useAdvancedUserAgentData } from '@dcl/hooks'
import { DownloadLayout } from '../components/Layout/DownloadLayout'
import { Layout } from '../components/Layout/Layout'
import { useFormatMessage } from '../hooks/adapters/useFormatMessage'
import { FALLBACK_CDN_RELEASE_LINKS } from '../modules/url'

const DownloadPage = () => {
  const l = useFormatMessage()
  const [, userAgentData] = useAdvancedUserAgentData()

  return (
    <Layout withNavbar={false} withFooter={false}>
      <DownloadLayout
        userAgentData={userAgentData}
        title={l('page.download.download_onboarding_title')}
        links={FALLBACK_CDN_RELEASE_LINKS}
        redirectPath="/download_success"
      />
    </Layout>
  )
}

export { DownloadPage }
// eslint-disable-next-line import/no-default-export
export default DownloadPage
