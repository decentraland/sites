import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render } from '@testing-library/react'
import type { HotScene } from '../../../features/events/events.discovery.types'
import { SectionViewedTrack } from '../../../modules/segment'
import { CreatorsLiveScenes } from './LiveScenes'

const mockAnimatedSection = jest.fn()
jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../../__test-utils__/styledMock')
  const Typography = ({ children, ...rest }: { children?: React.ReactNode }) => <p {...rest}>{children}</p>
  return { ...actual, Typography }
})

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

const mockTrackClick = jest.fn()
jest.mock('../../../hooks/adapters/useTrackLinkContext', () => ({
  useTrackClick: () => mockTrackClick
}))

jest.mock('../AnimatedSection', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AnimatedSection: (props: any) => {
    mockAnimatedSection(props.trackPlace)
    return <div>{props.children}</div>
  }
}))

jest.mock('@mui/icons-material/ChevronRight', () => ({
  __esModule: true,
  default: () => null
}))

const mockUseGetHotScenesQuery = jest.fn()
jest.mock('../../../features/events/scenes.discovery', () => ({
  useGetHotScenesQuery: () => mockUseGetHotScenesQuery()
}))

const aScene = (overrides: Partial<HotScene>): HotScene => ({
  id: 'scene-1',
  name: 'A Scene',
  baseCoords: [10, 20],
  usersTotalCount: 5,
  parcels: [[10, 20]],
  thumbnail: 'https://img.test/scene.png',
  ...overrides
})

const renderSection = () =>
  render(
    <MemoryRouter>
      <CreatorsLiveScenes />
    </MemoryRouter>
  )

describe('CreatorsLiveScenes', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the hot scenes are still loading', () => {
    beforeEach(() => {
      mockUseGetHotScenesQuery.mockReturnValue({ data: [], isLoading: true })
    })

    it('should render nothing', () => {
      const { container } = renderSection()

      expect(container).toBeEmptyDOMElement()
    })
  })

  describe('when no live scenes qualify', () => {
    beforeEach(() => {
      mockUseGetHotScenesQuery.mockReturnValue({
        data: [aScene({ id: 'plaza', name: 'Genesis Plaza' }), aScene({ id: 'empty', usersTotalCount: 0 })],
        isLoading: false
      })
    })

    it('should render nothing', () => {
      const { container } = renderSection()

      expect(container).toBeEmptyDOMElement()
    })
  })

  describe('when live scenes are available', () => {
    beforeEach(() => {
      mockUseGetHotScenesQuery.mockReturnValue({
        data: [
          aScene({ id: 'quiet', name: 'Quiet Scene', usersTotalCount: 2, baseCoords: [1, 1] }),
          aScene({ id: 'busy', name: 'Busy Scene', usersTotalCount: 40, baseCoords: [2, 2] }),
          aScene({ id: 'plaza', name: 'Genesis Plaza', usersTotalCount: 80 })
        ],
        isLoading: false
      })
    })

    it('should mark the section for the Creators Live Scenes section-viewed event', () => {
      renderSection()

      expect(mockAnimatedSection).toHaveBeenCalledWith(SectionViewedTrack.CREATORS_LIVE_SCENES)
    })

    it('should render only non-plaza scenes ordered by live users linking into discover', () => {
      const { container } = renderSection()

      const sceneLinks = Array.from(container.querySelectorAll('a[href^="/places/place/"]')).map(link => link.getAttribute('href'))
      expect(sceneLinks).toEqual(['/places/place/2,2', '/places/place/1,1'])
    })

    it('should render each scene title', () => {
      const { getByText, queryByText } = renderSection()

      expect(getByText('Busy Scene')).toBeInTheDocument()
      expect(getByText('Quiet Scene')).toBeInTheDocument()
      expect(queryByText('Genesis Plaza')).not.toBeInTheDocument()
    })

    it('should render a view-all link to discover', () => {
      const { container } = renderSection()

      expect(container.querySelector('a[href="/places"]')).toBeInTheDocument()
    })

    describe('and a scene card is clicked', () => {
      it('should track the click', () => {
        const { container } = renderSection()

        fireEvent.click(container.querySelector('a[href^="/places/place/"]')!)

        expect(mockTrackClick).toHaveBeenCalled()
      })
    })
  })

  describe('when more scenes qualify than the section limit', () => {
    beforeEach(() => {
      mockUseGetHotScenesQuery.mockReturnValue({
        data: Array.from({ length: 9 }, (_, i) => aScene({ id: `scene-${i}`, usersTotalCount: i + 1, baseCoords: [i, 0] })),
        isLoading: false
      })
    })

    it('should cap the rendered cards at six', () => {
      const { container } = renderSection()

      expect(container.querySelectorAll('a[href^="/places/place/"]')).toHaveLength(6)
    })
  })
})
