import { fireEvent, render, screen } from '@testing-library/react'
import { ExperiencesTabs } from './ExperiencesTabs'

jest.mock('./ExperiencesTabs.styled', () => ({
  TabsRow: ({ children, ...props }: Record<string, unknown>) => (
    <div role="tablist" aria-label={props['aria-label'] as string}>
      {children as React.ReactNode}
    </div>
  ),
  TabButton: ({ children, isActive: _isActive, ...props }: Record<string, unknown>) => (
    <button {...props}>{children as React.ReactNode}</button>
  )
}))

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'all_experiences.title': 'All Experiences',
        'all_experiences.tab_all': 'All Experiences',
        'all_experiences.tab_my': 'My Experiences'
      }
      return translations[key] ?? key
    }
  })
}))

describe('ExperiencesTabs', () => {
  describe('when the "all" tab is active', () => {
    it('should mark the "all" tab as selected', () => {
      render(<ExperiencesTabs value="all" onChange={jest.fn()} />)

      const tabs = screen.getAllByRole('tab')
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false')
    })

    it('should set tabindex=0 on the active tab and -1 on the other', () => {
      render(<ExperiencesTabs value="all" onChange={jest.fn()} />)

      const tabs = screen.getAllByRole('tab')
      expect(tabs[0]).toHaveAttribute('tabindex', '0')
      expect(tabs[1]).toHaveAttribute('tabindex', '-1')
    })
  })

  describe('when panelId is provided', () => {
    it('should wire aria-controls on both tabs', () => {
      render(<ExperiencesTabs value="all" onChange={jest.fn()} panelId="my-panel" />)

      screen.getAllByRole('tab').forEach(tab => {
        expect(tab).toHaveAttribute('aria-controls', 'my-panel')
      })
    })
  })

  describe('when clicking the "my" tab', () => {
    it('should call onChange with "my"', () => {
      const onChange = jest.fn()
      render(<ExperiencesTabs value="all" onChange={onChange} />)

      fireEvent.click(screen.getByRole('tab', { name: 'My Experiences' }))

      expect(onChange).toHaveBeenCalledWith('my')
    })
  })

  describe('when clicking the "all" tab', () => {
    it('should call onChange with "all"', () => {
      const onChange = jest.fn()
      render(<ExperiencesTabs value="my" onChange={onChange} />)

      fireEvent.click(screen.getByRole('tab', { name: 'All Experiences' }))

      expect(onChange).toHaveBeenCalledWith('all')
    })
  })

  describe('when pressing ArrowRight on the active tab', () => {
    it('should activate the next tab', () => {
      const onChange = jest.fn()
      render(<ExperiencesTabs value="all" onChange={onChange} />)

      fireEvent.keyDown(screen.getByRole('tab', { name: 'All Experiences' }), { key: 'ArrowRight' })

      expect(onChange).toHaveBeenCalledWith('my')
    })
  })

  describe('when pressing ArrowLeft from the last tab', () => {
    it('should activate the previous tab', () => {
      const onChange = jest.fn()
      render(<ExperiencesTabs value="my" onChange={onChange} />)

      fireEvent.keyDown(screen.getByRole('tab', { name: 'My Experiences' }), { key: 'ArrowLeft' })

      expect(onChange).toHaveBeenCalledWith('all')
    })
  })
})
