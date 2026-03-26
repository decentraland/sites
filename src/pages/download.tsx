import { DownloadLayout } from '../components/Layout/DownloadLayout'
import { useFormatMessage } from '../hooks/adapters/useFormatMessage'

const DownloadPage = () => {
  const l = useFormatMessage()

  return <DownloadLayout title={l('page.download.download_onboarding_title')} redirectPath="/download_success" />
}

export { DownloadPage }
// eslint-disable-next-line import/no-default-export
export default DownloadPage
