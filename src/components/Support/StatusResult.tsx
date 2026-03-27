import { memo } from 'react'
import { StatusHealthyIcon, StatusUnhealthyIcon, StatusWarningIcon } from '../Icons'
import { ServiceStatus } from './utils'

type StatusResultProps = {
  status: ServiceStatus
}

const StatusResult = memo(function StatusResult({ status }: StatusResultProps) {
  switch (status) {
    case ServiceStatus.OK:
      return <StatusHealthyIcon />
    case ServiceStatus.DOWN:
      return <StatusUnhealthyIcon />
    case ServiceStatus.SLOW:
      return <StatusWarningIcon />
    default:
      return <span>&#10068;</span>
  }
})

export { StatusResult }
