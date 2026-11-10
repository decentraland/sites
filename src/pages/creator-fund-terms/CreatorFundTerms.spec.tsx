import { render } from '@testing-library/react'
import { CREATOR_FUND_TERMS_TITLE, CreatorFundTerms } from './CreatorFundTerms'

jest.mock('../../components/LegalPage', () => ({
  LegalPageLayout: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  BulletList: ({ children }: { children?: React.ReactNode }) => <ol>{children}</ol>,
  Paragraph: ({ children }: { children?: React.ReactNode }) => <p>{children}</p>,
  Section: ({ children }: { children?: React.ReactNode }) => <section>{children}</section>,
  SectionTitle: ({ children }: { children?: React.ReactNode }) => <h2>{children}</h2>
}))

describe('CreatorFundTerms', () => {
  beforeEach(() => {
    document.title = 'Decentraland'
  })

  describe('when the page is open', () => {
    beforeEach(() => {
      render(<CreatorFundTerms />)
    })

    it('should title the browser tab Creator Fund - Terms', () => {
      expect(document.title).toBe(CREATOR_FUND_TERMS_TITLE)
      expect(CREATOR_FUND_TERMS_TITLE).toBe('Creator Fund - Terms')
    })
  })

  describe('when the page is left', () => {
    beforeEach(() => {
      render(<CreatorFundTerms />).unmount()
    })

    it('should restore the previous tab title', () => {
      expect(document.title).toBe('Decentraland')
    })
  })
})
