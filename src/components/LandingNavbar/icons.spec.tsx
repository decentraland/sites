import { render, screen } from '@testing-library/react'
import * as Icons from './icons'

describe('when navbar icons are rendered', () => {
  it.each(Object.entries(Icons))('should render %s as an accessible SVG with its supplied label', (name, Icon) => {
    render(<Icon role="img" aria-label={name} />)

    expect(screen.getByRole('img', { name }).querySelector('path, rect')).not.toBeNull()
  })
})
