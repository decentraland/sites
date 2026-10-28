import { render } from '@testing-library/react'
import { NetworkIcon } from './NetworkIcon'

describe('NetworkIcon', () => {
  describe('when the network is ethereum', () => {
    it('should render the blue Ethereum badge', () => {
      const { container } = render(<NetworkIcon network="ethereum" />)

      expect(container.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 26 26')
      expect(container.querySelector('rect')?.getAttribute('fill')).toBe('#627EEA')
    })
  })

  describe('when the network is polygon', () => {
    it('should render the purple Polygon badge', () => {
      const { container } = render(<NetworkIcon network="polygon" />)

      expect(container.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 252 252')
      expect(container.querySelector('stop')?.getAttribute('stop-color')).toBe('#A229C5')
    })
  })

  describe('when extra svg props are passed', () => {
    it('should forward them to the underlying svg', () => {
      const { container } = render(<NetworkIcon network="ethereum" width={32} height={32} />)
      const svg = container.querySelector('svg')

      expect(svg?.getAttribute('width')).toBe('32')
      expect(svg?.getAttribute('height')).toBe('32')
    })
  })
})
