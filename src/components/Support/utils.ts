enum ServiceStatus {
  OK = 'ok',
  DOWN = 'down',
  SLOW = 'slow',
  UNKNOWN = 'unknown'
}

enum StatusColor {
  GREEN = 'green',
  ORANGE = 'orange',
  RED = 'red'
}

type Service = { name: string; url: string }

const fetchServiceStatus = async (url: string): Promise<{ status: ServiceStatus }> => {
  try {
    const response = await fetch(url)
    if (response.ok) {
      return { status: ServiceStatus.OK }
    } else if (response.status >= 500) {
      return { status: ServiceStatus.DOWN }
    }
    return { status: ServiceStatus.SLOW }
  } catch {
    return { status: ServiceStatus.DOWN }
  }
}

const determineGlobalStatus = (
  statuses: Record<string, ServiceStatus>,
  t: (key: string) => string
): { status: ServiceStatus; color: StatusColor; text: string } => {
  const statusValues = Object.values(statuses)
  // eslint-disable-next-line prettier/prettier
  if (statusValues.every((s) => s === ServiceStatus.OK)) {
    return {
      status: ServiceStatus.OK,
      color: StatusColor.GREEN,
      text: t('component.landing.help.dropdown.status.all_operational')
    }
  } else if (statusValues.every(s => s === ServiceStatus.DOWN)) {
    return {
      status: ServiceStatus.DOWN,
      color: StatusColor.RED,
      text: t('component.landing.help.dropdown.status.shutdown')
    }
  }
  return {
    status: ServiceStatus.SLOW,
    color: StatusColor.ORANGE,
    text: t('component.landing.help.dropdown.status.warning')
  }
}

export { determineGlobalStatus, fetchServiceStatus, ServiceStatus, StatusColor }
export type { Service }
