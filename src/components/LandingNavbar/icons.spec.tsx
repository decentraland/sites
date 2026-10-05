import { render, screen } from '@testing-library/react'
import * as icons from './icons'

describe.each(Object.entries(icons))('when rendering the %s icon', (name, Icon) => {
  beforeEach(() => {
    render(<Icon role="img" aria-label={name} className="custom-icon" />)
  })

  it('should render an svg', () => {
    expect(screen.getByRole('img', { name }).tagName.toLowerCase()).toBe('svg')
  })

  it('should forward the props it receives to the svg', () => {
    expect(screen.getByRole('img', { name })).toHaveClass('custom-icon')
  })
})
