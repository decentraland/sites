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
    jest.resetAllMocks()
  })

  describe('when rendering the WearableInfoBadges category icon', () => {
    describe('and the category is a known category', () => {
      let container: HTMLElement

      beforeEach(() => {
        ;({ container } = render(<WearableInfoBadges category="upper_body" />))
      })

      it('should render the matching category icon', () => {
        expect(container.querySelector('[data-icon="upper-body"]')).not.toBeNull()
      })

      it('should label the icon with the humanized label', () => {
        expect(container.querySelector('[data-icon="upper-body"]')?.getAttribute('data-title')).toBe('Upper Body')
      })

      it('should mirror the humanized label in the tooltip title', () => {
        expect(container.querySelector('[data-tooltip="Upper Body"]')).not.toBeNull()
      })
    })

    describe('and the category is unknown', () => {
      let container: HTMLElement

      beforeEach(() => {
        ;({ container } = render(<WearableInfoBadges category="not_a_category" />))
      })

      it('should render no category icon', () => {
        expect(container.querySelector('[data-icon]')).toBeNull()
      })
    })

    describe('and the category is omitted', () => {
      let container: HTMLElement

      beforeEach(() => {
        ;({ container } = render(<WearableInfoBadges />))
      })

      it('should render no category icon', () => {
        expect(container.querySelector('[data-icon]')).toBeNull()
      })
    })
  })

  describe('when rendering the WearableInfoBadges body-shape icon', () => {
    describe('and both base shapes are present', () => {
      let container: HTMLElement

      beforeEach(() => {
        ;({ container } = render(<WearableInfoBadges bodyShapes={['urn:BaseMale', 'urn:BaseFemale']} />))
      })

      it('should render the unisex icon', () => {
        expect(container.querySelector('[data-icon="unisex"]')).not.toBeNull()
      })

      it('should label the unisex icon', () => {
        expect(container.querySelector('[data-icon="unisex"]')?.getAttribute('data-title')).toBe('Unisex')
      })
    })

    describe('and only the male shape is present', () => {
      let container: HTMLElement

      beforeEach(() => {
        ;({ container } = render(<WearableInfoBadges bodyShapes={['urn:BaseMale']} />))
      })

      it('should render the male icon', () => {
        expect(container.querySelector('[data-icon="base-male"]')).not.toBeNull()
      })

      it('should label the male icon', () => {
        expect(container.querySelector('[data-icon="base-male"]')?.getAttribute('data-title')).toBe('For male')
      })
    })

    describe('and only the female shape is present', () => {
      let container: HTMLElement

      beforeEach(() => {
        ;({ container } = render(<WearableInfoBadges bodyShapes={['urn:BaseFemale']} />))
      })

      it('should render the female icon', () => {
        expect(container.querySelector('[data-icon="base-female"]')).not.toBeNull()
      })

      it('should label the female icon', () => {
        expect(container.querySelector('[data-icon="base-female"]')?.getAttribute('data-title')).toBe('For female')
      })
    })

    describe('and there are no recognizable shapes', () => {
      let container: HTMLElement

      beforeEach(() => {
        ;({ container } = render(<WearableInfoBadges bodyShapes={['something']} />))
      })

      it('should render no male icon', () => {
        expect(container.querySelector('[data-icon="base-male"]')).toBeNull()
      })

      it('should render no female icon', () => {
        expect(container.querySelector('[data-icon="base-female"]')).toBeNull()
      })

      it('should render no unisex icon', () => {
        expect(container.querySelector('[data-icon="unisex"]')).toBeNull()
      })
    })
  })

  describe('when rendering the WearableInfoBadges smart wearable icon', () => {
    describe('and isSmart is true', () => {
      let container: HTMLElement

      beforeEach(() => {
        ;({ container } = render(<WearableInfoBadges isSmart />))
      })

      it('should render the smart wearable icon', () => {
        expect(container.querySelector('[data-icon="smart-wearable"]')).not.toBeNull()
      })

      it('should label the smart wearable icon', () => {
        expect(container.querySelector('[data-icon="smart-wearable"]')?.getAttribute('data-title')).toBe('Smart wearable')
      })
    })

    describe('and isSmart is false', () => {
      let container: HTMLElement

      beforeEach(() => {
        ;({ container } = render(<WearableInfoBadges isSmart={false} />))
      })

      it('should not render the smart wearable icon', () => {
        expect(container.querySelector('[data-icon="smart-wearable"]')).toBeNull()
      })
    })
  })

  describe('when rendering the PronounsIcon', () => {
    let container: HTMLElement

    beforeEach(() => {
      ;({ container } = render(<PronounsIcon />))
    })

    it('should render an svg', () => {
      expect(container.querySelector('svg')).not.toBeNull()
    })

    it('should mark the svg aria-hidden', () => {
      expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
    })

    it('should render three circle paths', () => {
      expect(container.querySelectorAll('svg path')).toHaveLength(3)
    })
  })
})
