import { containRect, controllableOverlay, overlayRect } from './cast2.overlay'
import type { MediaRect, OverlayLayout, OverlayRect, SlideInfo } from './cast2.types'

const LAYOUT: OverlayLayout = { x: 0, y: 1, size: 'small' }
const SLIDE: SlideInfo = { url: 'https://presenter.test/slide.png', width: 1920, height: 1080 }

describe.each<[string, OverlayLayout, number, OverlayRect]>([
  ['the small bubble sits bottom-left on a 960x540 frame', { x: 0, y: 1, size: 'small' }, 540, { left: 18, top: 376, d: 144 }],
  ['the large bubble sits top-right on a 960x540 frame', { x: 1, y: 0, size: 'large' }, 540, { left: 700, top: 18, d: 240 }],
  ['x lies beyond a 960x540 frame', { x: 5, y: 0.5, size: 'small' }, 540, { left: 796, top: 198, d: 144 }],
  ['a 960x100 frame is too short for the bubble', { x: 0, y: 0, size: 'small' }, 100, { left: 18, top: 18, d: 62 }]
])('when computing the overlay rectangle and %s', (_label, layout, height, expected) => {
  let rect: OverlayRect

  beforeEach(() => {
    rect = overlayRect(layout, 960, height)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should return the clamped even rectangle', () => {
    expect(rect).toEqual(expected)
  })
})

describe.each<[string, [number, number], MediaRect]>([
  ['a 16:9 media is letterboxed in a square box', [1600, 900], { left: 0, top: 218.75, width: 1000, height: 562.5 }],
  ['a 9:16 media is pillarboxed in a square box', [900, 1600], { left: 218.75, top: 0, width: 562.5, height: 1000 }],
  ['the media has no width', [0, 900], { left: 0, top: 0, width: 1000, height: 1000 }],
  ['the media has no height', [1600, 0], { left: 0, top: 0, width: 1000, height: 1000 }]
])('when containing a media and %s', (_label, [mediaWidth, mediaHeight], expected) => {
  let rect: MediaRect

  beforeEach(() => {
    rect = containRect(1000, 1000, mediaWidth, mediaHeight)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should return the rectangle the media occupies', () => {
    expect(rect).toEqual(expected)
  })
})

describe.each<[string, OverlayLayout | null, SlideInfo | null, string | null, OverlayLayout | null]>([
  ['the server sends no overlay', null, null, null, null],
  ['the server composites the deck', LAYOUT, null, null, LAYOUT],
  ['the local participant presents a client-composed deck', LAYOUT, SLIDE, '0xme', LAYOUT],
  ['another participant presents a client-composed deck', LAYOUT, SLIDE, '0xother', null],
  ['a client-composed deck has no presenter yet', LAYOUT, SLIDE, null, null]
])(
  'when deciding whether the local participant controls the camera bubble and %s',
  (_label, overlay, slide, presenterIdentity, expected) => {
    let controlled: OverlayLayout | null

    beforeEach(() => {
      controlled = controllableOverlay({ overlay, slide, presenterIdentity }, '0xme')
    })

    afterEach(() => {
      jest.resetAllMocks()
    })

    it('should return the overlay only when the local participant may move it', () => {
      expect(controlled).toEqual(expected)
    })
  }
)
