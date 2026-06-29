import { getRecentConnectorId } from './recentConnector'

describe('getRecentConnectorId', () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  describe('when wagmi has persisted a connector id', () => {
    beforeEach(() => {
      window.localStorage.setItem('wagmi.recentConnectorId', JSON.stringify('magic'))
    })

    it('should return the decoded connector id', () => {
      expect(getRecentConnectorId()).toBe('magic')
    })
  })

  describe('when wagmi has not connected on this origin', () => {
    it('should return null', () => {
      expect(getRecentConnectorId()).toBeNull()
    })
  })

  describe('when the stored value is not valid JSON', () => {
    beforeEach(() => {
      window.localStorage.setItem('wagmi.recentConnectorId', '{not valid json')
    })

    it('should return null rather than throwing', () => {
      expect(getRecentConnectorId()).toBeNull()
    })
  })

  describe('when the stored value decodes to a non-string', () => {
    beforeEach(() => {
      window.localStorage.setItem('wagmi.recentConnectorId', JSON.stringify({ id: 'magic' }))
    })

    it('should return null', () => {
      expect(getRecentConnectorId()).toBeNull()
    })
  })
})
