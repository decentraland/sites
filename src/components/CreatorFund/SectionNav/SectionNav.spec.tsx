import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { CREATOR_FUND_RULES_URL, CREATOR_FUND_TERMS_URL, sectionLinks } from '../data'
import { SectionNav } from './SectionNav'

jest.mock('decentraland-ui2', () => {
  const { styled, Box, dclColors, keyframes } = jest.requireActual('../../../__test-utils__/styledMock')
  return {
    styled,
    Box,
    dclColors,
    keyframes,
    Logo: (props: Record<string, unknown>) => React.createElement('svg', props)
  }
})

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

describe('SectionNav', () => {
  beforeEach(() => {
    render(<SectionNav />)
  })

  describe('when the menu is closed', () => {
    it('should offer to open it', () => {
      const button = screen.getByRole('button', { name: 'page.creator_fund.nav.open_menu' })

      expect(button).toHaveAttribute('aria-expanded', 'false')
    })

    it('should link Rules and Terms to their own pages', () => {
      expect(screen.getByRole('link', { name: 'page.creator_fund.nav.rules' })).toHaveAttribute('href', CREATOR_FUND_RULES_URL)
      expect(screen.getByRole('link', { name: 'page.creator_fund.nav.terms' })).toHaveAttribute('href', CREATOR_FUND_TERMS_URL)
    })

    it('should render only the desktop section links', () => {
      expect(screen.getAllByRole('link', { name: sectionLinks[0].labelKey })).toHaveLength(1)
    })
  })

  describe('when the menu button is clicked', () => {
    beforeEach(() => {
      fireEvent.click(screen.getByRole('button', { name: 'page.creator_fund.nav.open_menu' }))
    })

    it('should show the section links in the mobile panel', () => {
      expect(screen.getByRole('button', { name: 'page.creator_fund.nav.close_menu' })).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getAllByRole('link', { name: sectionLinks[0].labelKey })).toHaveLength(2)
    })

    describe('and a section link in the panel is followed', () => {
      beforeEach(() => {
        fireEvent.click(screen.getAllByRole('link', { name: sectionLinks[0].labelKey })[1])
      })

      it('should close the panel', () => {
        expect(screen.getByRole('button', { name: 'page.creator_fund.nav.open_menu' })).toBeInTheDocument()
        expect(screen.getAllByRole('link', { name: sectionLinks[0].labelKey })).toHaveLength(1)
      })
    })

    describe('and the Rules link in the panel is followed', () => {
      beforeEach(() => {
        fireEvent.click(screen.getAllByRole('link', { name: 'page.creator_fund.nav.rules' })[1])
      })

      it('should close the panel', () => {
        expect(screen.getAllByRole('link', { name: 'page.creator_fund.nav.rules' })).toHaveLength(1)
      })
    })

    describe('and the Terms link in the panel is followed', () => {
      beforeEach(() => {
        fireEvent.click(screen.getAllByRole('link', { name: 'page.creator_fund.nav.terms' })[1])
      })

      it('should close the panel', () => {
        expect(screen.getAllByRole('link', { name: 'page.creator_fund.nav.terms' })).toHaveLength(1)
      })
    })

    describe('and the join call to action in the panel is followed', () => {
      beforeEach(() => {
        fireEvent.click(screen.getAllByRole('link', { name: 'page.creator_fund.cta.join' })[1])
      })

      it('should close the panel', () => {
        expect(screen.getAllByRole('link', { name: 'page.creator_fund.cta.join' })).toHaveLength(1)
      })
    })

    describe('and the close button is clicked', () => {
      beforeEach(() => {
        fireEvent.click(screen.getByRole('button', { name: 'page.creator_fund.nav.close_menu' }))
      })

      it('should close the panel', () => {
        expect(screen.getByRole('button', { name: 'page.creator_fund.nav.open_menu' })).toHaveAttribute('aria-expanded', 'false')
      })
    })
  })
})
