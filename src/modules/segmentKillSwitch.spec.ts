import {
  SEGMENT_KILL_SWITCH_KEY,
  isSegmentProxyDisabled,
  persistSegmentProxyDisabled,
  resetSegmentKillSwitchForTests
} from './segmentKillSwitch'

// The module snapshots the persisted value on import, so a spec that writes to localStorage has to
// ask for the snapshot to be retaken — same shape as `resetFeatureFlagsForTests`.
function persistedValue(value: string): void {
  localStorage.setItem(SEGMENT_KILL_SWITCH_KEY, value)
  resetSegmentKillSwitchForTests()
}

describe('segmentKillSwitch', () => {
  beforeEach(() => {
    localStorage.clear()
    resetSegmentKillSwitchForTests()
  })

  afterEach(() => {
    localStorage.clear()
    resetSegmentKillSwitchForTests()
    jest.resetAllMocks()
  })

  describe('SEGMENT_KILL_SWITCH_KEY', () => {
    it('should pin the storage key, sibling dapps read and write the same one', () => {
      expect(SEGMENT_KILL_SWITCH_KEY).toBe('dcl-analytics-seg-alt')
    })
  })

  describe('isSegmentProxyDisabled', () => {
    it('should return false when nothing has been persisted yet', () => {
      expect(isSegmentProxyDisabled()).toBe(false)
    })

    it('should return true when the persisted value is on', () => {
      persistedValue('1')
      expect(isSegmentProxyDisabled()).toBe(true)
    })

    it('should return false when the persisted value is off', () => {
      persistedValue('0')
      expect(isSegmentProxyDisabled()).toBe(false)
    })

    it('should return false for a value it did not write', () => {
      persistedValue('true')
      expect(isSegmentProxyDisabled()).toBe(false)
    })

    it('should return false when localStorage cannot be read', () => {
      const getItem = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('access denied')
      })

      resetSegmentKillSwitchForTests()

      expect(isSegmentProxyDisabled()).toBe(false)

      getItem.mockRestore()
    })

    it('should answer the same for the whole page load, both transports must agree', () => {
      persistedValue('0')

      // A write landing mid-session decides the NEXT page load, not this one: the SDK is
      // configured once at boot and the beacon resolves its URL per event.
      persistSegmentProxyDisabled(true)

      expect(isSegmentProxyDisabled()).toBe(false)
    })
  })

  describe('persistSegmentProxyDisabled', () => {
    it('should round-trip an enabled flag', () => {
      persistSegmentProxyDisabled(true)
      resetSegmentKillSwitchForTests()

      expect(localStorage.getItem(SEGMENT_KILL_SWITCH_KEY)).toBe('1')
      expect(isSegmentProxyDisabled()).toBe(true)
    })

    it('should round-trip a disabled flag', () => {
      persistSegmentProxyDisabled(false)
      resetSegmentKillSwitchForTests()

      expect(localStorage.getItem(SEGMENT_KILL_SWITCH_KEY)).toBe('0')
      expect(isSegmentProxyDisabled()).toBe(false)
    })

    it('should overwrite the previously persisted value', () => {
      persistSegmentProxyDisabled(true)
      persistSegmentProxyDisabled(false)
      resetSegmentKillSwitchForTests()

      expect(isSegmentProxyDisabled()).toBe(false)
    })

    it('should not throw when localStorage cannot be written', () => {
      const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota exceeded')
      })

      expect(() => persistSegmentProxyDisabled(true)).not.toThrow()

      setItem.mockRestore()
    })
  })
})
