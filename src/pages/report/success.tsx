import { useEffect } from 'react'
import { ReportSuccess } from '../../components/Report/ReportSuccess'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'

function ReportSuccessPage() {
  const formatMessage = useFormatMessage()

  useEffect(() => {
    const previous = document.title
    document.title = formatMessage('page.report.success_title')
    return () => {
      document.title = previous
    }
  }, [formatMessage])

  return <ReportSuccess />
}

export { ReportSuccessPage }
