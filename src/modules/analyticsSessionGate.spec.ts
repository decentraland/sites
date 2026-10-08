describe('when deciding whether analytics is off for the session', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/')
  })

  describe('and the session starts on an exempt page', () => {
    it('should stay off after moving in-app to a page that is not exempt', () => {
      window.history.pushState({}, '', '/privacy')
      jest.isolateModules(() => {
        const { isAnalyticsDisabledForSession } = jest.requireActual<typeof import('./analyticsSessionGate')>('./analyticsSessionGate')
        window.history.pushState({}, '', '/credits-terms')
        expect(isAnalyticsDisabledForSession()).toBe(true)
      })
    })
  })

  describe('and the session starts on a page that is not exempt', () => {
    it('should stay on after moving in-app to an exempt page', () => {
      window.history.pushState({}, '', '/events')
      jest.isolateModules(() => {
        const { isAnalyticsDisabledForSession } = jest.requireActual<typeof import('./analyticsSessionGate')>('./analyticsSessionGate')
        window.history.pushState({}, '', '/privacy')
        expect(isAnalyticsDisabledForSession()).toBe(false)
      })
    })
  })
})
