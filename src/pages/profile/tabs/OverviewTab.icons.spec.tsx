import * as mockReact from 'react'
import { render } from '@testing-library/react'
import { PronounsIcon, WearableInfoBadges } from './OverviewTab.icons'

// Each ui2 icon is mocked as a span carrying its titleAccess so we can assert
// which glyph was chosen for a given category / body-shape combination.
jest.mock('decentraland-ui2', () => {
  const r = jest.requireActual<typeof mockReact>('react')
  const makeIcon = (name: string) => (props: { titleAccess?: string }) =>
    r.createElement('span', { 'data-icon': name, 'data-title': props?.titleAccess })
  return {
    BaseFemaleIcon: makeIcon('base-female'),
    BaseMaleIcon: makeIcon('base-male'),
    BodyShapeIcon: makeIcon('body-shape'),
    EarringIcon: makeIcon('earring'),
    EyebrowsIcon: makeIcon('eyebrows'),
    EyesIcon: makeIcon('eyes'),
    EyewearIcon: makeIcon('eyewear'),
    FacialHairIcon: makeIcon('facial-hair'),
    FeetIcon: makeIcon('feet'),
    HairIcon: makeIcon('hair'),
    HandsWearIcon: makeIcon('hands-wear'),
    HatIcon: makeIcon('hat'),
    HelmetIcon: makeIcon('helmet'),
    LowerBodyIcon: makeIcon('lower-body'),
    MaskIcon: makeIcon('mask'),
    MouthIcon: makeIcon('mouth'),
    SkinIcon: makeIcon('skin'),
    SmartWearableIcon: makeIcon('smart-wearable'),
    TiaraIcon: makeIcon('tiara'),
    TopHeadIcon: makeIcon('top-head'),
    UnisexIcon: makeIcon('unisex'),
    UpperBodyIcon: makeIcon('upper-body'),
    Tooltip: ({ children, title }: { children: React.ReactElement; title?: string }) =>
      r.createElement('span', { 'data-tooltip': title }, children)
  }
})

describe('OverviewTab.icons', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('WearableInfoBadges category icon', () => {
    it('should render the matching category icon with a humanized label', () => {
      const { container } = render(<WearableInfoBadges category="upper_body" />)

      const icon = container.querySelector('[data-icon="upper-body"]')
      expect(icon).not.toBeNull()
      expect(icon?.getAttribute('data-title')).toBe('Upper Body')
      // The tooltip title mirrors the humanized label.
      expect(container.querySelector('[data-tooltip="Upper Body"]')).not.toBeNull()
    })

    it('should render nothing for an unknown category', () => {
      const { container } = render(<WearableInfoBadges category="not_a_category" />)
      expect(container.querySelector('[data-icon]')).toBeNull()
    })

    it('should render no category icon when category is omitted', () => {
      const { container } = render(<WearableInfoBadges />)
      expect(container.querySelector('[data-icon]')).toBeNull()
    })
  })

  describe('WearableInfoBadges body-shape icon', () => {
    it('should render the unisex icon when both base shapes are present', () => {
      const { container } = render(<WearableInfoBadges bodyShapes={['urn:BaseMale', 'urn:BaseFemale']} />)

      const icon = container.querySelector('[data-icon="unisex"]')
      expect(icon).not.toBeNull()
      expect(icon?.getAttribute('data-title')).toBe('Unisex')
    })

    it('should render the male icon for male-only shapes', () => {
      const { container } = render(<WearableInfoBadges bodyShapes={['urn:BaseMale']} />)

      const icon = container.querySelector('[data-icon="base-male"]')
      expect(icon).not.toBeNull()
      expect(icon?.getAttribute('data-title')).toBe('For male')
    })

    it('should render the female icon for female-only shapes', () => {
      const { container } = render(<WearableInfoBadges bodyShapes={['urn:BaseFemale']} />)

      const icon = container.querySelector('[data-icon="base-female"]')
      expect(icon).not.toBeNull()
      expect(icon?.getAttribute('data-title')).toBe('For female')
    })

    it('should render no body icon when there are no recognizable shapes', () => {
      const { container } = render(<WearableInfoBadges bodyShapes={['something']} />)
      expect(container.querySelector('[data-icon="base-male"]')).toBeNull()
      expect(container.querySelector('[data-icon="base-female"]')).toBeNull()
      expect(container.querySelector('[data-icon="unisex"]')).toBeNull()
    })
  })

  describe('WearableInfoBadges smart wearable icon', () => {
    it('should render the smart wearable icon when isSmart is true', () => {
      const { container } = render(<WearableInfoBadges isSmart />)

      const icon = container.querySelector('[data-icon="smart-wearable"]')
      expect(icon).not.toBeNull()
      expect(icon?.getAttribute('data-title')).toBe('Smart wearable')
    })

    it('should not render the smart wearable icon when isSmart is false', () => {
      const { container } = render(<WearableInfoBadges isSmart={false} />)
      expect(container.querySelector('[data-icon="smart-wearable"]')).toBeNull()
    })
  })

  describe('PronounsIcon', () => {
    it('should render an aria-hidden svg with three circle paths', () => {
      const { container } = render(<PronounsIcon />)

      const svg = container.querySelector('svg')
      expect(svg).not.toBeNull()
      expect(svg?.getAttribute('aria-hidden')).toBe('true')
      expect(container.querySelectorAll('svg path')).toHaveLength(3)
    })
  })
})
