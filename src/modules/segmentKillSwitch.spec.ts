import { SEGMENT_KILL_SWITCH_KEY, isSegmentProxyDisabled, persistSegmentProxyDisabled } from './segmentKillSwitch'

describe('segmentKillSwitch', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
    jest.resetAllMocks()
  })

  describe('SEGMENT_KILL_SWITCH_KEY', () => {
    it('should be the key the other dapps read and write, it is a shared contract', () => {
      expect(SEGMENT_KILL_SWITCH_KEY).toBe('dcl-analytics-seg-alt')
    })
  })

  describe('isSegmentProxyDisabled', () => {
    it('should return false when nothing has been persisted yet', () => {
      expect(isSegmentProxyDisabled()).toBe(false)
    })

    it('should return true when the persisted value is on', () => {
      localStorage.setItem(SEGMENT_KILL_SWITCH_KEY, '1')
      expect(isSegmentProxyDisabled()).toBe(true)
    })

    it('should return false when the persisted value is off', () => {
      localStorage.setItem(SEGMENT_KILL_SWITCH_KEY, '0')
      expect(isSegmentProxyDisabled()).toBe(false)
    })

    it('should return false for a value it did not write', () => {
      localStorage.setItem(SEGMENT_KILL_SWITCH_KEY, 'true')
      expect(isSegmentProxyDisabled()).toBe(false)
    })

    it('should return false when localStorage is unavailable', () => {
      const getItem = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('access denied')
      })

      expect(isSegmentProxyDisabled()).toBe(false)

      getItem.mockRestore()
    })
  })

  describe('persistSegmentProxyDisabled', () => {
    it('should round-trip an enabled flag', () => {
      persistSegmentProxyDisabled(true)

      expect(localStorage.getItem(SEGMENT_KILL_SWITCH_KEY)).toBe('1')
      expect(isSegmentProxyDisabled()).toBe(true)
    })

    it('should round-trip a disabled flag', () => {
      persistSegmentProxyDisabled(false)

      expect(localStorage.getItem(SEGMENT_KILL_SWITCH_KEY)).toBe('0')
      expect(isSegmentProxyDisabled()).toBe(false)
    })

    it('should overwrite the previously persisted value', () => {
      persistSegmentProxyDisabled(true)
      persistSegmentProxyDisabled(false)

      expect(isSegmentProxyDisabled()).toBe(false)
    })

    it('should not throw when localStorage is unavailable', () => {
      const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota exceeded')
      })

      expect(() => persistSegmentProxyDisabled(true)).not.toThrow()

      setItem.mockRestore()
    })
  })
})
