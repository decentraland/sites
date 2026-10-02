import { containRect, overlayRect } from './cast2.overlay'

describe('overlayRect', () => {
  describe('when the small bubble sits bottom-left on a 960x540 frame', () => {
    it('should return the clamped even rectangle', () => {
      expect(overlayRect({ x: 0, y: 1, size: 'small' }, 960, 540)).toEqual({ left: 18, top: 376, d: 144 })
    })
  })

  describe('when the large bubble sits top-right on a 960x540 frame', () => {
    it('should return the clamped even rectangle', () => {
      expect(overlayRect({ x: 1, y: 0, size: 'large' }, 960, 540)).toEqual({ left: 700, top: 18, d: 240 })
    })
  })

  describe('when x lies beyond the frame', () => {
    it('should clamp it to the same rectangle as x = 1', () => {
      expect(overlayRect({ x: 5, y: 0.5, size: 'small' }, 960, 540)).toEqual(overlayRect({ x: 1, y: 0.5, size: 'small' }, 960, 540))
    })
  })

  describe('when the frame is too short for the bubble', () => {
    it('should cap the diameter to the height minus both margins', () => {
      expect(overlayRect({ x: 0, y: 0, size: 'small' }, 960, 100).d).toBe(62)
    })
  })
})

describe('containRect', () => {
  describe('when a 16:9 media is contained in a square box', () => {
    it('should letterbox it vertically', () => {
      expect(containRect(1000, 1000, 1600, 900)).toEqual({ left: 0, top: 218.75, width: 1000, height: 562.5 })
    })
  })

  describe('when a 9:16 media is contained in a square box', () => {
    it('should pillarbox it horizontally', () => {
      expect(containRect(1000, 1000, 900, 1600)).toEqual({ left: 218.75, top: 0, width: 562.5, height: 1000 })
    })
  })

  describe('when a media dimension is zero', () => {
    it('should return the whole box', () => {
      expect(containRect(800, 600, 0, 900)).toEqual({ left: 0, top: 0, width: 800, height: 600 })
      expect(containRect(800, 600, 1600, 0)).toEqual({ left: 0, top: 0, width: 800, height: 600 })
    })
  })
})
