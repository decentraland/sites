import { useDeferredValue, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { CircularProgress } from 'decentraland-ui2'
import { CardGrid, Empty, HeaderRow, Loader, PageContent, PageTitle, SearchField } from '../../components/social/_shared'
import { CommunityCard } from '../../components/social/CommunityCard'
import { useGetCommunitiesListQuery } from '../../features/social'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'

function SocialCommunitiesPage() {
  const t = useFormatMessage()
  const [searchInput, setSearchInput] = useState('')
  const search = useDeferredValue(searchInput.trim())

  const { data, isLoading } = useGetCommunitiesListQuery({
    limit: 200,
    offset: 0,
    search: search || undefined
  })

  // The social-api returns communities in creation order by default. Surface
  // the most-populated communities first so the page leads with what's most
  // active. Client-side sort is fine since we fetch a single page.
  const communities = useMemo(() => {
    const list = data?.data?.results ?? []
    return [...list].sort((a, b) => (b.membersCount ?? 0) - (a.membersCount ?? 0))
  }, [data])
  const isEmpty = !isLoading && communities.length === 0

  return (
    <PageContent>
      <Helmet>
        <title>{t('social.communities.page_title')}</title>
      </Helmet>
      <HeaderRow>
        <PageTitle>{t('social.communities.heading')}</PageTitle>
        <SearchField
          size="small"
          variant="outlined"
          placeholder={t('social.communities.search_placeholder')}
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
        />
      </HeaderRow>
      {isLoading ? (
        <Loader>
          <CircularProgress />
        </Loader>
      ) : isEmpty ? (
        <Empty>{t('social.communities.empty')}</Empty>
      ) : (
        <CardGrid>
          {communities.map(community => (
            <CommunityCard key={community.id} community={community} />
          ))}
        </CardGrid>
      )}
    </PageContent>
  )
}

export { SocialCommunitiesPage }
