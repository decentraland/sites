import { chunk } from './whatsOnChunk'

describe('chunk', () => {
  describe('when the array divides evenly by the size', () => {
    it('should split it into equal-length groups', () => {
      expect(chunk([1, 2, 3, 4], 2)).toEqual([
        [1, 2],
        [3, 4]
      ])
    })
  })

  describe('when the array does not divide evenly', () => {
    it('should leave a shorter final group', () => {
      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
    })
  })

  describe('when the array is empty', () => {
    it('should return an empty array', () => {
      expect(chunk([], 3)).toEqual([])
    })
  })

  describe('when the size is less than 1', () => {
    it('should return an empty array for size 0', () => {
      expect(chunk([1, 2, 3], 0)).toEqual([])
    })

    it('should return an empty array for a negative size', () => {
      expect(chunk([1, 2, 3], -2)).toEqual([])
    })
  })

  describe('when the size exceeds the array length', () => {
    it('should return a single group with all items', () => {
      expect(chunk([1, 2], 5)).toEqual([[1, 2]])
    })
  })
})
