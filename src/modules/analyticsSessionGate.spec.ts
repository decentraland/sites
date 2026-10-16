import { isBotClient } from '@dcl/hooks'

jest.mock('@dcl/hooks', () => ({ isBotClient: jest.fn() }))

describe('when deciding whether analytics is off for the session', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/')
  })

  describe('and the session starts on an exempt page', () => {
    it('should stay off after moving in-app to a page that is not exempt', async () => {
      window.history.pushState({}, '', '/privacy')
      await jest.isolateModulesAsync(async () => {
        const { isAnalyticsDisabledForSession } = await import('./analyticsSessionGate')
        window.history.pushState({}, '', '/events')
        expect(isAnalyticsDisabledForSession()).toBe(true)
      })
    })
  })

  describe('and the session starts on a page that is not exempt', () => {
    it('should stay on after moving in-app to an exempt page', async () => {
      window.history.pushState({}, '', '/events')
      await jest.isolateModulesAsync(async () => {
        const { isAnalyticsDisabledForSession } = await import('./analyticsSessionGate')
        window.history.pushState({}, '', '/privacy')
        expect(isAnalyticsDisabledForSession()).toBe(false)
      })
    })
  })
})

describe('when deciding whether analytics stays off for the visitor', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/')
    jest.resetAllMocks()
  })

  describe('and the session starts on an exempt page', () => {
    it('should be off even for a person', async () => {
      ;(isBotClient as jest.Mock).mockReturnValue(false)
      window.history.pushState({}, '', '/privacy')
      await jest.isolateModulesAsync(async () => {
        const { isAnalyticsOffForVisitor } = await import('./analyticsSessionGate')
        expect(isAnalyticsOffForVisitor()).toBe(true)
      })
    })
  })

  describe('and the session starts on a page that is not exempt', () => {
    it('should be off for a bot', async () => {
      ;(isBotClient as jest.Mock).mockReturnValue(true)
      window.history.pushState({}, '', '/events')
      await jest.isolateModulesAsync(async () => {
        const { isAnalyticsOffForVisitor } = await import('./analyticsSessionGate')
        expect(isAnalyticsOffForVisitor()).toBe(true)
      })
    })

    it('should be on for a person', async () => {
      ;(isBotClient as jest.Mock).mockReturnValue(false)
      window.history.pushState({}, '', '/events')
      await jest.isolateModulesAsync(async () => {
        const { isAnalyticsOffForVisitor } = await import('./analyticsSessionGate')
        expect(isAnalyticsOffForVisitor()).toBe(false)
      })
    })
  })
})
