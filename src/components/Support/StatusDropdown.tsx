import { memo, useEffect, useMemo, useState } from 'react'
import { useTranslation } from '@dcl/hooks'
import { CircularProgress, Menu } from 'decentraland-ui2'
import { StatusResult } from './StatusResult'
import { type Service, ServiceStatus, determineGlobalStatus, fetchServiceStatus } from './utils'
import {
  StatusContainer,
  StatusGlobalIcon,
  StatusHeaderBar,
  StatusItem,
  StatusMenuButton,
  StatusServiceName,
  StatusViewDetails
} from './StatusDropdown.styled'

type StatusDropdownProps = {
  serviceList: Service[]
}

const StatusDropdown = memo(function StatusDropdown({ serviceList }: StatusDropdownProps) {
  const { t } = useTranslation()

  const [statuses, setStatuses] = useState<Record<string, ServiceStatus>>({})
  const [loading, setLoading] = useState(true)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  useEffect(() => {
    let cancelled = false

    const loadStatuses = async () => {
      const results = await Promise.all(
        serviceList.map(service => fetchServiceStatus(service.url).then(result => ({ name: service.name, status: result.status })))
      )

      if (!cancelled) {
        const statusMap = results.reduce<Record<string, ServiceStatus>>((acc, { name, status }) => {
          acc[name] = status
          return acc
        }, {})

        setStatuses(statusMap)
        setLoading(false)
      }
    }

    loadStatuses()

    return () => {
      cancelled = true
    }
  }, [serviceList])

  const globalStatus = useMemo(() => determineGlobalStatus(statuses, t), [statuses, t])

  if (loading) {
    return (
      <StatusContainer>
        <CircularProgress size={20} />
      </StatusContainer>
    )
  }

  return (
    <StatusContainer>
      <StatusGlobalIcon>
        <StatusResult status={globalStatus.status} />
      </StatusGlobalIcon>
      {}
      <StatusMenuButton onClick={e => setAnchorEl(e.currentTarget)}>{t('component.landing.help.dropdown.title')}</StatusMenuButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: '#280d2be5',
              backgroundImage: 'none',
              border: '1px solid #444444',
              mt: 1
            }
          }
        }}
      >
        <StatusHeaderBar statusColor={globalStatus.color}>{globalStatus.text}</StatusHeaderBar>
        {Object.entries(statuses).map(([name, status]) => (
          <StatusItem key={name}>
            <StatusResult status={status} />
            <StatusServiceName>{name}</StatusServiceName>
          </StatusItem>
        ))}
        <StatusViewDetails>
          <a href="https://status.decentraland.org/" target="_blank" rel="noopener noreferrer">
            {t('component.landing.help.dropdown.cta')}
          </a>
        </StatusViewDetails>
      </Menu>
    </StatusContainer>
  )
})

export { StatusDropdown }
