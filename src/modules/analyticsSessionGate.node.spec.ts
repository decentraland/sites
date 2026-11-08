/**
 * @jest-environment node
 */
import { isAnalyticsDisabledForSession } from './analyticsSessionGate'

describe('when deciding whether analytics is off outside a browser', () => {
  it('should leave analytics on, since there is no URL to exempt', () => {
    expect(isAnalyticsDisabledForSession()).toBe(false)
  })
})
