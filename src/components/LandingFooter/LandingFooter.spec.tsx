import { render, screen } from '@testing-library/react'
import { LandingFooter } from './LandingFooter'

// Run the real LandingFooter.styled.ts through the shared styled shim instead
// of the emotion engine (decentraland-ui2 ships ESM Jest can't transform).
jest.mock('decentraland-ui2', () => jest.requireActual('../../__test-utils__/styledMock'))

jest.mock('@dcl/hooks', () => ({
  useAnalytics: () => ({ isInitialized: false, track: jest.fn() })
}))

jest.mock('../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

jest.mock('../../intl/LocaleContext', () => ({
  useLocale: () => ({ locale: 'en', setLocale: jest.fn() })
}))

const setCrossOriginIsolated = (value: boolean) => {
  Object.defineProperty(window, 'crossOriginIsolated', { value, configurable: true })
}

afterEach(() => {
  jest.resetAllMocks()
  setCrossOriginIsolated(false)
})

describe('LandingFooter', () => {
  describe('when the document is cross-origin isolated', () => {
    beforeEach(() => {
      setCrossOriginIsolated(true)
    })

    it('should mark the newsletter embed as credentialless so COEP does not block it', () => {
      render(<LandingFooter />)
      expect(screen.getByTitle('Newsletter signup').hasAttribute('credentialless')).toBe(true)
    })
  })

  describe('when the document is not cross-origin isolated', () => {
    beforeEach(() => {
      setCrossOriginIsolated(false)
    })

    it('should leave the newsletter embed with its regular credentials', () => {
      render(<LandingFooter />)
      expect(screen.getByTitle('Newsletter signup').hasAttribute('credentialless')).toBe(false)
    })
  })
})
