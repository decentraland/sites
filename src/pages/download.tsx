import { DownloadLayout } from '../components/Layout/DownloadLayout'
import { useFormatMessage } from '../hooks/adapters/useFormatMessage'
import { usePageView } from '../hooks/usePageView'

const DownloadPage = () => {
  const l = useFormatMessage()
  // Fullscreen route: mounted outside <Layout />, which is where the shared
  // page() call lives — without this the page every paid campaign lands on
  // emits no pageview at all.
  usePageView()

  return <DownloadLayout title={l('page.download.download_onboarding_title')} redirectPath="/download_success" />
}

export { DownloadPage }
// eslint-disable-next-line import/no-default-export
export default DownloadPage
