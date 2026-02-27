import { api } from '../../services/api'
import { ContentfulEntryKey, clearContentfulCache, contentfulEndpoint } from '../contentful/contentful.helper'
import { mapCreatorsConnect, mapCreatorsCreate, mapCreatorsHero, mapCreatorsLearn, mapCreatorsWhy, mapFaq } from './create.mappers'
import type {
  ContentfulCreatorsConnectListProps,
  ContentfulCreatorsCreateListProps,
  ContentfulCreatorsHeroEntryFieldsProps,
  ContentfulCreatorsLearnListProps,
  ContentfulCreatorsWhyListProps,
  ContentfulFaqEntriesProps
} from './create.types'

const createClient = api.injectEndpoints({
  endpoints: build => ({
    getCreatorsHero: build.query<ContentfulCreatorsHeroEntryFieldsProps, void>(
      contentfulEndpoint(ContentfulEntryKey.CREATORS_HERO, mapCreatorsHero, hero => {
        if (!hero || !hero.titleFirstLine) throw new Error('Failed to map creators hero content')
        return hero
      })
    ),
    getCreatorsWhy: build.query<ContentfulCreatorsWhyListProps, void>(contentfulEndpoint(ContentfulEntryKey.CREATORS_WHY, mapCreatorsWhy)),
    getCreatorsCreate: build.query<ContentfulCreatorsCreateListProps, void>(
      contentfulEndpoint(ContentfulEntryKey.CREATORS_CREATE, mapCreatorsCreate)
    ),
    getCreatorsConnect: build.query<ContentfulCreatorsConnectListProps, void>(
      contentfulEndpoint(ContentfulEntryKey.CREATORS_CONNECT, mapCreatorsConnect)
    ),
    getCreatorsLearn: build.query<ContentfulCreatorsLearnListProps, void>(
      contentfulEndpoint(ContentfulEntryKey.CREATORS_LEARN, mapCreatorsLearn)
    ),
    getCreatorsFaq: build.query<ContentfulFaqEntriesProps, void>(contentfulEndpoint(ContentfulEntryKey.CREATORS_FAQ, mapFaq))
  })
})

const {
  useGetCreatorsHeroQuery,
  useGetCreatorsWhyQuery,
  useGetCreatorsCreateQuery,
  useGetCreatorsConnectQuery,
  useGetCreatorsLearnQuery,
  useGetCreatorsFaqQuery
} = createClient

export {
  clearContentfulCache,
  useGetCreatorsConnectQuery,
  useGetCreatorsCreateQuery,
  useGetCreatorsFaqQuery,
  useGetCreatorsHeroQuery,
  useGetCreatorsLearnQuery,
  useGetCreatorsWhyQuery
}
