import { isAllowedSlideUrl } from './cast2.slideUrl'

const PRD_BASE = 'https://cast-presenter-service.decentraland.org'
const PRESENTATION_ID = '3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b'
const SLIDE_FILE = '0f3a9b8c7d6e5f41.png'
const VALID_SLIDE = `${PRD_BASE}/presentations/${PRESENTATION_ID}/slides/${SLIDE_FILE}`

describe('when checking isAllowedSlideUrl', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe.each([
    ['a slide on the presenter origin', VALID_SLIDE, PRD_BASE, true],
    [
      'a slide on a local presenter server',
      `http://localhost:3002/presentations/${PRESENTATION_ID}/slides/${SLIDE_FILE}`,
      'http://localhost:3002',
      true
    ],
    ['a slide on another host', `https://evil.example/presentations/${PRESENTATION_ID}/slides/${SLIDE_FILE}`, PRD_BASE, false],
    [
      'a slide on the presenter host over another scheme',
      `http://cast-presenter-service.decentraland.org/presentations/${PRESENTATION_ID}/slides/${SLIDE_FILE}`,
      PRD_BASE,
      false
    ],
    [
      'a slide on a host that extends the presenter host',
      `https://cast-presenter-service.decentraland.org.evil.example/presentations/${PRESENTATION_ID}/slides/${SLIDE_FILE}`,
      PRD_BASE,
      false
    ],
    ['a slide with a query string', `${VALID_SLIDE}?x=1`, PRD_BASE, false],
    ['a slide with a fragment', `${VALID_SLIDE}#x`, PRD_BASE, false],
    ['a png outside the slides path', `${PRD_BASE}/other/0f3a.png`, PRD_BASE, false],
    ['a slide path that traverses upwards', `${PRD_BASE}/presentations/${PRESENTATION_ID}/slides/../../x.png`, PRD_BASE, false],
    ['a slide whose hash is not hexadecimal', `${PRD_BASE}/presentations/${PRESENTATION_ID}/slides/zz.png`, PRD_BASE, false],
    ['a slide whose presentation id is not a UUID', `${PRD_BASE}/presentations/abc/slides/${SLIDE_FILE}`, PRD_BASE, false],
    ['a slide whose presentation id is percent-encoded', `${PRD_BASE}/presentations/a%2F..%2Fx/slides/${SLIDE_FILE}`, PRD_BASE, false],
    ['a slide whose hash is shorter than 16 characters', `${PRD_BASE}/presentations/${PRESENTATION_ID}/slides/0f3a.png`, PRD_BASE, false],
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
