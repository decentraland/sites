import { mapContentfulAsset, mapFaq, mapHero, mapTextMarquee, mapWhatsHot } from './landing.mappers'
import type { ContentfulEntry } from './contentful.types'

describe('mapContentfulAsset', () => {
  describe('when entry has valid file fields', () => {
    let entry: ContentfulEntry
    let result: ReturnType<typeof mapContentfulAsset>

    beforeEach(() => {
      entry = {
        sys: { id: 'asset-1', type: 'Asset' },
        fields: {
          file: {
            url: '//images.ctfassets.net/test.png',
            contentType: 'image/png',
            details: { image: { width: 1920, height: 1080 } }
          }
        }
      }
      result = mapContentfulAsset(entry)
    })

    it('should return mapped media props', () => {
      expect(result).toEqual({
        url: '//images.ctfassets.net/test.png',
        mimeType: 'image/png',
        width: 1920,
        height: 1080
      })
    })
  })

  describe('when entry is null', () => {
    let result: ReturnType<typeof mapContentfulAsset>

    beforeEach(() => {
      result = mapContentfulAsset(null)
    })

    it('should return null', () => {
      expect(result).toBeNull()
    })
  })

  describe('when entry has no file field', () => {
    let result: ReturnType<typeof mapContentfulAsset>

    beforeEach(() => {
      result = mapContentfulAsset({ sys: { id: 'a', type: 'Asset' }, fields: {} })
    })

    it('should return null', () => {
      expect(result).toBeNull()
    })
  })
})

describe('mapHero', () => {
  describe('when entry has all fields', () => {
    let entry: ContentfulEntry
    let result: ReturnType<typeof mapHero>

    beforeEach(() => {
      const mockAsset: ContentfulEntry = {
        sys: { id: 'img-1', type: 'Asset' },
        fields: {
          file: {
            url: '//test.png',
            contentType: 'image/png',
            details: { image: { width: 800, height: 600 } }
          }
        }
      }
      entry = {
        sys: { id: 'hero-1', type: 'Entry' },
        fields: {
          title: 'Welcome to Decentraland',
          subtitle: { text: 'A virtual world' },
          buttonPrimaryLabel: 'Jump In',
          buttonPrimaryLink: '/play',
          imageLandscape: mockAsset,
          videoLandscape: mockAsset,
          imagePortrait: mockAsset,
          videoPortrait: mockAsset
        }
      }
      result = mapHero(entry)
    })

    it('should map the title', () => {
      expect(result?.title).toBe('Welcome to Decentraland')
    })

    it('should map the subtitle text', () => {
      expect(result?.subtitle.text).toBe('A virtual world')
    })

    it('should map the primary button label', () => {
      expect(result?.buttonPrimaryLabel).toBe('Jump In')
    })

    it('should map the entry id', () => {
      expect(result?.id).toBe('hero-1')
    })
  })

  describe('when entry is null', () => {
    let result: ReturnType<typeof mapHero>

    beforeEach(() => {
      result = mapHero(null as unknown as ContentfulEntry)
    })

    it('should return null', () => {
      expect(result).toBeNull()
    })
  })

  describe('when subtitle is a plain string', () => {
    let result: ReturnType<typeof mapHero>

    beforeEach(() => {
      const entry: ContentfulEntry = {
        sys: { id: 'hero-2', type: 'Entry' },
        fields: { title: 'Title', subtitle: 'Plain subtitle' }
      }
      result = mapHero(entry)
    })

    it('should map the string subtitle to text field', () => {
      expect(result?.subtitle.text).toBe('Plain subtitle')
    })
  })
})

describe('mapFaq', () => {
  describe('when entry has a list of questions', () => {
    let entry: ContentfulEntry
    let result: ReturnType<typeof mapFaq>

    beforeEach(() => {
      entry = {
        sys: { id: 'faq-1', type: 'Entry' },
        fields: {
          list: [
            {
              sys: { id: 'q-1', type: 'Entry' },
              fields: {
                question: { text: 'What is Decentraland?' },
                answer: { raw: 'A virtual world.' }
              }
            },
            {
              sys: { id: 'q-2', type: 'Entry' },
              fields: {
                question: 'Plain question',
                answer: 'Plain answer'
              }
            }
          ]
        }
      }
      result = mapFaq(entry)
    })

    it('should map the correct number of items', () => {
      expect(result.list).toHaveLength(2)
    })

    it('should map object-style question and answer', () => {
      expect(result.list[0]).toEqual({
        question: { text: 'What is Decentraland?' },
        answer: { raw: 'A virtual world.' }
      })
    })

    it('should map string-style question and answer', () => {
      expect(result.list[1]).toEqual({
        question: { text: 'Plain question' },
        answer: { raw: 'Plain answer' }
      })
    })
  })

  describe('when entry has no list', () => {
    let result: ReturnType<typeof mapFaq>

    beforeEach(() => {
      result = mapFaq({ sys: { id: 'faq-empty', type: 'Entry' }, fields: {} })
    })

    it('should return an empty list', () => {
      expect(result.list).toEqual([])
    })
  })
})

describe('mapWhatsHot', () => {
  describe('when entry has items', () => {
    let entry: ContentfulEntry
    let result: ReturnType<typeof mapWhatsHot>

    beforeEach(() => {
      entry = {
        sys: { id: 'wh-1', type: 'Entry' },
        fields: {
          list: [
            {
              sys: { id: 'item-1', type: 'Entry' },
              fields: {
                title: 'Hot Event',
                subtitle: { subtitle: 'Something cool' },
                buttonLink: '/event',
                buttonLabel: 'Go',
                image: {
                  sys: { id: 'img-1', type: 'Asset' },
                  fields: {
                    file: { url: '//img.png', contentType: 'image/png', details: { image: { width: 400, height: 300 } } }
                  }
                }
              }
            }
          ]
        }
      }
      result = mapWhatsHot(entry)
    })

    it('should map the item title', () => {
      expect(result.list[0].title).toBe('Hot Event')
    })

    it('should map the item subtitle', () => {
      expect(result.list[0].subtitle.subtitle).toBe('Something cool')
    })

    it('should map the item id', () => {
      expect(result.list[0].id).toBe('item-1')
    })
  })

  describe('when entry has no list', () => {
    let result: ReturnType<typeof mapWhatsHot>

    beforeEach(() => {
      result = mapWhatsHot({ sys: { id: 'wh-empty', type: 'Entry' }, fields: {} })
    })

    it('should return an empty list', () => {
      expect(result.list).toEqual([])
    })
  })
})

describe('mapTextMarquee', () => {
  describe('when entry has text as object', () => {
    let result: ReturnType<typeof mapTextMarquee>

    beforeEach(() => {
      result = mapTextMarquee({
        sys: { id: 'tm-1', type: 'Entry' },
        fields: { text: { text: 'Welcome to DCL' } }
      })
    })

    it('should map the text field', () => {
      expect(result?.text.text).toBe('Welcome to DCL')
    })
  })

  describe('when entry has text as string', () => {
    let result: ReturnType<typeof mapTextMarquee>

    beforeEach(() => {
      result = mapTextMarquee({
        sys: { id: 'tm-2', type: 'Entry' },
        fields: { text: 'Plain text' }
      })
    })

    it('should map the string to text field', () => {
      expect(result?.text.text).toBe('Plain text')
    })
  })

  describe('when entry is null', () => {
    let result: ReturnType<typeof mapTextMarquee>

    beforeEach(() => {
      result = mapTextMarquee(null as unknown as ContentfulEntry)
    })

    it('should return null', () => {
      expect(result).toBeNull()
    })
  })
})
