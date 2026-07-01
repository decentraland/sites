import { readDataAttributes } from './readDataAttributes'

describe('when reading data attributes from an element', () => {
  let element: HTMLElement

  beforeEach(() => {
    element = document.createElement('button')
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and the element has single-segment data keys', () => {
    beforeEach(() => {
      element.setAttribute('data-event', 'Download')
      element.setAttribute('data-place', 'Landing Hero')
      element.setAttribute('data-os', 'Windows')
    })

    it('should return the keys and values as a flat payload', () => {
      expect(readDataAttributes(element)).toEqual({ event: 'Download', place: 'Landing Hero', os: 'Windows' })
    })
  })

  describe('and the element has multi-segment data keys', () => {
    beforeEach(() => {
      element.setAttribute('data-os-arch', 'amd64')
    })

    it('should camelCase the keys', () => {
      expect(readDataAttributes(element)).toEqual({ osArch: 'amd64' })
    })
  })

  describe('and the element has empty data attributes', () => {
    beforeEach(() => {
      element.setAttribute('id', 'cta')
      element.setAttribute('data-title', '')
      element.setAttribute('data-card', 'hero')
    })

    it('should skip empty values and non-data attributes', () => {
      expect(readDataAttributes(element)).toEqual({ card: 'hero' })
    })
  })
})
