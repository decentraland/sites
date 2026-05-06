import { useEffect } from 'react'
import { ReportForm } from '../../components/Report/ReportForm'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'

function ReportPage() {
  const formatMessage = useFormatMessage()

  useEffect(() => {
    const previous = document.title
    document.title = formatMessage('page.report.title')
    return () => {
      document.title = previous
    }
  }, [formatMessage])

  return <ReportForm />
}

export { ReportPage }
