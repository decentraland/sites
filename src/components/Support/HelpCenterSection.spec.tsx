import { fireEvent, render, screen } from '@testing-library/react'
import { isCreatorFundContentEnabled } from '../CreatorFund/CreatorFund.visibility'
import { HelpCenterSection, HelpTab } from './HelpCenterSection'

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('../CreatorFund/CreatorFund.visibility', () => ({
  isCreatorFundContentEnabled: jest.fn()
}))

jest.mock('./StatusDropdown', () => ({
  StatusDropdown: () => null
}))

jest.mock('decentraland-ui2', () => jest.requireActual('../../__test-utils__/ui2Mock').createUi2Mock())

const CREATOR_FUND_TAB = 'component.landing.help.center.creator_fund_button_label'

describe('HelpCenterSection', () => {
  let setTab: jest.Mock

  beforeEach(() => {
    setTab = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the Creator Fund content is enabled', () => {
    beforeEach(() => {
      ;(isCreatorFundContentEnabled as jest.Mock).mockReturnValue(true)
      render(<HelpCenterSection activeTab={HelpTab.FAQ} setTab={setTab} serviceList={[]} />)
    })

    it('should offer a Creator Fund tab', () => {
      expect(screen.getByRole('button', { name: CREATOR_FUND_TAB })).toBeInTheDocument()
    })

    it('should switch to the Creator Fund tab when it is clicked', () => {
      fireEvent.click(screen.getByRole('button', { name: CREATOR_FUND_TAB }))

      expect(setTab).toHaveBeenCalledWith(HelpTab.CREATOR_FUND)
    })
  })

  describe('when the Creator Fund content is not enabled yet (decentraland.org)', () => {
    beforeEach(() => {
      ;(isCreatorFundContentEnabled as jest.Mock).mockReturnValue(false)
      render(<HelpCenterSection activeTab={HelpTab.FAQ} setTab={setTab} serviceList={[]} />)
    })

    it('should not offer a Creator Fund tab', () => {
      expect(screen.queryByRole('button', { name: CREATOR_FUND_TAB })).not.toBeInTheDocument()
    })

    it('should keep the FAQ and Support Updates tabs', () => {
      expect(screen.getByRole('button', { name: 'component.landing.help.center.faq_button_label' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'component.landing.help.center.support_updates_button_label' })).toBeInTheDocument()
    })
  })
})
