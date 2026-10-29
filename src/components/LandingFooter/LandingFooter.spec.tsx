import { fireEvent, render, screen } from '@testing-library/react'
import { SectionViewedTrack, SegmentEvent } from '../../modules/segment'
import { LandingFooter } from './LandingFooter'

// Run the real LandingFooter.styled.ts through the shared styled shim instead
// of the emotion engine (decentraland-ui2 ships ESM Jest can't transform).
jest.mock('decentraland-ui2', () => jest.requireActual('../../__test-utils__/styledMock'))

const trackMock = jest.fn()
const setLocaleMock = jest.fn()
let isInitialized = true

jest.mock('@dcl/hooks', () => ({
  useAnalytics: () => ({ isInitialized, track: trackMock })
}))

jest.mock('../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

jest.mock('../../intl/LocaleContext', () => ({
  useLocale: () => ({ locale: 'en', setLocale: setLocaleMock })
}))

const setCrossOriginIsolated = (value: boolean) => {
  Object.defineProperty(window, 'crossOriginIsolated', { value, configurable: true })
}

beforeEach(() => {
  isInitialized = true
})

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

  describe('when a social platform is clicked', () => {
    it('should track the platform', () => {
      render(<LandingFooter />)
      fireEvent.click(screen.getAllByLabelText('Discord')[0])
      expect(trackMock).toHaveBeenCalledWith(SegmentEvent.CLICK, {
        place: SectionViewedTrack.LANDING_FOOTER_SOCIAL,
        event: 'click',
        platform: 'Discord'
      })
    })
  })

  describe('when a footer link is clicked', () => {
    it('should track the link label', () => {
      render(<LandingFooter />)
      fireEvent.click(screen.getAllByText('component.landing.footer.getting_started.what_is')[0])
      fireEvent.click(screen.getAllByText('component.landing.footer.resources.docs')[0])
      expect(trackMock).toHaveBeenCalledWith(SegmentEvent.CLICK, {
        place: SectionViewedTrack.LANDING_FOOTER_LINK,
        event: 'click',
        link: 'component.landing.footer.getting_started.what_is'
      })
      expect(trackMock).toHaveBeenCalledWith(SegmentEvent.CLICK, {
        place: SectionViewedTrack.LANDING_FOOTER_LINK,
        event: 'click',
        link: 'component.landing.footer.resources.docs'
      })
    })
  })

  describe('when a mobile footer link is clicked', () => {
    it('should track the link label', () => {
      render(<LandingFooter />)
      fireEvent.click(screen.getAllByText('component.landing.footer.resources.docs')[1])
      fireEvent.click(screen.getAllByText('component.landing.footer.getting_started.what_is')[1])
      expect(trackMock).toHaveBeenCalledWith(SegmentEvent.CLICK, {
        place: SectionViewedTrack.LANDING_FOOTER_LINK,
        event: 'click',
        link: 'component.landing.footer.resources.docs'
      })
      expect(trackMock).toHaveBeenCalledWith(SegmentEvent.CLICK, {
        place: SectionViewedTrack.LANDING_FOOTER_LINK,
        event: 'click',
        link: 'component.landing.footer.getting_started.what_is'
      })
    })
  })

  describe('when analytics has not initialized yet', () => {
    beforeEach(() => {
      isInitialized = false
    })

    it('should not track clicks', () => {
      render(<LandingFooter />)
      fireEvent.click(screen.getAllByLabelText('Discord')[0])
      expect(trackMock).not.toHaveBeenCalled()
    })
  })

  describe('when a mobile menu section is toggled', () => {
    it('should expand it on the first click and collapse it on the second', () => {
      const { container } = render(<LandingFooter />)
      const section = screen.getAllByText('component.landing.footer.getting_started.title')[1]
      expect(container.querySelectorAll('[open]')).toHaveLength(0)
      fireEvent.click(section)
      expect(container.querySelectorAll('[open]').length).toBeGreaterThan(0)
      fireEvent.click(section)
      expect(container.querySelectorAll('[open]')).toHaveLength(0)
    })

    it('should collapse the previous section when another one is opened', () => {
      const { container } = render(<LandingFooter />)
      fireEvent.click(screen.getAllByText('component.landing.footer.getting_started.title')[1])
      fireEvent.click(screen.getAllByText('component.landing.footer.resources.title')[1])
      const expanded = [...container.querySelectorAll('div[open]')]
      expect(expanded).toHaveLength(1)
      expect(expanded[0].textContent).toContain('component.landing.footer.resources.docs')
    })
  })

  describe('when the language menu is open', () => {
    it('should switch the locale and close the menu on selection', () => {
      render(<LandingFooter />)
      fireEvent.click(screen.getByText('English'))
      fireEvent.click(screen.getByText('Español'))
      expect(setLocaleMock).toHaveBeenCalledWith('es')
      expect(screen.queryByText('Español')).toBeNull()
    })

    it('should close on a click outside the language wrapper', () => {
      render(<LandingFooter />)
      fireEvent.click(screen.getByText('English'))
      expect(screen.getByText('Español')).toBeInTheDocument()
      fireEvent.mouseDown(document.body)
      expect(screen.queryByText('Español')).toBeNull()
    })

    it('should stay open on a click inside the language wrapper', () => {
      render(<LandingFooter />)
      const button = screen.getByText('English')
      fireEvent.click(button)
      fireEvent.mouseDown(button)
      expect(screen.getByText('Español')).toBeInTheDocument()
    })
  })

  describe('when rendering the bottom bar', () => {
    it('should link every legal page and stamp the current year', () => {
      render(<LandingFooter />)
      expect(screen.getAllByText('Privacy Policy')[0]).toHaveAttribute('href', '/privacy')
      expect(screen.getAllByText('Terms of Use')[0]).toHaveAttribute('href', '/terms')
      expect(screen.getAllByText('Content Policy')[0]).toHaveAttribute('href', '/content')
      expect(screen.getAllByText('Code of Ethics')[0]).toHaveAttribute('href', '/ethics')
      expect(screen.getByText(`© ${new Date().getFullYear()} Decentraland`)).toBeInTheDocument()
    })
  })
})
