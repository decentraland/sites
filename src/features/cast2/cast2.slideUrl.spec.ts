import { isAllowedSlideUrl } from './cast2.slideUrl'

const PRD_BASE = 'https://cast-presenter-service.decentraland.org'
const VALID_SLIDE = `${PRD_BASE}/presentations/abc/slides/0f3a.png`

describe('when checking isAllowedSlideUrl', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe.each([
    ['a slide on the presenter origin', VALID_SLIDE, PRD_BASE, true],
    ['a slide on a local presenter server', 'http://localhost:3002/presentations/abc/slides/0f3a.png', 'http://localhost:3002', true],
    ['a slide on another host', 'https://evil.example/presentations/abc/slides/0f3a.png', PRD_BASE, false],
    [
      'a slide on the presenter host over another scheme',
      'http://cast-presenter-service.decentraland.org/presentations/abc/slides/0f3a.png',
      PRD_BASE,
      false
    ],
    [
      'a slide on a host that extends the presenter host',
      'https://cast-presenter-service.decentraland.org.evil.example/presentations/abc/slides/0f3a.png',
      PRD_BASE,
      false
    ],
    ['a slide with a query string', `${VALID_SLIDE}?x=1`, PRD_BASE, false],
    ['a slide with a fragment', `${VALID_SLIDE}#x`, PRD_BASE, false],
    ['a png outside the slides path', `${PRD_BASE}/other/0f3a.png`, PRD_BASE, false],
    ['a slide path that traverses upwards', `${PRD_BASE}/presentations/abc/slides/../../x.png`, PRD_BASE, false],
    ['a slide whose hash is not hexadecimal', `${PRD_BASE}/presentations/abc/slides/zz.png`, PRD_BASE, false],
    ['a value that is not a URL', 'not a url', PRD_BASE, false],
    ['a presenter server URL that is not a URL', VALID_SLIDE, 'not a url', false]
  ])('and the input is %s', (_label, url, presenterServerUrl, expected) => {
    let slideUrl: string
    let baseUrl: string

    beforeEach(() => {
      slideUrl = url
      baseUrl = presenterServerUrl
    })

    it(`should return ${expected}`, () => {
      expect(isAllowedSlideUrl(slideUrl, baseUrl)).toBe(expected)
    })
  })
})
