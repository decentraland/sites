import type { Page } from '@playwright/test'

const SENTINEL_STATUS = 599

export function watchUnmockedCmsRequests(page: Page): { errors: string[] } {
  const errors: string[] = []
  page.on('response', resp => {
    if (resp.status() === SENTINEL_STATUS) {
      errors.push(`Unmocked CMS request → ${resp.url()}`)
    }
  })
  return { errors }
}

export { SENTINEL_STATUS }
