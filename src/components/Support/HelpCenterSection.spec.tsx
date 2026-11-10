import { fireEvent, render, screen } from '@testing-library/react'
import { HelpCenterSection, HelpTab } from './HelpCenterSection'

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
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

  describe('when the help center renders', () => {
    beforeEach(() => {
      render(<HelpCenterSection activeTab={HelpTab.FAQ} setTab={setTab} serviceList={[]} />)
    })

    it('should offer the FAQ, Support Updates and Creator Fund tabs', () => {
      expect(screen.getByRole('button', { name: 'component.landing.help.center.faq_button_label' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'component.landing.help.center.support_updates_button_label' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: CREATOR_FUND_TAB })).toBeInTheDocument()
    })

    it('should switch to the Creator Fund tab when it is clicked', () => {
      fireEvent.click(screen.getByRole('button', { name: CREATOR_FUND_TAB }))

      expect(setTab).toHaveBeenCalledWith(HelpTab.CREATOR_FUND)
    })
  })
})
