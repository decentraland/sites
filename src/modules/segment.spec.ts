import { DownloadPlace, resolveDownloadPlace } from './segment'

describe('when resolving the download place from the URL', () => {
  describe('and the place is the Jump In landing', () => {
    it('should resolve to the Jump In landing place', () => {
      expect(resolveDownloadPlace('jump-in-landing')).toBe(DownloadPlace.JUMP_IN_LANDING)
    })
  })

  describe('and the place is the previous Lets Play landing value', () => {
    it('should keep resolving it, so links already shared still attribute', () => {
      expect(resolveDownloadPlace('lets-play-landing')).toBe(DownloadPlace.LETS_PLAY_LANDING)
    })
  })

  describe('and the place is not a known value', () => {
    it('should resolve to unknown', () => {
      expect(resolveDownloadPlace('not-a-place')).toBe(DownloadPlace.UNKNOWN)
    })
  })

  describe('and there is no place', () => {
    it('should resolve to unknown', () => {
      expect(resolveDownloadPlace(null)).toBe(DownloadPlace.UNKNOWN)
    })
  })
})
